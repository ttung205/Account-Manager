<template>
  <Dialog
    v-model:visible="dialogVisible"
    header="Đổi mật khẩu"
    :style="{ width: '500px' }"
    :modal="true"
    :closable="!loading"
    :closeOnEscape="!loading"
  >
    <div class="change-password-dialog">
      <div v-if="successMessage" class="success-message">
        <i class="pi pi-check-circle"></i>
        <span>{{ successMessage }}</span>
      </div>

      <form v-else @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="current_password">Mật khẩu hiện tại <span class="required">*</span></label>
          <Password
            id="current_password"
            v-model="formData.current_password"
            placeholder="Nhập mật khẩu hiện tại"
            :class="{ 'p-invalid': errors.current_password }"
            :disabled="loading"
            :feedback="false"
            toggleMask
            @input="clearError('current_password')"
          />
          <small v-if="errors.current_password" class="p-error">{{ errors.current_password }}</small>
        </div>

        <div class="form-group">
          <label for="new_password">Mật khẩu mới <span class="required">*</span></label>
          <Password
            id="new_password"
            v-model="formData.new_password"
            placeholder="Nhập mật khẩu mới"
            :class="{ 'p-invalid': errors.new_password }"
            :disabled="loading"
            toggleMask
            @input="clearError('new_password')"
          >
            <template #footer>
              <Divider />
              <p class="password-requirements-title">Yêu cầu</p>
              <ul class="password-requirements">
                <li :class="{ 'requirement-met': passwordRequirements.minLength }">
                  <i :class="passwordRequirements.minLength ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                  Ít nhất 8 ký tự
                </li>
                <li :class="{ 'requirement-met': passwordRequirements.hasUppercase }">
                  <i :class="passwordRequirements.hasUppercase ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                  Chứa chữ hoa
                </li>
                <li :class="{ 'requirement-met': passwordRequirements.hasLowercase }">
                  <i :class="passwordRequirements.hasLowercase ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                  Chứa chữ thường
                </li>
                <li :class="{ 'requirement-met': passwordRequirements.hasNumber }">
                  <i :class="passwordRequirements.hasNumber ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                  Chứa số
                </li>
              </ul>
            </template>
          </Password>
          <small v-if="errors.new_password" class="p-error">{{ errors.new_password }}</small>
        </div>

        <div class="form-group">
          <label for="new_password_confirmation">Xác nhận mật khẩu mới <span class="required">*</span></label>
          <Password
            id="new_password_confirmation"
            v-model="formData.new_password_confirmation"
            placeholder="Nhập lại mật khẩu mới"
            :class="{ 'p-invalid': errors.new_password_confirmation }"
            :disabled="loading"
            :feedback="false"
            toggleMask
            @input="clearError('new_password_confirmation')"
          />
          <small v-if="errors.new_password_confirmation" class="p-error">{{ errors.new_password_confirmation }}</small>
        </div>

        <div v-if="errors.general" class="error-message">
          <i class="pi pi-exclamation-circle"></i>
          <span>{{ errors.general }}</span>
        </div>
      </form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button
          label="Hủy"
          severity="secondary"
          outlined
          @click="handleCancel"
          :disabled="loading"
        />
        <Button
          label="Đổi mật khẩu"
          @click="handleSubmit"
          :loading="loading"
          :disabled="loading || !isFormValid"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Password from 'primevue/password'
import Divider from 'primevue/divider'
import axios from '@/utils/axios'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:visible', 'success'])

const toast = useToast()

const formData = reactive({
  current_password: '',
  new_password: '',
  new_password_confirmation: ''
})

const errors = reactive({
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
  general: ''
})

const loading = ref(false)
const successMessage = ref('')

// Computed property for v-model binding
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// Password requirements validation
const passwordRequirements = computed(() => ({
  minLength: formData.new_password.length >= 8,
  hasUppercase: /[A-Z]/.test(formData.new_password),
  hasLowercase: /[a-z]/.test(formData.new_password),
  hasNumber: /[0-9]/.test(formData.new_password)
}))

const isFormValid = computed(() => {
  return formData.current_password &&
         formData.new_password &&
         formData.new_password_confirmation &&
         Object.values(passwordRequirements.value).every(req => req) &&
         formData.new_password === formData.new_password_confirmation
})

