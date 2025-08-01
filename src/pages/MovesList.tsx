import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import { supabase, type Database } from '../lib/supabase';
import { useClient } from '../hooks/useClient';
import { StatusBadge } from '../components/StatusBadge';
import toast from 'react-hot-toast';

type Move = Database['public']['Tables']['moves']['Row'];

export function MovesList() {
  const { client } = useClient();
  const [moves, setMoves] = useState<Move[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client?.id) {
      setLoading(false);
      return;
    }

    const fetchMoves = async () => {
      const { data, error } = await supabase
        .from('moves')
        .select('*')
        .eq('client_id', client.id)
        .order('date', { ascending: false }); // Order by move date, most recent first

      if (error) {
        console.error('Error fetching moves:', error);
        toast.error('Failed to load your moves.');
        setMoves([]);
      } else {
        setMoves(data || []);
      }
      setLoading(false);
    };

    fetchMoves();
  }, [client]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Moves</h1>
        <p className="text-gray-600 mt-1">Review all your past and upcoming moves.</p>
      </div>

      {moves.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="divide-y divide-gray-200">
            {moves.map((move) => (
              <Link
                key={move.id}
                to={`/move/${move.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">
                        {move.origin} to {move.destination}
                      </h2>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>
                        Move Date: {new Date(move.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <StatusBadge status={move.status} />
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No moves found</h3>
          <p className="text-gray-600">
            Your moving company will create moves for you, or you can request a new quote.
          </p>
          <Link
            to="/request-quote"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Request a New Quote
          </Link>
        </div>
      )}
    </div>
  );
}
