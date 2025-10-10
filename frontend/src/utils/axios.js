import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import router from '../router'

// Configure axios defaults
axios.defaults.withCredentials = true
axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''

// Track if we're already showing a session expired message
let isSessionExpiredShown = false

// Response interceptor to handle session expiration
axios.interceptors.response.use(
  (response) => {
    // Reset flag on successful response
    isSessionExpiredShown = false
    return response
  },
  (error) => {
    if (error.response) {
      // Check if session expired
      if (
        error.response.status === 401 &&
        error.response.data?.error_code === 'SESSION_EXPIRED'
      ) {
        if (!isSessionExpiredShown) {
          isSessionExpiredShown = true
          
          // Show notification to user
          alert('Phiên đăng nhập đã hết hạn (30 phút). Vui lòng đăng nhập lại.')
          
          // Clear auth state
          const authStore = useAuthStore()
          authStore.logout()
          
          // Redirect to login page
          router.push({ name: 'login', query: { expired: 'true' } })
        }
      }
      // Check for any other 401 errors
      else if (error.response.status === 401) {
        const authStore = useAuthStore()
        if (authStore.isAuthenticated) {
          authStore.logout()
          router.push({ name: 'login' })
        }
      }
    }
    
    return Promise.reject(error)
  }
)

// Request interceptor to add token to requests
axios.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default axios

