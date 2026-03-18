import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  console.log('🔑 Token from localStorage:', token)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('✅ Authorization header set:', config.headers.Authorization)
  } else {
    console.log('❌ No token found in localStorage')
  }
  return config
})

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log('❌ Unauthorized request - clearing session');
      localStorage.clear();
      // Only redirect if not already on login/landing page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup') && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
)

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (name, email, password) => api.post('/auth/signup', { name, email, password }),
  logout: () => {
    localStorage.removeItem('token')
  }
}

export const fileService = {
  uploadFile: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  getFiles: () => api.get('/files'),
  getFile: (fileId) => api.get(`/files/${fileId}`),
  getFileContent: (fileId) => api.get(`/files/${fileId}/content`),
  deleteFile: (fileId) => api.delete(`/files/${fileId}`)
}

export const chatService = {
  sendMessage: (fileId, message) => api.post(`/chat/${fileId}`, { query: message }),
  getConversation: (fileId) => api.get(`/chat/${fileId}/history`)
}

export default api
