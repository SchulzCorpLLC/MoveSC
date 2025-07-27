import { useEffect, useState, useCallback } from 'react'
import { Upload, FileText, Download, Trash2 } from 'lucide-react'
import { supabase, type Database } from '../lib/supabase'
import { useClient } from '../hooks/useClient'
import toast from 'react-hot-toast'

type Document = Database['public']['Tables']['documents']['Row']
type Move = Database['public']['Tables']['moves']['Row']

export function Documents() {
  const { client } = useClient()
  const [documents, setDocuments] = useState<Document[]>([])
  const [moves, setMoves] = useState<Move[]>([])
  const [selectedMoveId, setSelectedMoveId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    if (!client) return

    const fetchData = async () => {
      // Fetch moves
      const { data: movesData, error: movesError } = await supabase
        .from('moves')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })

      if (movesError) {
        console.error('Error fetching moves:', movesError)
      } else {
        setMoves(movesData)
        if (movesData.length > 0 && !selectedMoveId) {
          setSelectedMoveId(movesData[0].id)
        }
      }

      // Fetch documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .in('move_id', movesData?.map(m => m.id) || [])
        .order('uploaded_at', { ascending: false })

      if (documentsError) {
        console.error('Error fetching documents:', documentsError)
      } else {
        setDocuments(documentsData)
      }

      setLoading(false)
    }

    fetchData()
  }, [client])

  const uploadFile = useCallback(async (file: File) => {
    if (!selectedMoveId) {
      toast.error('Please select a move first')
      return
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `documents/${selectedMoveId}/${fileName}`

    setUploading(true)

    try {
      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      // Save document record
      const { data, error: insertError } = await supabase
        .from('documents')
        .insert({
          move_id: selectedMoveId,
          filename: file.name,
          file_url: publicUrl,
          file_size: file.size,
          content_type: file.type,
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      setDocuments(prev => [data, ...prev])
      toast.success(`${file.name} uploaded successfully`)
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(`Failed to upload ${file.name}: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }, [selectedMoveId])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)
      files.forEach(uploadFile)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      files.forEach(uploadFile)
    }
  }

  const deleteDocument = async (doc: Document) => {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', doc.id)

    if (error) {
      toast.error('Failed to delete document')
    } else {
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
      toast.success('Document deleted')
    }
  }

  const filteredDocuments = selectedMoveId 
    ? documents.filter(doc => doc.move_id === selectedMoveId)
    : documents

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600 mt-1">Upload and manage your move documents</p>
      </div>

      {/* Move Selection */}
      {moves.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <label htmlFor="move-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Move
          </label>
          <select
            id="move-select"
            value={selectedMoveId}
            onChange={(e) => setSelectedMoveId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Moves</option>
            {moves.map((move) => (
              <option key={move.id} value={move.id}>
                {move.origin} → {move.destination} ({new Date(move.date).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`relative bg-white rounded-xl shadow-sm border-2 border-dashed transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {uploading ? 'Uploading...' : 'Upload Documents'}
          </h3>
          <p className="text-gray-600 mb-4">
            Drag and drop files here, or click to select
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
            onChange={handleFileInput}
            disabled={uploading || !selectedMoveId}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white transition-colors ${
              uploading || !selectedMoveId
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
            }`}
          >
            Choose Files
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Supported: PDF, JPG, PNG, DOCX (Max 10MB each)
          </p>
        </div>
      </div>

      {/* Documents List */}
      {filteredDocuments.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedMoveId ? 'Documents for Selected Move' : 'All Documents'} ({filteredDocuments.length})
            </h2>
            
            <div className="space-y-3">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{doc.filename}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{doc.file_size ? formatFileSize(doc.file_size) : 'Unknown size'}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => deleteDocument(doc)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-600">
            {selectedMoveId ? 'No documents for this move' : 'Upload your first document to get started'}
          </p>
        </div>
      )}
    </div>
  )
}