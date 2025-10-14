<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :header="isSetup ? 'Thiết lập Master Password' : 'Nhập Master Password'"
    :style="{ width: '500px' }"
    modal
    :closable="!isSetup"
  >
    <div class="space-y-4">
      <!-- Info Message -->
      <div v-if="isSetup" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex gap-3">
          <i class="pi pi-info-circle text-blue-600 mt-0.5"></i>
          <div class="text-sm text-blue-800">
            <p class="font-medium mb-2">Tạo Master Password của bạn</p>
            <p>Mật khẩu này sẽ được dùng để mã hóa tất cả các mật khẩu đã lưu. Hãy chọn một mật khẩu mạnh, dễ nhớ và không quên.</p>
          </div>
        </div>
      </div>

      <div v-else class="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div class="flex gap-3">
          <i class="pi pi-shield text-amber-600 mt-0.5"></i>
          <div class="text-sm text-amber-800">
            <p class="font-medium mb-1">Két đã khóa</p>
            <p>Nhập master password để mở khóa và giải mã các mật khẩu của bạn.</p>
          </div>
        </div>
      </div>

      <!-- Password Input -->
      <div class="field">
        <div class="flex justify-between items-center mb-2">
          <label for="masterPassword" class="block text-sm font-medium text-gray-700">
            Master Password
          </label>
          <router-link 
            v-if="!isSetup" 
            to="/forgot-master-password" 
            class="text-sm text-blue-600 hover:text-blue-700 font-medium"
            @click="$emit('update:visible', false)"
          >
            Quên Master Password?
          </router-link>
        </div>
        <Password
          id="masterPassword"
          v-model="password"
          :placeholder="isSetup ? 'Tạo một master password mạnh' : 'Nhập master password của bạn'"
          class="w-full"
          :class="{ 'p-invalid': hasErrors }"
          :feedback="isSetup"
          toggleMask
          :promptLabel="isSetup ? 'Nhập mật khẩu' : ''"
          :weakLabel="isSetup ? 'Yếu' : ''"
          :mediumLabel="isSetup ? 'Trung bình' : ''"
          :strongLabel="isSetup ? 'Mạnh' : ''"
          @keyup.enter="handleSubmit"
          :pt="{
            input: {
              class: 'w-full px-4 py-3',
              style: 'width: 100% !important; min-width: 100% !important;'
            },
            root: {
              class: 'w-full',
              style: 'width: 100% !important;'
            }
          }"
        />
      </div>

      <!-- Confirm Password (Setup only) -->
      <div v-if="isSetup" class="field">
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
          Xác nhận Master Password
        </label>
        <Password
          id="confirmPassword"
          v-model="confirmPassword"
          placeholder="Xác nhận master password của bạn"
          class="w-full"
          :class="{ 'p-invalid': hasErrors }"
          :feedback="false"
          toggleMask
          @keyup.enter="handleSubmit"
          :pt="{
            input: {
              class: 'w-full px-4 py-3',
              style: 'width: 100% !important; min-width: 100% !important;'
            },
            root: {
              class: 'w-full',
              style: 'width: 100% !important;'
            }
          }"
        />
      </div>

      <!-- Custom Strength Indicator (Setup only) -->
      <div v-if="isSetup && password" class="field">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">Độ mạnh mật khẩu</span>
          <span class="text-sm font-bold" :class="strengthColor">
            {{ strengthLabel }} ({{ strengthScore }}/100)
          </span>
        </div>
        <ProgressBar
          :value="strengthScore"
          :showValue="false"
          class="h-2"
          :class="strengthBarColor"
        />
      </div>

      <!-- Validation Errors -->
      <div v-if="errors.length > 0" class="bg-red-50 border border-red-200 rounded-lg p-3">
        <div class="flex gap-2">
          <i class="pi pi-exclamation-triangle text-red-600 mt-0.5"></i>
          <div class="text-sm text-red-800">
            <p class="font-medium mb-1">Vui lòng sửa các vấn đề sau:</p>
            <ul class="list-disc list-inside space-y-1">
              <li v-for="error in errors" :key="error">{{ error }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Warnings -->
      <div v-if="warnings.length > 0" class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div class="flex gap-2">
          <i class="pi pi-exclamation-triangle text-yellow-600 mt-0.5"></i>
          <div class="text-sm text-yellow-800">
            <p class="font-medium mb-1">Khuyến nghị:</p>
            <ul class="list-disc list-inside space-y-1">
              <li v-for="warning in warnings" :key="warning">{{ warning }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Security Tips (Setup only) -->
      <div v-if="isSetup" class="bg-green-50 border border-green-200 rounded-lg p-3">
        <div class="flex gap-2">
          <i class="pi pi-lightbulb text-green-600 mt-0.5"></i>
          <div class="text-sm text-green-800">
            <p class="font-medium mb-1">Mẹo bảo mật:</p>
            <ul class="list-disc list-inside space-y-1">
              <li>Sử dụng ít nhất 16 ký tự để đảm bảo an toàn tối đa</li>
              <li>Bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt</li>
              <li>Tránh thông tin cá nhân hoặc từ phổ biến</li>
              <li>Cân nhắc sử dụng cụm từ với các từ ngẫu nhiên</li>
              <li>Không bao giờ chia sẻ master password với bất kỳ ai</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Auto-lock Info -->
      <div v-if="!isSetup" class="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div class="flex gap-2">
          <i class="pi pi-clock text-gray-600 mt-0.5"></i>
          <div class="text-sm text-gray-700">
            <p class="font-medium mb-1">Tự động khóa bảo mật</p>
            <p>Két của bạn sẽ tự động khóa sau 15 phút không hoạt động, hoặc 5 phút khi tab không hoạt động.</p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between w-full">
        <Button
          v-if="!isSetup"
          label="Hủy"
          severity="secondary"
          outlined
          @click="$emit('update:visible', false)"
        />
        <div v-else></div>
        <Button
          :label="isSetup ? 'Tạo Master Password' : 'Mở khóa két'"
          :loading="loading"
          :disabled="loading || (isSetup && (!password || !confirmPassword))"
          @click="handleSubmit"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useMasterPasswordStore } from '@/stores/masterPassword'
import { calculatePasswordStrength } from '@/utils/crypto'
import Dialog from 'primevue/dialog'
import Password from 'primevue/password'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'

const props = defineProps({
  visible: Boolean,
  isSetup: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'success', 'error'])

const masterPasswordStore = useMasterPasswordStore()

// State
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errors = ref([])
const warnings = ref([])

// Computed
const hasErrors = computed(() => errors.value.length > 0)

const strengthScore = computed(() => {
  if (!password.value) return 0
  return calculatePasswordStrength(password.value) * 25 // Convert 0-4 to 0-100
})

const strengthLabel = computed(() => {
  const score = strengthScore.value
  if (score < 30) return 'Rất yếu'
  if (score < 50) return 'Yếu'
  if (score < 70) return 'Trung bình'
  if (score < 85) return 'Mạnh'
  return 'Rất mạnh'
})

const strengthColor = computed(() => {
  const score = strengthScore.value
  if (score < 30) return 'text-red-600'
  if (score < 50) return 'text-orange-600'
  if (score < 70) return 'text-yellow-600'
  if (score < 85) return 'text-blue-600'
  return 'text-green-600'
})

const strengthBarColor = computed(() => {
  const score = strengthScore.value
  if (score < 30) return '!bg-red-500'
  if (score < 50) return '!bg-orange-500'
  if (score < 70) return '!bg-yellow-500'
  if (score < 85) return '!bg-blue-500'
  return '!bg-green-500'
})

// Methods
const validatePasswordStrength = (password) => {
  const errors = []
  const warnings = []

  if (password.length < 12) {
    errors.push('Master password phải có ít nhất 12 ký tự')
  }

  if (password.length < 16) {
    warnings.push('Nên sử dụng ít nhất 16 ký tự để bảo mật tốt hơn')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Phải chứa chữ thường')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Phải chứa chữ hoa')
  }

  if (!/\d/.test(password)) {
    errors.push('Phải chứa số')
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    warnings.push('Nên thêm ký tự đặc biệt để bảo mật tốt hơn')
  }

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    warnings.push('Tránh lặp lại ký tự')
  }

  if (/123|abc|qwe|password|admin/i.test(password)) {
    errors.push('Tránh các từ và mẫu phổ biến')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

const validatePassword = () => {
  errors.value = []
  warnings.value = []

  if (!password.value) {
    errors.value.push('Master password là bắt buộc')
    return false
  }

  if (props.isSetup) {
    if (!confirmPassword.value) {
      errors.value.push('Vui lòng xác nhận master password')
      return false
    }

    if (password.value !== confirmPassword.value) {
      errors.value.push('Mật khẩu không khớp')
      return false
    }

    // Validate strength
    const validation = validatePasswordStrength(password.value)
    if (!validation.isValid) {
      errors.value.push(...validation.errors)
    }
    warnings.value.push(...validation.warnings)

    return validation.isValid
  }

  return true
}

const handleSubmit = async () => {
  if (!validatePassword()) return

  loading.value = true

  try {
    if (props.isSetup) {
      // Setup new master password
      const result = await masterPasswordStore.createMasterPassword(password.value, confirmPassword.value)
      if (result.success) {
        emit('success', { isSetup: true })
        emit('update:visible', false)
      } else {
        errors.value = result.errors ? Object.values(result.errors).flat() : [result.error || 'Không thể thiết lập master password']
        warnings.value = []
      }
    } else {
      // Verify existing master password
      const result = await masterPasswordStore.verifyMasterPassword(password.value)
      if (result.success) {
        emit('success', { isSetup: false })
        emit('update:visible', false)
      } else {
        // Error already cleared in store, just show message
        errors.value = [result.error || 'Master password không hợp lệ']
        warnings.value = []
      }
    }
  } catch (error) {
    console.error('Master password error:', error)
    errors.value = ['Đã xảy ra lỗi. Vui lòng thử lại.']
    emit('error', error)
  } finally {
    loading.value = false
  }
}

// Watch for dialog visibility changes
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // Reset form when dialog opens
    password.value = ''
    confirmPassword.value = ''
    errors.value = []
    warnings.value = []
    loading.value = false
  }
})
</script>

<style scoped>
.field {
  @apply mb-4;
}

/* Force full width for password inputs */
:deep(.p-password) {
  width: 100% !important;
}

:deep(.p-password .p-inputtext) {
  width: 100% !important;
  min-width: 100% !important;
}

:deep(.p-password-input) {
  width: 100% !important;
  min-width: 100% !important;
}

/* Ensure dialog content has proper width */
.field {
  width: 100%;
}

.field .p-password {
  width: 100% !important;
}
</style>
