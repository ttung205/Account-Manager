<template>
  <Dialog
    v-model:visible="dialogVisible"
    header="Đổi Master Password"
    :style="{ width: '500px' }"
    :modal="true"
    :closable="!loading"
    :closeOnEscape="!loading"
  >
    <div class="change-master-password-dialog">
      <div class="warning-message">
        <i class="pi pi-exclamation-triangle"></i>
        <div>
          <strong>Lưu ý quan trọng:</strong>
          <p>Thay đổi master password sẽ mã hóa lại tất cả mật khẩu đã lưu. Quá trình này có thể mất một chút thời gian.</p>
        </div>
      </div>

      <div v-if="successMessage" class="success-message">
        <i class="pi pi-check-circle"></i>
        <span>{{ successMessage }}</span>
      </div>

      <form v-else @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="current_master_password">Master Password hiện tại <span class="required">*</span></label>
          <Password
            id="current_master_password"
            v-model="formData.current_master_password"
            placeholder="Nhập master password hiện tại"
            :class="{ 'p-invalid': errors.current_master_password }"
            :disabled="loading"
            :feedback="false"
            toggleMask
            @input="clearError('current_master_password')"
          />
          <small v-if="errors.current_master_password" class="p-error">{{ errors.current_master_password }}</small>
        </div>

        <div class="form-group">
          <label for="new_master_password">Master Password mới <span class="required">*</span></label>
          <Password
            id="new_master_password"
            v-model="formData.new_master_password"
            placeholder="Nhập master password mới"
            :class="{ 'p-invalid': errors.new_master_password }"
            :disabled="loading"
            toggleMask
            @input="clearError('new_master_password')"
          >
            <template #footer>
              <Divider />
              <p class="password-requirements-title">Yêu cầu</p>
              <ul class="password-requirements">
                <li :class="{ 'requirement-met': passwordRequirements.minLength }">
                  <i :class="passwordRequirements.minLength ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                  Ít nhất 12 ký tự
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
                <li :class="{ 'requirement-met': passwordRequirements.hasSpecial }">
                  <i :class="passwordRequirements.hasSpecial ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                  Chứa ký tự đặc biệt
                </li>
              </ul>
            </template>
          </Password>
          <small v-if="errors.new_master_password" class="p-error">{{ errors.new_master_password }}</small>
        </div>

        <div class="form-group">
          <label for="new_master_password_confirmation">Xác nhận Master Password mới <span class="required">*</span></label>
          <Password
            id="new_master_password_confirmation"
            v-model="formData.new_master_password_confirmation"
            placeholder="Nhập lại master password mới"
            :class="{ 'p-invalid': errors.new_master_password_confirmation }"
            :disabled="loading"
            :feedback="false"
            toggleMask
            @input="clearError('new_master_password_confirmation')"
          />
          <small v-if="errors.new_master_password_confirmation" class="p-error">{{ errors.new_master_password_confirmation }}</small>
        </div>

        <div v-if="errors.general" class="error-message">
          <i class="pi pi-exclamation-circle"></i>
          <span>{{ errors.general }}</span>
        </div>

        <div v-if="loading" class="processing-message">
          <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="4" />
          <span>Đang mã hóa lại mật khẩu...</span>
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
          label="Đổi Master Password"
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
import { useMasterPasswordStore } from '@/stores/masterPassword'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Password from 'primevue/password'
import Divider from 'primevue/divider'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:visible', 'success'])

const toast = useToast()
const masterPasswordStore = useMasterPasswordStore()

const formData = reactive({
  current_master_password: '',
  new_master_password: '',
  new_master_password_confirmation: ''
})

const errors = reactive({
  current_master_password: '',
  new_master_password: '',
  new_master_password_confirmation: '',
  general: ''
})

const loading = ref(false)
const successMessage = ref('')

// Computed property for v-model binding
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// Password requirements validation (stricter for master password)
const passwordRequirements = computed(() => ({
  minLength: formData.new_master_password.length >= 12,
  hasUppercase: /[A-Z]/.test(formData.new_master_password),
  hasLowercase: /[a-z]/.test(formData.new_master_password),
  hasNumber: /[0-9]/.test(formData.new_master_password),
  hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(formData.new_master_password)
}))

const isFormValid = computed(() => {
  return formData.current_master_password &&
         formData.new_master_password &&
         formData.new_master_password_confirmation &&
         Object.values(passwordRequirements.value).every(req => req) &&
         formData.new_master_password === formData.new_master_password_confirmation
})

const clearError = (field) => {
  errors[field] = ''
  errors.general = ''
}

const resetForm = () => {
  formData.current_master_password = ''
  formData.new_master_password = ''
  formData.new_master_password_confirmation = ''
  errors.current_master_password = ''
  errors.new_master_password = ''
  errors.new_master_password_confirmation = ''
  errors.general = ''
  successMessage.value = ''
}

const validateForm = () => {
  let isValid = true
  
  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
  
  // Validate current master password
  if (!formData.current_master_password) {
    errors.current_master_password = 'Master password hiện tại là bắt buộc'
    isValid = false
  }
  
  // Validate new master password
  if (!formData.new_master_password) {
    errors.new_master_password = 'Master password mới là bắt buộc'
    isValid = false
  } else if (!Object.values(passwordRequirements.value).every(req => req)) {
    errors.new_master_password = 'Master password không đáp ứng các yêu cầu'
    isValid = false
  }
  
  // Validate password confirmation
  if (!formData.new_master_password_confirmation) {
    errors.new_master_password_confirmation = 'Vui lòng xác nhận master password mới'
    isValid = false
  } else if (formData.new_master_password !== formData.new_master_password_confirmation) {
    errors.new_master_password_confirmation = 'Master password xác nhận không khớp'
    isValid = false
  }
  
  // Check if new password is same as current
  if (formData.current_master_password && formData.new_master_password && 
      formData.current_master_password === formData.new_master_password) {
    errors.new_master_password = 'Master password mới phải khác master password hiện tại'
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
    const result = await masterPasswordStore.changeMasterPassword(
      formData.current_master_password,
      formData.new_master_password,
      formData.new_master_password_confirmation
    )
    
    if (result.success) {
      // Check if page will reload (new behavior for better security)
      if (result.willReload) {
        successMessage.value = 'Master password đã được thay đổi thành công! Đang tải lại trang...'
        
        toast.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Master password đã được thay đổi. Vui lòng đăng nhập lại với master password mới.',
          life: 3000
        })
        
        // Note: Page will reload automatically from the store
        // No need to close dialog as page is reloading
      } else {
        // Legacy behavior (in case reload is not triggered)
        successMessage.value = result.message || 'Đổi master password thành công!'
        
        toast.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Master password đã được thay đổi và tất cả mật khẩu đã được mã hóa lại',
          life: 5000
        })
        
        // Close dialog after 2 seconds
        setTimeout(() => {
          emit('success')
          emit('update:visible', false)
          resetForm()
        }, 2000)
      }
    } else {
      errors.general = result.error || 'Không thể đổi master password'
    }
  } catch (error) {
    errors.general = error.message || 'Có lỗi xảy ra khi đổi master password'
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
.change-master-password-dialog {
  padding: 0.5rem 0;
}

.warning-message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  color: #92400e;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.warning-message i {
  font-size: 1.25rem;
  color: #f59e0b;
  margin-top: 0.125rem;
}

.warning-message strong {
  display: block;
  margin-bottom: 0.25rem;
}

.warning-message p {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
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

.processing-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #e0f2fe;
  border: 1px solid #7dd3fc;
  border-radius: 8px;
  color: #075985;
  margin-top: 1rem;
  font-size: 0.95rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>

