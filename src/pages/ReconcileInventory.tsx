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
import { Save as SaveIcon } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { InventoryItem, InventoryAdjustment } from '../types/database.types';

interface ReconciliationItem {
  id: string;
  description: string;
  quantity: number;
  actual_quantity: number;
  difference: number;
}

export default function ReconcileInventory() {
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<ReconciliationItem[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(null);
  const [reconcileSessionId, setReconcileSessionId] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [reconciliationItems, setReconciliationItems] = useState<any[]>([]);
  const [loadingReconciliations, setLoadingReconciliations] = useState(true);
  const [selectedReconciliation, setSelectedReconciliation] = useState<any | null>(null);
  const [editingReconciliation, setEditingReconciliation] = useState<any | null>(null);
  const [editQuantities, setEditQuantities] = useState<{ [id: string]: number }>({});
  const [editReconciledBy, setEditReconciledBy] = useState('Jose');
  const [editNotes, setEditNotes] = useState('');
  const [reconciledBy, setReconciledBy] = useState('Jose');
  const [actualQuantities, setActualQuantities] = useState<Record<string, number>>({});
  const reconciledByOptions = ['Jose', 'Abraham', 'Kareem'];

  useEffect(() => {
    fetchInventoryItems();
    fetchReconciliations();
  }, []);

  async function calculateCurrentQuantity(itemId: string) {
    try {
      // Get all receives
      const { data: receives, error: receivesError } = await supabase
        .from('received_order_items')
        .select('quantity')
        .eq('inventory_item_id', itemId);

      if (receivesError) throw receivesError;

      // Get all withdrawals
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('withdrawal_items')
        .select('quantity')
        .eq('inventory_item_id', itemId);

      if (withdrawalsError) throw withdrawalsError;

      // Get latest reconciliation
      const { data: latestReconciliation, error: reconciliationError } = await supabase
        .from('reconciliation_items')
        .select('actual_quantity')
        .eq('inventory_item_id', itemId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (reconciliationError) throw reconciliationError;

      // Calculate total
      const totalReceived = receives?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      const totalWithdrawn = withdrawals?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      const reconciledQuantity = latestReconciliation?.[0]?.actual_quantity;

      // If there's a reconciliation, use that as the base, otherwise use the difference
      return reconciledQuantity !== undefined ? reconciledQuantity : totalReceived - totalWithdrawn;
    } catch (error) {
      console.error('Error calculating quantity:', error);
      return 0;
    }
  }

  async function fetchInventoryItems() {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('description');

      if (error) throw error;

      // Calculate current quantities for each item
      const itemsWithQuantities = await Promise.all(
        (data || []).map(async (item) => {
          const currentQuantity = await calculateCurrentQuantity(item.id);
          return {
            id: item.id,
            description: item.description,
            quantity: currentQuantity,
            actual_quantity: currentQuantity,
            difference: 0,
          };
        })
      );

      setInventoryItems(itemsWithQuantities);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReconciliations() {
    setLoadingReconciliations(true);
    try {
      const { data: reconciliationsData, error: reconciliationsError } = await supabase
        .from('reconciliations')
        .select('*')
        .order('date', { ascending: false });

      const { data: reconciliationItemsData, error: reconciliationItemsError } = await supabase
        .from('reconciliation_items')
        .select('*');

      if (reconciliationsError) throw reconciliationsError;
      if (reconciliationItemsError) throw reconciliationItemsError;

      setReconciliations(reconciliationsData || []);
      setReconciliationItems(reconciliationItemsData || []);
    } catch (error) {
      console.error('Error fetching reconciliations:', error);
    } finally {
      setLoadingReconciliations(false);
    }
  }

  function getReconciliationSummary(reconciliationId: string) {
    return reconciliationItems
      .filter(item => item.reconciliation_id === reconciliationId)
      .map(item => `${item.description}: ${item.quantity} → ${item.actual_quantity}`)
      .join(', ');
  }

  const handleActualStockChange = (itemId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setActualQuantities(prev => ({
      ...prev,
      [itemId]: numValue
    }));
  };

  const handleEditQuantityChange = (itemId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setEditQuantities(prev => ({
      ...prev,
      [itemId]: numValue
    }));
  };

  const handleDeleteReconciliation = async (reconciliation: any) => {
    if (!window.confirm('Are you sure you want to delete this reconciliation?')) return;

    try {
      // Delete the reconciliation items first
      const { error: itemsError } = await supabase
        .from('reconciliation_items')
        .delete()
        .eq('reconciliation_id', reconciliation.id);

      if (itemsError) {
        console.error('Error deleting reconciliation items:', itemsError);
        throw itemsError;
      }

      // Delete any associated inventory adjustments
      const { error: adjustmentsError } = await supabase
        .from('inventory_adjustments')
        .delete()
        .eq('reconcile_session_id', reconciliation.id);

      if (adjustmentsError) {
        console.error('Error deleting inventory adjustments:', adjustmentsError);
        throw adjustmentsError;
      }

      // Delete the reconciliation
      const { error: reconciliationError } = await supabase
        .from('reconciliations')
        .delete()
        .eq('id', reconciliation.id);

      if (reconciliationError) {
        console.error('Error deleting reconciliation:', reconciliationError);
        throw reconciliationError;
      }

      // Refresh data to recalculate quantities
      await Promise.all([
        fetchInventoryItems(),
        fetchReconciliations()
      ]);
    } catch (error) {
      console.error('Error in delete reconciliation process:', error);
      alert('Failed to delete reconciliation. Please try again.');
    }
  };

  const handleOpenDialog = (item: ReconciliationItem) => {
    setSelectedItem(item);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
  };

  const handleSaveAdjustment = async () => {
    if (!selectedItem) return;

    try {
      // Create inventory adjustment record
      const { error: adjustmentError } = await supabase
        .from('inventory_adjustments')
        .insert([
          {
            inventory_item_id: selectedItem.id,
            previous_quantity: selectedItem.quantity,
            new_quantity: selectedItem.actual_quantity,
            adjustment_type: 'manual',
            notes,
            reconcile_session_id: reconcileSessionId,
          },
        ]);

      if (adjustmentError) throw adjustmentError;

      // Update inventory item
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ quantity: selectedItem.actual_quantity })
        .eq('id', selectedItem.id);

      if (updateError) throw updateError;

      handleCloseDialog();
      fetchInventoryItems();
    } catch (error) {
      console.error('Error saving inventory adjustment:', error);
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
        <Typography variant="h4">Reconcile Inventory</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setOpenDialog(true);
            setReconciledBy('Jose');
            setActualQuantities({});
          }}
        >
          New Reconciliation
        </Button>
      </Box>

      <Typography variant="h5" mt={4} mb={2}>Past Reconciliations</Typography>
      {loadingReconciliations ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Reconciled By</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Changes</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reconciliations.map((reconciliation) => (
                <TableRow key={reconciliation.id}>
                  <TableCell>{reconciliation.date ? new Date(reconciliation.date).toLocaleString() : ''}</TableCell>
                  <TableCell>{reconciliation.reconciled_by}</TableCell>
                  <TableCell>{reconciliation.notes}</TableCell>
                  <TableCell>{getReconciliationSummary(reconciliation.id)}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => {
                        setSelectedReconciliation(reconciliation);
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => {
                        setEditingReconciliation(reconciliation);
                        setEditReconciledBy(reconciliation.reconciled_by);
                        setEditNotes(reconciliation.notes || '');
                        setEditQuantities(reconciliationItems
                          .filter(item => item.reconciliation_id === reconciliation.id)
                          .reduce((acc, item) => ({ ...acc, [item.inventory_item_id]: item.actual_quantity }), {}));
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeleteReconciliation(reconciliation)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>New Reconciliation</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              select
              label="Reconciled By"
              value={reconciledBy}
              onChange={(e) => setReconciledBy(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              {reconciledByOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell>Item #</TableCell>
                  <TableCell>System Qty</TableCell>
                  <TableCell>Actual Qty</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventoryItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.item_number}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={actualQuantities[item.id] || ''}
                        onChange={(e) => handleActualStockChange(item.id, e.target.value)}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              // Create reconciliation record
              const { data: reconciliation, error: reconciliationError } = await supabase
                .from('reconciliations')
                .insert([
                  {
                    date: new Date().toISOString(),
                    reconciled_by: reconciledBy,
                  },
                ])
                .select()
                .single();

              if (reconciliationError) throw reconciliationError;

              // Create reconciliation items
              const itemsToInsert = Object.entries(actualQuantities)
                .filter(([_, qty]) => qty > 0)
                .map(([id, qty]) => {
                  const item = inventoryItems.find(i => i.id === id);
                  return item ? {
                    reconciliation_id: reconciliation.id,
                    inventory_item_id: id,
                    quantity: item.quantity,
                    actual_quantity: qty,
                    description: item.description,
                  } : null;
                })
                .filter(Boolean);

              const { error: itemsError } = await supabase
                .from('reconciliation_items')
                .insert(itemsToInsert);

              if (itemsError) throw itemsError;

              // Update inventory quantities
              for (const [id, qty] of Object.entries(actualQuantities)) {
                if (qty > 0) {
                  const { error: updateError } = await supabase
                    .from('inventory_items')
                    .update({ quantity: qty })
                    .eq('id', id);

                  if (updateError) throw updateError;
                }
              }

              setOpenDialog(false);
              setReconciledBy('Jose');
              setActualQuantities({});
              fetchInventoryItems();
              fetchReconciliations();
            }}
            variant="contained"
            color="primary"
            disabled={Object.values(actualQuantities).every(qty => !qty)}
          >
            Save Reconciliation
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!selectedReconciliation} onClose={() => setSelectedReconciliation(null)} maxWidth="md" fullWidth>
        <DialogTitle>Reconciliation Details</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Date: {selectedReconciliation?.date ? new Date(selectedReconciliation.date).toLocaleString() : ''}</Typography>
            <Typography variant="subtitle1">Reconciled By: {selectedReconciliation?.reconciled_by}</Typography>
            <Typography variant="subtitle1">Notes: {selectedReconciliation?.notes}</Typography>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">System Qty</TableCell>
                  <TableCell align="right">Actual Qty</TableCell>
                  <TableCell align="right">Difference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reconciliationItems
                  .filter(item => item.reconciliation_id === selectedReconciliation?.id)
                  .map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{item.actual_quantity}</TableCell>
                      <TableCell align="right" sx={{ color: item.actual_quantity > item.quantity ? 'success.main' : 'error.main' }}>
                        {item.actual_quantity - item.quantity}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedReconciliation(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editingReconciliation} onClose={() => setEditingReconciliation(null)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Reconciliation</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              select
              label="Reconciled By"
              value={editReconciledBy}
              onChange={(e) => setEditReconciledBy(e.target.value)}
            >
              {reconciledByOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Notes"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell>Item #</TableCell>
                  <TableCell>System Qty</TableCell>
                  <TableCell>Edit Qty</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventoryItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.item_number}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={editQuantities[item.id] || ''}
                        onChange={(e) => handleEditQuantityChange(item.id, e.target.value)}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingReconciliation(null)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!editingReconciliation) return;

              // Calculate quantity differences
              const originalItems = reconciliationItems.filter(item => item.reconciliation_id === editingReconciliation.id);
              const originalQuantities = originalItems.reduce((acc, item) => ({ ...acc, [item.inventory_item_id]: item.actual_quantity }), {});

              // Update reconciliation
              await supabase
                .from('reconciliations')
                .update({
                  reconciled_by: editReconciledBy,
                  notes: editNotes,
                })
                .eq('id', editingReconciliation.id);

              // Update reconciliation items
              const itemsToUpdate = Object.entries(editQuantities)
                .filter(([_, qty]) => qty > 0)
                .map(([id, qty]) => {
                  const item = inventoryItems.find(i => i.id === id);
                  return item ? {
                    reconciliation_id: editingReconciliation.id,
                    inventory_item_id: id,
                    quantity: item.quantity,
                    actual_quantity: qty,
                    description: item.description,
                  } : null;
                })
                .filter(Boolean);

              // Delete old items
              await supabase
                .from('reconciliation_items')
                .delete()
                .eq('reconciliation_id', editingReconciliation.id);

              // Insert new items
              await supabase
                .from('reconciliation_items')
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

              setEditingReconciliation(null);
              fetchInventoryItems();
              fetchReconciliations();
            }}
            variant="contained"
            color="primary"
            disabled={Object.values(editQuantities).every(qty => !qty)}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 