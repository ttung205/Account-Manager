<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :header="dialogTitle"
    :style="{ width: '600px' }"
    :closable="true"
    @hide="handleClose"
  >
    <div v-if="loading" class="text-center py-4">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      <p class="mt-3">Đang tải...</p>
    </div>

    <div v-else>
      <!-- Khi chưa bật 2FA -->
      <div v-if="!twoFactorStatus.enabled && !setupData">
        <div class="mb-4">
          <p class="text-lg mb-3">
            Xác thực hai yếu tố (2FA) giúp bảo vệ tài khoản của bạn khỏi truy cập trái phép.
          </p>
          <ul class="list-disc pl-5 space-y-2">
            <li>Tăng cường bảo mật tài khoản</li>
            <li>Yêu cầu mã xác thực từ điện thoại khi đăng nhập</li>
            <li>Bạn sẽ nhận được các mã khôi phục dự phòng</li>
          </ul>
        </div>
        <div class="flex justify-end">
          <Button label="Kích hoạt 2FA" icon="pi pi-shield" @click="initSetup" :loading="processing" />
        </div>
      </div>

      <!-- Quá trình thiết lập 2FA -->
      <div v-else-if="!twoFactorStatus.enabled && setupData">
        <div class="space-y-4">
          <!-- Bước 1: Quét QR Code -->
          <div class="border rounded-lg p-4">
            <h3 class="text-lg font-semibold mb-3 flex items-center">
              <span class="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">1</span>
              Quét mã QR
            </h3>
            <p class="text-gray-600 mb-3">
              Sử dụng Google Authenticator hoặc Authy để quét mã QR này:
            </p>
            <div class="flex justify-center my-4">
              <canvas ref="qrcodeCanvas" class="border-2 border-gray-300 rounded"></canvas>
            </div>
            <div class="bg-gray-50 p-3 rounded">
              <p class="text-sm text-gray-600 mb-1">Hoặc nhập mã thủ công:</p>
              <div class="flex items-center gap-2">
                <code class="bg-white px-3 py-2 rounded border flex-1 font-mono text-sm">
                  {{ setupData.secret }}
                </code>
                <Button
                  icon="pi pi-copy"
                  size="small"
                  text
                  @click="copySecret"
                  v-tooltip.top="'Sao chép'"
                />
              </div>
            </div>
          </div>

          <!-- Bước 2: Xác thực -->
          <div class="border rounded-lg p-4">
            <h3 class="text-lg font-semibold mb-3 flex items-center">
              <span class="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">2</span>
              Xác thực mã OTP
            </h3>
            <p class="text-gray-600 mb-4">
              Nhập mã 6 chữ số từ ứng dụng authenticator:
            </p>
            <div class="otp-input-group">
              <InputText
                v-for="(_, index) in 6"
                :key="'verify-' + index"
                :ref="el => verifyOtpInputs[index] = el"
                v-model="verifyOtpDigits[index]"
                type="text"
                maxlength="1"
                class="otp-input"
                inputmode="numeric"
                @input="handleVerifyInput(index, $event)"
                @keydown="handleVerifyKeydown(index, $event)"
                @paste="handleVerifyPaste($event)"
                :disabled="processing"
              />
            </div>
            <div class="mt-4">
              <Button
                label="Xác nhận"
                icon="pi pi-check"
                @click="enableTwoFactor"
                :loading="processing"
                :disabled="verificationCode.length !== 6"
                class="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Khi đã bật 2FA - hiển thị recovery codes -->
      <div v-else-if="twoFactorStatus.enabled && recoveryCodes.length > 0">
        <div class="mb-4">
          <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div class="flex">
              <i class="pi pi-exclamation-triangle text-yellow-400 mr-2"></i>
              <div>
                <p class="font-semibold">Lưu các mã khôi phục này!</p>
                <p class="text-sm">
                  Các mã này cho phép bạn truy cập tài khoản nếu mất thiết bị xác thực.
                  Mỗi mã chỉ có thể sử dụng một lần.
                </p>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex justify-between items-center mb-3">
              <h4 class="font-semibold">Mã khôi phục của bạn:</h4>
              <Button
                label="Sao chép tất cả"
                icon="pi pi-copy"
                size="small"
                text
                @click="copyRecoveryCodes"
              />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <code
                v-for="(code, index) in recoveryCodes"
                :key="index"
                class="bg-white px-3 py-2 rounded border font-mono text-sm"
              >
                {{ code }}
              </code>
            </div>
          </div>
        </div>
        <div class="flex justify-end">
          <Button label="Đóng" @click="handleClose" />
        </div>
      </div>

      <!-- Khi đã bật 2FA - trạng thái thông thường -->
      <div v-else-if="twoFactorStatus.enabled">
        <div class="mb-4">
          <div class="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
            <div class="flex items-center">
              <i class="pi pi-check-circle text-green-400 text-xl mr-2"></i>
              <div>
                <p class="font-semibold">Xác thực hai yếu tố đã được kích hoạt</p>
                <p class="text-sm">
                  Tài khoản của bạn được bảo vệ bởi xác thực hai yếu tố.
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p class="font-medium">Trạng thái</p>
                <p class="text-sm text-gray-600">Đã kích hoạt</p>
              </div>
              <i class="pi pi-shield text-green-500 text-2xl"></i>
            </div>

            <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p class="font-medium">Ngày kích hoạt</p>
                <p class="text-sm text-gray-600">
                  {{ formatDate(twoFactorStatus.enabled_at) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Form tắt 2FA -->
        <div class="border-t pt-4">
          <h4 class="font-semibold mb-3">Tắt xác thực hai yếu tố</h4>
          <p class="text-sm text-gray-600 mb-4">
            Nhập mã OTP từ ứng dụng authenticator để tắt 2FA:
          </p>
          <div class="otp-input-group">
            <InputText
              v-for="(_, index) in 6"
              :key="'disable-' + index"
              :ref="el => disableOtpInputs[index] = el"
              v-model="disableOtpDigits[index]"
              type="text"
              maxlength="1"
              class="otp-input"
              inputmode="numeric"
              @input="handleDisableInput(index, $event)"
              @keydown="handleDisableKeydown(index, $event)"
              @paste="handleDisablePaste($event)"
              :disabled="processing"
            />
          </div>
          <div class="mt-4">
            <Button
              label="Tắt 2FA"
              severity="danger"
              icon="pi pi-times"
              @click="disableTwoFactor"
              :loading="processing"
              :disabled="disableCode.length !== 6"
              class="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'
import axios from 'axios'
import QRCode from 'qrcode'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'updated'])

