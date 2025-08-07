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
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AddCircle as AddCircleIcon,
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { InventoryItem } from '../types/database.types';

export default function InventoryList() {
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openReceiveDialog, setOpenReceiveDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    paint_store: 'Sherwin-Williams',
    item_number: '',
    pack: 'EACH',
    unit_price: 0,
  });
  const [receiveData, setReceiveData] = useState({
    quantity: 0,
    notes: '',
  });
  const [openBulkReceiveDialog, setOpenBulkReceiveDialog] = useState(false);
  const [bulkReceiveData, setBulkReceiveData] = useState<{ [id: string]: number }>({});

  const unitOptions = [
    'EACH',
    '12 PK',
    '4 PK',
    '3 PK',
    '5-PACK',
    'BOX',
    '25 LBS',
    'HALF PINT',
    'ROLL',
    'QT',
  ];

  const paintStoreOptions = [
    'Sherwin-Williams',
    'Amazon',
    'Dunn-Edwards',
    'Vista Paint',
    'Home Depot',
  ];

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  useEffect(() => {
    console.log('openDialog state changed:', openDialog);
  }, [openDialog]);

  async function fetchInventoryItems() {
    try {
      // Check if Supabase is configured
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) {
        console.log('Supabase not configured, using mock data');
        setInventoryItems([
          {
            id: '1',
            description: 'Sample Paint',
            paint_store: 'Sherwin-Williams',
            item_number: 'SW001',
            pack: 'EACH',
            unit_price: 25.99,
            quantity: 10,
          }
        ]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('description');

      if (error) throw error;
      setInventoryItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      // Fallback to mock data on error
      setInventoryItems([
        {
          id: '1',
          description: 'Sample Paint',
          paint_store: 'Sherwin-Williams',
          item_number: 'SW001',
          pack: 'EACH',
          unit_price: 25.99,
          quantity: 10,
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenDialog = (item?: InventoryItem) => {
    console.log('handleOpenDialog called', item);
    if (item) {
      setEditingItem(item);
      setFormData({
        description: item.description || '',
        paint_store: item.paint_store || 'Sherwin-Williams',
        item_number: item.item_number || '',
        pack: item.pack || 'EACH',
        unit_price: item.unit_price,
      });
    } else {
      setEditingItem(null);
      setFormData({
        description: '',
        paint_store: 'Sherwin-Williams',
        item_number: '',
        pack: 'EACH',
        unit_price: 0,
      });
    }
    console.log('Setting openDialog to true');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
  };

  const handleOpenReceiveDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setReceiveData({
      quantity: 0,
      notes: '',
    });
    setOpenReceiveDialog(true);
  };

  const handleCloseReceiveDialog = () => {
    setOpenReceiveDialog(false);
    setEditingItem(null);
  };

  const handleSubmit = async () => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        // Mock data mode
        if (editingItem) {
          // Update existing item in mock data
          setInventoryItems(prev => prev.map(item => 
            item.id === editingItem.id 
              ? { ...item, ...formData }
              : item
          ));
        } else {
          // Add new item to mock data
          const newItem = {
            id: Date.now().toString(),
            ...formData,
            quantity: 0,
          };
          setInventoryItems(prev => [...prev, newItem]);
        }
        handleCloseDialog();
        return;
      }

      if (editingItem) {
        const { error } = await supabase
          .from('inventory_items')
          .update({
            description: formData.description,
            paint_store: formData.paint_store,
            item_number: formData.item_number,
            pack: formData.pack,
            unit_price: formData.unit_price,
          })
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('inventory_items').insert([
          {
            description: formData.description,
            paint_store: formData.paint_store,
            item_number: formData.item_number,
            pack: formData.pack,
            unit_price: formData.unit_price,
            quantity: 0,
          },
        ]);

        if (error) throw error;
      }

      handleCloseDialog();
      fetchInventoryItems();
    } catch (error) {
      console.error('Error saving inventory item:', error);
    }
  };

  const handleReceiveSubmit = async () => {
    if (!editingItem) return;

    try {
      const newQuantity = editingItem.quantity + receiveData.quantity;
      const { error } = await supabase
        .from('inventory_items')
        .update({
          quantity: newQuantity,
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      // Log the transaction
      const { error: logError } = await supabase.from('inventory_transactions').insert([
        {
          inventory_item_id: editingItem.id,
          quantity: receiveData.quantity,
          transaction_type: 'receive',
          notes: receiveData.notes,
        },
      ]);

      if (logError) throw logError;

      handleCloseReceiveDialog();
      fetchInventoryItems();
    } catch (error) {
      console.error('Error receiving inventory:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const { error } = await supabase
          .from('inventory_items')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchInventoryItems();
      } catch (error) {
        console.error('Error deleting inventory item:', error);
      }
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
        <Typography variant="h4">Inventory List</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              console.log('Add Item button clicked');
              handleOpenDialog();
            }}
          >
            Add Item
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell>Paint Store</TableCell>
              <TableCell>Item #</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventoryItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.paint_store}</TableCell>
                <TableCell>{item.item_number}</TableCell>
                <TableCell>{item.pack}</TableCell>
                <TableCell align="right">${item.unit_price.toFixed(2)}</TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenReceiveDialog(item)}
                    sx={{ mr: 1 }}
                  >
                    <AddCircleIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(item)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(item.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Box sx={{ mb: 2 }}>
              <TextField
                select
                fullWidth
                label="Paint Store"
                value={formData.paint_store}
                onChange={(e) => setFormData({ ...formData, paint_store: e.target.value })}
              >
                {paintStoreOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Item #"
                value={formData.item_number}
                onChange={(e) =>
                  setFormData({ ...formData, item_number: e.target.value })
                }
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                select
                fullWidth
                label="Unit"
                value={formData.pack}
                onChange={(e) => setFormData({ ...formData, pack: e.target.value })}
              >
                {unitOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                type="number"
                label="Unit Price"
                value={formData.unit_price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    unit_price: parseFloat(e.target.value) || 0,
                  })
                }
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={!formData.description || !formData.item_number}
          >
            {editingItem ? 'Save Changes' : 'Add Item'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openReceiveDialog} onClose={handleCloseReceiveDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Receive Order</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">
                {editingItem?.description}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current Quantity: {editingItem?.quantity}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                type="number"
                label="Quantity to Add"
                value={receiveData.quantity}
                onChange={(e) =>
                  setReceiveData({
                    ...receiveData,
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
                inputProps={{ min: 1 }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={receiveData.notes}
                onChange={(e) =>
                  setReceiveData({
                    ...receiveData,
                    notes: e.target.value,
                  })
                }
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReceiveDialog}>Cancel</Button>
          <Button
            onClick={handleReceiveSubmit}
            variant="contained"
            color="primary"
            disabled={receiveData.quantity <= 0}
          >
            Receive Order
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openBulkReceiveDialog} onClose={() => setOpenBulkReceiveDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Receive New Order</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell>Item #</TableCell>
                  <TableCell>Current Qty</TableCell>
                  <TableCell>Received Qty</TableCell>
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
                        value={bulkReceiveData[item.id] || ''}
                        onChange={(e) => setBulkReceiveData({ ...bulkReceiveData, [item.id]: parseInt(e.target.value) || 0 })}
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
          <Button onClick={() => setOpenBulkReceiveDialog(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              for (const id in bulkReceiveData) {
                const qty = bulkReceiveData[id];
                if (qty > 0) {
                  // Fetch current quantity
                  const { data, error } = await supabase.from('inventory_items').select('quantity').eq('id', id).single();
                  if (!error && data) {
                    const newQty = (data.quantity || 0) + qty;
                    await supabase.from('inventory_items').update({ quantity: newQty }).eq('id', id);
                  }
                }
              }
              setOpenBulkReceiveDialog(false);
              setBulkReceiveData({});
              fetchInventoryItems();
            }}
            variant="contained"
            color="primary"
          >
            Receive
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 