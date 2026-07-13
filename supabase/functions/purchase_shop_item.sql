CREATE OR REPLACE FUNCTION purchase_shop_item(
  p_user_id UUID,
  p_item_id UUID,
  p_quantity INTEGER DEFAULT 1
) RETURNS JSON AS $$
DECLARE
  v_item RECORD;
  v_wallet RECORD;
  v_total_cost INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get item details
  SELECT * INTO v_item FROM shop_items WHERE id = p_item_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Item not found', 'success', false);
  END IF;

  -- Get user wallet
  SELECT * INTO v_wallet FROM user_wallets WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Wallet not found', 'success', false);
  END IF;

  -- Calculate total cost
  v_total_cost := v_item.price * p_quantity;

  -- Check balance
  IF v_wallet.credits < v_total_cost THEN
    RETURN json_build_object(
      'error', 'Insufficient balance',
      'required', v_total_cost,
      'available', v_wallet.credits,
      'success', false
    );
  END IF;

  -- Deduct credits
  UPDATE user_wallets
  SET credits = credits - v_total_cost,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Add to inventory or update quantity
  INSERT INTO user_inventory (user_id, shop_item_id, quantity)
  VALUES (p_user_id, p_item_id, p_quantity)
  ON CONFLICT (user_id, shop_item_id)
  DO UPDATE SET quantity = user_inventory.quantity + p_quantity;

  -- Create transaction record
  INSERT INTO transactions (user_id, item_id, type, amount, currency_type, description)
  VALUES (
    p_user_id,
    p_item_id,
    'purchase',
    v_total_cost,
    'credits',
    'Purchased: ' || v_item.name
  ) RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'item_name', v_item.name,
    'cost', v_total_cost,
    'remaining_balance', v_wallet.credits - v_total_cost
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
