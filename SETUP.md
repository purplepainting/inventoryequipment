# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `paint-inventory-system`
   - Database Password: (create a strong password)
   - Region: Choose closest to you
6. Click "Create new project"

## Step 2: Get Your Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** (looks like: `https://your-project-id.supabase.co`)
3. Copy your **anon public** key (starts with `eyJ...`)

## Step 3: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `supabase-schema.sql` from this project
3. Paste it into the SQL editor
4. Click **Run** to execute the schema

## Step 4: Configure Environment Variables

1. Create a `.env` file in your project root
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your actual project URL and anon key.

## Step 5: Test the Connection

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Go to http://localhost:5173
3. Navigate to **Inventory List**
4. Try clicking **Add Item** - it should now work with the database!

## Database Tables Created

The schema creates these main tables:

### Inventory Management
- `inventory_items` - Core inventory data
- `inventory_transactions` - Transaction history
- `receive_orders` - Incoming orders
- `receive_order_items` - Items in receive orders
- `withdrawals` - Outgoing inventory
- `withdrawal_items` - Items in withdrawals

### Pricing Management
- `pricing_rules` - Markup and pricing rules
- `item_categories` - Item categorization
- `suppliers` - Supplier information
- `item_pricing` - Historical pricing data

### Transaction Tracking
- `expense_reports` - Generated expense reports
- `expense_items` - Individual expense line items
- `transaction_summaries` - Period summaries
- `expense_categories` - Expense categorization
- `job_expenses` - Job-specific expense tracking

## Troubleshooting

### If "Add Item" doesn't work:
1. Check your `.env` file has correct credentials
2. Verify the database schema was executed successfully
3. Check browser console for any errors
4. Restart the development server

### If you see database errors:
1. Make sure all tables were created in Supabase
2. Check that your anon key has proper permissions
3. Verify Row Level Security (RLS) settings if needed

## Next Steps

Once connected, you can:
1. Add inventory items through the UI
2. Test receiving inventory
3. Explore the other modules
4. Start building out the pricing and transaction features

The system will automatically fall back to mock data if Supabase isn't configured, so you can still test the UI even without the database connection. 