const toast = useToast()
const isVisible = ref(props.visible)
const loading = ref(false)
const processing = ref(false)
const twoFactorStatus = ref({
  enabled: false,
  enabled_at: null
})
const setupData = ref(null)
const verificationCode = ref('')
const disableCode = ref('')
const recoveryCodes = ref([])
const qrcodeCanvas = ref(null)

// OTP inputs for verify (enable 2FA)
const verifyOtpDigits = ref(['', '', '', '', '', ''])
const verifyOtpInputs = ref([])

// OTP inputs for disable 2FA
const disableOtpDigits = ref(['', '', '', '', '', ''])
const disableOtpInputs = ref([])

const dialogTitle = computed(() => {
  if (!twoFactorStatus.value.enabled && !setupData.value) {
    return 'Kích hoạt xác thực hai yếu tố'
  } else if (!twoFactorStatus.value.enabled && setupData.value) {
    return 'Thiết lập xác thực hai yếu tố'
  } else if (twoFactorStatus.value.enabled && recoveryCodes.value.length > 0) {
    return 'Mã khôi phục của bạn'
  } else {
    return 'Quản lý xác thực hai yếu tố'
  }
})

// Computed để sync OTP digits với verification code
watch(verifyOtpDigits, (newDigits) => {
  verificationCode.value = newDigits.join('')
}, { deep: true })

watch(disableOtpDigits, (newDigits) => {
  disableCode.value = newDigits.join('')
}, { deep: true })

