<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-4">
            <h1 class="text-xl font-semibold text-gray-900">
              <i class="pi pi-lock mr-2"></i>
              Kho mật khẩu
            </h1>
            <Tag :value="accountsStore.statistics.total" severity="info" class="text-sm" />
          </div>
          
          <div class="flex items-center space-x-3">
            <span class="text-sm text-gray-700">Xin chào, {{ authStore.user?.name }}</span>
            <Button
              label="Bảo mật 2FA"
              icon="pi pi-shield"
              severity="secondary"
              size="small"
              outlined
              v-tooltip.bottom="'Cài đặt xác thực hai yếu tố'"
              @click="showTwoFactorDialog = true"
            />
            <Button
              label="Đăng xuất"
              icon="pi pi-sign-out"
              severity="secondary"
              size="small"
              outlined
              @click="handleLogout"
            />
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <!-- Toolbar -->
      <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div class="flex-1 w-full sm:w-auto">
            <IconField iconPosition="left" class="w-full">
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="searchQuery"
                placeholder="Tìm kiếm tài khoản..."
                class="w-full pl-10"
              />
            </IconField>
          </div>
          
          <div class="flex gap-2 items-center w-full sm:w-auto">
            <Dropdown
              v-model="selectedCategory"
              :options="categoryOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Tất cả danh mục"
              class="w-full sm:w-48"
            />
            <Button
              label="Thêm tài khoản"
              icon="pi pi-plus"
              @click="showAccountDialog = true"
            />
          </div>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Tổng số tài khoản</p>
              <p class="text-2xl font-bold text-gray-900">{{ accountsStore.statistics.total }}</p>
            </div>
            <i class="pi pi-key text-blue-500 text-3xl"></i>
          </div>
        </div>

        <div class="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Yêu thích</p>
              <p class="text-2xl font-bold text-gray-900">{{ accountsStore.statistics.favorites }}</p>
            </div>
            <i class="pi pi-star-fill text-yellow-500 text-3xl"></i>
          </div>
        </div>

        <div class="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Danh mục</p>
              <p class="text-2xl font-bold text-gray-900">{{ Object.keys(accountsStore.statistics.categories || {}).length }}</p>
            </div>
            <i class="pi pi-folder text-green-500 text-3xl"></i>
          </div>
        </div>

        <div class="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Sử dụng gần đây</p>
              <p class="text-2xl font-bold text-gray-900">{{ accountsStore.recentAccounts.length }}</p>
            </div>
            <i class="pi pi-clock text-purple-500 text-3xl"></i>
          </div>
        </div>
      </div>

      <!-- Accounts DataTable -->
      <div class="bg-white rounded-lg shadow-sm">
        <DataTable
          :value="filteredAccounts"
          :loading="accountsStore.loading"
          :rows="10"
          :paginator="true"
          :rowsPerPageOptions="[10, 25, 50]"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} tài khoản"
          responsiveLayout="scroll"
          stripedRows
          class="p-datatable-sm"
        >
          <template #empty>
            <div class="text-center py-12">
              <i class="pi pi-lock text-gray-400 text-6xl mb-4"></i>
              <h3 class="text-lg font-medium text-gray-900 mb-2">Chưa có tài khoản nào</h3>
              <p class="text-gray-500 mb-6">Bắt đầu bằng cách thêm tài khoản đầu tiên của bạn.</p>
              <Button
                label="Thêm tài khoản"
                icon="pi pi-plus"
                @click="showAccountDialog = true"
              />
            </div>
          </template>

          <Column field="favorite" header="" style="width: 50px">
            <template #body="{ data }">
              <Button
                :icon="data.favorite ? 'pi pi-star-fill' : 'pi pi-star'"
                :class="data.favorite ? 'text-yellow-500' : 'text-gray-400'"
                text
                rounded
                @click="toggleFavorite(data)"
              />
            </template>
          </Column>

          <Column field="service_name" header="Dịch vụ" sortable>
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <Avatar
                  :label="data.service_name.charAt(0).toUpperCase()"
                  class="bg-blue-500 text-white"
                  shape="circle"
                  size="normal"
                />
                <div>
                  <div class="font-medium">{{ data.service_name }}</div>
                  <div v-if="data.website_url" class="text-xs text-gray-500">
                    {{ data.website_url }}
                  </div>
                </div>
              </div>
            </template>
          </Column>

          <Column field="username" header="Tên đăng nhập" sortable>
            <template #body="{ data }">
              <span class="font-mono text-sm">{{ data.username }}</span>
            </template>
          </Column>

          <Column field="password" header="Mật khẩu">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <span class="font-mono text-sm">••••••••••</span>
                <Button
                  icon="pi pi-copy"
                  text
                  rounded
                  size="small"
                  v-tooltip.top="'Sao chép mật khẩu'"
                  @click="copyPassword(data)"
                />
              </div>
            </template>
          </Column>

          <Column field="category" header="Danh mục" sortable>
            <template #body="{ data }">
              <Tag :value="data.category" severity="info" class="text-xs" />
            </template>
          </Column>

          <Column field="last_used_at" header="Lần dùng cuối" sortable>
            <template #body="{ data }">
              <span v-if="data.last_used_at" class="text-sm text-gray-600">
                {{ formatDate(data.last_used_at) }}
              </span>
              <span v-else class="text-sm text-gray-400">Chưa dùng</span>
            </template>
          </Column>

          <Column header="Thao tác" style="width: 150px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button
                  icon="pi pi-eye"
                  text
                  rounded
                  size="small"
                  severity="info"
                  v-tooltip.top="'Xem'"
                  @click="viewAccount(data)"
                />
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  size="small"
                  severity="warning"
                  v-tooltip.top="'Sửa'"
                  @click="editAccount(data)"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  size="small"
                  severity="danger"
                  v-tooltip.top="'Xóa'"
                  @click="confirmDelete(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </main>

    <!-- Account Form Dialog -->
    <AccountFormDialog
      v-model:visible="showAccountDialog"
      :account="selectedAccount"
      @saved="handleAccountSaved"
    />

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Xác nhận xóa"
      :style="{ width: '450px' }"
      modal
    >
      <div class="flex items-start gap-4">
        <i class="pi pi-exclamation-triangle text-red-500 text-3xl"></i>
        <div>
          <p class="mb-2">Bạn có chắc chắn muốn xóa tài khoản này?</p>
          <p class="text-sm text-gray-600">
            Dịch vụ: <strong>{{ accountToDelete?.service_name }}</strong>
          </p>
          <p class="text-sm text-gray-600">
            Tên đăng nhập: <strong>{{ accountToDelete?.username }}</strong>
          </p>
        </div>
      </div>
      
      <template #footer>
        <Button
          label="Hủy"
          severity="secondary"
          outlined
          @click="showDeleteDialog = false"
        />
        <Button
          label="Xóa"
          severity="danger"
          @click="deleteAccount"
        />
      </template>
    </Dialog>

    <!-- Master Password Dialog -->
    <MasterPasswordDialog
      v-model:visible="showMasterPasswordDialog"
      :is-setup="isFirstTimeSetup"
      @success="handleMasterPasswordSuccess"
      @error="handleMasterPasswordError"
    />

    <!-- Two Factor Authentication Dialog -->
    <TwoFactorDialog
      v-model:visible="showTwoFactorDialog"
      @updated="handleTwoFactorUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAccountsStore } from '@/stores/accounts'
