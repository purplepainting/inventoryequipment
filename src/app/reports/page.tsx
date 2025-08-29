'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  ArrowLeft, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Calendar,
  Download,
  BarChart3
} from 'lucide-react'

interface UsageStats {
  item_name: string
  item_sku: string
  total_quantity: number
  total_cost: number
  transaction_count: number
}

interface ProjectExpense {
  project_name: string
  project_id: string
  total_cost: number
  item_count: number
}

interface MonthlyUsage {
  month: string
  total_cost: number
  transaction_count: number
}

export default function ReportsPage() {
  const [mostUsedItems, setMostUsedItems] = useState<UsageStats[]>([])
  const [projectExpenses, setProjectExpenses] = useState<ProjectExpense[]>([])
  const [monthlyUsage, setMonthlyUsage] = useState<MonthlyUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadReports()
  }, [dateRange])

  const loadReports = async () => {
    try {
      // Most used items
      const { data: usageData } = await supabase
        .from('inventory_transactions')
        .select(`
          quantity,
          total_cost,
          inventory_items!inner(name, sku),
          created_at
        `)
        .eq('transaction_type', 'checkout')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end + 'T23:59:59')

      // Process usage stats
      const usageMap: {[key: string]: UsageStats} = {}
      usageData?.forEach((transaction: any) => {
        const key = transaction.inventory_items.sku
        if (!usageMap[key]) {
          usageMap[key] = {
            item_name: transaction.inventory_items.name,
            item_sku: transaction.inventory_items.sku,
            total_quantity: 0,
            total_cost: 0,
            transaction_count: 0
          }
        }
        usageMap[key].total_quantity += transaction.quantity
        usageMap[key].total_cost += transaction.total_cost
        usageMap[key].transaction_count += 1
      })

      const sortedUsage = Object.values(usageMap)
        .sort((a, b) => b.total_cost - a.total_cost)
        .slice(0, 10)

      setMostUsedItems(sortedUsage)

      // Project expenses
      const { data: projectData } = await supabase
        .from('inventory_transactions')
        .select(`
          total_cost,
          projects!inner(name, id),
          created_at
        `)
        .eq('transaction_type', 'checkout')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end + 'T23:59:59')

      const projectMap: {[key: string]: ProjectExpense} = {}
      projectData?.forEach((transaction: any) => {
        const key = transaction.projects.id
        if (!projectMap[key]) {
          projectMap[key] = {
            project_name: transaction.projects.name,
            project_id: transaction.projects.id,
            total_cost: 0,
            item_count: 0
          }
        }
        projectMap[key].total_cost += transaction.total_cost
        projectMap[key].item_count += 1
      })

      const sortedProjects = Object.values(projectMap)
        .sort((a, b) => b.total_cost - a.total_cost)

      setProjectExpenses(sortedProjects)

      // Monthly usage
      const monthlyMap: {[key: string]: MonthlyUsage} = {}
      usageData?.forEach((transaction: any) => {
        const month = transaction.created_at.substring(0, 7) // YYYY-MM
        if (!monthlyMap[month]) {
          monthlyMap[month] = {
            month,
            total_cost: 0,
            transaction_count: 0
          }
        }
        monthlyMap[month].total_cost += transaction.total_cost
        monthlyMap[month].transaction_count += 1
      })

      const sortedMonthly = Object.values(monthlyMap)
        .sort((a, b) => a.month.localeCompare(b.month))

      setMonthlyUsage(sortedMonthly)

    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = (type: 'items' | 'projects' | 'monthly') => {
    let data: any[] = []
    let filename = ''

    switch (type) {
      case 'items':
        data = mostUsedItems.map(item => ({
          'Item Name': item.item_name,
          'SKU': item.item_sku,
          'Total Quantity Used': item.total_quantity,
          'Total Cost': `$${item.total_cost.toFixed(2)}`,
          'Number of Transactions': item.transaction_count
        }))
        filename = 'most-used-items'
        break
      case 'projects':
        data = projectExpenses.map(project => ({
          'Project Name': project.project_name,
          'Total Cost': `$${project.total_cost.toFixed(2)}`,
          'Number of Items': project.item_count
        }))
        filename = 'project-expenses'
        break
      case 'monthly':
        data = monthlyUsage.map(month => ({
          'Month': month.month,
          'Total Cost': `$${month.total_cost.toFixed(2)}`,
          'Number of Transactions': month.transaction_count
        }))
        filename = 'monthly-usage'
        break
    }

    const headers = Object.keys(data[0] || {})
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${dateRange.start}-to-${dateRange.end}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
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
                href="/dashboard" 
                className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Reports & Analytics
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Most Used Items */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Most Used Items</h2>
                </div>
                <button
                  onClick={() => exportReport('items')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {mostUsedItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No usage data for this period</p>
              ) : (
                <div className="space-y-4">
                  {mostUsedItems.map((item, index) => (
                    <div key={item.item_sku} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.item_name}</p>
                          <p className="text-sm text-gray-500">SKU: {item.item_sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${item.total_cost.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">{item.transaction_count} uses</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Project Expenses */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="w-6 h-6 text-green-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Project Expenses</h2>
                </div>
                <button
                  onClick={() => exportReport('projects')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {projectExpenses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No project expenses for this period</p>
              ) : (
                <div className="space-y-4">
                  {projectExpenses.map((project) => (
                    <div key={project.project_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{project.project_name}</p>
                        <p className="text-sm text-gray-500">{project.item_count} items used</p>
                      </div>
                      <p className="font-medium text-gray-900">${project.total_cost.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Monthly Usage Trend */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="w-6 h-6 text-purple-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Monthly Usage Trend</h2>
                </div>
                <button
                  onClick={() => exportReport('monthly')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {monthlyUsage.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No usage data for this period</p>
              ) : (
                <div className="space-y-4">
                  {monthlyUsage.map((month) => {
                    const maxCost = Math.max(...monthlyUsage.map(m => m.total_cost))
                    const widthPercent = maxCost > 0 ? (month.total_cost / maxCost) * 100 : 0
                    
                    return (
                      <div key={month.month} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(month.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                          </span>
                          <span className="text-sm text-gray-600">
                            ${month.total_cost.toFixed(2)} • {month.transaction_count} transactions
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${widthPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
