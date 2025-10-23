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
    // IMPORTANT: Must check BOTH isVerified flag AND actual password in memory
    // because password is stored only in RAM and will be lost on page reload
    isUnlocked: (state) => {
      return state.isVerified && secureStorage.get('masterPassword') !== null
    },
    
    // SECURITY FIX: Get master password ONLY from secure memory storage
    // Never store master password in localStorage (even base64 encoded)
    getMasterPassword: () => {
      return secureStorage.get('masterPassword')
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
        this.error = error.response?.data?.message || 'Không thể kiểm tra trạng thái master password'
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
          
          // SECURITY FIX: Store ONLY in secure memory, NOT in localStorage
          secureStorage.set('masterPassword', password, 15 * 60 * 1000) // 15 minutes
          localStorage.setItem('masterPasswordVerified', 'true')
          localStorage.setItem('masterPasswordVerifiedAt', this.verifiedAt.toISOString())
          
          return { success: true, data: response.data.data }
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Không thể tạo master password'
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
          
          // SECURITY FIX: Store ONLY in secure memory, NOT in localStorage
          secureStorage.set('masterPassword', password, 15 * 60 * 1000) // 15 minutes
          localStorage.setItem('masterPasswordVerified', 'true')
          localStorage.setItem('masterPasswordVerifiedAt', this.verifiedAt.toISOString())
          
          return { success: true, data: response.data.data }
        }
      } catch (error) {
        // Clear master password from storage on verification failure
        this.clearMasterPassword()
        
        this.error = error.response?.data?.message || 'Không thể xác thực master password'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Update master password
     * This will also re-encrypt all account passwords with the new master password
     */
    async updateMasterPassword(currentPassword, newPassword, confirmPassword) {
      this.isLoading = true
      this.error = null

      try {
        // Import accounts store to get all accounts
        const { useAccountsStore } = await import('./accounts')
        const accountsStore = useAccountsStore()
        
        // Import crypto utilities
        const { decrypt, encrypt } = await import('../utils/crypto')
        
        // Get all accounts
        await accountsStore.fetchAccounts()
        const accounts = accountsStore.accounts
        
        // Re-encrypt all passwords
        const reEncryptedPasswords = []
        
        for (const account of accounts) {
          // Use _encrypted_password which is the stored encrypted version
          const encryptedPasswordField = account._encrypted_password || account.encrypted_password
          
          if (encryptedPasswordField) {
            try {
              // Decrypt with current (old) password
              const decryptedPassword = await decrypt(
                JSON.parse(encryptedPasswordField),
                currentPassword
              )
              
              // Encrypt with new password
              const newEncryptedPassword = await encrypt(decryptedPassword, newPassword)
              
              reEncryptedPasswords.push({
                account_id: account.id,
                encrypted_password: JSON.stringify(newEncryptedPassword)
              })
            } catch (error) {
              // If we can't decrypt with current password, it means the current password is wrong
              throw new Error('Không thể giải mã mật khẩu với master password hiện tại. Vui lòng kiểm tra lại.')
            }
          }
        }
        
        // Update master password with re-encrypted passwords
        const response = await axios.put('/api/master-password/update', {
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
          re_encrypted_passwords: reEncryptedPasswords
        })

        if (response.data.success) {
          // Clear ALL storage and state to prevent any sync issues
          secureStorage.clear()
          
          // Clear localStorage master password data (but keep auth token)
          localStorage.removeItem('masterPasswordVerified')
          localStorage.removeItem('masterPasswordVerifiedAt')
          
          // Clear accounts cache
          accountsStore.accounts = []
          
          // Reset master password store state
          this.isVerified = false
          this.verifiedAt = null
          
          // Reload page to ensure everything is fresh and user re-enters new master password
          // This is the safest approach to avoid any cache/timing issues
          setTimeout(() => {
            window.location.reload()
          }, 500)
          
          return { 
            success: true, 
            data: response.data.data,
            reEncryptedCount: reEncryptedPasswords.length,
            willReload: true
          }
        }
      } catch (error) {
        // Clear master password from storage on update failure
        this.clearMasterPassword()
        
        this.error = error.response?.data?.message || error.message || 'Không thể cập nhật master password'
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
     * Change master password (alias for updateMasterPassword)
     */
    async changeMasterPassword(currentPassword, newPassword, confirmPassword) {
      const result = await this.updateMasterPassword(currentPassword, newPassword, confirmPassword)
      
      if (result.success) {
        return {
          success: true,
          message: `Master password đã được thay đổi thành công. ${result.reEncryptedCount} mật khẩu đã được mã hóa lại.`,
          data: result.data
        }
      }
      
      return result
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
          
          // Clear from memory storage
          secureStorage.delete('masterPassword')
          localStorage.removeItem('masterPasswordVerified')
          localStorage.removeItem('masterPasswordVerifiedAt')
          
          return { success: true }
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Không thể xóa master password'
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
      
      // SECURITY FIX: Clean up any legacy master password stored in localStorage
      // This removes the insecure Base64 encoded password from previous versions
      const legacyPassword = localStorage.getItem('mp')
      if (legacyPassword) {
        console.warn('Removing legacy insecure master password from localStorage')
        localStorage.removeItem('mp')
        
        // If user was verified, they'll need to re-enter master password
        // This is safer than migrating the insecure storage
        if (this.isVerified) {
          this.clearMasterPassword()
        }
      }
      
      // IMPORTANT: If isVerified flag is true but password is not in memory (e.g. after page reload),
      // clear the verified flag to force re-authentication
      // This is expected behavior because we store password only in RAM for security
      if (this.isVerified && !secureStorage.get('masterPassword')) {
        console.log('Master password session expired (page reload). Please re-enter your master password.')
        this.clearMasterPassword()
        
        // Dispatch event so UI can show a friendly message
        window.dispatchEvent(new CustomEvent('masterPasswordSessionExpired', {
          detail: { reason: 'page_reload' }
        }))
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
