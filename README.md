# Paint Inventory Management System

A comprehensive inventory management system built with React, TypeScript, and Supabase, designed specifically for paint and construction materials tracking.

## 🏗️ Architecture

The system is organized into three main modules:

### 1. Inventory Management Module
- **Dashboard**: Overview of inventory status, recent transactions, and low stock alerts
- **Inventory List**: Add, edit, and manage inventory items
- **Receive Order**: Process incoming inventory and update quantities
- **Checkout Inventory**: Track outgoing inventory for jobs
- **Reconcile Inventory**: Audit and adjust inventory levels

### 2. Pricing & Items Module
- **Pricing Dashboard**: Overview of pricing strategies and margins
- **Item Management**: Manage item categories and specifications
- **Supplier Management**: Track suppliers and their information
- **Pricing Rules**: Configure markup percentages and pricing strategies

### 3. Transactions & Expenses Module
- **Transaction Dashboard**: Overview of all financial transactions
- **Expense Reports**: Generate and manage expense reports
- **Job Expenses**: Track expenses by job/project
- **Transaction History**: Complete audit trail of all transactions

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account (for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/purplepainting/inventorymanagement.git
   cd inventorymanagement
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
   - Get your project URL and anon key from the API settings

4. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
src/
├── modules/
│   ├── inventory/
│   │   ├── pages/          # Inventory management pages
│   │   ├── services.ts     # Database operations
│   │   └── types.ts        # TypeScript interfaces
│   ├── pricing/
│   │   ├── pages/          # Pricing management pages
│   │   ├── services.ts     # Pricing operations
│   │   └── types.ts        # Pricing interfaces
│   └── transactions/
│       ├── pages/          # Transaction pages
│       ├── services.ts     # Transaction operations
│       └── types.ts        # Transaction interfaces
├── components/             # Shared UI components
├── lib/                    # External service configurations
└── theme.ts               # Material-UI theme configuration
```

## 🗄️ Database Schema

The system uses the following main tables:

### Inventory Tables
- `inventory_items`: Core inventory data
- `inventory_transactions`: Transaction history
- `receive_orders`: Incoming order records
- `receive_order_items`: Items in receive orders
- `withdrawals`: Outgoing inventory records
- `withdrawal_items`: Items in withdrawals

### Pricing Tables
- `pricing_rules`: Markup and pricing rules
- `item_categories`: Item categorization
- `suppliers`: Supplier information
- `item_pricing`: Historical pricing data

### Transaction Tables
- `expense_reports`: Generated expense reports
- `expense_items`: Individual expense line items
- `transaction_summaries`: Period summaries
- `expense_categories`: Expense categorization
- `job_expenses`: Job-specific expense tracking

## 🔧 Features

### Inventory Management
- ✅ Add/Edit/Delete inventory items
- ✅ Track quantities and unit prices
- ✅ Receive incoming inventory
- ✅ Checkout inventory for jobs
- ✅ Transaction history logging
- ✅ Low stock alerts

### Pricing Management
- ✅ Configure pricing rules
- ✅ Manage suppliers
- ✅ Track cost vs retail pricing
- ✅ Historical pricing data

### Transaction Tracking
- ✅ Generate expense reports
- ✅ Track job-specific expenses
- ✅ Transaction summaries
- ✅ Export capabilities

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Adding New Features
1. Create types in the appropriate module's `types.ts`
2. Add services in the module's `services.ts`
3. Create UI components in the module's `pages/` directory
4. Update routing in `App.tsx`
5. Add navigation items in `Layout.tsx`

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Environment variables for sensitive data
- Input validation on all forms
- Error handling throughout the application

## 📊 Reporting

The system provides comprehensive reporting capabilities:
- Inventory valuation reports
- Transaction summaries by period
- Job expense reports
- Supplier performance tracking
- Low stock alerts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for the painting industry** 