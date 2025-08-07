import { supabase } from '../../lib/supabase';
import { PricingRule, ItemCategory, Supplier, ItemPricing } from './types';

export class PricingService {
  // Pricing Rules
  static async getPricingRules(): Promise<PricingRule[]> {
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createPricingRule(rule: Omit<PricingRule, 'id' | 'created_at'>): Promise<PricingRule> {
    const { data, error } = await supabase
      .from('pricing_rules')
      .insert([rule])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updatePricingRule(id: string, updates: Partial<PricingRule>): Promise<PricingRule> {
    const { data, error } = await supabase
      .from('pricing_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Item Categories
  static async getItemCategories(): Promise<ItemCategory[]> {
    const { data, error } = await supabase
      .from('item_categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async createItemCategory(category: Omit<ItemCategory, 'id' | 'created_at'>): Promise<ItemCategory> {
    const { data, error } = await supabase
      .from('item_categories')
      .insert([category])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Suppliers
  static async getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async createSupplier(supplier: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([supplier])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Item Pricing
  static async getItemPricing(itemId: string): Promise<ItemPricing[]> {
    const { data, error } = await supabase
      .from('item_pricing')
      .select('*')
      .eq('item_id', itemId)
      .order('effective_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createItemPricing(pricing: Omit<ItemPricing, 'id' | 'created_at'>): Promise<ItemPricing> {
    const { data, error } = await supabase
      .from('item_pricing')
      .insert([pricing])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Utility functions
  static calculateRetailPrice(costPrice: number, markupPercentage: number): number {
    return costPrice * (1 + markupPercentage / 100);
  }

  static calculateMarkupPercentage(costPrice: number, retailPrice: number): number {
    return ((retailPrice - costPrice) / costPrice) * 100;
  }
} 