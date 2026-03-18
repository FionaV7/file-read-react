import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function LandingPage() {
  const navigate = useNavigate()
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  const casualResponses = {
    'hi': 'Hello! 👋 How can I help you today?',
    'hello': 'Hi there! Welcome to File Read Bot! 😊',
    'hey': 'Hey! What can I do for you?',
    'how are you': 'I\'m doing great! Thanks for asking. How about you?',
    'thanks': 'You\'re welcome! Happy to help! 😊',
    'thank you': 'My pleasure! Let me know if you need anything else.',
    'bye': 'Goodbye! Have a great day! 👋',
    'help': 'I can help you understand documents! Upload files and chat with them using AI.',
    'what can you do': 'I can analyze documents, extract information, and answer questions about your files!',
    'who are you': 'I\'m File Read Bot - your AI document assistant! 🤖',
  }

  const handleSend = () => {
    if (!input.trim()) return

    const userMsg = input.trim()
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setInput('')

    // Find response
    const lowerInput = userMsg.toLowerCase()
    let response = casualResponses[lowerInput]
    
    if (!response) {
      // Check for partial matches
      for (const [key, value] of Object.entries(casualResponses)) {
        if (lowerInput.includes(key)) {
          response = value
          break
        }
      }
    }

    if (!response) {
      response = 'I\'m a simple chat bot on the landing page. For document analysis, please login and upload your files! 📄'
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', content: response }])
    }, 500)
  }

  const floatingIcons = [
    { type: 'PDF', icon: '📄', x: '12%', y: '18%', duration: 10, direction: 'right' },
    { type: 'DOCX', icon: '📝', x: '82%', y: '25%', duration: 12, direction: 'left' },
    { type: 'XLSX', icon: '📊', x: '18%', y: '72%', duration: 11, direction: 'up' },
    { type: 'PPTX', icon: '📊', x: '78%', y: '65%', duration: 13, direction: 'down' },
    { type: 'PNG', icon: '🖼️', x: '10%', y: '48%', duration: 14, direction: 'right' },
    { type: 'CSV', icon: '📋', x: '85%', y: '42%', duration: 9, direction: 'left' },
    { type: 'JSON', icon: '📦', x: '22%', y: '82%', duration: 12, direction: 'up' },
    { type: 'ZIP', icon: '🗜️', x: '72%', y: '12%', duration: 11, direction: 'down' },
    { type: 'TXT', icon: '📃', x: '48%', y: '10%', duration: 13, direction: 'right' },
    { type: 'XML', icon: '📋', x: '42%', y: '85%', duration: 10, direction: 'left' },
  ]

  const getAnimation = (direction, duration) => {
    const animations = {
      right: { x: [0, 100, 0], y: [0, -20, 0] },
      left: { x: [0, -100, 0], y: [0, 20, 0] },
      up: { x: [0, 20, 0], y: [0, -100, 0] },
      down: { x: [0, -20, 0], y: [0, 100, 0] },
    }
    return {
      animate: animations[direction],
      transition: {
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-gray-900 to-dark-bg relative overflow-hidden">
      {/* Floating File Icons */}
      {floatingIcons.map((item, idx) => (
        <motion.div
          key={idx}
          className="absolute z-50 pointer-events-none opacity-70"
          style={{ left: item.x, top: item.y }}
          {...getAnimation(item.direction, item.duration)}
        >
          <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-red/20 to-accent-red/20 backdrop-blur-xl rounded-full shadow-2xl border-2 border-red-400/30">
            <span className="text-3xl drop-shadow-lg">{item.icon}</span>
          </div>
        </motion.div>
      ))}

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 0.85, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.85 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-8"
          >
            <div className="inline-block p-6 bg-gradient-to-br from-primary-red to-accent-red rounded-full shadow-2xl">
              <svg
                className="w-16 h-16 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ delay: 0.4 }}
            className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent"
          >
            Welcome to File Read Bot
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.6 }}
            className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto"
          >
            Your Documents. Understood Intelligently.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.7 }}
            className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto"
          >
            Upload documents, extract structured content, and chat with them using AI-powered intelligence.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.85, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-primary-red hover:bg-red-hover text-white font-bold text-lg rounded-lg shadow-lg transform hover:scale-105 transition duration-300 w-48"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-4 bg-white hover:bg-gray-200 text-black font-bold text-lg rounded-lg shadow-lg transform hover:scale-105 transition duration-300 w-48"
            >
              Sign Up
            </button>
          </motion.div>

          {/* Guest Access Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 1.1 }}
            className="mt-6"
          >
            <button
              onClick={() => navigate('/guest')}
              className="px-6 py-2 text-gray-400 hover:text-white border border-gray-600 hover:border-primary-red hover:bg-card-bg rounded-lg transition duration-300"
            >
              🚀 Continue as Guest
            </button>
          </motion.div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 1.2 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl"
        >
          <FeatureCard
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            }
            title="Upload Documents"
            description="Support for PDF, Word, Excel, PowerPoint, and more"
          />
          <FeatureCard
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
            title="AI-Powered Analysis"
            description="Extract insights using Google Gemini and RAG technology"
          />
          <FeatureCard
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
            title="Chat Interface"
            description="Ask questions and get context-aware answers instantly"
          />
        </motion.div>
      </div>

      {/* Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            className="bg-primary-red hover:bg-red-hover text-white p-4 rounded-full shadow-2xl transform hover:scale-110 transition duration-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        ) : (
          <div className="bg-card-bg rounded-lg shadow-2xl w-80 h-96 flex flex-col">
            <div className="bg-primary-red p-4 rounded-t-lg flex justify-between items-center">
              <h3 className="font-bold text-white">Chat with us!</h3>
              <button onClick={() => setChatOpen(false)} className="text-white hover:text-gray-200">
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-gray-400 text-sm text-center mt-8">Say hi to get started! 👋</p>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-primary-red text-white' 
                        : 'bg-gray-700 text-gray-100'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-dark-bg border border-gray-600 rounded focus:outline-none focus:border-primary-red text-white text-sm"
                />
                <button
                  onClick={handleSend}
                  className="bg-primary-red hover:bg-red-hover text-white px-4 py-2 rounded transition"
                >
                  ➤
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FlipFeatureCard({ icon, title, backDescription, delay }) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 0.85, y: 0 }}
      transition={{ delay: 1.2 + delay, duration: 0.6 }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      className="h-64"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front - Icon at top center, Title in middle */}
        <div 
          className="absolute inset-0 bg-card-bg p-6 rounded-xl shadow-2xl border border-gray-700 hover:border-accent-blue transition duration-300 flex flex-col items-center justify-center"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <div className="text-accent-blue mb-6">{icon}</div>
          <h3 className="text-xl font-bold text-white text-center">{title}</h3>
        </div>
        
        {/* Back - Detailed Content */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-accent-blue to-secondary p-6 rounded-xl shadow-2xl flex items-center justify-center"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="text-white text-left space-y-2">
            {backDescription.split('\n').map((line, idx) => (
              <p key={idx} className="text-sm leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.8 }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.05 }}
      className="bg-card-bg p-6 rounded-lg shadow-xl border border-gray-700 hover:border-primary-red transition duration-300"
    >
      <div className="text-primary-red mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </motion.div>
  )
}