import { useMasterPasswordStore } from '@/stores/masterPassword'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Avatar from 'primevue/avatar'
import AccountFormDialog from './AccountFormDialog.vue'
import MasterPasswordDialog from './MasterPasswordDialog.vue'
import TwoFactorDialog from '../auth/TwoFactorDialog.vue'

const router = useRouter()
const authStore = useAuthStore()
const accountsStore = useAccountsStore()
const masterPasswordStore = useMasterPasswordStore()
const toast = useToast()

// State
const searchQuery = ref('')
const selectedCategory = ref('all')
const showAccountDialog = ref(false)
const showDeleteDialog = ref(false)
const showMasterPasswordDialog = ref(false)
const showTwoFactorDialog = ref(false)
const isFirstTimeSetup = ref(false)
const selectedAccount = ref(null)
const accountToDelete = ref(null)

// Category options
const categoryOptions = computed(() => [
  { label: 'Tất cả danh mục', value: 'all' },
  ...accountsStore.categories.map(cat => ({ label: cat, value: cat }))
])

// Filtered accounts
const filteredAccounts = computed(() => {
  let accounts = accountsStore.accounts

  // Filter by category
  if (selectedCategory.value !== 'all') {
    accounts = accounts.filter(acc => acc.category === selectedCategory.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    accounts = accounts.filter(acc =>
      acc.service_name.toLowerCase().includes(query) ||
      acc.username.toLowerCase().includes(query) ||
      (acc.website_url && acc.website_url.toLowerCase().includes(query))
    )
  }

  return accounts
})

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays < 7) return `${diffDays} ngày trước`
  
  return date.toLocaleDateString()
}

