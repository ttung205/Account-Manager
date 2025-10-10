/**
 * Client-side encryption utilities using Web Crypto API
 * Implements AES-GCM encryption for secure password storage
 */

/**
 * Derive encryption key from master password using PBKDF2
 * @param {string} masterPassword - User's master password
 * @param {Uint8Array} salt - Salt for key derivation
 * @returns {Promise<CryptoKey>} - Derived encryption key
 */
export async function deriveKey(masterPassword, salt) {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(masterPassword)

  // Import password as key material
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  // Derive key using PBKDF2 with 1,000,000 iterations (enhanced security)
  return await window.crypto.subtle.deriveKey(
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
}

/**
 * Generate random salt for key derivation
 * @returns {Uint8Array} - Random salt
 */
export function generateSalt() {
  return window.crypto.getRandomValues(new Uint8Array(16))
}

/**
 * Generate random IV for AES-GCM
 * @returns {Uint8Array} - Random IV
 */
export function generateIV() {
  return window.crypto.getRandomValues(new Uint8Array(12))
}

/**
 * Encrypt data using AES-GCM
 * @param {string} plaintext - Data to encrypt
 * @param {string} masterPassword - Master password
 * @returns {Promise<Object>} - Encrypted data with salt, iv, and ciphertext
 */
export async function encrypt(plaintext, masterPassword) {
  try {
    const salt = generateSalt()
    const iv = generateIV()
    const key = await deriveKey(masterPassword, salt)

    const encoder = new TextEncoder()
    const plaintextBuffer = encoder.encode(plaintext)

    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      plaintextBuffer
    )

    // Convert to base64 for storage
    return {
      salt: arrayBufferToBase64(salt),
      iv: arrayBufferToBase64(iv),
      ciphertext: arrayBufferToBase64(ciphertext)
    }
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt data using AES-GCM
 * @param {Object} encryptedData - Object containing salt, iv, and ciphertext
 * @param {string} masterPassword - Master password
 * @returns {Promise<string>} - Decrypted plaintext
 */
export async function decrypt(encryptedData, masterPassword) {
  try {
    const salt = base64ToArrayBuffer(encryptedData.salt)
    const iv = base64ToArrayBuffer(encryptedData.iv)
    const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext)

    const key = await deriveKey(masterPassword, salt)

    const plaintextBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      ciphertext
    )

    const decoder = new TextDecoder()
    return decoder.decode(plaintextBuffer)
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data. Invalid master password?')
  }
}

/**
 * Convert ArrayBuffer to Base64 string
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Convert Base64 string to ArrayBuffer
 * @param {string} base64
 * @returns {Uint8Array}
 */
function base64ToArrayBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Generate secure random password
 * @param {Object} options - Password generation options
 * @returns {string} - Generated password
 */
export function generatePassword(options = {}) {
  const {
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true
  } = options

  let charset = ''
  if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
  if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (includeNumbers) charset += '0123456789'
  if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'

  if (charset.length === 0) {
    throw new Error('At least one character type must be selected')
  }

  const password = Array.from(
    window.crypto.getRandomValues(new Uint32Array(length))
  )
    .map((x) => charset[x % charset.length])
    .join('')

  return password
}

/**
 * Calculate password strength (0-4)
 * @param {string} password
 * @returns {number} - Strength score (0: weak, 4: very strong)
 */
export function calculatePasswordStrength(password) {
  if (!password) return 0

  let score = 0

  // Length check
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++

  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z\d]/.test(password)) score++

  // Reduce score for common patterns
  if (/^[a-zA-Z]+$/.test(password)) score = Math.max(0, score - 1)
  if (/^[0-9]+$/.test(password)) score = Math.max(0, score - 1)
  if (/(.)\1{2,}/.test(password)) score = Math.max(0, score - 1)

  return Math.min(4, Math.max(0, score))
}

/**
 * Get password strength label and color
 * @param {number} strength - Strength score (0-4)
 * @returns {Object} - Label and color
 */
export function getPasswordStrengthInfo(strength) {
  const info = {
    0: { label: 'Rất yếu', color: 'red' },
    1: { label: 'Yếu', color: 'orange' },
    2: { label: 'Trung bình', color: 'yellow' },
    3: { label: 'Mạnh', color: 'blue' },
    4: { label: 'Rất mạnh', color: 'green' }
  }

  return info[strength] || info[0]
}

