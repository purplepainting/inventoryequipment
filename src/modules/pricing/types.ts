export interface PricingRule {
  id: string;
  item_id: string;
  markup_percentage: number;
  minimum_price: number;
  maximum_price: number;
  created_at?: string;
}

export interface ItemCategory {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
}

export interface ItemPricing {
  id: string;
  item_id: string;
  supplier_id: string;
  cost_price: number;
  retail_price: number;
  markup_percentage: number;
  effective_date: string;
  created_at?: string;
} 