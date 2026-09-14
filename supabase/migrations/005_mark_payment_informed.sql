CREATE OR REPLACE FUNCTION public.mark_payment_informed(
  p_order_number TEXT,
  p_customer_phone TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_order_id UUID;
  v_current_status TEXT;
BEGIN
  SELECT id, order_status INTO v_order_id, v_current_status
  FROM public.orders
  WHERE order_number = p_order_number
    AND customer_phone = p_customer_phone;

  IF v_order_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_current_status = 'awaiting_payment' THEN
    UPDATE public.orders
    SET
      order_status = 'payment_informed',
      payment_status = 'payment_informed',
      updated_at = NOW()
    WHERE id = v_order_id;

    INSERT INTO public.order_status_history (order_id, status, created_at)
    VALUES (v_order_id, 'payment_informed', NOW());
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.mark_payment_informed(TEXT, TEXT) TO anon, authenticated;
