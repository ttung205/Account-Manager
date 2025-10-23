/**
 * Secure storage utilities for sensitive data
 * Implements memory protection and auto-timeout for master password
 */

class SecureStorage {
  constructor() {
    this.data = new Map()
    this.timers = new Map()
    this.defaultTimeout = 15 * 60 * 1000 // 15 minutes
  }

  /**
   * Store sensitive data with auto-timeout
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @param {number} timeout - Timeout in milliseconds
   */
  set(key, value, timeout = this.defaultTimeout) {
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
    }

    // Store the value
    this.data.set(key, value)

    // Set auto-clear timer
    const timer = setTimeout(() => {
      this.delete(key)
      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('secureStorageTimeout', { 
        detail: { key } 
      }))
    }, timeout)

    this.timers.set(key, timer)
  }

  /**
   * Get stored value
   * @param {string} key - Storage key
   * @returns {any} - Stored value or null
   */
  get(key) {
    return this.data.get(key) || null
  }

  /**
   * Check if key exists
   * @param {string} key - Storage key
   * @returns {boolean}
   */
  has(key) {
    return this.data.has(key)
  }

  /**
   * Delete stored value and clear timer
   * @param {string} key - Storage key
   */
  delete(key) {
    // Clear timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
      this.timers.delete(key)
    }

    // Clear data
    if (this.data.has(key)) {
      // Overwrite with random data before deletion (basic protection)
      const value = this.data.get(key)
      if (typeof value === 'string') {
        this.data.set(key, crypto.getRandomValues(new Uint8Array(value.length)).join(''))
      }
      this.data.delete(key)
    }
  }

  /**
   * Clear all stored data
   */
  clear() {
    for (const key of this.data.keys()) {
      this.delete(key)
    }
  }

  /**
   * Extend timeout for a key
   * @param {string} key - Storage key
   * @param {number} timeout - New timeout in milliseconds
   */
  extendTimeout(key, timeout = this.defaultTimeout) {
    if (this.data.has(key)) {
      const value = this.data.get(key)
      this.set(key, value, timeout)
    }
  }
}

// Global secure storage instance
export const secureStorage = new SecureStorage()

/**
 * Master password manager with enhanced security
 */
export class MasterPasswordManager {
  constructor() {
    this.keyDerivationCache = new Map()
    this.setupEventListeners()
  }

