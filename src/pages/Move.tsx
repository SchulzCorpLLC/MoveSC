import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Clock, Users, Download } from 'lucide-react'
import { supabase, type Database } from '../lib/supabase'
import { StatusBadge } from '../components/StatusBadge'
import toast from 'react-hot-toast'

type Move = Database['public']['Tables']['moves']['Row']

export function Move() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [move, setMove] = useState<Move | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchMove = async () => {
      const { data, error } = await supabase
        .from('moves')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching move:', error)
        toast.error('Move not found')
        navigate('/dashboard')
      } else {
        setMove(data)
      }
      setLoading(false)
    }

    fetchMove()
  }, [id, navigate])

  const handleDownloadInvoice = () => {
    // Placeholder for invoice download
    toast.success('Invoice download will be available soon')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!move) {
    return (
      <div className="p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">Move not found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Move Details</h1>
          <StatusBadge status={move.status} />
        </div>
      </div>

      {/* Move Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h2>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Route</p>
              <p className="text-sm text-gray-600">
                <span className="block">{move.origin}</span>
                <span className="text-gray-400 my-1">↓</span>
                <span className="block">{move.destination}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Move Date</p>
              <p className="text-sm text-gray-600">
                {new Date(move.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {move.estimated_duration && (
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Estimated Duration</p>
                <p className="text-sm text-gray-600">{move.estimated_duration}</p>
              </div>
            </div>
          )}

          {move.crew_info && (
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Crew Information</p>
                <p className="text-sm text-gray-600">{move.crew_info}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h3>
        
        <div className="space-y-3">
          {move.status === 'quote_sent' && (
            <p className="text-gray-600">Your quote has been sent and is awaiting your approval.</p>
          )}
          {move.status === 'approved' && (
            <p className="text-gray-600">Your quote has been approved. We'll contact you soon to schedule your move.</p>
          )}
          {move.status === 'scheduled' && (
            <p className="text-gray-600">Your move has been scheduled. Please prepare for the scheduled date.</p>
          )}
          {move.status === 'in_progress' && (
            <p className="text-gray-600">Your move is currently in progress. Our crew is working on your relocation.</p>
          )}
          {move.status === 'completed' && (
            <p className="text-gray-600">Your move has been completed successfully. Thank you for choosing our service!</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
        
        <div className="space-y-3">
          <button
            onClick={handleDownloadInvoice}
            className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Invoice
          </button>

          {move.status === 'completed' && (
            <button
              onClick={() => navigate(`/feedback?move=${move.id}`)}
              className="flex items-center justify-center w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Leave Feedback
            </button>
          )}
        </div>
      </div>
    </div>
  )
}