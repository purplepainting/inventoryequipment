import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme';
import Layout from './components/Layout';

// Import modular pages
import InventoryDashboard from './modules/inventory/pages/InventoryDashboard';
import InventoryList from './modules/inventory/pages/InventoryList';
import ReceiveOrder from './modules/inventory/pages/ReceiveOrder';
import CheckoutInventory from './modules/inventory/pages/CheckoutInventory';
import ReconcileInventory from './modules/inventory/pages/ReconcileInventory';

import PricingDashboard from './modules/pricing/pages/PricingDashboard';
import ItemManagement from './modules/pricing/pages/ItemManagement';
import SupplierManagement from './modules/pricing/pages/SupplierManagement';
import PricingRules from './modules/pricing/pages/PricingRules';

import TransactionDashboard from './modules/transactions/pages/TransactionDashboard';
import ExpenseReports from './modules/transactions/pages/ExpenseReports';
import JobExpenses from './modules/transactions/pages/JobExpenses';
import TransactionHistory from './modules/transactions/pages/TransactionHistory';

const queryClient = new QueryClient();

// Simple fallback component for testing
function TestComponent() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">App is Loading!</Typography>
      <Typography variant="body1">If you can see this, the app is working.</Typography>
    </Box>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Routes>
              {/* Test route */}
              <Route path="/test" element={<TestComponent />} />
              
              {/* Default route */}
              <Route path="/" element={<InventoryDashboard />} />
              
              {/* Inventory Module Routes */}
              <Route path="/inventory" element={<InventoryDashboard />} />
              <Route path="/inventory/list" element={<InventoryList />} />
              <Route path="/inventory/receive" element={<ReceiveOrder />} />
              <Route path="/inventory/checkout" element={<CheckoutInventory />} />
              <Route path="/inventory/reconcile" element={<ReconcileInventory />} />
              
              {/* Pricing Module Routes */}
              <Route path="/pricing" element={<PricingDashboard />} />
              <Route path="/pricing/items" element={<ItemManagement />} />
              <Route path="/pricing/suppliers" element={<SupplierManagement />} />
              <Route path="/pricing/rules" element={<PricingRules />} />
              
              {/* Transactions Module Routes */}
              <Route path="/transactions" element={<TransactionDashboard />} />
              <Route path="/transactions/reports" element={<ExpenseReports />} />
              <Route path="/transactions/job-expenses" element={<JobExpenses />} />
              <Route path="/transactions/history" element={<TransactionHistory />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 