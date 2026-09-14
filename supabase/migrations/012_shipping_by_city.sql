-- ============================================================
-- MIGRATION 012 — Frete por Cidade (Tabela de Regras + Bloqueio de Zonas não atendidas)
-- Cenário real: UBÁ + cidades vizinhas com valores/prazos individuais.
-- Qualquer cidade FORA da tabela = BLOQUEIA entrega (mensagem customizável).
-- Modo legado "frete fixo geral" continua disponível via shipping_mode = 'fixed'.
-- ============================================================

-- ============================================================
-- 1) TABELA shipping_rules (1 regra = 1 cidade + valor de frete)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shipping_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  state CHAR(2) NOT NULL DEFAULT '',
  value NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (value >= 0),
  delivery_estimate TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Evita duplicatas: cidade + UF iguais = mesma regra
CREATE UNIQUE INDEX IF NOT EXISTS idx_shipping_rules_city_state
  ON public.shipping_rules (UPPER(TRIM(city)), state);

CREATE INDEX IF NOT EXISTS idx_shipping_rules_active
  ON public.shipping_rules (active);

-- Trigger updated_at
DROP TRIGGER IF EXISTS shipping_rules_updated_at ON public.shipping_rules;
CREATE TRIGGER shipping_rules_updated_at
  BEFORE UPDATE ON public.shipping_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 2) RLS da tabela shipping_rules
--    - Leitura pública (anon/authenticated) para consulta no checkout
--    - Escrita total só admin
-- ============================================================
ALTER TABLE public.shipping_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shipping_rules_select_public" ON public.shipping_rules;
CREATE POLICY "shipping_rules_select_public" ON public.shipping_rules
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "shipping_rules_admin_all" ON public.shipping_rules;
CREATE POLICY "shipping_rules_admin_all" ON public.shipping_rules
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Grants
GRANT SELECT ON TABLE public.shipping_rules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shipping_rules TO authenticated;
-- (NOTE: coluna id é UUID com gen_random_uuid() — NÃO existe sequence shipping_rules_id_seq.
--  Não adicionar GRANT USAGE ON SEQUENCE aqui, pois causaria erro 42P01.)

-- ============================================================
-- 3) FUNÇÃO AUXILIAR server-side: resolve frete por cidade/UF
--    Retorna JSON com {found, value, delivery_estimate, blocked, outside_behavior, blocked_message}
--    Usada na RPC create_order para revalidar o frete recebido do cliente
--    (evita manipulação: usuário edita JS pra R$0, servidor recalcula e bate)
-- ============================================================
CREATE OR REPLACE FUNCTION public.resolve_shipping(
  p_city TEXT,
  p_state TEXT,
  p_zipcode TEXT
) RETURNS JSON AS $$
DECLARE
  v_mode TEXT;
  v_fixed_value NUMERIC;
  v_outside TEXT;
  v_blocked_msg TEXT;
  v_rule RECORD;
  v_city_norm TEXT := UPPER(TRIM(COALESCE(p_city, '')));
  v_state_norm TEXT := UPPER(TRIM(COALESCE(p_state, '')));
BEGIN
  -- Carrega configurações do site
  SELECT COALESCE(MAX(CASE WHEN key = 'shipping_mode' THEN value END), 'fixed')
         INTO v_mode FROM public.site_settings;
  SELECT COALESCE(MAX(CASE WHEN key = 'shipping_value' THEN value END), '0')::NUMERIC
         INTO v_fixed_value FROM public.site_settings;
  SELECT COALESCE(MAX(CASE WHEN key = 'shipping_outside_rules_behavior' THEN value END), 'block')
         INTO v_outside FROM public.site_settings;
  SELECT COALESCE(MAX(CASE WHEN key = 'shipping_blocked_message' THEN value END),
         'No momento não entregamos em sua cidade. Consulte a retirada na loja.')
         INTO v_blocked_msg FROM public.site_settings;

  -- ==============
  -- MODO FIXO GERAL (compatibilidade com configuração antiga)
  -- ==============
  IF v_mode = 'fixed' THEN
    RETURN json_build_object(
      'found', true,
      'mode', 'fixed',
      'value', v_fixed_value,
      'delivery_estimate', '',
      'blocked', false,
      'blocked_message', ''
    );
  END IF;

  -- ==============
  -- MODO POR REGRAS DE CIDADE
  -- ==============
  SELECT * INTO v_rule
  FROM public.shipping_rules
  WHERE active = true
    AND UPPER(TRIM(city)) = v_city_norm
    AND (state = '' OR state = v_state_norm)
  ORDER BY CASE WHEN state <> '' THEN 0 ELSE 1 END
  LIMIT 1;

  IF v_rule.id IS NOT NULL THEN
    -- Cidade cadastrada = usa o valor e prazo da tabela
    RETURN json_build_object(
      'found', true,
      'mode', 'rules',
      'value', v_rule.value,
      'delivery_estimate', v_rule.delivery_estimate,
      'blocked', false,
      'blocked_message', ''
    );
  END IF;

  -- Cidade NÃO está na tabela → usa outside behavior
  IF v_outside = 'block' THEN
    RETURN json_build_object(
      'found', false,
      'mode', 'rules',
      'value', 0,
      'delivery_estimate', '',
      'blocked', true,
      'blocked_message', v_blocked_msg
    );
  END IF;

  -- outside = fixed_default (opcional pro futuro, usa o valor fixo geral como fallback)
  RETURN json_build_object(
    'found', false,
    'mode', 'rules_default',
    'value', v_fixed_value,
    'delivery_estimate', '',
    'blocked', false,
    'blocked_message', ''
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.resolve_shipping TO anon, authenticated;
