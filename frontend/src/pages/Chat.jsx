import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { chatService, fileService } from '../services/api'
import { useTheme } from '../context/ThemeContext'

export default function Chat() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const messagesContainerRef = useRef(null)
  const recognitionRef = useRef(null)
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'Welcome to Document Analysis. I\'m here to help you extract insights from your documents. You can upload files and ask me questions about them, or feel free to discuss any topic. What would you like to explore today?' 
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isListening, setIsListening] = useState(false)

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onstart = () => {
        setIsListening(true)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current.onresult = (event) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        if (event.results[event.results.length - 1].isFinal) {
          setInput(prev => prev + (prev ? ' ' : '') + transcript)
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    if (messagesContainerRef.current) {
      setTimeout(() => {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
      }, 100)
    }
  }, [messages, loading])

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      const response = await fileService.getFiles()
      setFiles(response.data)
    } catch (error) {
      console.error('Failed to load files:', error)
    }
  }

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    )
  }

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in your browser')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = input
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setInput('')
    setLoading(true)

    try {
      if (selectedFiles.length === 0) {
        // Casual chat without files
        const casualResponse = getCasualResponse(userMessage)
        setMessages(prev => [...prev, { role: 'assistant', content: casualResponse }])
      } else {
        // Chat with selected files
        const response = await chatService.sendMessage(selectedFiles.join(','), userMessage)
        setMessages(prev => [...prev, { role: 'assistant', content: response.data.answer }])
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Failed to get response' }])
    } finally {
      setLoading(false)
    }
  }

  const getCasualResponse = (msg) => {
    const lower = msg.toLowerCase()
    if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
      return 'Hello! I\'m ready to assist you. You can select documents from the sidebar to analyze them, or we can have a conversation about any topic you\'d like to discuss.'
    }
    if (lower.includes('how are you')) return 'Thank you for asking. I\'m functioning optimally and ready to help. How can I assist you today?'
    if (lower.includes('thanks') || lower.includes('thank you')) return 'You\'re welcome. Feel free to ask if you need anything else.'
    if (lower.includes('bye') || lower.includes('goodbye')) return 'Thank you for the conversation. Have a productive day ahead!'
    if (lower.includes('who are you') || lower.includes('what are you')) {
      return 'I\'m an AI document assistant designed to help you analyze documents, extract information, and answer questions based on content from your uploaded files. I can work with various document formats including PDFs, presentations, spreadsheets, and more.'
    }
    return 'I appreciate your question. To get the most from our interaction, you might consider uploading a document from the sidebar so we can work with specific content. Otherwise, I\'m happy to discuss any topic you have in mind.'
  }

  return (
    <div className="fixed inset-0 bg-dark-bg flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-card-bg border-r border-gray-700 p-4 overflow-y-auto">
        <button 
          onClick={() => navigate('/dashboard')}
          className="mb-4 text-accent-blue hover:underline flex items-center gap-2 w-full"
        >
          ← Back to Dashboard
        </button>

        <h2 className="text-xl font-bold text-white mb-4">Select Files</h2>
        
        {selectedFiles.length > 0 && (
          <div className="mb-4 p-3 bg-accent-blue rounded">
            <p className="text-white text-sm font-semibold">{selectedFiles.length} file(s) selected</p>
          </div>
        )}

        <div className="space-y-2">
          {files.length === 0 ? (
            <p className="text-gray-400 text-sm">No files uploaded yet</p>
          ) : (
            files.map((file) => (
              <label 
                key={file.id}
                className={`flex items-center gap-3 p-3 rounded cursor-pointer transition ${
                  selectedFiles.includes(file.id) 
                    ? 'bg-accent-blue text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.id)}
                  onChange={() => toggleFileSelection(file.id)}
                  className="w-4 h-4"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{file.name}</p>
                  <p className="text-xs opacity-75">{file.size} bytes</p>
                </div>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-card-bg p-4 border-b border-gray-700 flex-shrink-0 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-accent-blue">Document Analyst</h1>
            <p className="text-gray-400 text-sm">
              {selectedFiles.length === 0 
                ? 'Ready to help—select files from the sidebar or ask me anything' 
                : `Analyzing ${selectedFiles.length} document${selectedFiles.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="relative w-14 h-7 bg-gray-700 rounded-full transition-colors duration-300 hover:bg-gray-600 flex-shrink-0"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <div className={`absolute top-1 transition-transform duration-300 ${isDark ? 'translate-x-7' : 'translate-x-1'}`}>
              {isDark ? '🌙' : '☀️'}
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-end" ref={messagesContainerRef}>
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mb-20">
              <p className="text-lg mb-2">Welcome to Document Analysis</p>
              <p className="text-sm">Select files from the sidebar to analyze documents or start a conversation</p>
            </div>
          ) : (
            <div>
              {messages.map((msg, idx) => (
                <div key={idx} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block max-w-[80%] p-4 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-accent-blue text-white' 
                      : 'bg-gray-700 text-gray-100'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {loading && (
            <div className="text-left mb-4">
              <div className="inline-block bg-gray-700 text-gray-100 p-4 rounded-lg">
                <p>Processing your request...</p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="p-4 bg-card-bg border-t border-gray-700 flex-shrink-0">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-dark-bg border border-gray-500 rounded focus:outline-none focus:border-accent-blue text-white"
              placeholder="Ask a question about your documents or discuss any topic..."
            />
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={loading}
              className={`py-3 px-3 rounded transition flex items-center justify-center gap-1 font-semibold whitespace-nowrap flex-shrink-0 ${
                isListening 
                  ? 'bg-red-600 hover:bg-red-700 text-white border-2 border-red-500' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white border-2 border-gray-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              🎤 <span>{isListening ? 'Stop' : 'Voice'}</span>
            </button>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-accent-blue hover:bg-primary-blue text-white px-8 py-3 rounded transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
            >
              {loading ? '...' : '➤'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