// Watch props.visible để cập nhật isVisible
watch(() => props.visible, (newVal) => {
  isVisible.value = newVal
  if (newVal) {
    loadTwoFactorStatus()
  }
})

// Watch isVisible để emit update
watch(isVisible, (newVal) => {
  emit('update:visible', newVal)
})

const loadTwoFactorStatus = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/2fa/status')
    // Backend trả về response.data.data
    const data = response.data.data || response.data
    twoFactorStatus.value = {
      enabled: data.is_enabled || false,
      enabled_at: data.enabled_at || null
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Không thể tải trạng thái 2FA',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const initSetup = async () => {
  processing.value = true
  try {
    const response = await axios.post('/api/2fa/setup')
    // Backend trả về response.data.data
    const data = response.data.data || response.data
    setupData.value = {
      secret: data.secret_key || data.secret,
      qr_code_url: data.qr_code_url,
      recovery_codes: data.recovery_codes
    }
    
    // Render QR code
    await nextTick()
    if (qrcodeCanvas.value && setupData.value.qr_code_url) {
      await QRCode.toCanvas(qrcodeCanvas.value, setupData.value.qr_code_url, {
        width: 250,
        margin: 2
      })
    }
    
    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Đã tạo mã QR. Vui lòng quét mã và xác thực.',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: error.response?.data?.message || 'Không thể thiết lập 2FA',
      life: 3000
    })
  } finally {
    processing.value = false
  }
}

// Handlers for verify OTP inputs (Enable 2FA)
const handleVerifyInput = (index, event) => {
  const value = event.target.value
  
  // Only allow numbers
  verifyOtpDigits.value[index] = value.replace(/[^0-9]/g, '')
  
  // Auto-focus next input
  if (verifyOtpDigits.value[index] && index < 5) {
    verifyOtpInputs.value[index + 1].$el.focus()
  }
  
  // Auto-submit when all 6 digits are entered
  if (verificationCode.value.length === 6) {
    setTimeout(() => {
      enableTwoFactor()
    }, 300)
  }
}

const handleVerifyKeydown = (index, event) => {
  // Backspace: clear current and move to previous
  if (event.key === 'Backspace') {
    if (!verifyOtpDigits.value[index] && index > 0) {
      verifyOtpDigits.value[index - 1] = ''
      verifyOtpInputs.value[index - 1].$el.focus()
    }
  }
  
  // Arrow left
  if (event.key === 'ArrowLeft' && index > 0) {
    verifyOtpInputs.value[index - 1].$el.focus()
  }
  
  // Arrow right
  if (event.key === 'ArrowRight' && index < 5) {
    verifyOtpInputs.value[index + 1].$el.focus()
  }
}

const handleVerifyPaste = (event) => {
  event.preventDefault()
  const pastedData = event.clipboardData.getData('text').trim()
  const digits = pastedData.replace(/[^0-9]/g, '').slice(0, 6)
  
  if (digits.length > 0) {
    digits.split('').forEach((digit, i) => {
      if (i < 6) {
        verifyOtpDigits.value[i] = digit
      }
    })
    
    // Focus on next empty input or last input
    const nextIndex = Math.min(digits.length, 5)
    verifyOtpInputs.value[nextIndex].$el.focus()
  }
}

// Handlers for disable OTP inputs
const handleDisableInput = (index, event) => {
  const value = event.target.value
  
  // Only allow numbers
  disableOtpDigits.value[index] = value.replace(/[^0-9]/g, '')
  
  // Auto-focus next input
  if (disableOtpDigits.value[index] && index < 5) {
    disableOtpInputs.value[index + 1].$el.focus()
  }
  
  // Auto-submit when all 6 digits are entered
  if (disableCode.value.length === 6) {
    setTimeout(() => {
      disableTwoFactor()
    }, 300)
  }
}

