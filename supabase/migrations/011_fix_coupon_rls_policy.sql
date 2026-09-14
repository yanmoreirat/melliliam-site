-- ============================================================
-- MIGRATION 011 — Correção RLS da tabela coupons
-- Problema: A policy coupons_apply_by_code exigia current_setting('app.coupon_code')
--          porém o cliente (Cart.tsx) NUNCA seta esse setting via set_config,
--          portanto a policy sempre retornava 0 linhas (bloqueando o SELECT).
--          Resultado: Qualquer cupom cadastrado dava "inválido ou não encontrado".
--
-- Solução: Manter a validação de cupom ativo + não expirado na policy,
--          porém REMOVER a exigência do current_setting por código.
--          O cliente já filtra por código exato via .eq('code', code) na query.
-- ============================================================

DROP POLICY IF EXISTS "coupons_apply_by_code" ON public.coupons;

CREATE POLICY "coupons_apply_by_code" ON public.coupons
  FOR SELECT
  TO anon, authenticated
  USING (
    active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
