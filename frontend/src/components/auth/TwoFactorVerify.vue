<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <div class="verification-icon">
          <i class="pi pi-shield" style="font-size: 4rem; color: #3b82f6;"></i>
        </div>
        <h1 class="auth-title">Xác thực 2 bước</h1>
        <p class="auth-subtitle">Nhập mã 6 chữ số từ Google Authenticator</p>
      </div>

      <form @submit.prevent="handleVerify" class="auth-form">
        <div class="field">
          <label class="block text-sm mb-3 font-medium text-gray-700 text-center">
            Mã xác thực
          </label>
          <div class="otp-input-group">
            <InputText
              v-for="(_, index) in 6"
              :key="index"
              :ref="el => otpInputs[index] = el"
              v-model="otpDigits[index]"
              type="text"
              maxlength="1"
              class="otp-input"
              inputmode="numeric"
              @input="handleInput(index, $event)"
              @keydown="handleKeydown(index, $event)"
              @paste="handlePaste($event)"
            />
          </div>
          <small v-if="error" class="error-message">{{ error }}</small>
        </div>

        <Button
          type="submit"
          label="Xác thực"
          class="w-full text-base"
          :loading="isLoading"
          :disabled="isLoading || otpCode.length !== 6"
        />
      </form>

      <div class="auth-link mt-6">
        <router-link to="/login" class="flex items-center justify-center">
          <i class="pi pi-arrow-left mr-2"></i>
          Quay lại đăng nhập
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

const router = useRouter()
const authStore = useAuthStore()

const otpDigits = ref(['', '', '', '', '', ''])
const otpInputs = ref([])
const isLoading = ref(false)
const error = ref('')

const otpCode = computed(() => otpDigits.value.join(''))

onMounted(() => {
  // Check if user needs 2FA verification
  if (!authStore.token || !authStore.requires2FA) {
    router.push('/login')
    return
  }
  
  // Focus first input
  if (otpInputs.value[0]) {
    otpInputs.value[0].$el.focus()
  }
})

const handleInput = (index, event) => {
  const value = event.target.value
  
  // Only allow numbers
  otpDigits.value[index] = value.replace(/[^0-9]/g, '')
  
  // Auto-focus next input
  if (otpDigits.value[index] && index < 5) {
    otpInputs.value[index + 1].$el.focus()
  }
  
  // Auto-submit when all 6 digits are entered
  if (otpCode.value.length === 6) {
    setTimeout(() => {
      handleVerify()
    }, 300)
  }
}

const handleKeydown = (index, event) => {
  // Backspace: clear current and move to previous
  if (event.key === 'Backspace') {
    if (!otpDigits.value[index] && index > 0) {
      otpDigits.value[index - 1] = ''
      otpInputs.value[index - 1].$el.focus()
    }
  }
  
  // Arrow left
  if (event.key === 'ArrowLeft' && index > 0) {
    otpInputs.value[index - 1].$el.focus()
  }
  
  // Arrow right
  if (event.key === 'ArrowRight' && index < 5) {
    otpInputs.value[index + 1].$el.focus()
  }
}

const handlePaste = (event) => {
  event.preventDefault()
  const pastedData = event.clipboardData.getData('text').trim()
  const digits = pastedData.replace(/[^0-9]/g, '').slice(0, 6)
  
  if (digits.length > 0) {
    digits.split('').forEach((digit, i) => {
      if (i < 6) {
        otpDigits.value[i] = digit
      }
    })
    
    // Focus on next empty input or last input
    const nextIndex = Math.min(digits.length, 5)
    otpInputs.value[nextIndex].$el.focus()
  }
}

const handleVerify = async () => {
  if (otpCode.value.length !== 6) {
    error.value = 'Vui lòng nhập đủ 6 chữ số'
    return
  }
  
  isLoading.value = true
  error.value = ''
  
  const result = await authStore.verify2FA(otpCode.value)
  
  if (result.success) {
    router.push('/dashboard')
  } else {
    error.value = result.error || 'Mã xác thực không đúng'
    // Clear inputs
    otpDigits.value = ['', '', '', '', '', '']
    if (otpInputs.value[0]) {
      otpInputs.value[0].$el.focus()
    }
  }
  
  isLoading.value = false
}
</script>

<style scoped>
.verification-icon {
  text-align: center;
  margin-bottom: 1.5rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.info-box {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  color: #1e40af;
  font-size: 0.875rem;
}

.otp-input-group {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.otp-input {
  width: 3rem;
  height: 3.75rem;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  border: 2px solid #e5e7eb !important;
  border-radius: 0.5rem;
  transition: all 0.3s;
}

.otp-input:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  transform: scale(1.05);
}

.otp-input:not(:placeholder-shown) {
  border-color: #3b82f6 !important;
  background: #eff6ff;
}

@media (max-width: 640px) {
  .otp-input {
    width: 2.5rem;
    height: 3rem;
    font-size: 1.25rem;
  }
  
  .otp-input-group {
    gap: 0.5rem;
  }
}
</style>