  setupEventListeners() {
    // Clear on page unload
    window.addEventListener('beforeunload', () => {
      this.clear()
    })

    // Clear on visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Reduce timeout when tab is hidden
        if (secureStorage.has('masterPassword')) {
          secureStorage.extendTimeout('masterPassword', 5 * 60 * 1000) // 5 minutes
        }
      }
    })

    // Handle secure storage timeout
    window.addEventListener('secureStorageTimeout', (event) => {
      if (event.detail.key === 'masterPassword') {
        this.onTimeout()
      }
    })
  }

  /**
   * Validate master password strength
   * @param {string} password - Password to validate
   * @returns {Object} - Validation result
   */
  validateStrength(password) {
    const errors = []
    const warnings = []

    if (password.length < 12) {
      errors.push('Master password must be at least 12 characters long')
    }

    if (password.length < 16) {
      warnings.push('Consider using at least 16 characters for better security')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Must contain lowercase letters')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Must contain uppercase letters')
    }

    if (!/\d/.test(password)) {
      errors.push('Must contain numbers')
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      warnings.push('Consider adding special characters for better security')
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      warnings.push('Avoid repeating characters')
    }

    if (/123|abc|qwe|password|admin/i.test(password)) {
      errors.push('Avoid common words and patterns')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      strength: this.calculateStrength(password)
    }
  }

  /**
   * Calculate password strength (0-100)
   * @param {string} password - Password to analyze
   * @returns {number} - Strength score
   */
  calculateStrength(password) {
    let score = 0

    // Length bonus
    score += Math.min(password.length * 2, 50)

    // Character variety
    if (/[a-z]/.test(password)) score += 5
    if (/[A-Z]/.test(password)) score += 5
    if (/\d/.test(password)) score += 5
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 10

    // Entropy bonus
    const uniqueChars = new Set(password).size
    score += Math.min(uniqueChars * 2, 20)

    // Penalty for patterns
    if (/(.)\1{2,}/.test(password)) score -= 10
    if (/123|abc|qwe|password|admin/i.test(password)) score -= 20

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Set master password with validation
   * @param {string} password - Master password
   * @param {boolean} skipValidation - Skip strength validation
   * @returns {Promise<Object>} - Result object
   */
  async setMasterPassword(password, skipValidation = false) {
    if (!skipValidation) {
      const validation = this.validateStrength(password)
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        }
      }
    }

    // If this is not setup mode, verify the password first
    if (skipValidation) {
      const isValid = await this.verifyMasterPassword(password)
      if (!isValid) {
        return {
          success: false,
          errors: ['Invalid master password']
        }
      }
    } else {
      // Setup mode - create verification data
      await this.createVerificationData(password)
    }

    // Store with timeout
    secureStorage.set('masterPassword', password, 15 * 60 * 1000) // 15 minutes

    // Clear key derivation cache
    this.keyDerivationCache.clear()

    return { success: true }
  }

  /**
   * Get master password
   * @returns {string|null} - Master password or null
   */
  getMasterPassword() {
    return secureStorage.get('masterPassword')
  }

  /**
   * Check if master password is set
   * @returns {boolean}
   */
  hasMasterPassword() {
    return secureStorage.has('masterPassword')
  }

  /**
   * Clear master password
   */
  clear() {
    secureStorage.delete('masterPassword')
    this.keyDerivationCache.clear()
  }

  /**
   * Extend master password timeout
   * @param {number} minutes - Minutes to extend
   */
  extendTimeout(minutes = 15) {
    secureStorage.extendTimeout('masterPassword', minutes * 60 * 1000)
  }

  /**
   * Handle timeout event
   */
  onTimeout() {
    // Clear derived keys
    this.keyDerivationCache.clear()
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('masterPasswordTimeout'))
  }

  /**
   * Create verification data for master password
   * @param {string} password - Master password
   */
  async createVerificationData(password) {
    try {
      // Create a test string to encrypt
      const testData = 'MASTER_PASSWORD_VERIFICATION_TEST_' + Date.now()
      
      // Generate salt and IV for verification
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const iv = crypto.getRandomValues(new Uint8Array(12))
      
      // Derive key
      const encoder = new TextEncoder()
      const passwordBuffer = encoder.encode(password)
      
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      )
      
      const key = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 1000000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      )
      
      // Encrypt test data
      const testDataBuffer = encoder.encode(testData)
      const ciphertext = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        testDataBuffer
      )
      
      // Create hash of the test data for verification
      // SECURITY FIX: Only store the hash, NOT the plaintext
      const testDataHash = await window.crypto.subtle.digest(
        'SHA-256',
        testDataBuffer
      )
      
      // Store verification data in localStorage
      const verificationData = {
        salt: Array.from(salt),
        iv: Array.from(iv),
        ciphertext: Array.from(new Uint8Array(ciphertext)),
        testDataHash: Array.from(new Uint8Array(testDataHash)) // Store hash instead of plaintext
      }
      
      localStorage.setItem('masterPasswordVerification', JSON.stringify(verificationData))
      
    } catch (err) {
      console.error('Failed to create verification data:', err)
      throw new Error('Failed to setup master password verification')
    }
  }

  /**
   * Verify master password against stored verification data
   * @param {string} password - Password to verify
   * @returns {Promise<boolean>} - True if password is correct
   */
  async verifyMasterPassword(password) {
    try {
      const verificationDataStr = localStorage.getItem('masterPasswordVerification')
      if (!verificationDataStr) {
        // No verification data exists, this might be first time setup
        return false
      }
      
      const verificationData = JSON.parse(verificationDataStr)
      const salt = new Uint8Array(verificationData.salt)
      const iv = new Uint8Array(verificationData.iv)
      const ciphertext = new Uint8Array(verificationData.ciphertext)
      
      // SECURITY FIX: Support both old format (testData) and new format (testDataHash)
      // This ensures backward compatibility during migration
      const expectedTestDataHash = verificationData.testDataHash 
        ? new Uint8Array(verificationData.testDataHash)
        : null
      const expectedTestDataLegacy = verificationData.testData // For backward compatibility
      
      // Derive key with provided password
      const encoder = new TextEncoder()
      const passwordBuffer = encoder.encode(password)
      
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      )
      
      const key = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 1000000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      )
      
      // Try to decrypt
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        ciphertext
      )
      
      // Hash the decrypted data
      const decryptedDataHash = await window.crypto.subtle.digest(
        'SHA-256',
        decryptedBuffer
      )
      
      // Check if decrypted data hash matches expected hash
      if (expectedTestDataHash) {
        // New secure method: compare hashes
        const decryptedHashArray = Array.from(new Uint8Array(decryptedDataHash))
        const expectedHashArray = Array.from(expectedTestDataHash)
        
        return decryptedHashArray.length === expectedHashArray.length &&
               decryptedHashArray.every((byte, index) => byte === expectedHashArray[index])
      } else if (expectedTestDataLegacy) {
        // Legacy method for backward compatibility (will be removed in future)
        const decoder = new TextDecoder()
        const decryptedData = decoder.decode(decryptedBuffer)
        return decryptedData === expectedTestDataLegacy
      }
      
      return false
      
    } catch {
      // Decryption failed, password is incorrect
      return false
    }
  }

  /**
   * Check if master password verification data exists
   * @returns {boolean} - True if verification data exists
   */
  hasVerificationData() {
    return !!localStorage.getItem('masterPasswordVerification')
  }

  /**
   * Clear verification data (use with caution)
   */
  clearVerificationData() {
    localStorage.removeItem('masterPasswordVerification')
  }

  /**
   * Get or derive encryption key with caching
   * @param {Uint8Array} salt - Salt for key derivation
   * @returns {Promise<CryptoKey>} - Derived key
   */
  async getDerivedKey(salt) {
    const password = this.getMasterPassword()
    if (!password) {
      throw new Error('Master password not available')
    }

    const saltKey = Array.from(salt).join(',')
    
    // Check cache first
    if (this.keyDerivationCache.has(saltKey)) {
      return this.keyDerivationCache.get(saltKey)
    }

    // Derive key with enhanced parameters
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password)

    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    // Use higher iteration count for better security
    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 1000000, // 1M iterations (increased from 600k)
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )

    // Cache the derived key
    this.keyDerivationCache.set(saltKey, key)

    return key
  }
}

// Global master password manager instance
export const masterPasswordManager = new MasterPasswordManager()
