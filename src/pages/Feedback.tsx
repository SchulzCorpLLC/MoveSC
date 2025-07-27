import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Star, ArrowLeft } from 'lucide-react'
import { supabase, type Database } from '../lib/supabase'
import { useClient } from '../hooks/useClient'
import toast from 'react-hot-toast'

type Move = Database['public']['Tables']['moves']['Row']

const feedbackSchema = z.object({
  stars: z.number().min(1).max(5),
  comment: z.string().optional(),
})

type FeedbackForm = z.infer<typeof feedbackSchema>

export function Feedback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { client } = useClient()
  const moveId = searchParams.get('move')
  
  const [move, setMove] = useState<Move | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
  })

  useEffect(() => {
    if (!moveId || !client) return

    const fetchMove = async () => {
      const { data, error } = await supabase
        .from('moves')
        .select('*')
        .eq('id', moveId)
        .eq('client_id', client.id)
        .single()

      if (error) {
        console.error('Error fetching move:', error)
        toast.error('Move not found')
        navigate('/dashboard')
      } else {
        if (data.status !== 'completed') {
          toast.error('Feedback can only be submitted for completed moves')
          navigate('/dashboard')
          return
        }
        setMove(data)
      }
      setLoading(false)
    }

    fetchMove()
  }, [moveId, client, navigate])

  const onSubmit = async (data: FeedbackForm) => {
    if (!move) return

    setSubmitting(true)

    const { error } = await supabase
      .from('feedback')
      .insert({
        move_id: move.id,
        stars: data.stars,
        comment: data.comment || null,
      })

    if (error) {
      toast.error('Failed to submit feedback')
    } else {
      toast.success('Thank you for your feedback!')
      navigate('/dashboard')
    }

    setSubmitting(false)
  }

  const handleStarClick = (starValue: number) => {
    setRating(starValue)
    setValue('stars', starValue)
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
          <h1 className="text-xl font-semibold text-gray-900">Leave Feedback</h1>
          <p className="text-sm text-gray-600">
            {move.origin} → {move.destination}
          </p>
        </div>
      </div>

      {/* Feedback Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How would you rate your moving experience?
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {errors.stars && (
              <p className="mt-2 text-sm text-red-600">Please select a rating</p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Comments (Optional)
            </label>
            <textarea
              {...register('comment')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tell us about your experience..."
            />
            {errors.comment && (
              <p className="mt-1 text-sm text-red-600">{errors.comment.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>

      {/* Thank You Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-blue-900 font-medium mb-2">Thank you!</h3>
        <p className="text-blue-800 text-sm">
          Your feedback helps us improve our service and provide better experiences for all our clients.
        </p>
      </div>
    </div>
  )
}