# Inventory & Equipment Management System

A professional inventory and equipment management system designed specifically for painting companies. Built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

### 🏪 Inventory Management
- Track supplies, primer materials, and sundries
- SKU-based inventory with supplier information
- Stock level monitoring with minimum stock alerts
- Automatic reorder sheet generation
- Cost tracking and expense allocation

### 🔧 Equipment Tracking
- Tool location management across job sites
- Equipment check-in/check-out system
- Movement history and location tracking
- Shop vs. job site organization

### 📊 Project Management
- Project-based expense tracking
- Recurring project support
- Cost allocation and reporting
- Archive system for completed projects

### 👥 User Management
- Employee authentication system
- Role-based access control
- Activity tracking and audit trails

### 📈 Reporting & Analytics
- Usage history and trends
- Most-used items analysis
- Tool location history
- Expense reports for project billing

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel
- **Version Control**: GitHub

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account
- GitHub account
- Vercel account (for deployment)

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/purplepainting/inventoryequipment.git
cd inventoryequipment
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
Create a \`.env.local\` file in the root directory:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

4. Set up the database:
Run the SQL commands in \`supabase-schema.sql\` in your Supabase SQL editor.

5. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

The application uses the following main tables:
- \`profiles\` - User authentication and roles
- \`inventory_items\` - Inventory management
- \`tools\` - Equipment tracking
- \`projects\` - Project management
- \`inventory_transactions\` - Inventory checkout/restock history
- \`tool_movements\` - Tool location history

## Deployment

### Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Database Setup

1. Create a new Supabase project
2. Run the SQL schema from \`supabase-schema.sql\`
3. Enable Row Level Security policies
4. Configure authentication settings

## Usage

### For Employees
1. Register/login with company email
2. Access inventory and tools from dashboard
3. Process checkouts and track usage
4. Generate reorder sheets when needed

### For Administrators
1. Manage inventory items and tools
2. Create and manage projects
3. View reports and analytics
4. Manage user access and roles

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please create an issue in the GitHub repository.

## License

This project is proprietary software for painting company operations.
