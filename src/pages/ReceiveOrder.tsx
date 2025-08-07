import React, { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, MenuItem
} from '@mui/material';
import { supabase } from '../lib/supabase';

export default function ReceiveOrder() {
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [receiveQuantities, setReceiveQuantities] = useState<{ [id: string]: number }>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<Array<{
    id: string;
    order_id: string;
    inventory_item_id: string;
    quantity: number;
    description: string;
  }>>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const receivedByOptions = ['Jose', 'Abraham', 'Kareem'];
  const [openDialog, setOpenDialog] = useState(false);
  const [receivedBy, setReceivedBy] = useState('Jose');
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [editQuantities, setEditQuantities] = useState<{ [id: string]: number }>({});
  const [editReceivedBy, setEditReceivedBy] = useState('Jose');
  const paintStoreOptions = [
    'Sherwin-Williams',
    'Amazon',
    'Dunn-Edwards',
    'Vista Paint',
    'Home Depot',
  ];
  const [receivePaintStores, setReceivePaintStores] = useState<{ [id: string]: string }>({});
  const [paintStore, setPaintStore] = useState('Sherwin-Williams');

  useEffect(() => {
    fetchInventoryItems();
    fetchOrders();
  }, []);

  async function fetchInventoryItems() {
    setLoading(true);
    const { data, error } = await supabase.from('inventory_items').select('*').order('description');
    setInventoryItems(data || []);
    setLoading(false);
  }

  async function fetchOrders() {
    setLoadingOrders(true);
    const { data: ordersData, error: ordersError } = await supabase.from('received_orders').select('*').order('date', { ascending: false });
    const { data: orderItemsData, error: orderItemsError } = await supabase.from('received_order_items').select('*');
    setOrders(ordersData || []);
    setOrderItems(orderItemsData || []);
    setLoadingOrders(false);
  }

  function getOrderSummary(orderId: string) {
    return orderItems.filter((item) => item.order_id === orderId).map((item) => `${item.quantity} x ${item.description || ''}`).join(', ');
  }

  async function handleReceive() {
    // Prepare received items
    const items = Object.entries(receiveQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = inventoryItems.find(i => i.id === id);
        return item ? {
          inventory_item_id: id,
          quantity: qty,
          description: item.description,
        } : null;
      })
      .filter(Boolean);
    if (items.length === 0) return;
    // Insert received order
    const { data: order, error: orderError } = await supabase
      .from('received_orders')
      .insert([{ date: new Date().toISOString(), received_by: receivedBy, paint_store: paintStore }])
      .select()
      .single();
    if (orderError) return;
    // Insert received order items
    const orderItemsToInsert = items.map((item) => ({
      order_id: order.id,
      inventory_item_id: item.inventory_item_id,
      quantity: item.quantity,
      description: item.description,
    }));
    await supabase.from('received_order_items').insert(orderItemsToInsert);
    // Update inventory quantities
    for (const item of items) {
      const { data, error } = await supabase.from('inventory_items').select('quantity').eq('id', item.inventory_item_id).single();
      if (!error && data) {
        const newQty = (data.quantity || 0) + item.quantity;
        await supabase.from('inventory_items').update({ quantity: newQty }).eq('id', item.inventory_item_id);
      }
    }
    setReceiveQuantities({});
    setOpenDialog(false);
    fetchInventoryItems();
    fetchOrders();
  }

  async function handleDeleteReceivedOrder(order) {
    // 1. Fetch all items for this order
    const { data: orderItems } = await supabase
      .from('received_order_items')
      .select('*')
      .eq('order_id', order.id);

    // 2. Subtract each item's quantity from inventory
    if (orderItems) {
      for (const item of orderItems) {
        const { data: inv } = await supabase
          .from('inventory_items')
          .select('quantity')
          .eq('id', item.inventory_item_id)
          .single();
        if (inv) {
          const newQty = (inv.quantity || 0) - item.quantity;
          await supabase
            .from('inventory_items')
            .update({ quantity: newQty })
            .eq('id', item.inventory_item_id);
        }
      }
    }

    // 3. Delete the order and its items
    await supabase.from('received_order_items').delete().eq('order_id', order.id);
    await supabase.from('received_orders').delete().eq('id', order.id);

    // 4. Refresh data
    fetchInventoryItems();
    fetchOrders();
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Receive Order</Typography>
        <Button variant="contained" color="primary" onClick={() => { setOpenDialog(true); setReceivedBy('Jose'); setReceiveQuantities({}); }}>New Receive Order</Button>
      </Box>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>New Receive Order</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              select
              label="Received By"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
            >
              {receivedByOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Paint Store"
              value={paintStore}
              onChange={(e) => setPaintStore(e.target.value)}
            >
              {paintStoreOptions.map((option) => (
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
                  <TableCell>Current Qty</TableCell>
                  <TableCell>Receive Qty</TableCell>
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
                        value={receiveQuantities[item.id] || ''}
                        onChange={(e) => setReceiveQuantities({ ...receiveQuantities, [item.id]: parseInt(e.target.value) || 0 })}
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
            onClick={handleReceive}
            variant="contained"
            color="primary"
            disabled={Object.values(receiveQuantities).every(qty => !qty)}
          >
            Receive
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!editingOrder} onClose={() => setEditingOrder(null)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Receive Order</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              select
              label="Received By"
              value={editReceivedBy}
              onChange={(e) => setEditReceivedBy(e.target.value)}
            >
              {receivedByOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Paint Store"
              value={receivePaintStores[editingOrder?.id] || 'Sherwin-Williams'}
              onChange={(e) => setReceivePaintStores({ ...receivePaintStores, [editingOrder?.id]: e.target.value })}
            >
              {paintStoreOptions.map((option) => (
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
                  <TableCell>Current Qty</TableCell>
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
                        onChange={(e) => setEditQuantities({ ...editQuantities, [item.id]: parseInt(e.target.value) || 0 })}
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
          <Button onClick={() => setEditingOrder(null)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!editingOrder) return;
              
              // Calculate quantity differences
              const originalItems = orderItems.filter(item => item.order_id === editingOrder.id);
              const originalQuantities = originalItems.reduce((acc, item) => ({ ...acc, [item.inventory_item_id]: item.quantity }), {});
              
              // Update order
              await supabase
                .from('received_orders')
                .update({
                  received_by: editReceivedBy,
                  paint_store: receivePaintStores[editingOrder.id],
                })
                .eq('id', editingOrder.id);

              // Update order items
              const itemsToUpdate = Object.entries(editQuantities)
                .filter(([_, qty]) => qty > 0)
                .map(([id, qty]) => ({
                  order_id: editingOrder.id,
                  inventory_item_id: id,
                  quantity: qty,
                  description: inventoryItems.find(i => i.id === id)?.description,
                }));

              // Delete old items
              await supabase
                .from('received_order_items')
                .delete()
                .eq('order_id', editingOrder.id);

              // Insert new items
              await supabase
                .from('received_order_items')
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

              setEditingOrder(null);
              fetchInventoryItems();
              fetchOrders();
            }}
            variant="contained"
            color="primary"
            disabled={Object.values(editQuantities).every(qty => !qty)}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      <Typography variant="h5" mt={4} mb={2}>Received Orders</Typography>
      {loadingOrders ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Received By</TableCell>
                <TableCell>Paint Store</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.date ? new Date(order.date).toLocaleString() : ''}</TableCell>
                  <TableCell>{order.received_by}</TableCell>
                  <TableCell>{order.paint_store}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => {
                        setEditingOrder(order);
                        setEditReceivedBy(order.received_by);
                        setEditQuantities(orderItems
                          .filter((item): item is NonNullable<typeof item> => item !== null)
                          .filter(item => item.order_id === order.id)
                          .reduce((acc, item) => ({ ...acc, [item.inventory_item_id]: item.quantity }), {}));
                      }}
                    >
                      Edit
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={async () => {
                        await handleDeleteReceivedOrder(order);
                      }}
                    >
                      Delete
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
} 