<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900">Account Manager</h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-700">Welcome, {{ authStore.user?.name }}</span>
            <Button
              label="Logout"
              icon="pi pi-sign-out"
              severity="secondary"
              @click="handleLogout"
            />
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Dashboard</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div class="bg-blue-50 p-6 rounded-lg">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="pi pi-key text-blue-600 text-2xl"></i>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-blue-600">Total Accounts</p>
                    <p class="text-2xl font-semibold text-blue-900">0</p>
                  </div>
                </div>
              </div>
              
              <div class="bg-green-50 p-6 rounded-lg">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="pi pi-star text-green-600 text-2xl"></i>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-green-600">Favorites</p>
                    <p class="text-2xl font-semibold text-green-900">0</p>
                  </div>
                </div>
              </div>
              
              <div class="bg-purple-50 p-6 rounded-lg">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="pi pi-shield text-purple-600 text-2xl"></i>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-purple-600">2FA Status</p>
                    <p class="text-2xl font-semibold text-purple-900">
                      {{ authStore.user?.two_factor_enabled ? 'Enabled' : 'Disabled' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="text-center py-12">
              <i class="pi pi-lock text-gray-400 text-6xl mb-4"></i>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No accounts yet</h3>
              <p class="text-gray-500 mb-6">Start by adding your first account to get started.</p>
              <Button
                label="Add Account"
                icon="pi pi-plus"
                class="p-button-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
  }
})
</script>
