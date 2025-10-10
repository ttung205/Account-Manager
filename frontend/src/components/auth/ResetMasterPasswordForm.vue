<template>
  <div class="auth-container">
    <div class="reset-password-form">
      <div class="form-header">
        <h2>Đặt Lại Master Password</h2>
        <p class="subtitle">Nhập master password mới để mở khóa kho mật khẩu của bạn</p>
      </div>

    <div v-if="successMessage" class="success-message">
      <i class="pi pi-check-circle"></i>
      <div>
        <p>{{ successMessage }}</p>
        <p class="redirect-info">Đang chuyển đến trang mở khóa kho...</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" v-else>
      <div class="form-group">
        <label for="password">Master Password Mới</label>
        <Password
          id="password"
          v-model="formData.password"
          placeholder="Nhập master password mới"
          :class="{ 'p-invalid': errors.password }"
          :disabled="loading"
          toggleMask
          :feedback="true"
          @input="clearError('password')"
        >
          <template #header>
            <h6>Chọn master password mạnh</h6>
          </template>
          <template #footer>
            <Divider />
            <p class="mt-2">Yêu cầu:</p>
            <ul class="pl-2 ml-2 mt-0" style="line-height: 1.5">
              <li>Ít nhất một chữ thường</li>
              <li>Ít nhất một chữ hoa</li>
              <li>Ít nhất một số</li>
              <li>Ít nhất một ký tự đặc biệt (!@#$%^&*)</li>
              <li>Tối thiểu 12 ký tự</li>
            </ul>
          </template>
        </Password>
        <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
      </div>

      <div class="form-group">
        <label for="password_confirmation">Xác Nhận Master Password</label>
        <Password
          id="password_confirmation"
          v-model="formData.password_confirmation"
          placeholder="Nhập lại master password mới"
          :class="{ 'p-invalid': errors.password_confirmation }"
          :disabled="loading"
          toggleMask
          :feedback="false"
          @input="clearError('password_confirmation')"
        />
        <small v-if="errors.password_confirmation" class="p-error">{{ errors.password_confirmation }}</small>
      </div>

      <div v-if="errors.general" class="error-message">
        <i class="pi pi-exclamation-circle"></i>
        <span>{{ errors.general }}</span>
      </div>

      <div class="form-actions">
        <Button
          type="submit"
          label="Đặt Lại Master Password"
          :loading="loading"
          :disabled="loading"
          class="submit-btn"
        />
        
        <Button
          type="button"
          label="Quay Lại Dashboard"
          severity="secondary"
          text
          @click="$router.push('/dashboard')"
          :disabled="loading"
          class="back-btn"
        />
      </div>
    </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Divider from 'primevue/divider';
import axios from 'axios';

const router = useRouter();
const route = useRoute();

const formData = reactive({
  password: '',
  password_confirmation: '',
  token: '',
  email: ''
});

const errors = reactive({
  password: '',
  password_confirmation: '',
  general: ''
});

const loading = ref(false);
const successMessage = ref('');

onMounted(() => {
  // Lấy token và email từ URL query parameters
  formData.token = route.query.token || '';
  formData.email = route.query.email || '';
  
  if (!formData.token) {
    errors.general = 'Link đặt lại master password không hợp lệ. Vui lòng yêu cầu link mới.';
  }
});

const clearError = (field) => {
  errors[field] = '';
  errors.general = '';
};

const validateForm = () => {
  let isValid = true;
  
  // Reset errors
  errors.password = '';
  errors.password_confirmation = '';
  errors.general = '';
  
  // Validate master password - yêu cầu cao hơn
  if (!formData.password) {
    errors.password = 'Vui lòng nhập master password';
    isValid = false;
  } else if (formData.password.length < 12) {
    errors.password = 'Master password phải có ít nhất 12 ký tự';
    isValid = false;
  } else if (!/[a-z]/.test(formData.password)) {
    errors.password = 'Master password phải có ít nhất một chữ thường';
    isValid = false;
  } else if (!/[A-Z]/.test(formData.password)) {
    errors.password = 'Master password phải có ít nhất một chữ hoa';
    isValid = false;
  } else if (!/[0-9]/.test(formData.password)) {
    errors.password = 'Master password phải có ít nhất một số';
    isValid = false;
  } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
    errors.password = 'Master password phải có ít nhất một ký tự đặc biệt';
    isValid = false;
  }
  
  // Validate password confirmation
  if (!formData.password_confirmation) {
    errors.password_confirmation = 'Vui lòng xác nhận master password';
    isValid = false;
  } else if (formData.password !== formData.password_confirmation) {
    errors.password_confirmation = 'Master password không khớp';
    isValid = false;
  }
  
  // Check if we have token
  if (!formData.token) {
    errors.general = 'Link đặt lại master password không hợp lệ. Vui lòng yêu cầu link mới.';
    isValid = false;
  }
  
  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }
  
  loading.value = true;
  errors.general = '';
  
  try {
    const response = await axios.post('/api/password-reset/reset', {
      token: formData.token,
      type: 'master',
      password: formData.password,
      password_confirmation: formData.password_confirmation
    });
    
    successMessage.value = response.data.message || 'Master password đã được đặt lại thành công!';
    
    // Redirect về vault để unlock với master password mới sau 3 giây
    setTimeout(() => {
      router.push('/vault');
    }, 3000);
    
  } catch (error) {
    console.error('Reset master password error:', error);
    
    if (error.response) {
      if (error.response.status === 422) {
        // Validation errors
        const validationErrors = error.response.data.errors;
        if (validationErrors) {
          Object.keys(validationErrors).forEach(key => {
            if (Object.prototype.hasOwnProperty.call(errors, key)) {
              errors[key] = validationErrors[key][0];
            }
          });
        }
      } else if (error.response.status === 400) {
        errors.general = error.response.data.message || 'Link đã hết hạn hoặc không hợp lệ.';
      } else {
        errors.general = error.response.data.message || 'Không thể đặt lại master password. Vui lòng thử lại.';
      }
    } else {
      errors.general = 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.reset-password-form {
  width: 100%;
  max-width: 450px;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.form-header .subtitle {
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
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

.form-group :deep(.p-password) {
  width: 100%;
}

.form-group :deep(.p-password input) {
  width: 100%;
  padding: 0.75rem;
  font-size: 0.95rem;
}

.form-group :deep(.p-password input:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group :deep(.p-invalid input) {
  border-color: #ef4444;
}

.form-group .p-error {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  display: block;
}

.success-message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #dcfce7;
  border: 1px solid #86efac;
  border-radius: 8px;
  color: #166534;
  margin-bottom: 1.5rem;
}

.success-message i {
  font-size: 1.25rem;
  color: #22c55e;
  margin-top: 0.1rem;
}

.success-message p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

.success-message .redirect-info {
  font-size: 0.85rem;
  color: #15803d;
  margin-top: 0.25rem;
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
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.error-message i {
  font-size: 1.25rem;
  color: #ef4444;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

.submit-btn {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.back-btn {
  width: 100%;
  padding: 0.75rem;
  font-size: 0.95rem;
  color: #64748b;
}

.back-btn:hover:not(:disabled) {
  color: #3b82f6;
}

@media (max-width: 640px) {
  .auth-container {
    padding: 1rem;
  }
  
  .reset-password-form {
    padding: 1.5rem;
    border-radius: 8px;
  }
  
  .form-header h2 {
    font-size: 1.5rem;
  }
}
</style>

