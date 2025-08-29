'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Package, 
  Plus, 
  Minus, 
  Trash2, 
  Save,
  Search
} from 'lucide-react'

interface InventoryItem {
  id: string
  name: string
  sku: string
  current_stock: number
  unit_cost: number
  unit: string
  supplier: string | null
}

interface ReceiveItem {
  inventory_item_id: string
  name: string
  sku: string
  quantity: number
  unit_cost: number
  unit: string
  total_cost: number
  current_stock: number
}

export default function ReceiveOrderPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadInventoryItems()
  }, [])

  const loadInventoryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, name, sku, current_stock, unit_cost, unit, supplier')
        .order('name')

      if (error) throw error
      setInventoryItems(data || [])
    } catch (error) {
      console.error('Error loading inventory:', error)
    }
  }

  const addToReceive = (item: InventoryItem) => {
    const existingItem = receiveItems.find(ri => ri.inventory_item_id === item.id)
    
    if (existingItem) {
      updateQuantity(item.id, existingItem.quantity + 1)
    } else {
      const newItem: ReceiveItem = {
        inventory_item_id: item.id,
        name: item.name,
        sku: item.sku,
        quantity: 1,
        unit_cost: item.unit_cost,
        unit: item.unit,
        total_cost: item.unit_cost,
        current_stock: item.current_stock
      }
      setReceiveItems([...receiveItems, newItem])
    }
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromReceive(itemId)
      return
    }

    setReceiveItems(items =>
      items.map(item => {
        if (item.inventory_item_id === itemId) {
          const quantity = Math.max(0, newQuantity)
          return {
            ...item,
            quantity,
            total_cost: quantity * item.unit_cost
          }
        }
        return item
      })
    )
  }

  const updateUnitCost = (itemId: string, newCost: number) => {
    setReceiveItems(items =>
      items.map(item => {
        if (item.inventory_item_id === itemId) {
          const unitCost = Math.max(0, newCost)
          return {
            ...item,
            unit_cost: unitCost,
            total_cost: item.quantity * unitCost
          }
        }
        return item
      })
    )
  }

  const removeFromReceive = (itemId: string) => {
    setReceiveItems(items => items.filter(item => item.inventory_item_id !== itemId))
  }

  const getTotalCost = () => {
    return receiveItems.reduce((total, item) => total + item.total_cost, 0)
  }

  const processReceive = async () => {
    if (receiveItems.length === 0) {
      alert('Please add items to receive')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Process each receive item
      for (const item of receiveItems) {
        // Create transaction record
        const { error: transactionError } = await supabase
          .from('inventory_transactions')
          .insert({
            inventory_item_id: item.inventory_item_id,
            project_id: null, // No project for receiving orders
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            total_cost: item.total_cost,
            transaction_type: 'restock',
            notes: notes,
            created_by: user.id
          })

        if (transactionError) throw transactionError

        // Update inventory stock and cost
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({
            current_stock: item.current_stock + item.quantity,
            unit_cost: item.unit_cost // Update with latest cost
          })
          .eq('id', item.inventory_item_id)

        if (updateError) throw updateError
      }

      alert('Order received successfully!')
      setReceiveItems([])
      setNotes('')
      loadInventoryItems() // Refresh inventory data
    } catch (error: any) {
      console.error('Error processing receive:', error)
      alert('Error processing receive: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredInventory = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link 
                href="/inventory" 
                className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                Back to Inventory
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Receive Order / Restock
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Inventory Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <Package className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Select Items to Receive</h2>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search by name, SKU, or supplier..."
                />
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredInventory.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                    <p className="text-sm text-gray-500">
                      Current Stock: {item.current_stock} {item.unit} • ${item.unit_cost.toFixed(2)}/{item.unit}
                    </p>
                    {item.supplier && (
                      <p className="text-sm text-blue-600">Supplier: {item.supplier}</p>
                    )}
                  </div>
                  <button
                    onClick={() => addToReceive(item)}
                    className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Receive Cart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <Package className="w-6 h-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Items to Receive</h2>
            </div>

            {receiveItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No items selected. Add items from the inventory list.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {receiveItems.map(item => (
                  <div key={item.inventory_item_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                        <p className="text-sm text-gray-500">Current Stock: {item.current_stock} {item.unit}</p>
                      </div>
                      <button
                        onClick={() => removeFromReceive(item.inventory_item_id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity Received
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.inventory_item_id, item.quantity - 1)}
                            className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.inventory_item_id, parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                            min="0"
                          />
                          <button
                            onClick={() => updateQuantity(item.inventory_item_id, item.quantity + 1)}
                            className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <span className="text-sm text-gray-500">{item.unit}</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unit Cost ($)
                        </label>
                        <input
                          type="number"
                          value={item.unit_cost}
                          onChange={(e) => updateUnitCost(item.inventory_item_id, parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3 text-right">
                      <p className="font-medium">Total: ${item.total_cost.toFixed(2)}</p>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total Order Cost:</span>
                    <span>${getTotalCost().toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Supplier, PO#, etc.)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add notes about this order receipt..."
                    />
                  </div>

                  <button
                    onClick={processReceive}
                    disabled={loading || receiveItems.length === 0}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Processing...' : 'Receive Order'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
