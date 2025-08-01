import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, MapPin, Calendar, Clock, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useClient } from '../hooks/useClient';
import toast from 'react-hot-toast';

const requestQuoteSchema = z.object({
  origin: z.string().min(5, 'Origin address is required'),
  destination: z.string().min(5, 'Destination address is required'),
  date: z.string().min(1, 'Move date is required'),
  estimated_duration: z.string().optional(),
  special_requests: z.string().optional(),
});

type RequestQuoteForm = z.infer<typeof requestQuoteSchema>;

export function RequestQuote() {
  const navigate = useNavigate();
  const { client, loading: clientLoading } = useClient();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestQuoteForm>({
    resolver: zodResolver(requestQuoteSchema),
  });

  const onSubmit = async (data: RequestQuoteForm) => {
    if (!client || !client.id || !client.company_id) {
      toast.error('Client information not available. Please try again.');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from('moves')
      .insert({
        client_id: client.id,
        company_id: client.company_id,
        origin: data.origin,
        destination: data.destination,
        date: data.date,
        estimated_duration: data.estimated_duration || null,
        crew_info: data.special_requests || null, // Using crew_info for special requests for now
        status: 'quote_sent', // Initial status for a new quote request
      });

    if (error) {
      console.error('Error submitting quote request:', error);
      toast.error('Failed to submit quote request. Please try again.');
    } else {
      toast.success('Quote request submitted successfully!');
      navigate('/dashboard');
    }

    setSubmitting(false);
  };

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
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
          <h1 className="text-xl font-semibold text-gray-900">Request New Quote</h1>
          <p className="text-sm text-gray-600">Tell us about your next move.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Origin */}
        <div>
          <label htmlFor="origin" className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <MapPin className="h-4 w-4 mr-2" />
            Origin Address
          </label>
          <input
            {...register('origin')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 123 Main St, Anytown"
          />
          {errors.origin && (
            <p className="mt-1 text-sm text-red-600">{errors.origin.message}</p>
          )}
        </div>

        {/* Destination */}
        <div>
          <label htmlFor="destination" className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <MapPin className="h-4 w-4 mr-2" />
            Destination Address
          </label>
          <input
            {...register('destination')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 456 Oak Ave, Othercity"
          />
          {errors.destination && (
            <p className="mt-1 text-sm text-red-600">{errors.destination.message}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label htmlFor="date" className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 mr-2" />
            Preferred Move Date
          </label>
          <input
            {...register('date')}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
          )}
        </div>

        {/* Estimated Duration (Optional) */}
        <div>
          <label htmlFor="estimated_duration" className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Clock className="h-4 w-4 mr-2" />
            Estimated Duration (Optional)
          </label>
          <input
            {...register('estimated_duration')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Full day, Half day, 2 hours"
          />
          {errors.estimated_duration && (
            <p className="mt-1 text-sm text-red-600">{errors.estimated_duration.message}</p>
          )}
        </div>

        {/* Special Requests (Optional) */}
        <div>
          <label htmlFor="special_requests" className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="h-4 w-4 mr-2" />
            Special Requests / Notes (Optional)
          </label>
          <textarea
            {...register('special_requests')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Need packing services, fragile items, specific access instructions..."
          />
          {errors.special_requests && (
            <p className="mt-1 text-sm text-red-600">{errors.special_requests.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Submitting Request...' : 'Submit Quote Request'}
        </button>
      </form>
    </div>
  );
}
