import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, ArrowRight, MessageSquare } from 'lucide-react'
import { supabase, type Database } from '../lib/supabase'
import { useClient } from '../hooks/useClient'
import { ProgressBar } from '../components/ProgressBar'
import { StatusBadge } from '../components/StatusBadge'

type Move = Database['public']['Tables']['moves']['Row'] & {
  quotes: Database['public']['Tables']['quotes']['Row'][]
  move_updates: Database['public']['Tables']['move_updates']['Row'][]
}

export function Dashboard() {
  const { client } = useClient()
  const [moves, setMoves] = useState<Move[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!client) return

    const fetchMoves = async () => {
      const { data, error } = await supabase
        .from('moves')
        .select(`
          *,
          move_updates(*),
          quotes(*)
        `)
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching moves:', error)
      } else {
        // Sort move_updates by created_at in descending order for each move
        const sortedMoves = data.map(move => ({
          ...move,
          move_updates: move.move_updates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        }))
        setMoves(sortedMoves as Move[])
      }
      setLoading(false)
    }

    fetchMoves()
  }, [client])

  const currentMove = moves[0]
  const currentQuote = currentMove?.quotes?.[0]

  const getNextAction = () => {
    if (!currentMove) return null

    switch (currentMove.status) {
      case 'quote_sent':
        return currentQuote
          ? {
              text: 'Review & Approve Quote',
              href: `/quote/${currentQuote.id}`,
              color: 'bg-blue-600 hover:bg-blue-700'
            }
          : null
      case 'approved':
        return {
          text: 'Quote Approved - Awaiting Schedule',
          href: `/move/${currentMove.id}`,
          color: 'bg-green-600 hover:bg-green-700'
        }
      case 'scheduled':
        return {
          text: 'View Move Details',
          href: `/move/${currentMove.id}`,
          color: 'bg-purple-600 hover:bg-purple-700'
        }
      case 'in_progress':
        return {
          text: 'Move in Progress',
          href: `/move/${currentMove.id}`,
          color: 'bg-orange-600 hover:bg-orange-700'
        }
      case 'completed':
        return {
          text: 'Leave Feedback',
          href: `/feedback?move=${currentMove.id}`,
          color: 'bg-yellow-600 hover:bg-yellow-700'
        }
      default:
        return null
    }
  }

  const nextAction = getNextAction()

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {client?.name}
        </h1>
        <p className="text-gray-600 mt-1">
          {client?.company?.name && `Moving with ${client.company.name}`}
        </p>
      </div>

      {currentMove ? (
        <>
          {/* Move Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Current Move</h2>
              <StatusBadge status={currentMove.status} />
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm">
                  {currentMove.origin} → {currentMove.destination}
                </span>
              </div>

              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm">
                  {new Date(currentMove.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>

            <ProgressBar currentStatus={currentMove.status} />
          </div>

          {/* Next Action */}
          {nextAction && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Action</h3>
              <Link
                to={nextAction.href}
                className={`inline-flex items-center px-6 py-3 rounded-lg text-white font-medium transition-colors ${nextAction.color}`}
              >
                {nextAction.text}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          )}

          {/* Recent Updates */}
          {currentMove.move_updates && currentMove.move_updates.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Updates</h3>
              <div className="space-y-3">
                {currentMove.move_updates.slice(0, 3).map((update) => (
                  <div key={update.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">{update.title}</p>
                      {update.description && (
                        <p className="text-sm text-gray-600 mt-1">{update.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(update.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {currentMove.move_updates.length > 3 && (
                  <Link to={`/move/${currentMove.id}`} className="text-sm text-blue-600 hover:underline block text-center mt-4">View all updates</Link>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/documents"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">📄</div>
                <p className="text-sm font-medium text-gray-900">Documents</p>
                <p className="text-xs text-gray-500">Upload & view files</p>
              </div>
            </Link>

            <Link
              to="/notifications"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">🔔</div>
                <p className="text-sm font-medium text-gray-900">Updates</p>
                <p className="text-xs text-gray-500">Recent notifications</p>
              </div>
            </Link>
          </div>

          {/* Recent Moves */}
          {moves.length > 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Moves</h3>
              <div className="space-y-3">
                {moves.slice(1, 4).map((move) => (
                  <Link
                    key={move.id}
                    to={`/move/${move.id}`}
                    className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {move.origin} → {move.destination}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(move.date).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={move.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No moves yet</h2>
          <p className="text-gray-600 mb-6">
            Your moving company will create your first move and you'll see it here.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <Link
              to="/profile"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Complete Profile
            </Link>
            <Link
              to="/documents"
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Upload Documents
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
