import { defineStore } from 'pinia'
import axios from '../utils/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token'),
    isLoading: false,
    error: null,
    requires2FA: localStorage.getItem('requires2FA') === 'true',
    twoFactorVerified: localStorage.getItem('twoFactorVerified') === 'true',
    loginTime: localStorage.getItem('loginTime') ? parseInt(localStorage.getItem('loginTime')) : null,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes in milliseconds
    sessionCheckInterval: null
  }),

  getters: {
    isAuthenticated: (state) => {
      if (!state.token || !state.twoFactorVerified) return false
      
      // Check if session is expired (30 minutes)
      if (state.loginTime) {
        const now = Date.now()
        const elapsed = now - state.loginTime
        if (elapsed > state.sessionTimeout) {
          return false
        }
      }
      
      return true
    },
    userData: (state) => state.user,
    timeRemaining: (state) => {
      if (!state.loginTime) return 0
      const now = Date.now()
      const elapsed = now - state.loginTime
      const remaining = state.sessionTimeout - elapsed
      return remaining > 0 ? Math.ceil(remaining / 1000) : 0 // in seconds
    }
  },

  actions: {
    // Set axios default header
    setAuthHeader(token) {
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } else {
        delete axios.defaults.headers.common['Authorization']
      }
    },

    // Login
    async login(credentials) {
      this.isLoading = true
      this.error = null

      try {
        // Get CSRF cookie first
        await axios.get('/sanctum/csrf-cookie')
        
        const response = await axios.post('/api/login', credentials, {
          withCredentials: true
        })
        
        if (response.data.success) {
          this.user = response.data.data.user
          this.token = response.data.data.token
          this.requires2FA = response.data.data.requires_2fa
          this.twoFactorVerified = response.data.data.two_factor_verified
          this.loginTime = Date.now()
          
          // Save to localStorage
          localStorage.setItem('token', this.token)
          localStorage.setItem('requires2FA', this.requires2FA)
          localStorage.setItem('twoFactorVerified', this.twoFactorVerified)
          localStorage.setItem('loginTime', this.loginTime.toString())
          this.setAuthHeader(this.token)
          
          // Start session check if not requiring 2FA
          if (this.twoFactorVerified) {
            this.startSessionCheck()
          }
          
          return { success: true, data: response.data.data }
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Login failed'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Verify 2FA
    async verify2FA(code) {
      this.isLoading = true
      this.error = null

      try {
        const response = await axios.post('/api/verify-2fa', { code })
        
        if (response.data.success) {
          this.twoFactorVerified = true
          this.requires2FA = false
          
          // Save to localStorage
          localStorage.setItem('twoFactorVerified', true)
          localStorage.setItem('requires2FA', false)
          
          // Start session check after 2FA verification
          this.startSessionCheck()
          
          return { success: true }
        }
      } catch (error) {
        this.error = error.response?.data?.message || '2FA verification failed'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Register
    async register(userData) {
      this.isLoading = true
      this.error = null

      try {
        // Get CSRF cookie first
        await axios.get('/sanctum/csrf-cookie')
        
        const response = await axios.post('/api/register', userData, {
          withCredentials: true
        })
        
        if (response.data.success) {
          this.user = response.data.data.user
          this.token = response.data.data.token
          this.twoFactorVerified = true
          this.requires2FA = false
          this.loginTime = Date.now()
          
          // Save to localStorage
          localStorage.setItem('token', this.token)
          localStorage.setItem('twoFactorVerified', true)
          localStorage.setItem('requires2FA', false)
          localStorage.setItem('loginTime', this.loginTime.toString())
          this.setAuthHeader(this.token)
          
          // Start session check
          this.startSessionCheck()
          
          return { success: true, data: response.data.data }
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Registration failed'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Logout
    async logout() {
      try {
        if (this.token) {
          await axios.post('/api/logout')
        }
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.user = null
        this.token = null
        this.requires2FA = false
        this.twoFactorVerified = false
        this.loginTime = null
        
        // Clear session check interval
        if (this.sessionCheckInterval) {
          clearInterval(this.sessionCheckInterval)
          this.sessionCheckInterval = null
        }
        
        localStorage.removeItem('token')
        localStorage.removeItem('requires2FA')
        localStorage.removeItem('twoFactorVerified')
        localStorage.removeItem('loginTime')
        this.setAuthHeader(null)
        
        // Clear master password from memory (but keep in database)
        const { useMasterPasswordStore } = await import('./masterPassword')
        const masterPasswordStore = useMasterPasswordStore()
        masterPasswordStore.clearMasterPassword()
      }
    },

    // Get user info
    async fetchUser() {
      if (!this.token) return

      try {
        this.setAuthHeader(this.token)
        const response = await axios.get('/api/user')
        
        if (response.data.success) {
          this.user = response.data.data.user
        }
      } catch (error) {
        console.error('Fetch user error:', error)
        this.logout()
      }
    },

    // Initialize auth state
    async init() {
      if (this.token) {
        this.setAuthHeader(this.token)
        
        // Check if session is already expired
        if (!this.isAuthenticated) {
          await this.logout()
          return
        }
        
        await this.fetchUser()
        
        // Start session check timer
        this.startSessionCheck()
      }
    },

    // Check session expiration periodically
    startSessionCheck() {
      // Clear any existing interval
      if (this.sessionCheckInterval) {
        clearInterval(this.sessionCheckInterval)
      }
      
      // Check every minute
      this.sessionCheckInterval = setInterval(() => {
        if (!this.isAuthenticated && this.token) {
          clearInterval(this.sessionCheckInterval)
          alert('Phiên đăng nhập đã hết hạn (30 phút). Vui lòng đăng nhập lại.')
          this.logout()
          
          // Import router dynamically to avoid circular dependency
          import('../router').then(({ default: router }) => {
            router.push({ name: 'login', query: { expired: 'true' } })
          })
        }
      }, 60000) // Check every minute
    }
  }
})
