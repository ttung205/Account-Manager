import { defineStore } from 'pinia'
import axios from 'axios'
import { secureStorage } from '@/utils/secureStorage'

export const useMasterPasswordStore = defineStore('masterPassword', {
  state: () => ({
    isLoading: false,
    error: null,
    hasMasterPassword: false,
    isVerified: localStorage.getItem('masterPasswordVerified') === 'true',
    verifiedAt: localStorage.getItem('masterPasswordVerifiedAt') ? new Date(localStorage.getItem('masterPasswordVerifiedAt')) : null
  }),

  getters: {
    // Check if master password is set and verified
    isUnlocked: (state) => state.isVerified,
    
    // Get master password from secure storage or localStorage
    getMasterPassword: () => {
      const memoryPassword = secureStorage.get('masterPassword')
      if (memoryPassword) return memoryPassword
      
      // Try to get from localStorage (base64 encoded for minimal obfuscation)
      const storedPassword = localStorage.getItem('mp')
      if (storedPassword) {
        try {
          return atob(storedPassword)
        } catch (e) {
          return null
        }
      }
      return null
    }
  },

  actions: {
    /**
     * Check if user has master password set on server
     */
    async checkStatus() {
      this.isLoading = true
      this.error = null

      try {
        const response = await axios.get('/api/master-password/status')
        
        if (response.data.success) {
          this.hasMasterPassword = response.data.data.has_master_password
          return { success: true, hasMasterPassword: this.hasMasterPassword }
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to check master password status'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Create new master password
     */
    async createMasterPassword(password, confirmPassword) {
      this.isLoading = true
      this.error = null

      try {
        const response = await axios.post('/api/master-password/create', {
          password: password,
          password_confirmation: confirmPassword
        })

        if (response.data.success) {
          this.hasMasterPassword = true
          this.isVerified = true
          this.verifiedAt = new Date()
          
          // Store in both secure memory and localStorage
          secureStorage.set('masterPassword', password, 15 * 60 * 1000) // 15 minutes
          localStorage.setItem('mp', btoa(password)) // Base64 encode for minimal obfuscation
          localStorage.setItem('masterPasswordVerified', 'true')
          localStorage.setItem('masterPasswordVerifiedAt', this.verifiedAt.toISOString())
          
          return { success: true, data: response.data.data }
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create master password'
        return { 
          success: false, 
          error: this.error,
          errors: error.response?.data?.errors 
        }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Verify master password
     */
    async verifyMasterPassword(password) {
      this.isLoading = true
      this.error = null

      try {
        const response = await axios.post('/api/master-password/verify', {
          password: password
        })

        if (response.data.success) {
          this.isVerified = true
          this.verifiedAt = new Date(response.data.data.verified_at)
          
          // Store in both secure memory and localStorage
          secureStorage.set('masterPassword', password, 15 * 60 * 1000) // 15 minutes
          localStorage.setItem('mp', btoa(password)) // Base64 encode for minimal obfuscation
          localStorage.setItem('masterPasswordVerified', 'true')
          localStorage.setItem('masterPasswordVerifiedAt', this.verifiedAt.toISOString())
          
          return { success: true, data: response.data.data }
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to verify master password'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Update master password
     */
    async updateMasterPassword(currentPassword, newPassword, confirmPassword) {
      this.isLoading = true
      this.error = null

      try {
        const response = await axios.put('/api/master-password/update', {
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword
        })

        if (response.data.success) {
          // Update stored password in both memory and localStorage
          secureStorage.set('masterPassword', newPassword, 15 * 60 * 1000)
          localStorage.setItem('mp', btoa(newPassword))
          
          return { success: true, data: response.data.data }
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update master password'
        return { 
          success: false, 
          error: this.error,
          errors: error.response?.data?.errors 
        }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Delete master password (dangerous)
     */
    async deleteMasterPassword(password) {
      this.isLoading = true
      this.error = null

      try {
        const response = await axios.delete('/api/master-password/delete', {
          data: {
            password: password,
            confirmation: 'DELETE_MASTER_PASSWORD'
          }
        })

        if (response.data.success) {
          this.hasMasterPassword = false
          this.isVerified = false
          this.verifiedAt = null
          
          // Clear from both memory and localStorage
          secureStorage.delete('masterPassword')
          localStorage.removeItem('mp')
          localStorage.removeItem('masterPasswordVerified')
          localStorage.removeItem('masterPasswordVerifiedAt')
          
          return { success: true }
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete master password'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Clear master password from memory (logout/timeout)
     */
    clearMasterPassword() {
      this.isVerified = false
      this.verifiedAt = null
      secureStorage.delete('masterPassword')
      localStorage.removeItem('mp')
      localStorage.removeItem('masterPasswordVerified')
      localStorage.removeItem('masterPasswordVerifiedAt')
    },

    /**
     * Extend master password timeout
     */
    extendTimeout(minutes = 15) {
      const currentPassword = secureStorage.get('masterPassword')
      if (currentPassword) {
        secureStorage.set('masterPassword', currentPassword, minutes * 60 * 1000)
      }
    },

    /**
     * Initialize store (check status on app start)
     */
    async init() {
      await this.checkStatus()
      
      // Restore master password from localStorage if verified
      if (this.isVerified && !secureStorage.has('masterPassword')) {
        const storedPassword = localStorage.getItem('mp')
        if (storedPassword) {
          try {
            const password = atob(storedPassword)
            secureStorage.set('masterPassword', password, 15 * 60 * 1000)
          } catch (e) {
            console.error('Failed to restore master password:', e)
          }
        }
      }
      
      // Setup timeout listener
      window.addEventListener('secureStorageTimeout', (event) => {
        if (event.detail.key === 'masterPassword') {
          this.clearMasterPassword()
          window.dispatchEvent(new CustomEvent('masterPasswordTimeout'))
        }
      })
    }
  }
})
