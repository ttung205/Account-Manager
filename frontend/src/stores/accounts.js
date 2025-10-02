import { defineStore } from 'pinia'
import axios from 'axios'
import { encrypt, decrypt } from '@/utils/crypto'

export const useAccountsStore = defineStore('accounts', {
  state: () => ({
    accounts: [],
    statistics: {
      total: 0,
      favorites: 0,
      categories: {}
    },
    loading: false,
    error: null,
    masterPassword: null, // Stored in memory only during session
    categories: ['General', 'Social Media', 'Banking', 'Email', 'Work', 'Shopping', 'Entertainment']
  }),

  getters: {
    // Get accounts by category
    accountsByCategory: (state) => (category) => {
      if (!category || category === 'all') return state.accounts
      return state.accounts.filter(acc => acc.category === category)
    },

    // Get favorite accounts
    favoriteAccounts: (state) => {
      return state.accounts.filter(acc => acc.favorite)
    },

    // Get recently used accounts
    recentAccounts: (state) => {
      return [...state.accounts]
        .filter(acc => acc.last_used_at)
        .sort((a, b) => new Date(b.last_used_at) - new Date(a.last_used_at))
        .slice(0, 5)
    },

    // Search accounts
    searchAccounts: (state) => (query) => {
      if (!query) return state.accounts
      const lowerQuery = query.toLowerCase()
      return state.accounts.filter(acc =>
        acc.service_name.toLowerCase().includes(lowerQuery) ||
        acc.username.toLowerCase().includes(lowerQuery) ||
        (acc.website_url && acc.website_url.toLowerCase().includes(lowerQuery))
      )
    },

    // Check if master password is set
    hasMasterPassword: (state) => !!state.masterPassword
  },

  actions: {
    // Set master password for the session
    setMasterPassword(password) {
      this.masterPassword = password
    },

    // Clear master password (on logout or timeout)
    clearMasterPassword() {
      this.masterPassword = null
    },

    // Fetch all accounts
    async fetchAccounts() {
      if (!this.masterPassword) {
        throw new Error('Master password required')
      }

      this.loading = true
      this.error = null

      try {
        const response = await axios.get('/api/accounts')

        if (response.data.success) {
          // Decrypt passwords for display (keep encrypted in memory until needed)
          this.accounts = response.data.data.accounts.map(acc => ({
            ...acc,
            _encrypted_password: acc.encrypted_password, // Keep encrypted version
            decrypted: false // Flag to track decryption status
          }))

          return { success: true }
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch accounts'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    // Fetch account statistics
    async fetchStatistics() {
      try {
        const response = await axios.get('/api/accounts/statistics')

        if (response.data.success) {
          this.statistics = response.data.data
        }
      } catch (error) {
        console.error('Failed to fetch statistics:', error)
      }
    },

    // Create new account
    async createAccount(accountData) {
      if (!this.masterPassword) {
        throw new Error('Master password required')
      }

      this.loading = true
      this.error = null

      try {
        console.log('Creating account with data:', accountData)
        
        // Encrypt password before sending
        const encryptedPassword = await encrypt(accountData.password, this.masterPassword)
        console.log('Password encrypted:', encryptedPassword)

        // Encrypt note if provided
        let encryptedNote = null
        if (accountData.note) {
          encryptedNote = await encrypt(accountData.note, this.masterPassword)
        }

        const payload = {
          service_name: accountData.service_name,
          username: accountData.username,
          encrypted_password: JSON.stringify(encryptedPassword),
          encrypted_note: encryptedNote ? JSON.stringify(encryptedNote) : null,
          website_url: accountData.website_url || null,
          category: accountData.category || 'General',
          favorite: accountData.favorite || false
        }

        console.log('Sending payload:', payload)

        const response = await axios.post('/api/accounts', payload)
        console.log('Response from server:', response.data)

        if (response.data.success) {
          const newAccount = response.data.data.account
          console.log('New account created:', newAccount)
          
          this.accounts.push({
            ...newAccount,
            _encrypted_password: newAccount.encrypted_password,
            decrypted: false
          })

          await this.fetchStatistics()

          return { success: true, data: newAccount }
        } else {
          console.error('Response not successful:', response.data)
          return { success: false, error: 'Server returned unsuccessful response' }
        }
      } catch (error) {
        console.error('Error creating account:', error.response?.data)
        this.error = error.response?.data?.message || error.response?.data?.errors || 'Failed to create account'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    // Update account
    async updateAccount(id, accountData) {
      if (!this.masterPassword) {
        throw new Error('Master password required')
      }

      this.loading = true
      this.error = null

      try {
        const payload = { ...accountData }

        // Encrypt password if changed
        if (accountData.password) {
          const encryptedPassword = await encrypt(accountData.password, this.masterPassword)
          payload.encrypted_password = JSON.stringify(encryptedPassword)
          delete payload.password
        }

        // Encrypt note if provided
        if (accountData.note !== undefined) {
          if (accountData.note) {
            const encryptedNote = await encrypt(accountData.note, this.masterPassword)
            payload.encrypted_note = JSON.stringify(encryptedNote)
          } else {
            payload.encrypted_note = null
          }
          delete payload.note
        }

        const response = await axios.put(`/api/accounts/${id}`, payload)

        if (response.data.success) {
          const updatedAccount = response.data.data.account
          const index = this.accounts.findIndex(acc => acc.id === id)
          if (index !== -1) {
            this.accounts[index] = {
              ...updatedAccount,
              _encrypted_password: updatedAccount.encrypted_password,
              decrypted: false
            }
          }

          await this.fetchStatistics()

          return { success: true, data: updatedAccount }
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update account'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    // Delete account
    async deleteAccount(id) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.delete(`/api/accounts/${id}`)

        if (response.data.success) {
          this.accounts = this.accounts.filter(acc => acc.id !== id)
          await this.fetchStatistics()

          return { success: true }
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete account'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    // Decrypt and return password for an account
    async getDecryptedPassword(account) {
      if (!this.masterPassword) {
        throw new Error('Master password required')
      }

      try {
        const encryptedData = JSON.parse(account._encrypted_password)
        const password = await decrypt(encryptedData, this.masterPassword)
        return password
      } catch (error) {
        console.error('Decryption error:', error)
        throw new Error('Failed to decrypt password')
      }
    },

    // Decrypt and return note for an account
    async getDecryptedNote(account) {
      if (!this.masterPassword || !account.encrypted_note) {
        return null
      }

      try {
        const encryptedData = JSON.parse(account.encrypted_note)
        const note = await decrypt(encryptedData, this.masterPassword)
        return note
      } catch (error) {
        console.error('Decryption error:', error)
        return null
      }
    },

    // Mark account as used
    async markAsUsed(id) {
      try {
        await axios.post(`/api/accounts/${id}/mark-used`)
        const index = this.accounts.findIndex(acc => acc.id === id)
        if (index !== -1) {
          this.accounts[index].last_used_at = new Date().toISOString()
        }
      } catch (error) {
        console.error('Failed to mark as used:', error)
      }
    },

    // Toggle favorite
    async toggleFavorite(id) {
      const account = this.accounts.find(acc => acc.id === id)
      if (!account) return

      const result = await this.updateAccount(id, {
        favorite: !account.favorite
      })

      return result
    },

    // Copy password to clipboard
    async copyPassword(account, timeout = 30000) {
      try {
        const password = await this.getDecryptedPassword(account)
        
        await navigator.clipboard.writeText(password)
        
        // Auto-clear clipboard after timeout
        setTimeout(async () => {
          const currentClipboard = await navigator.clipboard.readText()
          if (currentClipboard === password) {
            await navigator.clipboard.writeText('')
          }
        }, timeout)

        // Mark as used
        await this.markAsUsed(account.id)

        return { success: true }
      } catch (error) {
        console.error('Failed to copy password:', error)
        return { success: false, error: error.message }
      }
    }
  }
})

