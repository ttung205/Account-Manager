<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1 class="auth-title">Tạo tài khoản</h1>
        <p class="auth-subtitle">Đăng ký để bắt đầu</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="field">
          <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
            Họ và tên
          </label>
          <InputText
            id="name"
            v-model="form.name"
            placeholder="Nhập họ và tên của bạn"
            class="auth-input w-full"
            :class="{ 'p-invalid': errors.name }"
            required
          />
          <small v-if="errors.name" class="error-message">{{ errors.name }}</small>
        </div>

        <div class="field">
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
            Địa chỉ Email
          </label>
          <InputText
            id="email"
            v-model="form.email"
            type="email"
            placeholder="Nhập email của bạn"
            class="auth-input w-full"
            :class="{ 'p-invalid': errors.email }"
            required
          />
          <small v-if="errors.email" class="error-message">{{ errors.email }}</small>
        </div>

        <div class="field">
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            Mật khẩu
          </label>
          <Password
            id="password"
            v-model="form.password"
            placeholder="Nhập mật khẩu của bạn"
            class="auth-input w-full"
            :class="{ 'p-invalid': errors.password }"
            :feedback="true"
            toggleMask
            required
            :pt="{
              input: {
                class: 'w-full px-4 py-3',
                style: 'width: 100% !important;'
              },
              root: {
                class: 'w-full',
                style: 'width: 100% !important;'
              }
            }"
          />
          <small v-if="errors.password" class="error-message">{{ errors.password }}</small>
        </div>

        <div class="field">
          <label for="password_confirmation" class="block text-sm font-medium text-gray-700 mb-2">
            Xác nhận mật khẩu
          </label>
          <Password
            id="password_confirmation"
            v-model="form.password_confirmation"
            placeholder="Xác nhận mật khẩu của bạn"
            class="auth-input w-full"
            :class="{ 'p-invalid': errors.password_confirmation }"
            :feedback="false"
            toggleMask
            required
            :pt="{
              input: {
                class: 'w-full px-4 py-3',
                style: 'width: 100% !important;'
              },
              root: {
                class: 'w-full',
                style: 'width: 100% !important;'
              }
            }"
          />
          <small v-if="errors.password_confirmation" class="error-message">{{ errors.password_confirmation }}</small>
        </div>

        <Button
          type="submit"
          label="Tạo tài khoản"
          class="auth-button w-full text-center"
          :loading="authStore.isLoading"
          :disabled="authStore.isLoading"
        />

        <div v-if="authStore.error" class="error-message text-center">
          {{ authStore.error }}
        </div>
      </form>

      <div class="auth-link mt-6">
        Đã có tài khoản?
        <router-link to="/login" class="ml-1">Đăng nhập</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: ''
})

const errors = ref({})

const validateForm = () => {
  errors.value = {}
  
  if (!form.name) {
    errors.value.name = 'Họ và tên là bắt buộc'
  } else if (form.name.length < 2) {
    errors.value.name = 'Họ và tên phải có ít nhất 2 ký tự'
  }
  
  if (!form.email) {
    errors.value.email = 'Email là bắt buộc'
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.value.email = 'Email không hợp lệ'
  }
  
  if (!form.password) {
    errors.value.password = 'Mật khẩu là bắt buộc'
  } else if (form.password.length < 8) {
    errors.value.password = 'Mật khẩu phải có ít nhất 8 ký tự'
  }
  
  if (!form.password_confirmation) {
    errors.value.password_confirmation = 'Xác nhận mật khẩu là bắt buộc'
  } else if (form.password !== form.password_confirmation) {
    errors.value.password_confirmation = 'Mật khẩu không khớp'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleRegister = async () => {
  if (!validateForm()) return
  
  const result = await authStore.register(form)
  
  if (result.success) {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
/* Ensure all form inputs are full width */
.field {
  @apply mb-4 w-full;
}

.auth-input {
  @apply w-full;
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

/* Ensure InputText is full width */
:deep(.p-inputtext) {
  width: 100% !important;
  min-width: 100% !important;
}
</style>
