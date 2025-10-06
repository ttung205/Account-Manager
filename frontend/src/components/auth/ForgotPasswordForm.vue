<template>
  <div class="auth-container">
    <div class="forgot-password-form">
      <div class="form-header">
        <h2>Forgot Password</h2>
        <p class="subtitle">Enter your email address and we'll send you a link to reset your password.</p>
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
          placeholder="Enter your email"
          :class="{ 'p-invalid': errors.email }"
          :disabled="loading"
          @input="clearError('email')"
        />
        <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
      </div>

      <div class="form-group">
        <label for="type">Password Type</label>
        <Dropdown
          id="type"
          v-model="formData.type"
          :options="passwordTypes"
          optionLabel="label"
          optionValue="value"
          placeholder="Select password type"
          :class="{ 'p-invalid': errors.type }"
          :disabled="loading"
          @change="clearError('type')"
        />
        <small v-if="errors.type" class="p-error">{{ errors.type }}</small>
      </div>

      <div v-if="errors.general" class="error-message">
        <i class="pi pi-exclamation-circle"></i>
        <span>{{ errors.general }}</span>
      </div>

      <div class="form-actions">
        <Button
          type="submit"
          label="Send Reset Link"
          :loading="loading"
          :disabled="loading"
          class="submit-btn"
        />
        
        <Button
          type="button"
          label="Back to Login"
          severity="secondary"
          text
          @click="$router.push('/login')"
          :disabled="loading"
          class="back-btn"
        />
      </div>
    </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import axios from 'axios';

const router = useRouter();

const formData = reactive({
  email: '',
  type: 'login'
});

const passwordTypes = [
  { label: 'Login Password', value: 'login' },
  { label: 'Master Password', value: 'master' }
];

const errors = reactive({
  email: '',
  type: '',
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
  errors.type = '';
  errors.general = '';
  
  // Validate email
  if (!formData.email) {
    errors.email = 'Email is required';
    isValid = false;
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
    isValid = false;
  }
  
  // Validate type
  if (!formData.type) {
    errors.type = 'Password type is required';
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
      type: formData.type
    });
    
    successMessage.value = response.data.message || 'Password reset link has been sent to your email address.';
    
    // Optionally redirect to login after a delay
    setTimeout(() => {
      router.push('/login');
    }, 5000);
    
  } catch (error) {
    console.error('Forgot password error:', error);
    
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
        errors.general = 'No account found with this email address.';
      } else {
        errors.general = error.response.data.message || 'Failed to send reset link. Please try again.';
      }
    } else {
      errors.general = 'Network error. Please check your connection and try again.';
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

.form-group :deep(.p-inputtext),
.form-group :deep(.p-dropdown) {
  width: 100%;
  padding: 0.75rem;
  font-size: 0.95rem;
}

.form-group :deep(.p-inputtext:focus),
.form-group :deep(.p-dropdown:focus) {
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

