import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { setUnauthorizedHandler } from '../api/client'

const TOKEN_KEY = 'babytracker-token'
const USER_KEY = 'babytracker-user'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  })

  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  })

  const login = useCallback((newToken, newUser) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
  }, [logout])

  const value = {
    token,
    user,
    login,
    logout,
    isAuthenticated: !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
