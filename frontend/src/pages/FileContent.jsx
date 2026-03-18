import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fileService } from '../services/api'

export default function FileContent() {
  const { fileId } = useParams()
  const navigate = useNavigate()
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const CHARS_PER_PAGE = 3000

  useEffect(() => {
    loadFileContent()
  }, [fileId])

  const loadFileContent = async () => {
    try {
      setLoading(true)
      const response = await fileService.getFileContent(fileId)
      if (response.data.text) {
        response.data.text = response.data.text
          .replace(/\n{3,}/g, '\n\n')
          .replace(/  +/g, ' ')
          .trim()
      }
      setContent(response.data)
    } catch (error) {
      console.error('Failed to load file content:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPages = () => {
    if (!content?.text) return []
    const text = content.text
    const pages = []
    for (let i = 0; i < text.length; i += CHARS_PER_PAGE) {
      pages.push(text.slice(i, i + CHARS_PER_PAGE))
    }
    return pages
  }

  const pages = getPages()
  const totalPages = pages.length

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg p-8 flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-red mx-auto mb-4"></div>
          <p className="text-primary-red text-xl">Loading document...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-gray-900 to-dark-bg p-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-primary-red hover:text-red-hover flex items-center gap-2 font-semibold transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </motion.div>

        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-8">
          {content?.name || 'Document Viewer'}
        </motion.h1>

        {content?.text && totalPages > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card-bg rounded-xl shadow-2xl mb-8 overflow-hidden border border-gray-700">
            <div className="bg-gradient-to-r from-primary-red to-accent-red p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Document Content
              </h2>
              <span className="text-white text-sm">Page {currentPage + 1} of {totalPages}</span>
            </div>
            
            <div className="p-8 text-gray-200 leading-relaxed whitespace-pre-wrap min-h-[500px] max-h-[600px] overflow-y-auto">
              {pages[currentPage]}
            </div>
            
            {totalPages > 1 && (
              <div className="bg-gray-800 p-4 flex justify-center items-center gap-4">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="bg-primary-red hover:bg-red-hover disabled:opacity-30 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <span className="text-gray-300 font-semibold">{currentPage + 1} / {totalPages}</span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="bg-primary-red hover:bg-red-hover disabled:opacity-30 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </motion.div>
        )}

        {content?.tables && content.tables.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card-bg rounded-xl shadow-2xl p-6 mb-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Tables
            </h2>
            {content.tables.map((table, idx) => (
              <div key={idx} className="mb-8 overflow-x-auto">
                <h3 className="text-primary-red font-semibold mb-3">Table {idx + 1}</h3>
                <table className="w-full border-collapse">
                  <tbody>
                    {table.map((row, rowIdx) => (
                      <tr key={rowIdx} className={rowIdx === 0 ? 'bg-gradient-to-r from-primary-red to-accent-red' : 'bg-gray-800 hover:bg-gray-700'}>
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="border border-gray-600 px-4 py-3 text-white text-sm">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </motion.div>
        )}

        {content?.images && content.images.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card-bg rounded-xl shadow-2xl p-6 mb-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Images
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.images.map((image, idx) => (
                <div key={idx} className="border border-gray-600 rounded-lg overflow-hidden hover:border-primary-red transition">
                  <img 
                    src={`data:image/png;base64,${image}`} 
                    alt={`Image ${idx + 1}`}
                    className="w-full h-auto"
                  />
                  <p className="text-center text-gray-400 text-sm p-3 bg-gray-800">Image {idx + 1}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {content?.metadata && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-card-bg rounded-xl shadow-2xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Document Information
            </h2>
            <div className="grid grid-cols-2 gap-4 text-gray-300">
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-500 text-sm mb-1">File Size</p>
                <p className="font-semibold">{(content.metadata.size / 1024).toFixed(2)} KB</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-500 text-sm mb-1">File Type</p>
                <p className="font-semibold uppercase">{content.metadata.type}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
