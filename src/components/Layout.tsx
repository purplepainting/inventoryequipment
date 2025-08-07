import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  ListSubheader,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as CheckoutIcon,
  CompareArrows as ReconcileIcon,
  Assessment as SummaryIcon,
  Receipt as InvoiceIcon,
  AttachMoney as PricingIcon,
  AccountBalance as TransactionIcon,
  List as ListIcon,
  Add as AddIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Assessment as ReportsIcon,
} from '@mui/icons-material';
import { useState } from 'react';

const drawerWidth = 280;

interface LayoutProps {
  children: ReactNode;
}

const menuItems = [
  {
    section: 'Inventory Management',
    items: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/inventory' },
      { text: 'Inventory List', icon: <ListIcon />, path: '/inventory/list' },
      { text: 'Receive Order', icon: <AddIcon />, path: '/inventory/receive' },
      { text: 'Checkout Inventory', icon: <CheckoutIcon />, path: '/inventory/checkout' },
      { text: 'Reconcile Inventory', icon: <ReconcileIcon />, path: '/inventory/reconcile' },
    ]
  },
  {
    section: 'Pricing & Items',
    items: [
      { text: 'Pricing Dashboard', icon: <PricingIcon />, path: '/pricing' },
      { text: 'Item Management', icon: <InventoryIcon />, path: '/pricing/items' },
      { text: 'Supplier Management', icon: <PeopleIcon />, path: '/pricing/suppliers' },
      { text: 'Pricing Rules', icon: <SettingsIcon />, path: '/pricing/rules' },
    ]
  },
  {
    section: 'Transactions & Expenses',
    items: [
      { text: 'Transaction Dashboard', icon: <TransactionIcon />, path: '/transactions' },
      { text: 'Expense Reports', icon: <ReportsIcon />, path: '/transactions/reports' },
      { text: 'Job Expenses', icon: <InvoiceIcon />, path: '/transactions/job-expenses' },
      { text: 'Transaction History', icon: <HistoryIcon />, path: '/transactions/history' },
    ]
  }
];

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Paint Inventory System
        </Typography>
      </Toolbar>
      <Divider />
      {menuItems.map((section) => (
        <div key={section.section}>
          <List>
            <ListSubheader>{section.section}</ListSubheader>
            {section.items.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
          <Divider />
        </div>
      ))}
    </div>
  );

  const getCurrentPageTitle = () => {
    for (const section of menuItems) {
      const item = section.items.find(item => item.path === location.pathname);
      if (item) return item.text;
    }
    return 'Paint Inventory System';
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {getCurrentPageTitle()}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
        }}
      >
        {children}
      </Box>
    </Box>
  );
} 