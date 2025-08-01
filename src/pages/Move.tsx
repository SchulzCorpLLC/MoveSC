import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Clock, Users, Download, Eye, FileText, MessageSquare } from 'lucide-react' // Added FileText and MessageSquare
import { supabase, type Database } from '../lib/supabase'
import { StatusBadge } from '../components/StatusBadge'
import toast from 'react-hot-toast'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

type Quote = Database['public']['Tables']['quotes']['Row']
type Company = Database['public']['Tables']['companies']['Row']
type Client = Database['public']['Tables']['clients']['Row']
type Invoice = Database['public']['Tables']['invoices']['Row'] // New type
type MoveUpdate = Database['public']['Tables']['move_updates']['Row'] // Added for recent updates section

// Extend the Move type to include related quotes, company, client, invoices, and move_updates data
type MoveWithDetails = Database['public']['Tables']['moves']['Row'] & {
  quotes: Quote[]
  company: Company | null
  client: Pick<Client, 'name'> | null
  invoices: Invoice[] // Add invoices
  move_updates: MoveUpdate[] // Add move_updates
}

export function Move() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [move, setMove] = useState<MoveWithDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchMove = async () => {
      const { data, error } = await supabase
        .from('moves')
        .select(`
          *,
          quotes(*),
          company:companies(*),
          client:clients(name),
          invoices(*), // Fetch invoices
          move_updates(*) // Fetch move_updates
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching move:', error)
        toast.error('Move not found')
        navigate('/dashboard')
      } else {
        // Sort move_updates by created_at in descending order
        const sortedMoveUpdates = data.move_updates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setMove({ ...data, move_updates: sortedMoveUpdates } as MoveWithDetails);
      }
      setLoading(false)
    }

    fetchMove()
  }, [id, navigate])

  // Helper function to generate the PDF instance
  const generateInvoicePdf = async () => {
    if (!move) {
      toast.error('Move details not loaded.')
      return null
    }

    // Prioritize using an actual invoice record if available
    const invoice = move.invoices.length > 0 ? move.invoices[0] : null; // Assuming one invoice per move for simplicity, or pick the latest/relevant one
    const approvedQuote = move.quotes.find(q => q.approved) || move.quotes[0]; // Still need quote for line items

    if (!invoice && !approvedQuote) {
      toast.error('No invoice or approved quote found for this move to generate PDF.')
      return null
    }

    const companyName = move.company?.name || 'Moving Company'
    const companyLogo = move.company?.logo_url || ''
    const moveDate = new Date(move.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Use invoice details if available, otherwise fall back to quote details for display
    const invoiceIdDisplay = invoice?.invoice_number || invoice?.id?.substring(0, 8) || 'N/A';
    const issueDateDisplay = invoice?.issue_date ? new Date(invoice.issue_date).toLocaleDateString('en-US') : 'N/A';
    const dueDateDisplay = invoice?.due_date ? new Date(invoice.due_date).toLocaleDateString('en-US') : 'N/A';
    const totalAmountDisplay = invoice?.total_amount !== undefined ? invoice.total_amount.toFixed(2) : (approvedQuote?.total !== undefined ? approvedQuote.total.toFixed(2) : '0.00');
    const statusDisplay = invoice?.status?.replace(/_/g, ' ') || 'N/A';

    // Line items still come from the quote as the invoice table doesn't store them
    const lineItemsToUse = approvedQuote?.line_items || [];
    const subtotalToUse = approvedQuote?.subtotal !== undefined ? approvedQuote.subtotal : 0;
    const taxToUse = approvedQuote?.tax !== undefined ? approvedQuote.tax : 0;
    const clientNotesToUse = approvedQuote?.client_notes || '';

    const lineItemsHtml = (lineItemsToUse || [])
      .map((item: any) => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px; text-align: left;">${item.description || item.name}</td>
          <td style="padding: 10px; text-align: right;">$${(item.amount || item.price || 0).toFixed(2)}</td>
        </tr>
      `)
      .join('')

    const invoiceHtml = `
      <div style="font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif; padding: 20px; color: #333; max-width: 800px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          ${companyLogo ? `<img src="${companyLogo}" alt="${companyName} Logo" style="max-height: 60px; margin-bottom: 10px;">` : ''}
          <h1 style="font-size: 28px; color: #2c3e50; margin: 0;">${companyName}</h1>
          <p>Invoice for Move: ${move.origin} to ${move.destination}</p>
          <p>Date: ${moveDate}</p>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div style="width: 48%;">
            <p style="margin: 5px 0; font-size: 14px;"><strong>Invoice ID:</strong> ${invoiceIdDisplay}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Move ID:</strong> ${move.id.substring(0, 8)}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Issue Date:</strong> ${issueDateDisplay}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Due Date:</strong> ${dueDateDisplay}</p>
          </div>
          <div style="width: 48%;">
            <p style="margin: 5px 0; font-size: 14px;"><strong>Client:</strong> ${move.client?.name || 'N/A'}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Status:</strong> ${statusDisplay}</p>
          </div>
        </div>

        <h2 style="font-size: 20px; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px;">Line Item Breakdown</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr>
              <th style="padding: 10px; text-align: left; background-color: #f8f8f8; font-weight: bold;">Description</th>
              <th style="padding: 10px; text-align: right; background-color: #f8f8f8; font-weight: bold;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHtml}
          </tbody>
        </table>

        <div style="text-align: right;">
          <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 15px;">
            <span>Subtotal:</span>
            <span>$${subtotalToUse.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 15px;">
            <span>Tax:</span>
            <span>$${taxToUse.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 22px; font-weight: bold; color: #2c3e50; border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px;">
            <span>Total:</span>
            <span>$${totalAmountDisplay}</span>
          </div>
        </div>

        ${clientNotesToUse ? `
          <h2 style="font-size: 20px; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px; margin-top: 30px;">Client Notes</h2>
          <p>${clientNotesToUse}</p>
        ` : ''}

        <div style="text-align: center; font-size: 12px; color: #777; margin-top: 40px;">
          <p>Thank you for your business!</p>
        </div>
      </div>
    `

    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '800px';
    document.body.appendChild(tempDiv);
    tempDiv.innerHTML = invoiceHtml;

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate invoice PDF.');
      return null;
    } finally {
      document.body.removeChild(tempDiv);
    }
  }

  const handleDownloadInvoice = async () => {
    const pdf = await generateInvoicePdf();
    if (pdf) {
      const invoiceNumber = move?.invoices?.[0]?.invoice_number || move?.id?.substring(0, 8);
      pdf.save(`invoice-${invoiceNumber}.pdf`);
      toast.success('Invoice downloaded successfully! Check your device\'s downloads folder.');
    }
  }

  const handleViewInvoice = async () => {
    const pdf = await generateInvoicePdf();
    if (pdf) {
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      toast.success('Invoice opened in a new tab!');
      // Clean up the object URL after a short delay
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
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

  // Get the first invoice if available
  const currentInvoice = move.invoices.length > 0 ? move.invoices[0] : null;

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

      {/* Invoice Information */}
      {currentInvoice && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Invoice Number</p>
                <p className="text-sm text-gray-600">{currentInvoice.invoice_number || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Issue Date</p>
                <p className="text-sm text-gray-600">{new Date(currentInvoice.issue_date).toLocaleDateString('en-US')}</p>
              </div>
            </div>
            {currentInvoice.due_date && (
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Due Date</p>
                  <p className="text-sm text-gray-600">{new Date(currentInvoice.due_date).toLocaleDateString('en-US')}</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <span className="text-lg font-bold text-gray-400">$</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Total Amount</p>
                <p className="text-lg font-semibold text-gray-900">${currentInvoice.total_amount.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <StatusBadge status={currentInvoice.status} /> {/* Re-using StatusBadge for invoice status */}
              <div>
                <p className="text-sm font-medium text-gray-900">Payment Status</p>
                <p className="text-sm text-gray-600">{currentInvoice.status.replace(/_/g, ' ')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Recent Updates (from move_updates table) */}
      {move.move_updates && move.move_updates.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Updates</h3>
          <div className="space-y-3">
            {move.move_updates.map((update) => (
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
          </div>
        </div>
      )}

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
          <button
            onClick={handleViewInvoice}
            className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Invoice
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
