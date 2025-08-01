import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, ArrowRight } from 'lucide-react';
import { supabase, type Database } from '../lib/supabase';
import { useClient } from '../hooks/useClient';
import { StatusBadge } from '../components/StatusBadge'; // Re-using StatusBadge for quote status
import toast from 'react-hot-toast';

type Quote = Database['public']['Tables']['quotes']['Row'] & {
  move: Database['public']['Tables']['moves']['Row'];
};

export function QuotesList() {
  const { client } = useClient();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client?.id) {
      setLoading(false);
      return;
    }

    const fetchQuotes = async () => {
      // Fetch moves associated with the client, then fetch quotes for those moves
      const { data: movesData, error: movesError } = await supabase
        .from('moves')
        .select('id')
        .eq('client_id', client.id);

      if (movesError) {
        console.error('Error fetching client moves:', movesError);
        toast.error('Failed to load your quotes.');
        setLoading(false);
        return;
      }

      const moveIds = movesData.map(move => move.id);

      if (moveIds.length === 0) {
        setQuotes([]);
        setLoading(false);
        return;
      }

      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          *,
          move:moves(*)
        `)
        .in('move_id', moveIds)
        .order('created_at', { ascending: false });

      if (quotesError) {
        console.error('Error fetching quotes:', quotesError);
        toast.error('Failed to load your quotes.');
        setQuotes([]);
      } else {
        setQuotes(quotesData as Quote[]);
      }
      setLoading(false);
    };

    fetchQuotes();
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
        <h1 className="text-2xl font-bold text-gray-900">My Quotes</h1>
        <p className="text-gray-600 mt-1">Review all your moving quotes.</p>
      </div>

      {quotes.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="divide-y divide-gray-200">
            {quotes.map((quote) => (
              <Link
                key={quote.id}
                to={`/quote/${quote.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">
                        Quote for {quote.move.origin} to {quote.move.destination}
                      </h2>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>
                        Move Date: {new Date(quote.move.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      Total: ${quote.total.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {/* Using StatusBadge for quote approval status */}
                    <StatusBadge status={quote.approved ? 'approved' : 'quote_sent'} />
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes found</h3>
          <p className="text-gray-600">
            Your moving company will send you quotes for your moves.
          </p>
        </div>
      )}
    </div>
  );
}
