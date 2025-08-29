'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Package, 
  Wrench, 
  FileText, 
  AlertTriangle, 
  TrendingUp,
  LogOut,
  User
} from 'lucide-react'

interface DashboardStats {
  totalInventoryItems: number
  lowStockItems: number
  totalTools: number
  activeProjects: number
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalInventoryItems: 0,
    lowStockItems: 0,
    totalTools: 0,
    activeProjects: 0
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    loadDashboardStats()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setUser(user)
  }

  const loadDashboardStats = async () => {
    try {
      // Get inventory stats
      const { data: inventoryItems } = await supabase
        .from('inventory_items')
        .select('id, current_stock, minimum_stock')

      // Get tools count
      const { data: tools } = await supabase
        .from('tools')
        .select('id')

      // Get active projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('status', 'active')

      const lowStock = inventoryItems?.filter(item => 
        item.current_stock <= item.minimum_stock
      ).length || 0

      setStats({
        totalInventoryItems: inventoryItems?.length || 0,
        lowStockItems: lowStock,
        totalTools: tools?.length || 0,
        activeProjects: projects?.length || 0
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
            <h1 className="text-xl font-semibold text-gray-900">
              Inventory & Equipment Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-1" />
                {user?.email}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Inventory Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInventoryItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Wrench className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tools</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTools}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/inventory" className="group">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <Package className="w-12 h-12 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Inventory</h3>
              <p className="text-gray-600">Add, edit, and track inventory items. Manage stock levels and SKUs.</p>
            </div>
          </Link>

          <Link href="/inventory/checkout" className="group">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <TrendingUp className="w-12 h-12 text-orange-600 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Checkout Items</h3>
              <p className="text-gray-600">Process inventory checkouts with cost calculations for projects.</p>
            </div>
          </Link>

          <Link href="/inventory/receive" className="group">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <Package className="w-12 h-12 text-emerald-600 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Receive Order</h3>
              <p className="text-gray-600">Restock inventory from supplier orders and shipments.</p>
            </div>
          </Link>

          <Link href="/tools" className="group">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <Wrench className="w-12 h-12 text-green-600 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Tools</h3>
              <p className="text-gray-600">Monitor tool locations and movements across job sites.</p>
            </div>
          </Link>

          <Link href="/projects" className="group">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <FileText className="w-12 h-12 text-purple-600 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Projects</h3>
              <p className="text-gray-600">Manage projects and track associated expenses.</p>
            </div>
          </Link>

          <Link href="/reports" className="group">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <TrendingUp className="w-12 h-12 text-indigo-600 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reports</h3>
              <p className="text-gray-600">View usage history, analytics, and generate reorder lists.</p>
            </div>
          </Link>

          <Link href="/inventory/reorder" className="group">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <AlertTriangle className="w-12 h-12 text-red-600 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reorder Sheet</h3>
              <p className="text-gray-600">Generate reorder lists for items below minimum stock.</p>
            </div>
          </Link>
        </div>

        {/* Recent Activity would go here */}
        {stats.lowStockItems > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">
                <strong>Attention:</strong> {stats.lowStockItems} item(s) are at or below minimum stock levels.
                <Link href="/inventory/reorder" className="ml-2 underline font-medium">
                  View Reorder Sheet
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
