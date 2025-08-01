import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { supabase, type Database } from '../lib/supabase';
import { useClient } from '../hooks/useClient';
import toast from 'react-hot-toast';

type Service = Database['public']['Tables']['services']['Row'];

export function Services() {
  const { client } = useClient();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client?.company_id) {
      setLoading(false);
      return;
    }

    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', client.company_id)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching services:', error);
        toast.error('Failed to load services.');
        setServices([]);
      } else {
        setServices(data || []);
      }
      setLoading(false);
    };

    fetchServices();
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
        <h1 className="text-2xl font-bold text-gray-900">Our Services</h1>
        <p className="text-gray-600 mt-1">Explore the services offered by {client?.company?.name || 'your moving company'}.</p>
      </div>

      {services.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="divide-y divide-gray-200">
            {services.map((service) => (
              <div key={service.id} className="p-6">
                <div className="flex items-start space-x-4">
                  <Package className="h-6 w-6 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">{service.name}</h2>
                    {service.description && (
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                    )}
                    {service.price !== null && service.price !== undefined && (
                      <p className="text-sm font-medium text-gray-800 mt-2">
                        Price: ${service.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services listed yet</h3>
          <p className="text-gray-600">
            Your moving company has not yet added any services. Please check back later.
          </p>
        </div>
      )}
    </div>
  );
}
