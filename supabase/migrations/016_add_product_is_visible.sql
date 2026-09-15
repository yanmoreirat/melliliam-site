-- Adiciona coluna is_visible para controlar se o produto aparece no site (separado de is_available = esgotado)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

-- Cria índice para performance no filtro público
CREATE INDEX IF NOT EXISTS idx_products_is_visible ON public.products(is_visible);
