'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Download, Package, Printer } from 'lucide-react'

interface ReorderItem {
  id: string
  name: string
  sku: string
  current_stock: number
  minimum_stock: number
  unit: string
  unit_cost: number
  supplier: string | null
  category: string | null
  recommended_order: number
}

export default function ReorderPage() {
  const [reorderItems, setReorderItems] = useState<ReorderItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReorderItems()
  }, [])

  const loadReorderItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .lte('current_stock', supabase.raw('minimum_stock'))
        .order('name')

      if (error) throw error

      const itemsWithRecommendation = (data || []).map(item => ({
        ...item,
        recommended_order: Math.max(
          item.minimum_stock * 2 - item.current_stock,
          item.minimum_stock
        )
      }))

      setReorderItems(itemsWithRecommendation)
    } catch (error) {
      console.error('Error loading reorder items:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRecommendedOrder = (itemId: string, newAmount: number) => {
    setReorderItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, recommended_order: Math.max(0, newAmount) }
          : item
      )
    )
  }

  const generateCSV = () => {
    const headers = ['Item Name', 'SKU', 'Current Stock', 'Minimum Stock', 'Recommended Order', 'Unit', 'Unit Cost', 'Total Cost', 'Supplier', 'Category']
    
    const csvContent = [
      headers.join(','),
      ...reorderItems.map(item => [
        `"${item.name}"`,
        `"${item.sku}"`,
        item.current_stock,
        item.minimum_stock,
        item.recommended_order,
        `"${item.unit}"`,
        item.unit_cost.toFixed(2),
        (item.recommended_order * item.unit_cost).toFixed(2),
        `"${item.supplier || ''}"`,
        `"${item.category || ''}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reorder-sheet-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const printReorderSheet = () => {
    const printContent = `
      <html>
        <head>
          <title>Reorder Sheet - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .total { font-weight: bold; background-color: #f9f9f9; }
            .header-info { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header-info">
            <h1>Inventory Reorder Sheet</h1>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Items Requiring Reorder:</strong> ${reorderItems.length}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>SKU</th>
                <th>Current Stock</th>
                <th>Min Stock</th>
                <th>Order Qty</th>
                <th>Unit</th>
                <th>Unit Cost</th>
                <th>Total Cost</th>
                <th>Supplier</th>
              </tr>
            </thead>
            <tbody>
              ${reorderItems.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.sku}</td>
                  <td>${item.current_stock}</td>
                  <td>${item.minimum_stock}</td>
                  <td>${item.recommended_order}</td>
                  <td>${item.unit}</td>
                  <td>$${item.unit_cost.toFixed(2)}</td>
                  <td>$${(item.recommended_order * item.unit_cost).toFixed(2)}</td>
                  <td>${item.supplier || 'N/A'}</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td colspan="7"><strong>Total Estimated Cost:</strong></td>
                <td><strong>$${reorderItems.reduce((total, item) => total + (item.recommended_order * item.unit_cost), 0).toFixed(2)}</strong></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const getTotalCost = () => {
    return reorderItems.reduce((total, item) => total + (item.recommended_order * item.unit_cost), 0)
  }

  const getSupplierGroups = () => {
    const groups: { [key: string]: ReorderItem[] } = {}
    reorderItems.forEach(item => {
      const supplier = item.supplier || 'Unknown Supplier'
      if (!groups[supplier]) {
        groups[supplier] = []
      }
      groups[supplier].push(item)
    })
    return groups
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reorder sheet...</p>
        </div>
      </div>
    )
  }

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
                Reorder Sheet
              </h1>
            </div>
            {reorderItems.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={generateCSV}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </button>
                <button
                  onClick={printReorderSheet}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {reorderItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Package className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">All Stock Levels Good!</h2>
            <p className="text-gray-600">No items currently need reordering. All inventory is above minimum stock levels.</p>
            <Link
              href="/inventory"
              className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Inventory
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
                <h2 className="text-xl font-semibold text-red-800">Items Requiring Reorder</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-red-600">{reorderItems.length}</p>
                  <p className="text-sm text-red-700">Items Below Minimum</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {reorderItems.reduce((total, item) => total + item.recommended_order, 0)}
                  </p>
                  <p className="text-sm text-red-700">Total Units to Order</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">${getTotalCost().toFixed(2)}</p>
                  <p className="text-sm text-red-700">Estimated Total Cost</p>
                </div>
              </div>
            </div>

            {/* Reorder Items by Supplier */}
            {Object.entries(getSupplierGroups()).map(([supplier, items]) => (
              <div key={supplier} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">{supplier}</h3>
                  <p className="text-sm text-gray-600">
                    {items.length} item(s) • Total: ${items.reduce((total, item) => total + (item.recommended_order * item.unit_cost), 0).toFixed(2)}
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recommended Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map(item => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                              {item.category && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                  {item.category}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm text-gray-900">
                                Current: {item.current_stock} {item.unit}
                              </p>
                              <p className="text-sm text-gray-500">
                                Minimum: {item.minimum_stock} {item.unit}
                              </p>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                                item.current_stock === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.current_stock === 0 ? 'Out of Stock' : 'Low Stock'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={item.recommended_order}
                                onChange={(e) => updateRecommendedOrder(item.id, parseInt(e.target.value) || 0)}
                                min="0"
                                className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <span className="text-sm text-gray-500">{item.unit}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                ${(item.recommended_order * item.unit_cost).toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-500">
                                ${item.unit_cost.toFixed(2)} / {item.unit}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
