import { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { supabase } from '../lib/supabase';
import { InventoryItem } from '../types/database.types';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    recentWithdrawals: 0,
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch total items and value
        const { data: inventoryItems, error: inventoryError } = await supabase
          .from('inventory_items')
          .select('*');

        if (inventoryError) throw inventoryError;

        const totalValue = inventoryItems.reduce(
          (sum, item) => sum + item.current_stock * item.unit_price,
          0
        );

        const lowStockItems = inventoryItems.filter(
          (item) => item.current_stock <= item.reorder_level
        ).length;

        // Fetch recent withdrawals (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count: recentWithdrawals, error: withdrawalsError } = await supabase
          .from('withdrawals')
          .select('*', { count: 'exact' })
          .gte('date', sevenDaysAgo.toISOString());

        if (withdrawalsError) throw withdrawalsError;

        setStats({
          totalItems: inventoryItems.length,
          totalValue,
          lowStockItems,
          recentWithdrawals: recentWithdrawals || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Items
            </Typography>
            <Typography variant="h4">{stats.totalItems}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Inventory Value
            </Typography>
            <Typography variant="h4">
              ${stats.totalValue.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Low Stock Items
            </Typography>
            <Typography variant="h4">{stats.lowStockItems}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Recent Withdrawals (7 days)
            </Typography>
            <Typography variant="h4">{stats.recentWithdrawals}</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
} 