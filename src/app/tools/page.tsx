'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Wrench, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MapPin,
  Clock,
  Building
} from 'lucide-react'

interface Tool {
  id: string
  name: string
  sku: string | null
  description: string | null
  location: string
  type: string | null
  status: 'available' | 'in_use' | 'maintenance'
  created_at: string
  updated_at: string
}

interface Project {
  id: string
  name: string
}

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
  }

  const loadData = async () => {
    try {
      // Load tools
      const { data: toolsData, error: toolsError } = await supabase
        .from('tools')
        .select('*')
        .order('name')

      if (toolsError) throw toolsError

      // Load projects for location options
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('status', 'active')
        .order('name')

      setTools(toolsData || [])
      setProjects(projectsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteTool = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tool?')) return

    try {
      const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTools(tools.filter(tool => tool.id !== id))
    } catch (error) {
      console.error('Error deleting tool:', error)
      alert('Error deleting tool')
    }
  }

  const moveToolToLocation = async (toolId: string, newLocation: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const tool = tools.find(t => t.id === toolId)
      if (!tool) return

      // Update tool location
      const { error: updateError } = await supabase
        .from('tools')
        .update({ 
          location: newLocation,
          status: newLocation === 'shop' ? 'available' : 'in_use'
        })
        .eq('id', toolId)

      if (updateError) throw updateError

      // Record movement
      const { error: movementError } = await supabase
        .from('tool_movements')
        .insert({
          tool_id: toolId,
          from_location: tool.location,
          to_location: newLocation,
          movement_type: newLocation === 'shop' ? 'return' : 'checkout',
          moved_by: user.id
        })

      if (movementError) throw movementError

      // Update local state
      setTools(tools.map(t => 
        t.id === toolId 
          ? { ...t, location: newLocation, status: newLocation === 'shop' ? 'available' : 'in_use' }
          : t
      ))

    } catch (error: any) {
      console.error('Error moving tool:', error)
      alert('Error moving tool: ' + error.message)
    }
  }

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tool.sku && tool.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (tool.description && tool.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesLocation = locationFilter === 'all' || tool.location === locationFilter
    const matchesStatus = statusFilter === 'all' || tool.status === statusFilter
    const matchesType = typeFilter === 'all' || tool.type === typeFilter

    return matchesSearch && matchesLocation && matchesStatus && matchesType
  })

  const getLocationOptions = () => {
    const locations = new Set(['shop'])
    projects.forEach(project => locations.add(project.name))
    return Array.from(locations)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'in_use':
        return 'bg-blue-100 text-blue-800'
      case 'maintenance':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLocationCounts = () => {
    const counts: {[key: string]: number} = {}
    tools.forEach(tool => {
      counts[tool.location] = (counts[tool.location] || 0) + 1
    })
    return counts
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tools...</p>
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
                Tools & Equipment
              </h1>
            </div>
            <Link
              href="/tools/add"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Tool
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Location Summary */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          {Object.entries(getLocationCounts()).map(([location, count]) => (
            <div key={location} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                {location === 'shop' ? (
                  <Building className="w-6 h-6 text-blue-600 mr-2" />
                ) : (
                  <MapPin className="w-6 h-6 text-green-600 mr-2" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-600 capitalize">{location}</p>
                  <p className="text-lg font-bold text-gray-900">{count} tools</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Tools
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search by name, SKU, or description..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Location
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Locations</option>
                {getLocationOptions().map(location => (
                  <option key={location} value={location}>
                    {location === 'shop' ? 'Shop' : location}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="in_use">In Use</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {Array.from(new Set(tools.map(tool => tool.type).filter(Boolean))).map(type => (
                  <option key={type} value={type!}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tools Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tool Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quick Move
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTools.map((tool) => (
                  <tr key={tool.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Wrench className="w-8 h-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {tool.name}
                          </div>
                          {tool.sku && (
                            <div className="text-sm text-gray-500">
                              SKU: {tool.sku}
                            </div>
                          )}
                          {tool.type && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1 mr-2">
                              {tool.type}
                            </span>
                          )}
                          {tool.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {tool.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {tool.location === 'shop' ? (
                          <Building className="w-4 h-4 text-blue-600 mr-2" />
                        ) : (
                          <MapPin className="w-4 h-4 text-green-600 mr-2" />
                        )}
                        <span className="text-sm text-gray-900 capitalize">
                          {tool.location}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tool.status)}`}>
                        {tool.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value && e.target.value !== tool.location) {
                            moveToolToLocation(tool.id, e.target.value)
                          }
                        }}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">Move to...</option>
                        {getLocationOptions()
                          .filter(location => location !== tool.location)
                          .map(location => (
                            <option key={location} value={location}>
                              {location === 'shop' ? 'Shop' : location}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/tools/edit/${tool.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/tools/${tool.id}/history`}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        <Clock className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => deleteTool(tool.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTools.length === 0 && (
            <div className="text-center py-12">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {tools.length === 0 ? 'No tools found. Add your first tool!' : 'No tools match your search criteria.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
