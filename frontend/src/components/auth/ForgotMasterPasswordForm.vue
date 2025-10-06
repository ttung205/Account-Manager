<template>
  <div class="auth-container">
    <div class="forgot-password-form">
      <div class="form-header">
        <h2>Quên Master Password</h2>
        <p class="subtitle">Nhập email của bạn để nhận link reset master password.</p>
      </div>

    <div v-if="successMessage" class="success-message">
      <i class="pi pi-check-circle"></i>
      <span>{{ successMessage }}</span>
    </div>

    <form @submit.prevent="handleSubmit" v-else>
      <div class="form-group">
        <label for="email">Email Address</label>
        <InputText
          id="email"
          v-model="formData.email"
          type="email"
          placeholder="Nhập email của bạn"
          :class="{ 'p-invalid': errors.email }"
          :disabled="loading"
          @input="clearError('email')"
        />
        <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
      </div>

      <div v-if="errors.general" class="error-message">
        <i class="pi pi-exclamation-circle"></i>
        <span>{{ errors.general }}</span>
      </div>

      <div class="form-actions">
        <Button
          type="submit"
          label="Gửi Link Reset"
          :loading="loading"
          :disabled="loading"
          class="submit-btn"
        />
        
        <Button
          type="button"
          label="Quay lại"
          severity="secondary"
          text
          @click="handleBack"
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
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import axios from 'axios';

const router = useRouter();
const authStore = useAuthStore();

// Check if user is authenticated
onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login');
  }
});

const formData = reactive({
  email: ''
});

const errors = reactive({
  email: '',
  general: ''
});

const loading = ref(false);
const successMessage = ref('');

const clearError = (field) => {
  errors[field] = '';
  errors.general = '';
};

const validateForm = () => {
  let isValid = true;
  
  // Reset errors
  errors.email = '';
  errors.general = '';
  
  // Validate email
  if (!formData.email) {
    errors.email = 'Email là bắt buộc';
    isValid = false;
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = 'Vui lòng nhập email hợp lệ';
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
    const response = await axios.post('/api/password-reset/request', {
      email: formData.email,
      type: 'master'  // Chỉ định loại là master password
    });
    
    successMessage.value = response.data.message || 'Link reset master password đã được gửi đến email của bạn.';
    
    // Redirect về login sau 5 giây
    setTimeout(() => {
      router.push('/login');
    }, 5000);
    
  } catch (error) {
    console.error('Forgot master password error:', error);
    
    if (error.response) {
      if (error.response.status === 422) {
        // Validation errors
        const validationErrors = error.response.data.errors;
        if (validationErrors) {
          Object.keys(validationErrors).forEach(key => {
            if (errors.hasOwnProperty(key)) {
              errors[key] = validationErrors[key][0];
            }
          });
        }
      } else if (error.response.status === 404) {
        errors.general = 'Không tìm thấy tài khoản với email này.';
      } else {
        errors.general = error.response.data.message || 'Không thể gửi link reset. Vui lòng thử lại.';
      }
    } else {
      errors.general = 'Lỗi kết nối. Vui lòng kiểm tra kết nối và thử lại.';
    }
  } finally {
    loading.value = false;
  }
};

const handleBack = () => {
  // Quay lại trang trước hoặc về login
  router.go(-1);
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

.forgot-password-form {
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

.form-group :deep(.p-inputtext) {
  width: 100%;
  padding: 0.75rem;
  font-size: 0.95rem;
}

.form-group :deep(.p-inputtext:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group :deep(.p-invalid) {
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
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #dcfce7;
  border: 1px solid #86efac;
  border-radius: 8px;
  color: #166534;
  margin-bottom: 1.5rem;
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
  
  .forgot-password-form {
    padding: 1.5rem;
    border-radius: 8px;
  }
  
  .form-header h2 {
    font-size: 1.5rem;
  }
}
</style>

