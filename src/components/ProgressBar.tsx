interface ProgressBarProps {
  currentStatus: 'quote_sent' | 'approved' | 'scheduled' | 'in_progress' | 'completed'
}

const steps = [
  { key: 'quote_sent', label: 'Quote Sent', description: 'Quote has been sent to you' },
  { key: 'approved', label: 'Quote Approved', description: 'You approved the quote' },
  { key: 'scheduled', label: 'Scheduled', description: 'Move has been scheduled' },
  { key: 'in_progress', label: 'In Progress', description: 'Move is currently happening' },
  { key: 'completed', label: 'Completed', description: 'Move has been completed' },
]

export function ProgressBar({ currentStatus }: ProgressBarProps) {
  const currentIndex = steps.findIndex(step => step.key === currentStatus)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <div key={step.key} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${
                  index <= currentIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    index < currentIndex ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
            <div className="text-center mt-2">
              <p className={`text-xs font-medium ${
                index <= currentIndex ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.label}
              </p>
              <p className="text-xs text-gray-400 mt-1 hidden sm:block">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}