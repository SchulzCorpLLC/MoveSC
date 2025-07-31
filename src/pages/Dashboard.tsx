```typescript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, type Database } from '../lib/supabase';
import { useClient } from '../hooks/useClient';
import { StatusBadge } from '../components/StatusBadge';
import toast from 'react-hot-toast';
import { ArrowRight, MessageSquare } from 'lucide-react'; // Added MessageSquare icon

type Move = Database['public']['Tables']['moves']['Row'] & {
  move_updates: Database['public']['Tables']['move_updates']['Row'][];
};

export function Dashboard() {
  const { client, loading: clientLoading } = useClient();
  const [moves, setMoves] = useState<Move[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (clientLoading || !client) return;

    const fetchMoves = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('moves')
        .select(`
          *,
          move_updates(*)
        `)
        .eq('client_id', client.id)
        .order('date', { ascending: false }) // Order moves by date
        .order('created_at', { foreignTable: 'move_updates', ascending: false }); // Order move_updates by created_at

      if (error) {
        console.error('Error fetching moves:', error);
        toast.error('Failed to load moves.');
      } else {
        setMoves(data || []);
      }
      setLoading(false);
    };

    fetchMoves();
  }, [client, clientLoading]);

  if (loading || clientLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Moves</h1>
        <p className="text-gray-600 mt-1">Overview of your upcoming and past moves.</p>
      </div>

      {moves.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No moves found</h3>
          <p className="text-gray-600">It looks like you don't have any moves scheduled yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {moves.map((move) => (
            <div
              key={move.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/move/${move.id}`)}
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  {move.origin} to {move.destination}
                </h2>
                <StatusBadge status={move.status} />
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Date: {new Date(move.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              {move.move_updates && move.move_updates.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h3 className="text-md font-medium text-gray-800 mb-2 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-gray-500" /> Latest Update:
                  </h3>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{move.move_updates[0].title}:</span>{' '}
                    {move.move_updates[0].description || 'No description provided.'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(move.move_updates[0].created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
              <div className="mt-4 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent navigating to move details when clicking button
                    navigate(`/move/${move.id}`);
                  }}
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View Details <ArrowRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```