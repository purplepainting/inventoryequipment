import Link from 'next/link'
import { Package, Wrench, FileText, Users } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Inventory & Equipment Manager
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional inventory and equipment management system designed for painting companies
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <Link href="/inventory" className="group">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition-shadow duration-300">
              <Package className="w-16 h-16 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Inventory</h3>
              <p className="text-gray-600">Manage supplies, track stock levels, and generate reorder sheets</p>
            </div>
          </Link>

          <Link href="/tools" className="group">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition-shadow duration-300">
              <Wrench className="w-16 h-16 text-green-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tools</h3>
              <p className="text-gray-600">Track tools and equipment across job locations</p>
            </div>
          </Link>

          <Link href="/projects" className="group">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition-shadow duration-300">
              <FileText className="w-16 h-16 text-purple-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Projects</h3>
              <p className="text-gray-600">Manage projects and track expenses</p>
            </div>
          </Link>

          <Link href="/auth" className="group">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition-shadow duration-300">
              <Users className="w-16 h-16 text-orange-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Login</h3>
              <p className="text-gray-600">Employee authentication and access control</p>
            </div>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-500">
            Built for professional painting companies to streamline operations
          </p>
        </div>
      </div>
    </div>
  )
}
