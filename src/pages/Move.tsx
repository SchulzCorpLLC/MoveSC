import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Clock, Users, Download } from 'lucide-react'
import { supabase, type Database } from '../lib/supabase'
import { StatusBadge } from '../components/StatusBadge'
import toast from 'react-hot-toast'

type Quote = Database['public']['Tables']['quotes']['Row']
type Company = Database['public']['Tables']['companies']['Row']

// Extend the Move type to include related quotes and company data
type MoveWithDetails = Database['public']['Tables']['moves']['Row'] & {
  quotes: Quote[]
  company: Company
}

export function Move() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [move, setMove] = useState<MoveWithDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchMove = async () => {
      // Fetch move details, including associated quotes and company information
      const { data, error } = await supabase
        .from('moves')
        .select(`
          *,
          quotes(*),
          company:companies(*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching move:', error)
        toast.error('Move not found')
        navigate('/dashboard')
      } else {
        setMove(data as MoveWithDetails)
      }
      setLoading(false)
    }

    fetchMove()
  }, [id, navigate])

  const handleDownloadInvoice = () => {
    if (!move) {
      toast.error('Move details not loaded.')
      return
    }

    const approvedQuote = move.quotes.find(q => q.approved) || move.quotes[0]

    if (!approvedQuote) {
      toast.error('No approved quote found for this move.')
      return
    }

    const companyName = move.company?.name || 'Moving Company'
    const companyLogo = move.company?.logo_url || ''
    const moveDate = new Date(move.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const lineItemsHtml = (approvedQuote.line_items || [])
      .map((item: any) => `
        <tr class="border-b border-gray-200">
          <td class="py-2 px-4 text-left">${item.description || item.name}</td>
          <td class="py-2 px-4 text-right">$${(item.amount || item.price || 0).toFixed(2)}</td>
        </tr>
      `)
      .join('')

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice for Move ${move.id.substring(0, 8)}</title>
        <style>
          body { font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
          .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .header img { max-height: 60px; margin-bottom: 10px; }
          .header h1 { font-size: 28px; color: #2c3e50; margin: 0; }
          .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .details div { width: 48%; }
          .details p { margin: 5px 0; font-size: 14px; }
          .details strong { color: #555; }
          .section-title { font-size: 20px; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
          th { background-color: #f8f8f8; font-weight: bold; }
          .totals { text-align: right; }
          .totals div { display: flex; justify-content: space-between; padding: 5px 0; font-size: 15px; }
          .totals .total-amount { font-size: 22px; font-weight: bold; color: #2c3e50; border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px; }
          .footer { text-align: center; font-size: 12px; color: #777; margin-top: 40px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${companyLogo ? `<img src="${companyLogo}" alt="${companyName} Logo">` : ''}
            <h1>${companyName}</h1>
            <p>Invoice for Move: ${move.origin} to ${move.destination}</p>
            <p>Date: ${moveDate}</p>
          </div>

          <div class="details">
            <div>
              <p><strong>Invoice ID:</strong> ${approvedQuote.id.substring(0, 8)}</p>
              <p><strong>Move ID:</strong> ${move.id.substring(0, 8)}</p>
            </div>
            <div>
              <p><strong>Client:</strong> ${move.client_id}</p> <!-- You might want to fetch client name here -->
              <p><strong>Status:</strong> ${move.status.replace(/_/g, ' ')}</p>
            </div>
          </div>

          <h2 class="section-title">Quote Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th class="text-left">Description</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${lineItemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div>
              <span>Subtotal:</span>
              <span>$${approvedQuote.subtotal.toFixed(2)}</span>
            </div>
            <div>
              <span>Tax:</span>
              <span>$${approvedQuote.tax.toFixed(2)}</span>
            </div>
            <div class="total-amount">
              <span>Total:</span>
              <span>$${approvedQuote.total.toFixed(2)}</span>
            </div>
          </div>

          ${approvedQuote.client_notes ? `
            <h2 class="section-title">Client Notes</h2>
            <p>${approvedQuote.client_notes}</p>
          ` : ''}

          <div class="footer">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(invoiceHtml)
      printWindow.document.close()
      printWindow.focus() // Required for IE
      printWindow.print()
      setTimeout(() => {
        printWindow.close()
      }, 500) // Close after a short delay
    } else {
      toast.error('Please allow pop-ups for invoice download.')
    }
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