const clearError = (field) => {
  errors[field] = ''
  errors.general = ''
}

const resetForm = () => {
  formData.current_password = ''
  formData.new_password = ''
  formData.new_password_confirmation = ''
  errors.current_password = ''
  errors.new_password = ''
  errors.new_password_confirmation = ''
  errors.general = ''
  successMessage.value = ''
}

const validateForm = () => {
  let isValid = true
  
  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
  
  // Validate current password
  if (!formData.current_password) {
    errors.current_password = 'Mật khẩu hiện tại là bắt buộc'
    isValid = false
  }
  
  // Validate new password
  if (!formData.new_password) {
    errors.new_password = 'Mật khẩu mới là bắt buộc'
    isValid = false
  } else if (!Object.values(passwordRequirements.value).every(req => req)) {
    errors.new_password = 'Mật khẩu không đáp ứng các yêu cầu'
    isValid = false
  }
  
  // Validate password confirmation
  if (!formData.new_password_confirmation) {
    errors.new_password_confirmation = 'Vui lòng xác nhận mật khẩu mới'
    isValid = false
  } else if (formData.new_password !== formData.new_password_confirmation) {
    errors.new_password_confirmation = 'Mật khẩu xác nhận không khớp'
    isValid = false
  }
  
  // Check if new password is same as current
  if (formData.current_password && formData.new_password && 
      formData.current_password === formData.new_password) {
    errors.new_password = 'Mật khẩu mới phải khác mật khẩu hiện tại'
    isValid = false
  }
  
  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  
  loading.value = true
  errors.general = ''
  
  try {
    const response = await axios.post('/api/change-password', {
      current_password: formData.current_password,
      new_password: formData.new_password,
      new_password_confirmation: formData.new_password_confirmation
    })
    
    if (response.data.success) {
      successMessage.value = response.data.message || 'Đổi mật khẩu thành công!'
      
      toast.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Mật khẩu đã được thay đổi thành công',
        life: 3000
      })
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        emit('success')
        emit('update:visible', false)
        resetForm()
      }, 2000)
    }
  } catch (error) {
    console.error('Change password error:', error)
    
    if (error.response) {
      if (error.response.status === 422) {
        // Validation errors
        const validationErrors = error.response.data.errors
        if (validationErrors) {
          Object.keys(validationErrors).forEach(key => {
            if (Object.prototype.hasOwnProperty.call(errors, key)) {
              errors[key] = validationErrors[key][0]
            }
          })
        }
      } else if (error.response.status === 401) {
        errors.current_password = 'Mật khẩu hiện tại không đúng'
      } else {
        errors.general = error.response.data.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.'
      }
    } else {
      errors.general = 'Lỗi kết nối. Vui lòng kiểm tra kết nối và thử lại.'
    }
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  emit('update:visible', false)
  resetForm()
}

// Watch for dialog visibility change
watch(() => props.visible, (newValue) => {
  if (!newValue) {
    resetForm()
  }
})
</script>

<style scoped>
.change-password-dialog {
  padding: 0.5rem 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #334155;
  font-size: 0.9rem;
}

.form-group label .required {
  color: #ef4444;
}

.form-group :deep(.p-password) {
  width: 100%;
}

.form-group :deep(.p-password input) {
  width: 100%;
  padding: 0.75rem;
  font-size: 0.95rem;
}

.form-group :deep(.p-password.p-invalid input) {
  border-color: #ef4444;
}

.form-group .p-error {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  display: block;
}

.password-requirements-title {
  margin: 0.5rem 0 0.25rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.password-requirements {
  list-style: none;
  padding: 0;
  margin: 0;
}

.password-requirements li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  font-size: 0.85rem;
  color: #64748b;
}

.password-requirements li i {
  font-size: 0.75rem;
  color: #94a3b8;
}

.password-requirements li.requirement-met {
  color: #22c55e;
}

.password-requirements li.requirement-met i {
  color: #22c55e;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #dcfce7;
  border: 1px solid #86efac;
  border-radius: 8px;
  color: #166534;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.success-message i {
  font-size: 1.25rem;
  color: #22c55e;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  color: #991b1b;
  margin-top: 1rem;
  font-size: 0.95rem;
}

.error-message i {
  font-size: 1.25rem;
  color: #ef4444;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>

