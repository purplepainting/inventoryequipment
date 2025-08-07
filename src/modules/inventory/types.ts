export interface InventoryItem {
  id: string;
  description: string;
  paint_store: string;
  item_number: string;
  pack: string;
  unit_price: number;
  quantity: number;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryTransaction {
  id: string;
  inventory_item_id: string;
  quantity: number;
  transaction_type: 'receive' | 'withdraw';
  notes?: string;
  job_name?: string;
  withdrawn_by?: string;
  created_at?: string;
}

export interface ReceiveOrder {
  id: string;
  order_date: string;
  supplier: string;
  notes?: string;
  total_amount: number;
  created_at?: string;
}

export interface ReceiveOrderItem {
  id: string;
  receive_order_id: string;
  inventory_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at?: string;
}

export interface Withdrawal {
  id: string;
  job_name: string;
  withdrawn_by: string;
  notes?: string;
  date: string;
  total_amount: number;
  created_at?: string;
}

export interface WithdrawalItem {
  id: string;
  withdrawal_id: string;
  inventory_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at?: string;
} 