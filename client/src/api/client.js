const API_URL = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'babytracker-token'
const USER_KEY = 'babytracker-user'

let onUnauthorized = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  window.location.reload()
}

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    onUnauthorized()
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    let message = `${res.status} error`
    try {
      const data = await res.json()
      if (data.message) message = data.message
      else if (data.error) message = data.error
    } catch {
      message = await res.text()
    }
    throw new Error(message)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  del: (path) => request('DELETE', path),
}
