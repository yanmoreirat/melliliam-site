-- =========================================================
-- MIGRATION 013 — Validação server-side do frete na create_order
-- Garante que:
--   a) Usuário não manipula o JS para p_shipping_fee = 0 quando
--      a cidade dele tem frete R$20;
--   b) Bloqueia finalização do pedido se cidade estiver bloqueada
--      (shipping_outside_rules_behavior = 'block' e cidade não
--      existe na shipping_rules);
--   c) Pickup na loja SEMPRE tem frete 0, sem validação de cidade.
--
-- Usa a função resolve_shipping criada na migration 012.
-- =========================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'create_order'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s);', r.proname, r.args);
  END LOOP;
END $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.create_order(
  p_order_number TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT DEFAULT NULL::TEXT,
  p_zipcode TEXT DEFAULT NULL::TEXT,
  p_street TEXT DEFAULT NULL::TEXT,
  p_number TEXT DEFAULT NULL::TEXT,
  p_complement TEXT DEFAULT NULL::TEXT,
  p_neighborhood TEXT DEFAULT NULL::TEXT,
  p_city TEXT DEFAULT NULL::TEXT,
  p_state TEXT DEFAULT NULL::TEXT,
  p_items JSON DEFAULT '[]'::JSON,
  p_coupon_code TEXT DEFAULT NULL::TEXT,
  p_shipping_fee NUMERIC DEFAULT 0,
  p_notes TEXT DEFAULT NULL::TEXT,
  p_address_type TEXT DEFAULT 'delivery'::TEXT
)
RETURNS JSON AS $$
DECLARE
  v_coupon_code TEXT := UPPER(TRIM(p_coupon_code));
  v_total NUMERIC := 0;
  v_subtotal NUMERIC := 0;
  v_discount_total NUMERIC := 0;
  v_coupon_discount NUMERIC := 0;
  v_item RECORD;
  v_product RECORD;
  v_price_with_discount NUMERIC;
  v_item_subtotal NUMERIC;
  v_order_id UUID;
  v_order_created RECORD;
  v_current_free_shipping_min NUMERIC;
  v_resolve JSON;
  v_expected_shipping NUMERIC;
  v_blocked BOOLEAN;
  v_blocked_msg TEXT;
