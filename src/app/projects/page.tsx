'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  DollarSign,
  Package,
  Archive
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string | null
  status: 'active' | 'completed' | 'archived'
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

interface ProjectExpense {
  total_cost: number
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectExpenses, setProjectExpenses] = useState<{[key: string]: number}>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'archived'>('active')
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadProjects()
  }, [filter])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
  }

  const loadProjects = async () => {
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setProjects(data || [])

      // Load expense totals for each project
      const expenses: {[key: string]: number} = {}
      for (const project of (data || [])) {
        const { data: expenseData } = await supabase
          .from('inventory_transactions')
          .select('total_cost')
          .eq('project_id', project.id)
          .eq('transaction_type', 'checkout')

        expenses[project.id] = expenseData?.reduce((sum, item) => sum + item.total_cost, 0) || 0
      }
      setProjectExpenses(expenses)

    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error
      setProjects(projects.filter(project => project.id !== id))
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Error deleting project')
    }
  }

  const updateProjectStatus = async (id: string, newStatus: 'active' | 'completed' | 'archived') => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      
      setProjects(projects.map(project => 
        project.id === id ? { ...project, status: newStatus } : project
      ))
    } catch (error) {
      console.error('Error updating project status:', error)
      alert('Error updating project status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getFilterCounts = () => {
    return {
      all: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      archived: projects.filter(p => p.status === 'archived').length
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
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
                Project Management
              </h1>
            </div>
            <Link
              href="/projects/add"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Projects' },
              { key: 'active', label: 'Active' },
              { key: 'completed', label: 'Completed' },
              { key: 'archived', label: 'Archived' }
            ].map(({ key, label }) => {
              const count = key === 'all' ? projects.length : projects.filter(p => p.status === key).length
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Projects Found</h2>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? 'Get started by creating your first project.'
                : `No ${filter} projects found.`
              }
            </p>
            <Link
              href="/projects/add"
              className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Project
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <div key={project.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Link href={`/projects/${project.id}`}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600 cursor-pointer">
                          {project.name}
                        </h3>
                      </Link>
                      {project.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {project.start_date && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Started: {new Date(project.start_date).toLocaleDateString()}
                      </div>
                    )}
                    {project.end_date && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Ended: {new Date(project.end_date).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Total Expenses: ${projectExpenses[project.id]?.toFixed(2) || '0.00'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Link
                        href={`/projects/edit/${project.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/projects/${project.id}/expenses`}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Package className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex space-x-1">
                      {project.status === 'active' && (
                        <button
                          onClick={() => updateProjectStatus(project.id, 'completed')}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                        >
                          Complete
                        </button>
                      )}
                      {project.status === 'completed' && (
                        <>
                          <button
                            onClick={() => updateProjectStatus(project.id, 'active')}
                            className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                          >
                            Reopen
                          </button>
                          <button
                            onClick={() => updateProjectStatus(project.id, 'archived')}
                            className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200"
                          >
                            Archive
                          </button>
                        </>
                      )}
                      {project.status === 'archived' && (
                        <button
                          onClick={() => updateProjectStatus(project.id, 'active')}
                          className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
