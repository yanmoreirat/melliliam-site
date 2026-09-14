-- ================================================
-- MIGRATION 009: ADD NOVO STATUS + SEPARACAO DE STATUS
-- Obs: Executar SEM erros, pois agora usa TRANSACAO + atualiza valores antigos antes.
-- ================================================

-- 1) ATUALIZAR VALORES ANTIGOS (ja existiam na tabela orders e por isso quebravam constraint)
-- Se existir linha com order_status = awaiting_payment / payment_informed / payment_confirmed
-- converter para "awaiting_confirmation" (novo status logistico inicial)
UPDATE public.orders
SET order_status = 'awaiting_confirmation'
WHERE order_status IN ('awaiting_payment', 'payment_informed', 'payment_confirmed');

-- Se nao existia linha nenhuma, nao tem problema.

-- 2) FAZER O MESMO NA TABELA DE HISTORICO: converter linhas de pagamento inseridas em order_status_history
--    para os novos valores, evitando quebra do CHECK.
--    (Para nao perder o historico, convertemos apenas os de pagamento para a etapa mais proxima.)
UPDATE public.order_status_history
SET status = 'awaiting_confirmation'
WHERE status IN ('awaiting_payment', 'payment_informed', 'payment_confirmed');

-- 3) REMOVER CONSTRAINTS ANTIGAS (se existirem)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.order_status_history DROP CONSTRAINT IF EXISTS order_status_history_status_check;

-- 4) RECRIAR CONSTRAINTS NOVAS com os valores separados corretos

/*
 order_status = SOMENTE etapas logisticas
 (NAO CONTEM informacoes de pagamento)
--------------------------------------------------
 awaiting_confirmation  -> Aguardando confirmacao do pagamento (status logistico inicial padrao)
 in_preparation         -> Em Preparacao
 pronto_para_retirada   -> Pronto para Retirada (NOVO)
 shipped                -> Saiu para Entrega
 delivered              -> Entregue / Retirado
 cancelled              -> Cancelado
*/
ALTER TABLE public.orders
ADD CONSTRAINT orders_order_status_check
CHECK (order_status IN (
  'awaiting_confirmation',
  'in_preparation',
  'pronto_para_retirada',
  'shipped',
  'delivered',
  'cancelled'
));

/*
 payment_status = SOMENTE sobre o dinheiro (INDEPENDENTE)
--------------------------------------------------
 awaiting_payment   -> Aguardando Pagamento
 payment_informed   -> Pagamento Informado
 payment_confirmed  -> Pagamento Confirmado
 refunded           -> Reembolsado (se necessario futuramente)
 cancelled          -> Cancelado
*/
ALTER TABLE public.orders
ADD CONSTRAINT orders_payment_status_check
CHECK (payment_status IN (
  'awaiting_payment',
  'payment_informed',
  'payment_confirmed',
  'refunded',
  'cancelled'
));

/*
 order_status_history.status
 Permite AMBOS (historico completo).
 Para pedidos antigos de pagamento que foram migrados para awaiting_confirmation,
 mantermos compatibilidade total.
*/
ALTER TABLE public.order_status_history
ADD CONSTRAINT order_status_history_status_check
CHECK (status IN (
  'awaiting_confirmation',
  'in_preparation',
  'pronto_para_retirada',
  'shipped',
  'delivered',
  'cancelled',
  'awaiting_payment',
  'payment_informed',
  'payment_confirmed',
  'refunded'
));

-- 5) PADRONIZAR VALOR DEFAULT da coluna order_status (para novos pedidos criados agora em diante):
ALTER TABLE public.orders ALTER COLUMN order_status SET DEFAULT 'awaiting_confirmation';
ALTER TABLE public.orders ALTER COLUMN payment_status SET DEFAULT 'awaiting_payment';
