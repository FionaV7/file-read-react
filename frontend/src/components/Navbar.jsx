import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { AuthContext } from '../context/AuthContext'

export default function Navbar({ setIsAuthenticated }) {
  const navigate = useNavigate()
  const { logout } = useContext(AuthContext)
  const [username, setUsername] = useState('')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { isDark, toggleTheme } = useTheme()

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      try {
        const userData = JSON.parse(user)
        setUsername(userData.name || userData.email || user)
      } catch {
        setUsername(user)
      }
    }
  }, [])

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    // Call AuthContext logout to clear all auth state
    if (logout) {
      logout()
    } else {
      // Fallback if logout function is not available
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('email')
      localStorage.removeItem('isGuest')
      localStorage.removeItem('userData')
    }
    
    // Notify parent component
    setIsAuthenticated(false)
    
    // Navigate to landing page
    setShowLogoutModal(false)
    navigate('/')
  }

  return (
    <>
      <nav className="bg-card-bg border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-red">📂 File Read AI</h1>
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="relative w-14 h-7 bg-gray-700 rounded-full transition-colors duration-300 hover:bg-gray-600"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <motion.div
                className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full flex items-center justify-center"
                animate={{ x: isDark ? 0 : 28 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                {isDark ? '🌙' : '☀️'}
              </motion.div>
            </button>
            {username && (
              <span className="text-gray-300">👤 {username}</span>
            )}
            <button
              onClick={handleLogout}
              className="bg-primary-red hover:bg-red-hover text-white px-4 py-2 rounded-lg transition transform hover:scale-105 shadow-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

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
              <div className="text-center mb-6">
                <div className="inline-block p-4 bg-red-500/20 rounded-full mb-4">
                  <svg className="w-12 h-12 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Confirm Logout</h2>
                <p className="text-gray-400">Are you sure you want to logout?</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 bg-primary-red hover:bg-red-hover text-white px-4 py-3 rounded-lg transition font-semibold shadow-lg"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