const handleDisableKeydown = (index, event) => {
  // Backspace: clear current and move to previous
  if (event.key === 'Backspace') {
    if (!disableOtpDigits.value[index] && index > 0) {
      disableOtpDigits.value[index - 1] = ''
      disableOtpInputs.value[index - 1].$el.focus()
    }
  }
  
  // Arrow left
  if (event.key === 'ArrowLeft' && index > 0) {
    disableOtpInputs.value[index - 1].$el.focus()
  }
  
  // Arrow right
  if (event.key === 'ArrowRight' && index < 5) {
    disableOtpInputs.value[index + 1].$el.focus()
  }
}

const handleDisablePaste = (event) => {
  event.preventDefault()
  const pastedData = event.clipboardData.getData('text').trim()
  const digits = pastedData.replace(/[^0-9]/g, '').slice(0, 6)
  
  if (digits.length > 0) {
    digits.split('').forEach((digit, i) => {
      if (i < 6) {
        disableOtpDigits.value[i] = digit
      }
    })
    
    // Focus on next empty input or last input
    const nextIndex = Math.min(digits.length, 5)
    disableOtpInputs.value[nextIndex].$el.focus()
  }
}

const enableTwoFactor = async () => {
  if (verificationCode.value.length !== 6) {
    toast.add({
      severity: 'warn',
      summary: 'Cảnh báo',
      detail: 'Vui lòng nhập mã 6 chữ số',
      life: 3000
    })
    return
  }

  processing.value = true
  try {
    await axios.post('/api/2fa/verify', {
      code: verificationCode.value
    })
    
    twoFactorStatus.value.enabled = true
    twoFactorStatus.value.enabled_at = new Date().toISOString()
    
    // Lưu recovery codes từ setup data
    if (setupData.value?.recovery_codes) {
      recoveryCodes.value = setupData.value.recovery_codes
    }
    
    setupData.value = null
    verificationCode.value = ''
    verifyOtpDigits.value = ['', '', '', '', '', '']
    
    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Đã kích hoạt xác thực hai yếu tố',
      life: 3000
    })
    
    emit('updated')
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: error.response?.data?.message || 'Mã xác thực không đúng',
      life: 3000
    })
  } finally {
    processing.value = false
  }
}

const disableTwoFactor = async () => {
  if (disableCode.value.length !== 6) {
    toast.add({
      severity: 'warn',
      summary: 'Cảnh báo',
      detail: 'Vui lòng nhập mã 6 chữ số',
      life: 3000
    })
    return
  }

  processing.value = true
  try {
    await axios.post('/api/2fa/disable', {
      code: disableCode.value
    })
    
    twoFactorStatus.value.enabled = false
    twoFactorStatus.value.enabled_at = null
    disableCode.value = ''
    disableOtpDigits.value = ['', '', '', '', '', '']
    
    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Đã tắt xác thực hai yếu tố',
      life: 3000
    })
    
    emit('updated')
    handleClose()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: error.response?.data?.message || 'Mã xác thực không đúng',
      life: 3000
    })
  } finally {
    processing.value = false
  }
}

const copySecret = () => {
  if (setupData.value?.secret) {
    navigator.clipboard.writeText(setupData.value.secret)
    toast.add({
      severity: 'success',
      summary: 'Đã sao chép',
      detail: 'Đã sao chép secret key',
      life: 2000
    })
  }
}

const copyRecoveryCodes = () => {
  const codes = recoveryCodes.value.join('\n')
  navigator.clipboard.writeText(codes)
  toast.add({
    severity: 'success',
    summary: 'Đã sao chép',
    detail: 'Đã sao chép tất cả mã khôi phục',
    life: 2000
  })
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleClose = () => {
  // Reset các trạng thái khi đóng dialog
  setupData.value = null
  verificationCode.value = ''
  disableCode.value = ''
  verifyOtpDigits.value = ['', '', '', '', '', '']
  disableOtpDigits.value = ['', '', '', '', '', '']
  recoveryCodes.value = []
  isVisible.value = false
}
</script>

<style scoped>
.list-disc {
  list-style-type: disc;
}

.space-y-2 > * + * {
  margin-top: 0.5rem;
}

.space-y-3 > * + * {
  margin-top: 0.75rem;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}

.gap-2 {
  gap: 0.5rem;
}

.otp-input-group {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 1rem;
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

