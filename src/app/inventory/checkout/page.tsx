'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Calculator,
  Save,
  Package
} from 'lucide-react'

interface InventoryItem {
  id: string
  name: string
  sku: string
  current_stock: number
  unit_cost: number
  unit: string
}

interface Project {
  id: string
  name: string
  status: string
}

interface CheckoutItem {
  inventory_item_id: string
  name: string
  sku: string
  quantity: number
  unit_cost: number
  unit: string
  total_cost: number
  available_stock: number
}

export default function CheckoutPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [notes, setNotes] = useState('')
  const [showNewProjectForm, setShowNewProjectForm] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load inventory items
      const { data: inventory } = await supabase
        .from('inventory_items')
        .select('id, name, sku, current_stock, unit_cost, unit')
        .gt('current_stock', 0)
        .order('name')

      // Load active projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, status')
        .eq('status', 'active')
        .order('name')

      setInventoryItems(inventory || [])
      setProjects(projectsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const addToCheckout = (item: InventoryItem) => {
    const existingItem = checkoutItems.find(ci => ci.inventory_item_id === item.id)
    
    if (existingItem) {
      updateQuantity(item.id, existingItem.quantity + 1)
    } else {
      const newItem: CheckoutItem = {
        inventory_item_id: item.id,
        name: item.name,
        sku: item.sku,
        quantity: 1,
        unit_cost: item.unit_cost,
        unit: item.unit,
        total_cost: item.unit_cost,
        available_stock: item.current_stock
      }
      setCheckoutItems([...checkoutItems, newItem])
    }
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCheckout(itemId)
      return
    }

    setCheckoutItems(items =>
      items.map(item => {
        if (item.inventory_item_id === itemId) {
          const quantity = Math.min(newQuantity, item.available_stock)
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

  const removeFromCheckout = (itemId: string) => {
    setCheckoutItems(items => items.filter(item => item.inventory_item_id !== itemId))
  }

  const getTotalCost = () => {
    return checkoutItems.reduce((total, item) => total + item.total_cost, 0)
  }

  const createNewProject = async () => {
    if (!newProjectName.trim()) {
      alert('Please enter a project name')
      return
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: newProjectName.trim(),
          status: 'active'
        }])
        .select()
        .single()

      if (error) throw error

      // Add new project to the list and select it
      const newProject = { id: data.id, name: data.name, status: data.status }
      setProjects([...projects, newProject])
      setSelectedProject(data.id)
      setNewProjectName('')
      setShowNewProjectForm(false)
    } catch (error: any) {
      console.error('Error creating project:', error)
      alert('Error creating project: ' + error.message)
    }
  }

  const processCheckout = async () => {
    if (checkoutItems.length === 0) {
      alert('Please add items to checkout')
      return
    }

    if (!selectedProject) {
      alert('Please select a project')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Process each checkout item
      for (const item of checkoutItems) {
        // Create transaction record
        const { error: transactionError } = await supabase
          .from('inventory_transactions')
          .insert({
            inventory_item_id: item.inventory_item_id,
            project_id: selectedProject,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            total_cost: item.total_cost,
            transaction_type: 'checkout',
            notes: notes,
            created_by: user.id
          })

        if (transactionError) throw transactionError

        // Update inventory stock
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({
            current_stock: item.available_stock - item.quantity
          })
          .eq('id', item.inventory_item_id)

        if (updateError) throw updateError
      }

      alert('Checkout completed successfully!')
      setCheckoutItems([])
      setSelectedProject('')
      setNotes('')
      loadData() // Refresh inventory data
    } catch (error: any) {
      console.error('Error processing checkout:', error)
      alert('Error processing checkout: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredInventory = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link 
                href="/dashboard" 
                className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Inventory Checkout
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
              <h2 className="text-xl font-semibold text-gray-900">Available Inventory</h2>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search items..."
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredInventory.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                    <p className="text-sm text-gray-500">
                      Stock: {item.current_stock} {item.unit} • ${item.unit_cost.toFixed(2)}/{item.unit}
                    </p>
                  </div>
                  <button
                    onClick={() => addToCheckout(item)}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout Cart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <ShoppingCart className="w-6 h-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Checkout Cart</h2>
            </div>

            {checkoutItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No items in cart. Add items from the inventory list.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {checkoutItems.map(item => (
                  <div key={item.inventory_item_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                      </div>
                      <button
                        onClick={() => removeFromCheckout(item.inventory_item_id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.inventory_item_id, item.quantity - 1)}
                          className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 py-1 border border-gray-300 rounded">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.inventory_item_id, item.quantity + 1)}
                          className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                          disabled={item.quantity >= item.available_stock}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="text-sm text-gray-500">{item.unit}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${item.total_cost.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">${item.unit_cost.toFixed(2)}/{item.unit}</p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total Cost:</span>
                    <span>${getTotalCost().toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project *
                    </label>
                    <select
                      value={selectedProject}
                      onChange={(e) => {
                        if (e.target.value === 'new_project') {
                          setShowNewProjectForm(true)
                          setSelectedProject('')
                        } else {
                          setSelectedProject(e.target.value)
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                      <option value="new_project">+ Add New Project</option>
                    </select>
                  </div>

                  {showNewProjectForm && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Create New Project</h4>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          placeholder="Enter project name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              createNewProject()
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={createNewProject}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          Create
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewProjectForm(false)
                            setNewProjectName('')
                          }}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add any notes about this checkout..."
                    />
                  </div>

                  <button
                    onClick={processCheckout}
                    disabled={loading || checkoutItems.length === 0 || !selectedProject}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Processing...' : 'Complete Checkout'}
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
