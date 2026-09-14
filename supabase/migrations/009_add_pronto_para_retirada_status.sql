ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_status_check CHECK (order_status IN ('awaiting_payment', 'payment_informed', 'payment_confirmed', 'preparing', 'pronto_para_retirada', 'shipped', 'delivered', 'cancelled'));

ALTER TABLE public.order_status_history DROP CONSTRAINT IF EXISTS order_status_history_status_check;
ALTER TABLE public.order_status_history ADD CONSTRAINT order_status_history_status_check CHECK (status IN ('awaiting_payment', 'payment_informed', 'payment_confirmed', 'preparing', 'pronto_para_retirada', 'shipped', 'delivered', 'cancelled'));