BEGIN
  -- ========================================================
  -- VALIDAÇÃO SERVER-SIDE DO FRETE (impede manipulação client)
  -- ========================================================
  IF COALESCE(p_address_type, 'delivery') = 'pickup' THEN
    -- Retirada na loja sempre tem frete 0, ignora tabela
    p_shipping_fee := 0;
  ELSE
    v_resolve := public.resolve_shipping(p_city, p_state, p_zipcode);
    v_expected_shipping := COALESCE((v_resolve->>'value')::NUMERIC, 0);
    v_blocked := COALESCE((v_resolve->>'blocked')::BOOLEAN, false);
    v_blocked_msg := COALESCE(v_resolve->>'blocked_message',
                      'Entrega não disponível para sua cidade.');

    IF v_blocked THEN
      RAISE EXCEPTION '%', v_blocked_msg;
    END IF;

    -- Cupom de frete grátis com valor mínimo já lido abaixo (mantém compatibilidade).
    -- Por agora valida que o frete enviado pelo cliente NÃO diverge
    -- do frete calculado no servidor (tolerância R$0,01).
    IF ABS(COALESCE(p_shipping_fee, 0) - v_expected_shipping) > 0.01 THEN
      p_shipping_fee := v_expected_shipping;
    END IF;
  END IF;

  -- Pega o valor mínimo atual para frete grátis da tabela coupons
  -- (caso não exista cupom de frete grátis, ignora)
  BEGIN
    SELECT free_shipping_min_value INTO v_current_free_shipping_min
    FROM public.coupons
    WHERE v_coupon_code IS NOT NULL
      AND code = v_coupon_code
      AND active = TRUE
      AND NOW() BETWEEN COALESCE(valid_from, '1970-01-01'::TIMESTAMPTZ) AND COALESCE(valid_until, '9999-12-31'::TIMESTAMPTZ)
      AND (max_uses IS NULL OR times_used < max_uses)
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_current_free_shipping_min := NULL;
  END;

  -- Se cupom fornecido mas inválido, zera o código (não aplica desconto)
  IF v_coupon_code IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.coupons
      WHERE code = v_coupon_code
        AND active = TRUE
        AND NOW() BETWEEN COALESCE(valid_from, '1970-01-01'::TIMESTAMPTZ) AND COALESCE(valid_until, '9999-12-31'::TIMESTAMPTZ)
        AND (max_uses IS NULL OR times_used < max_uses)
    ) THEN
      v_coupon_code := NULL;
    END IF;
  END IF;

  -- Calcula subtotal e itens
  FOR v_item IN
    SELECT
      (elem->>'product_id')::UUID AS product_id,
      GREATEST((elem->>'quantity')::INTEGER, 1) AS quantity
    FROM json_array_elements(p_items) AS elem
  LOOP
    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_item.product_id
      AND active = TRUE;

    IF v_product.id IS NULL THEN
      RAISE EXCEPTION 'Produto não encontrado ou inativo: %', v_item.product_id;
    END IF;

    v_price_with_discount := v_product.price * (1 - (v_product.discount_percent / 100));
    v_item_subtotal := v_price_with_discount * v_item.quantity;
    v_subtotal := v_subtotal + v_item_subtotal;
  END LOOP;

  -- Calcula desconto de cupom (se for cupom de desconto percentual/fixo)
  IF v_coupon_code IS NOT NULL THEN
    DECLARE
      v_c RECORD;
    BEGIN
      SELECT * INTO v_c
      FROM public.coupons
      WHERE code = v_coupon_code
        AND active = TRUE
        AND NOW() BETWEEN COALESCE(valid_from, '1970-01-01'::TIMESTAMPTZ) AND COALESCE(valid_until, '9999-12-31'::TIMESTAMPTZ)
        AND (max_uses IS NULL OR times_used < max_uses);

      IF v_c.discount_type = 'percent' THEN
        v_coupon_discount := ROUND((v_subtotal * v_c.discount_value) / 100, 2);
      ELSIF v_c.discount_type = 'fixed' THEN
        v_coupon_discount := v_c.discount_value;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_coupon_discount := 0;
    END;
  END IF;

  -- Aplica frete grátis SE cupom permitir e atingir mínimo
  IF v_current_free_shipping_min IS NOT NULL AND v_subtotal >= v_current_free_shipping_min THEN
    p_shipping_fee := 0;
  END IF;

  v_discount_total := v_coupon_discount;
  IF v_discount_total < 0 THEN
    v_discount_total := 0;
  END IF;

  v_total := v_subtotal - v_discount_total + COALESCE(p_shipping_fee, 0);
  IF v_total < 0 THEN
    v_total := 0;
  END IF;

  INSERT INTO public.orders (
    order_number,
    customer_name, customer_phone, customer_email,
    zipcode, street, number, complement, neighborhood, city, state,
    subtotal, discount_total, coupon_discount, shipping_fee, total,
    payment_status, order_status, coupon_code, notes, address_type
  ) VALUES (
    p_order_number,
    p_customer_name, p_customer_phone, p_customer_email,
    p_zipcode, p_street, p_number, p_complement, p_neighborhood, p_city, p_state,
    v_subtotal, v_discount_total, v_coupon_discount, COALESCE(p_shipping_fee, 0), v_total,
    'awaiting_payment', 'awaiting_confirmation',
    CASE WHEN v_coupon_code IS NOT NULL THEN v_coupon_code ELSE NULL END,
    p_notes,
    COALESCE(p_address_type, 'delivery')
  ) RETURNING * INTO v_order_created;

  v_order_id := v_order_created.id;

  FOR v_item IN
    SELECT
      (elem->>'product_id')::UUID AS product_id,
      GREATEST((elem->>'quantity')::INTEGER, 1) AS quantity
    FROM json_array_elements(p_items) AS elem
  LOOP
    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_item.product_id;

    v_price_with_discount := v_product.price * (1 - (v_product.discount_percent / 100));
    v_item_subtotal := v_price_with_discount * v_item.quantity;

    INSERT INTO public.order_items (
      order_id, product_id,
      product_name_snapshot, unit_price_snapshot, discount_percent_snapshot,
      quantity, subtotal
    ) VALUES (
      v_order_id, v_product.id,
      v_product.name, v_product.price, v_product.discount_percent,
      v_item.quantity, v_item_subtotal
    );
  END LOOP;

  INSERT INTO public.order_status_history (order_id, status)
  VALUES (v_order_id, 'awaiting_confirmation');

  -- Incrementa cupom se usado
  IF v_coupon_code IS NOT NULL THEN
    UPDATE public.coupons SET times_used = times_used + 1 WHERE code = v_coupon_code;
  END IF;

  RETURN public.get_order_by_number_and_phone(p_order_number, p_customer_phone);
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_order TO anon, authenticated;
