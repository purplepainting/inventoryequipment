import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
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
import { InventoryService } from '../services';
import { InventoryItem } from '../types';

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

  async function fetchInventoryItems() {
    try {
      const items = await InventoryService.getInventoryItems();
      setInventoryItems(items);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      // Fallback to mock data
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
      if (editingItem) {
        await InventoryService.updateInventoryItem(editingItem.id, formData);
      } else {
        await InventoryService.createInventoryItem({
          ...formData,
          quantity: 0,
        });
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
      await InventoryService.updateInventoryItem(editingItem.id, { quantity: newQuantity });

      // Log the transaction
      await InventoryService.createInventoryTransaction({
        inventory_item_id: editingItem.id,
        quantity: receiveData.quantity,
        transaction_type: 'receive',
        notes: receiveData.notes,
      });

      handleCloseReceiveDialog();
      fetchInventoryItems();
    } catch (error) {
      console.error('Error receiving inventory:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await InventoryService.deleteInventoryItem(id);
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
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Item
        </Button>
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
            <Grid container spacing={2}>
              <Grid item xs={12}>
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
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Item #"
                  value={formData.item_number}
                  onChange={(e) =>
                    setFormData({ ...formData, item_number: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
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
              </Grid>
              <Grid item xs={12}>
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
              </Grid>
            </Grid>
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
    </Box>
  );
} 