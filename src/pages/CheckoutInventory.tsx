import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { InventoryItem, Withdrawal, WithdrawalItem } from '../types/database.types';

interface WithdrawalFormItem {
  inventory_item_id: string;
  quantity: number;
  unit_price: number;
}

export default function CheckoutInventory() {
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const withdrawnByOptions = ['Jose', 'Abraham', 'Kareem'];
  const [formData, setFormData] = useState({
    job_name: '',
    withdrawn_by: 'Jose',
    notes: '',
    items: [] as WithdrawalFormItem[],
  });
  const [withdrawQuantities, setWithdrawQuantities] = useState<{ [id: string]: number }>({});
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalItems, setWithdrawalItems] = useState<any[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(null);
  const [editQuantities, setEditQuantities] = useState<{ [id: string]: number }>({});
  const [editWithdrawnBy, setEditWithdrawnBy] = useState('Jose');
  const [editJobName, setEditJobName] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    fetchInventoryItems();
    fetchWithdrawals();
  }, []);

  async function fetchInventoryItems() {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('description');

      if (error) throw error;
      setInventoryItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchWithdrawals() {
    setLoadingWithdrawals(true);
    const { data: withdrawalsData, error: withdrawalsError } = await supabase
      .from('withdrawals')
      .select('*')
      .order('date', { ascending: false });
    const { data: withdrawalItemsData, error: withdrawalItemsError } = await supabase
      .from('withdrawal_items')
      .select('*');
    if (!withdrawalsError && !withdrawalItemsError) {
      setWithdrawals(withdrawalsData || []);
      setWithdrawalItems(withdrawalItemsData || []);
    }
    setLoadingWithdrawals(false);
  }

  function getTotalAmount(withdrawalId: string) {
    return withdrawalItems
      .filter((item) => item.withdrawal_id === withdrawalId)
      .reduce((sum, item) => sum + (item.total_price || 0), 0);
  }

  async function handleDeleteWithdrawal(withdrawal) {
    // 1. Fetch all items for this withdrawal
    const { data: withdrawalItems } = await supabase
      .from('withdrawal_items')
      .select('*')
      .eq('withdrawal_id', withdrawal.id);

    // 2. Add each item's quantity back to inventory
    if (withdrawalItems) {
      for (const item of withdrawalItems) {
        const { data: inv } = await supabase
          .from('inventory_items')
          .select('quantity')
          .eq('id', item.inventory_item_id)
          .single();
        if (inv) {
          const newQty = (inv.quantity || 0) + item.quantity;
          await supabase
            .from('inventory_items')
            .update({ quantity: newQty })
            .eq('id', item.inventory_item_id);
        }
      }
    }

    // 3. Delete the withdrawal and its items
    await supabase.from('withdrawal_items').delete().eq('withdrawal_id', withdrawal.id);
    await supabase.from('withdrawals').delete().eq('id', withdrawal.id);

    // 4. Refresh data
    fetchInventoryItems();
    fetchWithdrawals();
  }

  const handleOpenDialog = async () => {
    await fetchInventoryItems();
    setFormData({
      job_name: '',
      withdrawn_by: 'Jose',
      notes: '',
      items: [],
    });
    setWithdrawQuantities({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          inventory_item_id: '',
          quantity: 0,
          unit_price: 0,
        },
      ],
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({
      ...formData,
      items: newItems,
    });
  };

  const handleItemChange = (index: number, field: keyof WithdrawalFormItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    // If inventory_item_id changes, update the unit_price
    if (field === 'inventory_item_id') {
      const selectedItem = inventoryItems.find((item) => item.id === value);
      if (selectedItem) {
        newItems[index].unit_price = selectedItem.unit_price;
      }
    }

    setFormData({
      ...formData,
      items: newItems,
    });
  };

  const handleSubmit = async () => {
    try {
      // Create withdrawal record
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert([
          {
            job_name: formData.job_name,
            withdrawn_by: formData.withdrawn_by,
            notes: formData.notes,
            date: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (withdrawalError) throw withdrawalError;

      // Create withdrawal items
      const withdrawalItems = formData.items.map((item) => ({
        withdrawal_id: withdrawal.id,
        inventory_item_id: item.inventory_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from('withdrawal_items')
        .insert(withdrawalItems);

      if (itemsError) throw itemsError;

      // Update inventory quantities
      for (const item of formData.items) {
        const { error: updateError } = await supabase.rpc('decrease_inventory', {
          item_id: item.inventory_item_id,
          amount: item.quantity,
        });

        if (updateError) throw updateError;
      }

      handleCloseDialog();
      fetchInventoryItems();
      fetchWithdrawals();
    } catch (error) {
      console.error('Error creating withdrawal:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Checkout Inventory</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          New Withdrawal
        </Button>
      </Box>

      {loadingWithdrawals ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Job Name</TableCell>
                <TableCell>Withdrawn By</TableCell>
                <TableCell align="right">Total Amount</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {withdrawals.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>{w.date ? new Date(w.date).toLocaleString() : ''}</TableCell>
                  <TableCell>{w.job_name}</TableCell>
                  <TableCell>{w.withdrawn_by}</TableCell>
                  <TableCell align="right">${getTotalAmount(w.id).toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => {
                      setSelectedWithdrawal(w);
                      setEditJobName(w.job_name);
                      setEditWithdrawnBy(w.withdrawn_by);
                      setEditNotes(w.notes || '');
                      setEditQuantities(withdrawalItems
                        .filter(item => item.withdrawal_id === w.id)
                        .reduce((acc, item) => ({ ...acc, [item.inventory_item_id]: item.quantity }), {}));
                    }}>View/Edit</Button>
                    <Button size="small" color="error" onClick={() => handleDeleteWithdrawal(w)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>New Withdrawal</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : inventoryItems.length === 0 ? (
            <Box p={2} textAlign="center">No inventory items found.</Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Job Name"
                  value={formData.job_name}
                  onChange={(e) => setFormData({ ...formData, job_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Withdrawn By"
                  value={formData.withdrawn_by}
                  onChange={(e) => setFormData({ ...formData, withdrawn_by: e.target.value })}
                >
                  {withdrawnByOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="right">Current Qty</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Withdraw Qty</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inventoryItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item?.description || ''}</TableCell>
                          <TableCell align="right">{item?.quantity ?? ''}</TableCell>
                          <TableCell align="right">{item?.unit_price !== undefined ? `$${item.unit_price.toFixed(2)}` : ''}</TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={withdrawQuantities[item.id] || ''}
                              onChange={(e) => setWithdrawQuantities({ ...withdrawQuantities, [item.id]: parseInt(e.target.value) || 0 })}
                              inputProps={{ min: 0, max: item?.quantity ?? 0 }}
                              helperText={`Available: ${item?.quantity ?? 0}`}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={async () => {
              // Prepare withdrawal items from withdrawQuantities
              const items = Object.entries(withdrawQuantities)
                .filter(([_, qty]) => qty > 0)
                .map(([id, qty]) => {
                  const item = inventoryItems.find(i => i.id === id);
                  return item ? {
                    inventory_item_id: id,
                    quantity: qty,
                    unit_price: item.unit_price,
                  } : null;
                })
                .filter(Boolean);
              if (items.length === 0) return;
              // Submit withdrawal as before, but with bulk items
              try {
                const { data: withdrawal, error: withdrawalError } = await supabase
                  .from('withdrawals')
                  .insert([
                    {
                      job_name: formData.job_name,
                      withdrawn_by: formData.withdrawn_by,
                      notes: formData.notes,
                      date: new Date().toISOString(),
                    },
                  ])
                  .select()
                  .single();
                if (withdrawalError) throw withdrawalError;
                const withdrawalItems = items.map((item) => ({
                  withdrawal_id: withdrawal.id,
                  inventory_item_id: item.inventory_item_id,
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                  total_price: item.quantity * item.unit_price,
                }));
                const { error: itemsError } = await supabase
                  .from('withdrawal_items')
                  .insert(withdrawalItems);
                if (itemsError) throw itemsError;
                // Update inventory quantities
                for (const item of items) {
                  const { error: updateError } = await supabase.rpc('decrease_inventory', {
                    item_id: item.inventory_item_id,
                    amount: item.quantity,
                  });
                  if (updateError) throw updateError;
                }
                handleCloseDialog();
                fetchInventoryItems();
                fetchWithdrawals();
              } catch (error) {
                console.error('Error saving withdrawal:', error);
              }
            }}
            variant="contained"
            color="primary"
            disabled={!formData.job_name || Object.values(withdrawQuantities).every(qty => !qty)}
          >
            Create Withdrawal
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!selectedWithdrawal} onClose={() => setSelectedWithdrawal(null)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Withdrawal</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Name"
                value={editJobName}
                onChange={(e) => setEditJobName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Withdrawn By"
                value={editWithdrawnBy}
                onChange={(e) => setEditWithdrawnBy(e.target.value)}
              >
                {withdrawnByOptions.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Current Qty</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Edit Qty</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventoryItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item?.description || ''}</TableCell>
                        <TableCell align="right">{item?.quantity ?? ''}</TableCell>
                        <TableCell align="right">{item?.unit_price !== undefined ? `$${item.unit_price.toFixed(2)}` : ''}</TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={editQuantities[item.id] || ''}
                            onChange={(e) => setEditQuantities({ ...editQuantities, [item.id]: parseInt(e.target.value) || 0 })}
                            inputProps={{ min: 0, max: item?.quantity ?? 0 }}
                            helperText={`Available: ${item?.quantity ?? 0}`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedWithdrawal(null)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!selectedWithdrawal) return;

              // Calculate quantity differences
              const originalItems = withdrawalItems.filter(item => item.withdrawal_id === selectedWithdrawal.id);
              const originalQuantities = originalItems.reduce((acc, item) => ({ ...acc, [item.inventory_item_id]: item.quantity }), {});

              // Update withdrawal
              await supabase
                .from('withdrawals')
                .update({
                  job_name: editJobName,
                  withdrawn_by: editWithdrawnBy,
                  notes: editNotes,
                })
                .eq('id', selectedWithdrawal.id);

              // Update withdrawal items
              const itemsToUpdate = Object.entries(editQuantities)
                .filter(([_, qty]) => qty > 0)
                .map(([id, qty]) => {
                  const item = inventoryItems.find(i => i.id === id);
                  return item ? {
                    withdrawal_id: selectedWithdrawal.id,
                    inventory_item_id: id,
                    quantity: qty,
                    unit_price: item.unit_price,
                    total_price: qty * item.unit_price,
                  } : null;
                })
                .filter(Boolean);

              // Delete old items
              await supabase
                .from('withdrawal_items')
                .delete()
                .eq('withdrawal_id', selectedWithdrawal.id);

              // Insert new items
              await supabase
                .from('withdrawal_items')
                .insert(itemsToUpdate);

              // Update inventory quantities
              for (const [id, newQty] of Object.entries(editQuantities)) {
                const oldQty = originalQuantities[id] || 0;
                const diff = newQty - oldQty;
                if (diff !== 0) {
                  const { data } = await supabase
                    .from('inventory_items')
                    .select('quantity')
                    .eq('id', id)
                    .single();
                  if (data) {
                    await supabase
                      .from('inventory_items')
                      .update({ quantity: data.quantity + diff })
                      .eq('id', id);
                  }
                }
              }

              setSelectedWithdrawal(null);
              fetchInventoryItems();
              fetchWithdrawals();
            }}
            variant="contained"
            color="primary"
            disabled={!editJobName || Object.values(editQuantities).every(qty => !qty)}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 