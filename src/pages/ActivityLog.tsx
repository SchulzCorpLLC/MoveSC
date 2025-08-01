import { useEffect, useState } from 'react';
import { History, User, Clock } from 'lucide-react';
import { supabase, type Database } from '../lib/supabase';
import { useClient } from '../hooks/useClient';
import toast from 'react-hot-toast';

type ClientActivity = Database['public']['Tables']['client_activity_log']['Row'];

export function ActivityLog() {
  const { client } = useClient();
  const [activityLogs, setActivityLogs] = useState<ClientActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client?.id) {
      setLoading(false);
      return;
    }

    const fetchActivityLogs = async () => {
      const { data, error } = await supabase
        .from('client_activity_log')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching activity logs:', error);
        toast.error('Failed to load activity logs.');
        setActivityLogs([]);
      } else {
        setActivityLogs(data || []);
      }
      setLoading(false);
    };

    fetchActivityLogs();
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
        <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
        <p className="text-gray-600 mt-1">Review your recent activities in the portal.</p>
      </div>

      {activityLogs.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="divide-y divide-gray-200">
            {activityLogs.map((log) => (
              <div key={log.id} className="p-6">
                <div className="flex items-start space-x-4">
                  <History className="h-6 w-6 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">{log.activity_type}</h2>
                    {log.description && (
                      <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                    )}
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>
                        {new Date(log.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {log.ip_address && (
                        <>
                          <span className="mx-2">•</span>
                          <span>IP: {log.ip_address}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No activity recorded yet</h3>
          <p className="text-gray-600">
            Your activities will appear here as you use the portal.
          </p>
        </div>
      )}
    </div>
  );
}
