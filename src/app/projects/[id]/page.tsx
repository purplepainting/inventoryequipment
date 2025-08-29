'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  FileText, 
  Wrench, 
  Package, 
  Calendar,
  MapPin,
  Clock,
  DollarSign
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string | null
  status: 'active' | 'completed' | 'archived'
  start_date: string | null
  end_date: string | null
  created_at: string
}

interface ToolMovement {
  id: string
  tool_id: string
  from_location: string
  to_location: string
  movement_type: 'checkout' | 'return' | 'transfer'
  notes: string | null
  moved_at: string
  tool: {
    name: string
    sku: string | null
    type: string | null
  }
  moved_by_user: {
    full_name: string | null
    email: string
  }
}

interface CurrentTool {
  id: string
  name: string
  sku: string | null
  type: string | null
  status: 'available' | 'in_use' | 'maintenance'
  location: string
}

interface ProjectExpense {
  id: string
  total_cost: number
  created_at: string
  inventory_item: {
    name: string
    sku: string
  }
  quantity: number
}

export default function ProjectDetailPage() {
  const [project, setProject] = useState<Project | null>(null)
  const [currentTools, setCurrentTools] = useState<CurrentTool[]>([])
  const [toolMovements, setToolMovements] = useState<ToolMovement[]>([])
  const [expenses, setExpenses] = useState<ProjectExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'tools' | 'history' | 'expenses'>('tools')
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  useEffect(() => {
    if (projectId) {
      loadProjectData()
    }
  }, [projectId])

  const loadProjectData = async () => {
    try {
      // Load project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError
      setProject(projectData)

      // Load current tools at this project location
      const { data: toolsData, error: toolsError } = await supabase
        .from('tools')
        .select('id, name, sku, type, status, location')
        .eq('location', projectData.name)

      if (toolsError) throw toolsError
      setCurrentTools(toolsData || [])

      // Load tool movement history for this project
      const { data: movementsData, error: movementsError } = await supabase
        .from('tool_movements')
        .select(`
          id,
          tool_id,
          from_location,
          to_location,
          movement_type,
          notes,
          moved_at,
          tools!inner(name, sku, type),
          profiles!moved_by(full_name, email)
        `)
        .or(`to_location.eq.${projectData.name},from_location.eq.${projectData.name}`)
        .order('moved_at', { ascending: false })

      if (movementsError) throw movementsError
      
      const formattedMovements = (movementsData || []).map((movement: any) => ({
        id: movement.id,
        tool_id: movement.tool_id,
        from_location: movement.from_location,
        to_location: movement.to_location,
        movement_type: movement.movement_type,
        notes: movement.notes,
        moved_at: movement.moved_at,
        tool: movement.tools,
        moved_by_user: movement.profiles
      }))
      
      setToolMovements(formattedMovements)

      // Load project expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('inventory_transactions')
        .select(`
          id,
          total_cost,
          quantity,
          created_at,
          inventory_items!inner(name, sku)
        `)
        .eq('project_id', projectId)
        .eq('transaction_type', 'checkout')
        .order('created_at', { ascending: false })

      if (expensesError) throw expensesError
      
      const formattedExpenses = (expensesData || []).map((expense: any) => ({
        id: expense.id,
        total_cost: expense.total_cost,
        quantity: expense.quantity,
        created_at: expense.created_at,
        inventory_item: expense.inventory_items
      }))
      
      setExpenses(formattedExpenses)

    } catch (error) {
      console.error('Error loading project data:', error)
      router.push('/projects')
    } finally {
      setLoading(false)
    }
  }

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.total_cost, 0)
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'checkout':
        return <MapPin className="w-4 h-4 text-green-600" />
      case 'return':
        return <ArrowLeft className="w-4 h-4 text-blue-600" />
      case 'transfer':
        return <MapPin className="w-4 h-4 text-orange-600" />
      default:
        return <MapPin className="w-4 h-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Project not found</p>
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
                href="/projects" 
                className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                Back to Projects
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                {project.name}
              </h1>
            </div>
            <Link
              href={`/projects/edit/${project.id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Edit Project
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center mb-4">
            <FileText className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                project.status === 'active' ? 'bg-green-100 text-green-800' :
                project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.status}
              </span>
            </div>
          </div>
          
          {project.description && (
            <p className="text-gray-600 mb-4">{project.description}</p>
          )}
          
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            {project.start_date && (
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                Started: {new Date(project.start_date).toLocaleDateString()}
              </div>
            )}
            {project.end_date && (
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                Ended: {new Date(project.end_date).toLocaleDateString()}
              </div>
            )}
            <div className="flex items-center text-gray-600">
              <DollarSign className="w-4 h-4 mr-2" />
              Total Expenses: ${getTotalExpenses().toFixed(2)}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('tools')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'tools'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Wrench className="w-4 h-4 inline mr-2" />
                Current Tools ({currentTools.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Tool Movement History
              </button>
              <button
                onClick={() => setActiveTab('expenses')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'expenses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Inventory Expenses ({expenses.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Current Tools Tab */}
            {activeTab === 'tools' && (
              <div className="space-y-4">
                {currentTools.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No tools currently at this project location.</p>
                ) : (
                  currentTools.map(tool => (
                    <div key={tool.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <Wrench className="w-6 h-6 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{tool.name}</p>
                          {tool.sku && <p className="text-sm text-gray-500">SKU: {tool.sku}</p>}
                          <div className="flex items-center space-x-2 mt-1">
                            {tool.type && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {tool.type}
                              </span>
                            )}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              tool.status === 'available' ? 'bg-green-100 text-green-800' :
                              tool.status === 'in_use' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {tool.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tool Movement History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {toolMovements.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No tool movements recorded for this project.</p>
                ) : (
                  toolMovements.map(movement => (
                    <div key={movement.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {getMovementIcon(movement.movement_type)}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{movement.tool.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(movement.moved_at).toLocaleDateString()} at {new Date(movement.moved_at).toLocaleTimeString()}
                          </p>
                        </div>
                        {movement.tool.sku && (
                          <p className="text-sm text-gray-500">SKU: {movement.tool.sku}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="capitalize">{movement.movement_type.replace('_', ' ')}</span>: 
                          {movement.from_location} → {movement.to_location}
                        </p>
                        {movement.notes && (
                          <p className="text-sm text-gray-500 mt-1">Note: {movement.notes}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Moved by: {movement.moved_by_user?.full_name || movement.moved_by_user?.email}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Expenses Tab */}
            {activeTab === 'expenses' && (
              <div className="space-y-4">
                {expenses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No inventory expenses recorded for this project.</p>
                ) : (
                  <div>
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-lg font-semibold text-blue-900">
                        Total Project Expenses: ${getTotalExpenses().toFixed(2)}
                      </p>
                    </div>
                    {expenses.map(expense => (
                      <div key={expense.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          <Package className="w-6 h-6 text-gray-400 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">{expense.inventory_item.name}</p>
                            <p className="text-sm text-gray-500">SKU: {expense.inventory_item.sku}</p>
                            <p className="text-sm text-gray-500">Quantity: {expense.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">${expense.total_cost.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(expense.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
