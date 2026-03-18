import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { fileService, chatService } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { AuthContext } from '../context/AuthContext'

export default function Dashboard() {
  const [files, setFiles] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [username, setUsername] = useState('')
  const [isGuest, setIsGuest] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [currentChatId, setCurrentChatId] = useState(null)
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const { logout } = useContext(AuthContext)

  useEffect(() => {
    const user = localStorage.getItem('user')
    const guest = localStorage.getItem('isGuest') === 'true'
    let token = localStorage.getItem('token')
    
    console.log('Dashboard mounted - Token:', token)
    console.log('Dashboard mounted - User:', user)
    console.log('Dashboard mounted - IsGuest:', guest)
    
    // Auto-generate token for guests if missing
    if (guest && !token) {
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substr(2, 9)
      token = `guest_${timestamp}_${randomStr}`
      localStorage.setItem('token', token)
      console.log('Auto-generated guest token:', token)
    }
    
    // Skip token check for guests
    if (guest) {
      console.log('Guest user - no token required')
    } else if (!token) {
      console.error('No token found! Redirecting to login...')
      navigate('/')
      return
    }
    
    if (user) {
      try {
        const userData = JSON.parse(user)
        setUsername(userData.name || userData.email || user)
      } catch {
        setUsername(user)
      }
    }
    setIsGuest(guest)
    loadFiles()

    // Load chat history from localStorage (skip for guests)
    if (!guest) {
      const savedChats = JSON.parse(localStorage.getItem('chatHistory') || '[]')
      setChatHistory(savedChats)
    }

    // Show initial greeting
    const hour = new Date().getHours()
    let greeting = 'Hi!'
    if (hour >= 5 && hour < 12) greeting = 'Good morning!'
    else if (hour >= 12 && hour < 18) greeting = 'Good afternoon!'
    else if (hour >= 18 && hour < 22) greeting = 'Good evening!'
    
    const initialMessage = {
      role: 'assistant',
      content: `${greeting} 👋 I'm your AI document assistant. Upload and select documents to analyze them, or just chat with me casually. How can I help you today?`
    }
    setMessages([initialMessage])

    // Create new chat
    const newChatId = Date.now()
    setCurrentChatId(newChatId)

    if (guest) {
      window.addEventListener('beforeunload', cleanupGuestData)
      return () => {
        window.removeEventListener('beforeunload', cleanupGuestData)
      }
    }
  }, [])

  const cleanupGuestData = () => {
    if (localStorage.getItem('isGuest') === 'true') {
      localStorage.clear()
    }
  }

  const loadFiles = async () => {
    try {
      setLoading(true)
      console.log('Loading files...')
      const response = await fileService.getFiles()
      console.log('Files loaded:', response.data)
      setFiles(response.data)
    } catch (error) {
      console.error('Failed to load files:', error)
      if (error.response?.status === 401) {
        console.error('Unauthorized - token may be invalid')
      }
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  const handleMultipleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files)
    if (uploadedFiles.length === 0) return

    console.log('Uploading files:', uploadedFiles.map(f => f.name))
    console.log('Current token:', localStorage.getItem('token'))

    setLoading(true)
    setUploadStatus(`Uploading ${uploadedFiles.length} file(s)...`)

    try {
      for (const file of uploadedFiles) {
        console.log('Uploading file:', file.name)
        await fileService.uploadFile(file)
        console.log('File uploaded successfully:', file.name)
      }
      setUploadStatus(`✓ ${uploadedFiles.length} file(s) uploaded!`)
      await loadFiles()
      setTimeout(() => setUploadStatus(''), 3000)
    } catch (error) {
      console.error('Upload error:', error)
      console.error('Error response:', error.response?.data)
      setUploadStatus('❌ Upload failed: ' + (error.response?.data?.detail || error.message))
      setTimeout(() => setUploadStatus(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => {
      const newSelection = prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
      return newSelection
    })
  }

  const handleNewChat = () => {
    // Save current chat before creating new one (skip for guests)
    // Only save if there are meaningful interactions (more than 2 user messages)
    if (messages.length > 5 && !isGuest) {
      const chatTitle = messages[1]?.content.substring(0, 30) + '...' || 'New Chat'
      const newChat = {
        id: currentChatId,
        title: chatTitle,
        messages: messages,
        timestamp: new Date().toISOString(),
        files: selectedFiles
      }
      const updatedHistory = [newChat, ...chatHistory]
      setChatHistory(updatedHistory)
      localStorage.setItem('chatHistory', JSON.stringify(updatedHistory))
    }

    // Create new chat
    const hour = new Date().getHours()
    let greeting = 'Hi!'
    if (hour >= 5 && hour < 12) greeting = 'Good morning!'
    else if (hour >= 12 && hour < 18) greeting = 'Good afternoon!'
    else if (hour >= 18 && hour < 22) greeting = 'Good evening!'
    
    setMessages([{
      role: 'assistant',
      content: `${greeting} 👋 Starting a fresh conversation! Upload and select documents to analyze them, or just chat with me. What would you like to talk about?`
    }])
    setSelectedFiles([])
    setCurrentChatId(Date.now())
  }

  const loadChat = (chat) => {
    setMessages(chat.messages)
    setSelectedFiles(chat.files)
    setCurrentChatId(chat.id)
    setShowChatHistory(false)
  }

  const deleteChat = (chatId) => {
    const updatedHistory = chatHistory.filter(c => c.id !== chatId)
    setChatHistory(updatedHistory)
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory))
  }

  const renameChat = (chatId, newTitle) => {
    const updatedHistory = chatHistory.map(c => 
      c.id === chatId ? { ...c, title: newTitle } : c
    )
    setChatHistory(updatedHistory)
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory))
  }

  const handleViewContent = (fileId) => {
    navigate(`/file-content/${fileId}`)
  }

  const handleDelete = async (fileId) => {
    if (!confirm('Delete this file?')) return
    try {
      await fileService.deleteFile(fileId)
      await loadFiles()
      setSelectedFiles(prev => prev.filter(id => id !== fileId))
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = input
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setInput('')
    setChatLoading(true)

    try {
      if (selectedFiles.length === 0) {
        const casualResponse = getCasualResponse(userMessage)
        setTimeout(() => {
          const newMessages = [...messages, { role: 'user', content: userMessage }, { role: 'assistant', content: casualResponse }]
          setMessages(newMessages)
          
          // Update chat in history with all messages (both new and existing)
          if (!isGuest) {
            const chatTitle = userMessage.substring(0, 40)
            const existingChat = chatHistory.find(c => c.id === currentChatId)
            
            if (existingChat) {
              // Update existing chat with new messages
              const updatedHistory = chatHistory.map(c =>
                c.id === currentChatId ? { ...c, messages: newMessages, timestamp: new Date().toISOString() } : c
              )
              setChatHistory(updatedHistory)
              localStorage.setItem('chatHistory', JSON.stringify(updatedHistory))
            } else if (messages.length > 1) {
              // Create new chat only after first interaction
              const newChat = {
                id: currentChatId,
                title: chatTitle,
                messages: newMessages,
                timestamp: new Date().toISOString(),
                files: selectedFiles
              }
              const updatedHistory = [newChat, ...chatHistory]
              setChatHistory(updatedHistory)
              localStorage.setItem('chatHistory', JSON.stringify(updatedHistory))
            }
          }
          
          setChatLoading(false)
        }, 500)
      } else {
        const response = await chatService.sendMessage(selectedFiles.join(','), userMessage)
        const newMessages = [...messages, { role: 'user', content: userMessage }, { role: 'assistant', content: response.data.answer }]
        setMessages(newMessages)
        
        // Update chat in history with all messages (both new and existing)
        if (!isGuest) {
          const chatTitle = userMessage.substring(0, 40)
          const existingChat = chatHistory.find(c => c.id === currentChatId)
          
          if (existingChat) {
            // Update existing chat with new messages
            const updatedHistory = chatHistory.map(c =>
              c.id === currentChatId ? { ...c, messages: newMessages, timestamp: new Date().toISOString() } : c
            )
            setChatHistory(updatedHistory)
            localStorage.setItem('chatHistory', JSON.stringify(updatedHistory))
          } else if (messages.length > 1) {
            // Create new chat only after first interaction
            const newChat = {
              id: currentChatId,
              title: chatTitle,
              messages: newMessages,
              timestamp: new Date().toISOString(),
              files: selectedFiles
            }
            const updatedHistory = [newChat, ...chatHistory]
            setChatHistory(updatedHistory)
            localStorage.setItem('chatHistory', JSON.stringify(updatedHistory))
          }
        }
        
        setChatLoading(false)
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Failed to get response' }])
      setChatLoading(false)
    }
  }

  const getCasualResponse = (msg) => {
    const lower = msg.toLowerCase()

    // Greetings
    if (lower.match(/\b(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b/)) {
      return '👋 Hello! I\'m your AI document assistant. Upload files and select them to analyze, or just chat with me!'
    }
    if (lower.match(/\b(how are you|how\'s it going|what\'s up|wassup)\b/)) {
      return '😊 I\'m doing great, thanks for asking! I\'m here to help you understand your documents. How can I assist you today?'
    }
    if (lower.match(/\b(thanks|thank you|thx|appreciate)\b/)) {
      return '🙏 You\'re very welcome! Feel free to ask me anything about your documents!'
    }
    if (lower.match(/\b(bye|goodbye|see you|later)\b/)) {
      return '👋 Goodbye! Come back anytime you need document analysis!'
    }
    if (lower.match(/\b(help|what can you do|capabilities)\b/)) {
      return '💡 I can analyze documents, extract information, answer questions about your files, and have casual conversations. Upload files and select them to get started!'
    }
    if (lower.match(/\b(who are you|what are you)\b/)) {
      return '🤖 I\'m an AI-powered document assistant using Google Gemini and RAG technology. I can help you understand and analyze your documents!'
    }

    return '💬 I\'m here to help! Select files from the list to analyze documents with AI, or just chat with me about anything!'
  }

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    if (logout) {
      logout()
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('email')
      localStorage.removeItem('isGuest')
      localStorage.removeItem('userData')
    }
    setShowLogoutModal(false)
    navigate('/')
  }

  return (
    <div className="fixed inset-0 bg-dark-bg flex flex-col overflow-hidden">
      {/* User Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-card-bg to-gray-800 border-b border-gray-700 px-6 py-4 flex-shrink-0"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-red to-accent-red rounded-full flex items-center justify-center text-lg font-bold">
              👤
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{username || 'User'}</p>
              <p className="text-gray-400 text-xs">
                {isGuest ? '👥 Guest Session' : '✓ Logged In'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="relative w-12 h-6 bg-gray-700 rounded-full transition-colors duration-300 hover:bg-gray-600"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <motion.div
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs"
                animate={{ x: isDark ? 0 : 24 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                {isDark ? '🌙' : '☀️'}
              </motion.div>
            </button>
            <button
              onClick={handleLogout}
              className="bg-primary-red hover:bg-red-hover text-white px-4 py-2 rounded-lg transition transform hover:scale-105 shadow-lg text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side - Files */}
        <div className="w-1/2 p-6 border-r border-gray-700 overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div>
            <h1 className="text-2xl font-bold text-primary-red mb-1">
              📂 Documents
            </h1>
            <p className="text-gray-400 mb-4 text-xs">
              {isGuest ? '👥 Guest session - Data deleted on close' : '✓ Upload and select files to analyze'}
            </p>
          </div>
        </motion.div>

        {/* Compact Upload */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <label className="block bg-gradient-to-r from-primary-red to-accent-red p-3 rounded-lg cursor-pointer hover:shadow-lg transition mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="flex-1">
                <p className="text-white font-semibold text-xs">Upload Documents</p>
              </div>
            </div>
            <input type="file" multiple onChange={handleMultipleFileUpload} className="hidden" disabled={loading} />
          </label>
          {uploadStatus && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs text-green-400 mb-2">
              {uploadStatus}
            </motion.p>
          )}
        </motion.div>

        {/* Feature Cards with Flip Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3 mb-4"
        >
          <FlipCard
            icon="🤖"
            title="AI Powered"
            description="Google Gemini 2.5 Flash for intelligent analysis"
            delay={0.4}
          />
          <FlipCard
            icon="⚡"
            title="Fast Search"
            description="Vector embeddings for instant semantic search"
            delay={0.5}
          />
          <FlipCard
            icon="📊"
            title="Multi-Format"
            description="PDF, Word, Excel, Images & more supported"
            delay={0.6}
          />
          <FlipCard
            icon="🔒"
            title="Secure"
            description="Your data is isolated and protected"
            delay={0.7}
          />
        </motion.div>

        {/* Files List */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-white">Documents ({files.length})</h2>
          {selectedFiles.length > 0 && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => setSelectedFiles([])}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Clear {selectedFiles.length} selected
            </motion.button>
          )}
        </div>

        <div className="space-y-3">
          {files.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-gray-400"
            >
              <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">No documents yet</p>
              <p className="text-xs">Upload files to get started</p>
            </motion.div>
          ) : (
            files.map((file, idx) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-2"
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.id)}
                  onChange={() => toggleFileSelection(file.id)}
                  className="w-5 h-5 accent-accent-blue cursor-pointer flex-shrink-0"
                />

                {/* File Card */}
                <div
                  onClick={() => toggleFileSelection(file.id)}
                  className={`flex-1 bg-card-bg p-3 rounded-lg border-2 transition cursor-pointer transform hover:scale-[1.01] ${selectedFiles.includes(file.id)
                      ? 'border-primary-red shadow-lg shadow-primary-red/20'
                      : 'border-gray-700 hover:border-gray-600'
                    }`}
                >
                  <p className="font-semibold text-white text-sm truncate">{file.name}</p>
                  <p className="text-gray-400 text-xs mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleViewContent(file.id)}
                    className="bg-gradient-to-r from-primary-red to-accent-red hover:from-accent-red hover:to-primary-red text-white px-4 py-2 rounded-lg text-xs transition transform hover:scale-105 font-semibold shadow-lg flex items-center gap-1"
                    title="View Content"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="bg-gradient-to-r from-danger to-red-600 hover:from-red-600 hover:to-danger text-white px-3 py-2 rounded-lg text-xs transition transform hover:scale-105 shadow-lg"
                    title="Delete File"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Right Side - Chat */}
      <div className="w-1/2 flex flex-col overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-r from-card-bg to-gray-800 p-4 border-b border-gray-700 flex-shrink-0"
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-primary-red flex items-center gap-2">
                💬 AI Assistant
              </h2>
              <p className="text-gray-400 text-xs mt-1">
                {selectedFiles.length === 0
                  ? '💡 Select documents to analyze or chat casually'
                  : `📚 Analyzing ${selectedFiles.length} document${selectedFiles.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowChatHistory(!showChatHistory)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                History ({chatHistory.length})
              </button>
              <button
                onClick={handleNewChat}
                className="bg-primary-red hover:bg-red-hover text-white px-4 py-2 rounded-lg text-sm transition transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Chat
              </button>
            </div>
          </div>
        </motion.div>

        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-dark-bg to-gray-900 flex flex-col">
          {showChatHistory ? (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white mb-4">Chat History</h3>
              {chatHistory.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No saved chats yet</p>
              ) : (
                chatHistory.map((chat) => (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-black/40 p-4 rounded-lg border border-gray-800 hover:border-primary-red transition cursor-pointer"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1" onClick={() => loadChat(chat)}>
                        <input
                          type="text"
                          defaultValue={chat.title}
                          onBlur={(e) => renameChat(chat.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-transparent text-black font-semibold text-sm mb-1 w-full border-none outline-none focus:bg-transparent focus:text-black hover:text-black px-2 py-1 rounded transition"
                        />
                        <p className="text-gray-400 text-xs px-2">
                          {new Date(chat.timestamp).toLocaleString()} • {chat.messages.length} messages
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                        className="text-red-400 hover:text-red-300 p-1 flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            <div className="max-h-full">
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center text-gray-400 mt-20"
                >
                  <div className="inline-block p-6 bg-card-bg rounded-full mb-4">
                    <svg className="w-12 h-12 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold mb-2">Ready to Chat!</p>
                  <p className="text-sm">Select documents or start chatting</p>
                </motion.div>
              ) : (
                messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                  >
                    <div className={`inline-block max-w-[85%] p-3 rounded-lg text-sm shadow-lg break-words ${msg.role === 'user'
                        ? 'bg-gradient-to-r from-primary-red to-accent-red text-white'
                        : 'bg-card-bg text-gray-100 border border-gray-700'
                      }`}>
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    </div>
                  </motion.div>
                ))
              )}
              {chatLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-left mb-3"
                >
                  <div className="inline-block bg-card-bg text-gray-100 p-3 rounded-lg text-sm border border-gray-700">
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSendMessage}
          className="p-4 bg-card-bg border-t border-gray-700 flex-shrink-0"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={chatLoading}
              className="flex-1 px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg focus:outline-none focus:border-primary-red text-white text-sm transition"
              placeholder="Type your message..."
            />
            <button
              type="submit"
              disabled={chatLoading || !input.trim()}
              className="bg-primary-red hover:bg-red-hover hover:shadow-lg text-white px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              ➤
            </button>
          </div>
        </motion.form>
      </div>

      {/* Right Side - Chat closing div is above - end of main content */}
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card-bg rounded-xl p-8 max-w-md w-full mx-4 border border-gray-700 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-primary-red mb-4">Confirm Logout</h2>
              <p className="text-gray-300 mb-6">Are you sure you want to logout?</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 bg-primary-red hover:bg-red-hover text-white px-4 py-2 rounded-lg transition"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FlipCard({ icon, title, description, delay }) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, rotateY: -90 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ delay, duration: 0.6 }}
      onHoverStart={() => setIsFlipped(true)}
      onHoverEnd={() => setIsFlipped(false)}
      className="relative h-24 cursor-pointer"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div
          className="absolute w-full h-full bg-gradient-to-br from-card-bg to-gray-800 rounded-lg p-3 border border-gray-700 flex flex-col items-center justify-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-3xl mb-1">{icon}</span>
          <p className="text-white font-semibold text-xs text-center">{title}</p>
        </div>

        {/* Back */}
        <div
          className="absolute w-full h-full bg-gradient-to-br from-primary-red to-accent-red rounded-lg p-3 flex items-center justify-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-white text-xs text-center leading-tight">{description}</p>
        </div>
      </motion.div>
    </motion.div>
  )
}
