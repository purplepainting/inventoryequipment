import { supabase } from '../../lib/supabase';
import { 
  InventoryItem, 
  InventoryTransaction, 
  ReceiveOrder, 
  ReceiveOrderItem, 
  Withdrawal, 
  WithdrawalItem 
} from './types';

export class InventoryService {
  // Inventory Items
  static async getInventoryItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('description');
    
    if (error) throw error;
    return data || [];
  }

  static async createInventoryItem(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([item])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteInventoryItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Inventory Transactions
  static async getInventoryTransactions(): Promise<InventoryTransaction[]> {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createInventoryTransaction(transaction: Omit<InventoryTransaction, 'id' | 'created_at'>): Promise<InventoryTransaction> {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .insert([transaction])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Receive Orders
  static async getReceiveOrders(): Promise<ReceiveOrder[]> {
    const { data, error } = await supabase
      .from('receive_orders')
      .select('*')
      .order('order_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createReceiveOrder(order: Omit<ReceiveOrder, 'id' | 'created_at'>): Promise<ReceiveOrder> {
    const { data, error } = await supabase
      .from('receive_orders')
      .insert([order])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createReceiveOrderItem(item: Omit<ReceiveOrderItem, 'id' | 'created_at'>): Promise<ReceiveOrderItem> {
    const { data, error } = await supabase
      .from('receive_order_items')
      .insert([item])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Withdrawals
  static async getWithdrawals(): Promise<Withdrawal[]> {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createWithdrawal(withdrawal: Omit<Withdrawal, 'id' | 'created_at'>): Promise<Withdrawal> {
    const { data, error } = await supabase
      .from('withdrawals')
      .insert([withdrawal])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createWithdrawalItem(item: Omit<WithdrawalItem, 'id' | 'created_at'>): Promise<WithdrawalItem> {
    const { data, error } = await supabase
      .from('withdrawal_items')
      .insert([item])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Utility functions
  static async updateInventoryQuantity(itemId: string, quantityChange: number): Promise<void> {
    const { data: currentItem } = await supabase
      .from('inventory_items')
      .select('quantity')
      .eq('id', itemId)
      .single();
    
    if (currentItem) {
      const newQuantity = currentItem.quantity + quantityChange;
      await supabase
        .from('inventory_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);
    }
  }
} 