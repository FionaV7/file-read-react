import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function GuestLogin({ setIsAuthenticated }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleGuestLogin = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    // Just store name and go to dashboard - no login logic
    localStorage.setItem('user', JSON.stringify({ name: name }))
    localStorage.setItem('isGuest', 'true')

    setIsAuthenticated(true)
    navigate('/chat')
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-dark-bg via-gray-900 to-dark-bg">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-card-bg p-8 rounded-lg shadow-2xl w-full max-w-md border border-gray-700"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-center mb-6"
        >
          <div className="inline-block p-4 bg-gradient-to-br from-primary-red to-accent-red rounded-full mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">Quick Access</h1>
          <p className="text-gray-400">No registration required</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6"
        >
          <p className="text-yellow-300 text-sm text-center">
            ⚠️ Guest Mode: Your data will be automatically deleted when you close the browser
          </p>
        </motion.div>

        <form onSubmit={handleGuestLogin}>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <label className="block text-sm font-medium mb-2 text-gray-300">👋 Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg focus:outline-none focus:border-primary-red focus:ring-2 focus:ring-primary-red/50 transition text-white"
              placeholder="Enter your name"
              required
            />
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-primary-red hover:bg-red-hover text-white font-bold py-3 rounded-lg transition duration-300 shadow-lg disabled:opacity-50"
          >
            {loading ? '🚀 Launching...' : '⚡ Continue as Guest'}
          </motion.button>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center space-y-2"
        >
          <p className="text-gray-400 text-sm">
            Want to save your data? <a href="/signup" className="text-primary-red hover:text-accent-red hover:underline font-semibold">Create an account</a>
          </p>
          <p className="text-gray-500 text-sm">
            <a href="/" className="hover:text-primary-red transition">← Back to Home</a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
