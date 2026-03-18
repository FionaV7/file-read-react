import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authService } from '../services/api'

export default function Signup({ setIsAuthenticated }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      console.log('Attempting signup with:', name, email)
      const response = await authService.signup(name, email, password)
      console.log('Signup response:', response.data)
      
      alert('Account created successfully! Please login.')
      navigate('/login')
    } catch (err) {
      console.error('Signup error:', err)
      const errorMsg = err.response?.data?.detail || err.message || 'Signup failed. Please check if backend is running.'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-dark-bg via-gray-900 to-dark-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card-bg p-8 rounded-lg shadow-2xl w-full max-w-md border border-gray-700"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="text-center mb-6"
        >
          <div className="inline-block p-4 bg-gradient-to-br from-primary-red to-accent-red rounded-full mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">Create Account</h1>
          <p className="text-gray-400">Join us and start analyzing documents</p>
        </motion.div>
        
        {error && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-red-500 text-white p-3 rounded mb-4">
            {error}
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit}>
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-300">👤 Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg focus:outline-none focus:border-primary-red focus:ring-2 focus:ring-primary-red/50 transition text-white"
              placeholder="Enter your name"
              required
            />
          </motion.div>
          
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-300">📧 Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg focus:outline-none focus:border-primary-red focus:ring-2 focus:ring-primary-red/50 transition text-white"
              placeholder="Enter your email"
              required
            />
          </motion.div>
          
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-300">🔒 Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg focus:outline-none focus:border-primary-red focus:ring-2 focus:ring-primary-red/50 transition text-white"
              placeholder="Minimum 6 characters"
              required
            />
          </motion.div>
          
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-300">✔️ Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg focus:outline-none focus:border-primary-red focus:ring-2 focus:ring-primary-red/50 transition text-white"
              placeholder="Confirm your password"
              required
            />
          </motion.div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-primary-red hover:bg-red-hover text-white font-bold py-3 rounded-lg transition duration-300 shadow-lg disabled:opacity-50"
          >
            {loading ? '⏳ Creating Account...' : '✨ Sign Up'}
          </motion.button>
        </form>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account? <a href="/login" className="text-primary-red hover:text-accent-red hover:underline font-semibold">Login</a>
          </p>
          <p className="text-gray-500 mt-2 text-sm">
            <a href="/" className="hover:text-primary-red transition">← Back to Home</a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
