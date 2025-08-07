import { supabase } from '../../lib/supabase';
import { 
  ExpenseReport, 
  ExpenseItem, 
  TransactionSummary, 
  ExpenseCategory, 
  JobExpense 
} from './types';

export class TransactionService {
  // Expense Reports
  static async getExpenseReports(): Promise<ExpenseReport[]> {
    const { data, error } = await supabase
      .from('expense_reports')
      .select('*')
      .order('report_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createExpenseReport(report: Omit<ExpenseReport, 'id' | 'created_at'>): Promise<ExpenseReport> {
    const { data, error } = await supabase
      .from('expense_reports')
      .insert([report])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateExpenseReport(id: string, updates: Partial<ExpenseReport>): Promise<ExpenseReport> {
    const { data, error } = await supabase
      .from('expense_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Expense Items
  static async getExpenseItems(reportId: string): Promise<ExpenseItem[]> {
    const { data, error } = await supabase
      .from('expense_items')
      .select('*')
      .eq('expense_report_id', reportId)
      .order('created_at');
    
    if (error) throw error;
    return data || [];
  }

  static async createExpenseItem(item: Omit<ExpenseItem, 'id' | 'created_at'>): Promise<ExpenseItem> {
    const { data, error } = await supabase
      .from('expense_items')
      .insert([item])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Transaction Summaries
  static async getTransactionSummaries(): Promise<TransactionSummary[]> {
    const { data, error } = await supabase
      .from('transaction_summaries')
      .select('*')
      .order('period_start', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createTransactionSummary(summary: Omit<TransactionSummary, 'id' | 'created_at'>): Promise<TransactionSummary> {
    const { data, error } = await supabase
      .from('transaction_summaries')
      .insert([summary])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Expense Categories
  static async getExpenseCategories(): Promise<ExpenseCategory[]> {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async createExpenseCategory(category: Omit<ExpenseCategory, 'id' | 'created_at'>): Promise<ExpenseCategory> {
    const { data, error } = await supabase
      .from('expense_categories')
      .insert([category])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Job Expenses
  static async getJobExpenses(): Promise<JobExpense[]> {
    const { data, error } = await supabase
      .from('job_expenses')
      .select('*')
      .order('period_start', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createJobExpense(expense: Omit<JobExpense, 'id' | 'created_at'>): Promise<JobExpense> {
    const { data, error } = await supabase
      .from('job_expenses')
      .insert([expense])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Utility functions
  static async generateExpenseReport(periodStart: string, periodEnd: string): Promise<ExpenseReport> {
    // Get all transactions in the period
    const { data: transactions } = await supabase
      .from('inventory_transactions')
      .select('*')
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd);

    const totalAmount = transactions?.reduce((sum, t) => {
      if (t.transaction_type === 'withdraw') {
        return sum + (t.quantity || 0);
      }
      return sum;
    }, 0) || 0;

    const report = await this.createExpenseReport({
      report_date: new Date().toISOString(),
      period_start: periodStart,
      period_end: periodEnd,
      total_amount: totalAmount,
      status: 'draft'
    });

    return report;
  }

  static async generateJobExpenseReport(jobName: string, periodStart: string, periodEnd: string): Promise<JobExpense> {
    // Get all withdrawals for the job in the period
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('*, withdrawal_items(*)')
      .eq('job_name', jobName)
      .gte('date', periodStart)
      .lte('date', periodEnd);

    const totalAmount = withdrawals?.reduce((sum, w) => {
      return sum + (w.withdrawal_items?.reduce((itemSum, item) => itemSum + (item.total_price || 0), 0) || 0);
    }, 0) || 0;

    const itemCount = withdrawals?.reduce((sum, w) => {
      return sum + (w.withdrawal_items?.length || 0);
    }, 0) || 0;

    const expense = await this.createJobExpense({
      job_name: jobName,
      total_amount: totalAmount,
      item_count: itemCount,
      period_start: periodStart,
      period_end: periodEnd
    });

    return expense;
  }
} 