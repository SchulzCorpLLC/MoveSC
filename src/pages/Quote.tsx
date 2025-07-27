import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Check } from 'lucide-react'
import { supabase, type Database } from '../lib/supabase'
import toast from 'react-hot-toast'

type Quote = Database['public']['Tables']['quotes']['Row'] & {
  move: Database['public']['Tables']['moves']['Row']
}

const approvalSchema = z.object({
  notes: z.string().optional(),
})

type ApprovalForm = z.infer<typeof approvalSchema>

export function Quote() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApprovalForm>({
    resolver: zodResolver(approvalSchema),
  })

  useEffect(() => {
    if (!id) return

    const fetchQuote = async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          move:moves(*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching quote:', error)
        toast.error('Quote not found')
        navigate('/dashboard')
      } else {
        setQuote(data as Quote)
      }
      setLoading(false)
    }

    fetchQuote()
  }, [id, navigate])

  const onApprove = async (data: ApprovalForm) => {
    if (!quote) return

    setApproving(true)

    const { error: quoteError } = await supabase
      .from('quotes')
      .update({
        approved: true,
        client_notes: data.notes || null,
      })
      .eq('id', quote.id)

    if (quoteError) {
      toast.error('Failed to approve quote')
      setApproving(false)
      return
    }

    // Update move status
    const { error: moveError } = await supabase
      .from('moves')
      .update({ status: 'approved' })
      .eq('id', quote.move_id)

    if (moveError) {
      console.error('Error updating move status:', moveError)
    }

    toast.success('Quote approved successfully!')
    navigate('/dashboard')
    setApproving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">Quote not found</h1>
        </div>
      </div>
    )
  }

  const lineItems = Array.isArray(quote.line_items) ? quote.line_items : []

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
          <h1 className="text-xl font-semibold text-gray-900">Quote Details</h1>
          <p className="text-sm text-gray-600">
            {quote.move.origin} → {quote.move.destination}
          </p>
        </div>
      </div>

      {/* Quote Status */}
      {quote.approved ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800 font-medium">Quote Approved</span>
          </div>
          {quote.client_notes && (
            <p className="text-green-700 text-sm mt-2">
              Your notes: {quote.client_notes}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">Awaiting your approval</p>
        </div>
      )}

      {/* Line Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quote Breakdown</h2>
          
          <div className="space-y-3">
            {lineItems.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{item.description || item.name}</p>
                  {item.details && (
                    <p className="text-sm text-gray-600">{item.details}</p>
                  )}
                </div>
                <span className="font-semibold text-gray-900">
                  ${(item.amount || item.price || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
            <div className="flex items-center justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${quote.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>Tax</span>
              <span>${quote.tax.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-lg font-semibold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>${quote.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Form */}
      {!quote.approved && (
        <form onSubmit={handleSubmit(onApprove)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Approve Quote</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional notes or requests..."
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={approving}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {approving ? 'Approving...' : 'Approve Quote'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}