export interface ExpenseReport {
  id: string;
  report_date: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  notes?: string;
  created_at?: string;
}

export interface ExpenseItem {
  id: string;
  expense_report_id: string;
  transaction_id: string;
  amount: number;
  description: string;
  category: string;
  created_at?: string;
}

export interface TransactionSummary {
  id: string;
  period_start: string;
  period_end: string;
  total_received: number;
  total_withdrawn: number;
  net_change: number;
  item_count: number;
  created_at?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  budget_limit?: number;
  created_at?: string;
}

export interface JobExpense {
  id: string;
  job_name: string;
  total_amount: number;
  item_count: number;
  period_start: string;
  period_end: string;
  created_at?: string;
} 