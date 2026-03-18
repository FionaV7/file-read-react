import { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [isGuest, setIsGuest] = useState(localStorage.getItem('isGuest') === 'true')

  // Monitor session changes to sync state
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token')
      const isGuestMode = localStorage.getItem('isGuest') === 'true'
      setToken(token)
      setIsGuest(isGuestMode)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const login = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    setIsGuest(false)
    localStorage.setItem('token', authToken)
    localStorage.setItem('isGuest', 'false')
    localStorage.removeItem('userData') // Clear guest data if switching to permanent account
  }

  const loginAsGuest = (userData) => {
    setUser(userData)
    setIsGuest(true)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.setItem('isGuest', 'true')
    localStorage.setItem('userData', JSON.stringify(userData))
  }

  const logout = () => {
    console.log('🔐 Logging out user...')
    setUser(null)
    setToken(null)
    setIsGuest(false)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('isGuest')
    localStorage.removeItem('userData')
  }

  return (
    <AuthContext.Provider value={{ user, token, isGuest, login, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
