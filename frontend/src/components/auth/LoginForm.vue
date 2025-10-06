<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1 class="auth-title">Welcome Back</h1>
        <p class="auth-subtitle">Sign in to your account</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="field">
          <label for="email" class="block text-sm mb-2 font-medium text-gray-700">
            Email Address
          </label>
          <InputText
            id="email"
            v-model="form.email"
            type="email"
            placeholder="Enter your email"
            class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 
                   focus:border-blue-500 focus:ring-4 focus:ring-blue-100 
                   transition-all duration-200 text-base placeholder:text-gray-400
                   hover:border-gray-300"
            :class="{ 'border-red-400 focus:border-red-500 focus:ring-red-100': errors.email }"
            required
          />
          <small v-if="errors.email" class="error-message">{{ errors.email }}</small>
        </div>

        <div class="field">
          <div class="flex justify-between items-center mb-2">
            <label for="password" class="block text-sm font-medium text-gray-700">
              Password
            </label>
            <router-link to="/forgot-password" class="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Forgot Password?
            </router-link>
          </div>
          <Password
            id="password"
            v-model="form.password"
            placeholder="Enter your password"
            class="w-full [&>input]:w-full [&>input]:px-4 [&>input]:py-3 [&>input]:rounded-lg [&>input]:border-2 [&>input]:border-gray-200 [&>input]:focus:border-blue-500 [&>input]:focus:ring-4 [&>input]:focus:ring-blue-100 [&>input]:transition-all [&>input]:duration-200 [&>input]:text-base [&>input]:placeholder:text-gray-400 [&>input]:hover:border-gray-300"
            :class="{ 'p-invalid': errors.password }"
            :feedback="false"
            toggleMask
            required
          />
          <small v-if="errors.password" class="error-message">{{ errors.password }}</small>
        </div>

        <Button
          type="submit"
          label="Sign In"
          class="w-full text-base"
          :loading="authStore.isLoading"
          :disabled="authStore.isLoading"
        />

        <div v-if="authStore.error" class="error-message text-center">
          {{ authStore.error }}
        </div>
      </form>

      <div class="auth-link mt-6">
        Don't have an account?
        <router-link to="/register" class="ml-1">Sign up</router-link>
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
  email: '',
  password: ''
})

const errors = ref({})

const validateForm = () => {
  errors.value = {}
  
  if (!form.email) {
    errors.value.email = 'Email is required'
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.value.email = 'Email is invalid'
  }
  
  if (!form.password) {
    errors.value.password = 'Password is required'
  } else if (form.password.length < 6) {
    errors.value.password = 'Password must be at least 6 characters'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleLogin = async () => {
  if (!validateForm()) return
  
  const result = await authStore.login(form)
  
  if (result.success) {
    // Check if 2FA is required
    if (result.data.requires_2fa && !result.data.two_factor_verified) {
      router.push('/2fa-verify')
    } else {
      router.push('/dashboard')
    }
  }
}
</script>
