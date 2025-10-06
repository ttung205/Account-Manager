import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/vault'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/components/auth/LoginForm.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/components/auth/RegisterForm.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/2fa-verify',
      name: '2FAVerify',
      component: () => import('@/components/auth/TwoFactorVerify.vue'),
      meta: { requires2FA: true }
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('@/components/auth/ForgotPasswordForm.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/forgot-master-password',
      name: 'ForgotMasterPassword',
      component: () => import('@/components/auth/ForgotMasterPasswordForm.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('@/components/auth/ResetPasswordForm.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/reset-master-password',
      name: 'ResetMasterPassword',
      component: () => import('@/components/auth/ResetMasterPasswordForm.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/components/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/vault',
      name: 'Vault',
      component: () => import('@/components/vault/VaultList.vue'),
      meta: { requiresAuth: true }
    }
  ],
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Check if route requires full authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // User has token but not verified 2FA
    if (authStore.token && authStore.requires2FA && !authStore.twoFactorVerified) {
      next('/2fa-verify')
    } else {
      next('/login')
    }
  } 
  // Check if route is for 2FA verification page
  else if (to.meta.requires2FA) {
    // Only allow if user has token and needs 2FA
    if (!authStore.token || !authStore.requires2FA) {
      next('/login')
    } else {
      next()
    }
  }
  // Check if guest-only pages
  else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/vault')
  } 
  else {
    next()
  }
})

export default router
