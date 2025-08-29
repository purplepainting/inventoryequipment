'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Wrench, Save } from 'lucide-react'

interface Project {
  id: string
  name: string
  status: string
}

export default function AddToolPage() {
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [showNewProjectForm, setShowNewProjectForm] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    location: 'shop',
    type: '',
    status: 'available' as 'available' | 'in_use' | 'maintenance'
  })
  const router = useRouter()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    }
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

      const newProject = { id: data.id, name: data.name, status: data.status }
      setProjects([...projects, newProject])
      setFormData(prev => ({ ...prev, location: data.name }))
      setNewProjectName('')
      setShowNewProjectForm(false)
    } catch (error: any) {
      console.error('Error creating project:', error)
      alert('Error creating project: ' + error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('tools')
        .insert([formData])

      if (error) throw error

      router.push('/tools')
    } catch (error: any) {
      console.error('Error adding tool:', error)
      alert('Error adding tool: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link 
                href="/tools" 
                className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                Back to Tools
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Add New Tool
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center mb-6">
            <Wrench className="w-8 h-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Tool Details</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Tool Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter tool name"
                  required
                />
              </div>

              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter SKU (optional)"
                />
              </div>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Tool Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select tool type</option>
                <option value="Ladders">Ladders</option>
                <option value="Sprayers">Sprayers</option>
                <option value="Air tools">Air tools</option>
                <option value="Gas">Gas</option>
                <option value="Washers">Washers</option>
                <option value="Power tools">Power tools</option>
                <option value="Hand tools">Hand tools</option>
                <option value="Brushes">Brushes</option>
                <option value="Rollers">Rollers</option>
                <option value="Safety">Safety Equipment</option>
                <option value="Misc">Miscellaneous</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter tool description"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Location *
                </label>
                <select
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={(e) => {
                    if (e.target.value === 'new_project') {
                      setShowNewProjectForm(true)
                    } else {
                      setFormData(prev => ({ ...prev, location: e.target.value }))
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="shop">Shop</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.name}>
                      {project.name}
                    </option>
                  ))}
                  <option value="new_project">+ Add New Project</option>
                </select>
                
                {showNewProjectForm && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
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
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="available">Available</option>
                  <option value="in_use">In Use</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6">
              <Link
                href="/tools"
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Tool'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
