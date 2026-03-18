import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authService } from '../services/api'

export default function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('Attempting login with:', email)

    try {
      const response = await authService.login(email, password)
      console.log('Login response:', response.data)
      localStorage.setItem('token', response.data.access_token)
      localStorage.setItem('user', JSON.stringify({ name: response.data.user, email: response.data.email }))
      localStorage.setItem('email', response.data.email)
      setIsAuthenticated(true)
      navigate('/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      console.error('Error response:', err.response)
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.')
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">Welcome Back</h1>
          <p className="text-gray-400">Login to access your documents</p>
        </motion.div>
        
        {error && <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-4"
          >
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
          
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <label className="block text-sm font-medium mb-2 text-gray-300">🔒 Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg focus:outline-none focus:border-primary-red focus:ring-2 focus:ring-primary-red/50 transition text-white"
              placeholder="Enter your password"
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
            {loading ? '🔄 Logging in...' : '🚀 Login'}
          </motion.button>
        </form>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-400">
            Don't have an account? <a href="/signup" className="text-primary-red hover:text-accent-red hover:underline font-semibold">Sign up</a>
          </p>
          <p className="text-gray-500 mt-2 text-sm">
            <a href="/" className="hover:text-primary-red transition">← Back to Home</a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