// Actions
const handleLogout = async () => {
  accountsStore.clearMasterPassword()
  await authStore.logout()
  router.push('/login')
}

const handleMasterPasswordSuccess = async (event) => {
  try {
    await loadAccounts()
    
    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: event.isSetup ? 'Đã tạo master password thành công' : 'Đã mở khóa kho thành công',
      life: 3000
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Không thể tải danh sách tài khoản',
      life: 3000
    })
  }
}

const handleMasterPasswordError = (error) => {
  toast.add({
    severity: 'error',
    summary: 'Lỗi',
    detail: error.message || 'Lỗi master password',
    life: 3000
  })
}

const loadAccounts = async () => {
  const result = await accountsStore.fetchAccounts()
  if (!result.success) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: result.error,
      life: 3000
    })
  }
  await accountsStore.fetchStatistics()
}

const viewAccount = (account) => {
  selectedAccount.value = account
  showAccountDialog.value = true
}

const editAccount = (account) => {
  selectedAccount.value = account
  showAccountDialog.value = true
}

const confirmDelete = (account) => {
  accountToDelete.value = account
  showDeleteDialog.value = true
}

const deleteAccount = async () => {
  const result = await accountsStore.deleteAccount(accountToDelete.value.id)
  
  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Đã xóa tài khoản thành công',
      life: 3000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: result.error,
      life: 3000
    })
  }
  
  showDeleteDialog.value = false
  accountToDelete.value = null
}

const copyPassword = async (account) => {
  const result = await accountsStore.copyPassword(account)
  
  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Đã sao chép!',
      detail: 'Mật khẩu đã được sao chép vào clipboard (sẽ tự động xóa sau 30s)',
      life: 3000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: result.error,
      life: 3000
    })
  }
}

const toggleFavorite = async (account) => {
  await accountsStore.toggleFavorite(account.id)
}

const handleAccountSaved = () => {
  selectedAccount.value = null
  showAccountDialog.value = false
  loadAccounts()
  
  toast.add({
    severity: 'success',
    summary: 'Thành công',
    detail: 'Đã lưu tài khoản thành công',
    life: 3000
  })
}

const handleTwoFactorUpdated = () => {
  // Có thể thêm logic reload hoặc cập nhật UI nếu cần
  console.log('2FA settings updated')
}

// Setup event listeners for master password timeout
const setupMasterPasswordListeners = () => {
  // Handle master password timeout
  window.addEventListener('masterPasswordTimeout', () => {
    toast.add({
      severity: 'warn',
      summary: 'Phiên đã hết hạn',
      detail: 'Kho của bạn đã bị khóa để bảo mật. Vui lòng nhập lại master password.',
      life: 5000
    })
    showMasterPasswordDialog.value = true
    isFirstTimeSetup.value = false
  })
}

// Lifecycle
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  // Setup event listeners
  setupMasterPasswordListeners()

  // Initialize master password store
  await masterPasswordStore.init()

  // Check if master password is set
  if (!masterPasswordStore.isUnlocked) {
    // Determine if this is first time setup or just unlock
    isFirstTimeSetup.value = !masterPasswordStore.hasMasterPassword
    console.log('Master password not unlocked. Is first time setup:', isFirstTimeSetup.value)
    showMasterPasswordDialog.value = true
  } else {
    await loadAccounts()
  }
})
</script>

