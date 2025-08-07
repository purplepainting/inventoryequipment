import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
} from '@mui/material';
import { InventoryService } from '../services';
import { InventoryItem, InventoryTransaction } from '../types';

export default function InventoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [items, trans] = await Promise.all([
        InventoryService.getInventoryItems(),
        InventoryService.getInventoryTransactions()
      ]);
      setInventoryItems(items);
      setTransactions(trans);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalItems = inventoryItems.length;
  const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const recentTransactions = transactions.slice(0, 5);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Inventory Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Items
              </Typography>
              <Typography variant="h3">
                {totalItems}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Quantity
              </Typography>
              <Typography variant="h3">
                {totalQuantity}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Value
              </Typography>
              <Typography variant="h3">
                ${totalValue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              {recentTransactions.map((transaction) => (
                <Box key={transaction.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(transaction.created_at || '').toLocaleDateString()}
                  </Typography>
                  <Typography variant="body1">
                    {transaction.transaction_type === 'receive' ? 'Received' : 'Withdrawn'}: {transaction.quantity}
                  </Typography>
                  {transaction.job_name && (
                    <Typography variant="body2" color="textSecondary">
                      Job: {transaction.job_name}
                    </Typography>
                  )}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Low Stock Items
              </Typography>
              {inventoryItems
                .filter(item => item.quantity < 10)
                .slice(0, 5)
                .map((item) => (
                  <Box key={item.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                    <Typography variant="body1">
                      {item.description}
                    </Typography>
                    <Typography variant="body2" color="error">
                      Quantity: {item.quantity}
                    </Typography>
                  </Box>
                ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 