CREATE OR REPLACE FUNCTION public.create_order(
  p_order_number TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_zipcode TEXT,
  p_street TEXT,
  p_number TEXT,
  p_neighborhood TEXT,
  p_city TEXT,
  p_state TEXT,
  p_items JSON,
  p_customer_email TEXT DEFAULT NULL,
  p_complement TEXT DEFAULT NULL,
  p_coupon_code TEXT DEFAULT NULL,
  p_shipping_fee NUMERIC(10,2) DEFAULT 0,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_order RECORD;
  v_items JSONB;
  v_history JSONB;

  v_subtotal NUMERIC(10,2) := 0;
  v_discount_total NUMERIC(10,2) := 0;
  v_coupon_discount NUMERIC(10,2) := 0;
  v_shipping_fee NUMERIC(10,2) := 0;
  v_total NUMERIC(10,2) := 0;

  v_shipping_type TEXT;
  v_shipping_value NUMERIC(10,2);

  v_coupon RECORD := NULL;
  v_item RECORD;
  v_product RECORD;

  v_price_with_discount NUMERIC(10,2);
  v_item_discount NUMERIC(10,2);
  v_item_subtotal NUMERIC(10,2);
  v_order_created RECORD;
BEGIN
  IF p_order_number IS NULL OR TRIM(p_order_number) = '' THEN
    RAISE EXCEPTION 'Número do pedido é obrigatório';
  END IF;

  IF EXISTS (SELECT 1 FROM public.orders WHERE order_number = p_order_number) THEN
    RAISE EXCEPTION 'Número do pedido já existe';
  END IF;

  IF p_customer_name IS NULL OR TRIM(p_customer_name) = '' THEN
    RAISE EXCEPTION 'Nome do cliente é obrigatório';
  END IF;

  IF p_customer_phone IS NULL OR TRIM(p_customer_phone) = '' THEN
    RAISE EXCEPTION 'Telefone do cliente é obrigatório';
  END IF;

  IF p_items IS NULL OR json_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Pedido deve ter pelo menos um item';
  END IF;

  SELECT value INTO v_shipping_type
  FROM public.site_settings WHERE key = 'shipping_type';

  SELECT COALESCE(NULLIF(value, '')::NUMERIC(10,2), 0) INTO v_shipping_value
  FROM public.site_settings WHERE key = 'shipping_value';

  IF v_shipping_type = 'free' THEN
    v_shipping_fee := 0;
  ELSE
    v_shipping_fee := COALESCE(v_shipping_value, 0);
  END IF;

  IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE code = TRIM(p_coupon_code)
      AND active = true
      AND (expires_at IS NULL OR expires_at > NOW());

    IF v_coupon IS NULL THEN
      RAISE EXCEPTION 'Cupom inválido ou expirado';
    END IF;
  END IF;

  FOR v_item IN
    SELECT
      (elem->>'product_id')::UUID AS product_id,
      GREATEST((elem->>'quantity')::INTEGER, 1) AS quantity
    FROM json_array_elements(p_items) AS elem
  LOOP
    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_item.product_id
      AND is_available = true;

    IF v_product IS NULL THEN
      RAISE EXCEPTION 'Produto indisponível ou não encontrado: %', v_item.product_id;
    END IF;

    v_price_with_discount := v_product.price * (1 - (v_product.discount_percent / 100));
    v_item_subtotal := v_price_with_discount * v_item.quantity;
    v_item_discount := (v_product.price - v_price_with_discount) * v_item.quantity;

    v_subtotal := v_subtotal + (v_product.price * v_item.quantity);
    v_discount_total := v_discount_total + v_item_discount;
  END LOOP;

  v_total := v_subtotal - v_discount_total;

  IF v_coupon IS NOT NULL THEN
    IF v_coupon.type = 'percent' THEN
      v_coupon_discount := ROUND(((v_subtotal - v_discount_total) * (v_coupon.value / 100)), 2);
    ELSE
      v_coupon_discount := v_coupon.value;
    END IF;
    IF v_coupon_discount > (v_subtotal - v_discount_total) THEN
      v_coupon_discount := v_subtotal - v_discount_total;
    END IF;
    IF v_coupon_discount < 0 THEN
      v_coupon_discount := 0;
    END IF;
  END IF;

  v_total := (v_subtotal - v_discount_total - v_coupon_discount) + v_shipping_fee;
  IF v_total < 0 THEN
    v_total := 0;
  END IF;

  INSERT INTO public.orders (
    order_number,
    customer_name, customer_phone, customer_email,
    zipcode, street, number, complement, neighborhood, city, state,
    subtotal, discount_total, coupon_discount, shipping_fee, total,
    payment_status, order_status, coupon_code, notes
  ) VALUES (
    p_order_number,
    p_customer_name, p_customer_phone, p_customer_email,
    p_zipcode, p_street, p_number, p_complement, p_neighborhood, p_city, p_state,
    v_subtotal, v_discount_total, v_coupon_discount, v_shipping_fee, v_total,
    'awaiting_payment', 'awaiting_payment',
    CASE WHEN v_coupon.code IS DISTINCT FROM NULL THEN v_coupon.code ELSE p_coupon_code END,
    p_notes
  ) RETURNING * INTO v_order_created;

  v_order_id := v_order_created.id;

  FOR v_item IN
    SELECT
      (elem->>'product_id')::UUID AS product_id,
      GREATEST((elem->>'quantity')::INTEGER, 1) AS quantity
    FROM json_array_elements(p_items) AS elem
  LOOP
    SELECT * INTO v_product
    FROM public.products WHERE id = v_item.product_id;

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
  VALUES (v_order_id, 'awaiting_payment');

  RETURN public.get_order_by_number_and_phone(p_order_number, p_customer_phone);
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_order TO anon, authenticated;
