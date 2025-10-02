import { defineStore } from 'pinia'
import axios from 'axios'

// Configure axios defaults
axios.defaults.withCredentials = true
axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token'),
    isLoading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userData: (state) => state.user
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
          
          // Save to localStorage
          localStorage.setItem('token', this.token)
          this.setAuthHeader(this.token)
          
          return { success: true, data: response.data.data }
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Login failed'
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
          
          // Save to localStorage
          localStorage.setItem('token', this.token)
          this.setAuthHeader(this.token)
          
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
        localStorage.removeItem('token')
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
        await this.fetchUser()
      }
    }
  }
})
