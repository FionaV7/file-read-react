import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import FileContent from './pages/FileContent'
import Login from './pages/Login'
import Signup from './pages/Signup'
import GuestLogin from './pages/GuestLogin'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if this is a new session - auto logout guest and user accounts
    const sessionId = sessionStorage.getItem('sessionId')
    if (!sessionId) {
      console.log('🔄 New session detected - logging out all users and guests')
      
      // Clear all authentication data
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('isGuest')
      localStorage.removeItem('userData')
      sessionStorage.clear()
      
      // Set a new session ID to prevent logout on page refresh
      const newSessionId = Date.now().toString()
      sessionStorage.setItem('sessionId', newSessionId)
      
      console.log('✅ Session cleared and new sessionId set:', newSessionId)
      setIsAuthenticated(false)
      setLoading(false)
      return
    }
    
    // Check existing authentication on page load/refresh
    const token = localStorage.getItem('token')
    const isGuest = localStorage.getItem('isGuest') === 'true'
    
    // Authenticate if token exists OR if guest AND session is still valid
    if ((token || isGuest) && sessionId) {
      console.log('✅ User authenticated - session valid')
      setIsAuthenticated(true)
    } else {
      console.log('❌ No valid session - logging out')
      // Clean up any orphaned data
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('isGuest')
      setIsAuthenticated(false)
    }
    
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-bg">
        <div className="text-center">
          <p className="text-accent-blue text-xl">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="bg-dark-bg min-h-screen text-white">
            {isAuthenticated && <Navbar setIsAuthenticated={setIsAuthenticated} />}
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/dashboard" />} />
              <Route path="/signup" element={!isAuthenticated ? <Signup setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/dashboard" />} />
              <Route path="/guest" element={!isAuthenticated ? <GuestLogin setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/chat" element={isAuthenticated ? <Chat /> : <Navigate to="/login" />} />
              <Route path="/file-content/:fileId" element={isAuthenticated ? <FileContent /> : <Navigate to="/login" />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
