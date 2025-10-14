<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    header="Chi tiết tài khoản"
    :style="{ width: '600px' }"
    modal
  >
    <div v-if="account" class="space-y-4">
      <!-- Service Name -->
      <div class="field">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <i class="pi pi-briefcase mr-2"></i>Tên dịch vụ
        </label>
        <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Avatar
            :label="account.service_name.charAt(0).toUpperCase()"
            class="bg-blue-500 text-white"
            shape="circle"
            size="normal"
          />
          <span class="font-medium">{{ account.service_name }}</span>
        </div>
      </div>

      <!-- Username/Email -->
      <div class="field">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <i class="pi pi-user mr-2"></i>Tên đăng nhập/Email
        </label>
        <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <span class="font-mono flex-1">{{ account.username }}</span>
          <Button
            :icon="copiedUsername ? 'pi pi-check' : 'pi pi-copy'"
            text
            rounded
            size="small"
            :severity="copiedUsername ? 'success' : 'secondary'"
            v-tooltip.top="'Sao chép tên đăng nhập'"
            @click="copyToClipboard(account.username, 'username')"
          />
        </div>
      </div>

      <!-- Password -->
      <div class="field">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <i class="pi pi-lock mr-2"></i>Mật khẩu
        </label>
        <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <span v-if="!showPassword" class="font-mono flex-1">••••••••••</span>
          <span v-else class="font-mono flex-1">{{ decryptedPassword || 'Đang giải mã...' }}</span>
          <Button
            :icon="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
            text
            rounded
            size="small"
            severity="secondary"
            v-tooltip.top="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
            @click="togglePasswordVisibility"
            :loading="loadingPassword"
          />
          <Button
            :icon="copiedPassword ? 'pi pi-check' : 'pi pi-copy'"
            text
            rounded
            size="small"
            :severity="copiedPassword ? 'success' : 'secondary'"
            v-tooltip.top="'Sao chép mật khẩu'"
            @click="copyPassword"
          />
        </div>
      </div>

      <!-- Website URL -->
      <div class="field" v-if="account.website_url">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <i class="pi pi-globe mr-2"></i>Website URL
        </label>
        <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <a 
            :href="getFullUrl(account.website_url)" 
            target="_blank" 
            class="text-blue-600 hover:underline flex-1 truncate"
          >
            {{ account.website_url }}
          </a>
          <Button
            icon="pi pi-external-link"
            text
            rounded
            size="small"
            severity="secondary"
            v-tooltip.top="'Mở trang web'"
            @click="openWebsite"
          />
        </div>
      </div>

      <!-- Category -->
      <div class="field">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <i class="pi pi-folder mr-2"></i>Danh mục
        </label>
        <div class="p-3 bg-gray-50 rounded-lg">
          <Tag :value="account.category" severity="info" />
        </div>
      </div>

      <!-- Note -->
      <div class="field" v-if="account.encrypted_note || decryptedNote">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <i class="pi pi-file-edit mr-2"></i>Ghi chú
        </label>
        <div class="p-3 bg-gray-50 rounded-lg">
          <span v-if="!showNote && account.encrypted_note" class="text-gray-500 italic">
            Nhấn để xem ghi chú
            <Button
              icon="pi pi-eye"
              text
              size="small"
              class="ml-2"
              @click="toggleNoteVisibility"
              :loading="loadingNote"
            />
          </span>
          <div v-else-if="showNote" class="flex items-start gap-2">
            <span class="flex-1 whitespace-pre-wrap">{{ decryptedNote || 'Đang giải mã...' }}</span>
            <Button
              icon="pi pi-eye-slash"
              text
              size="small"
              @click="toggleNoteVisibility"
            />
          </div>
          <span v-else class="text-gray-400 italic">Không có ghi chú</span>
        </div>
      </div>

      <!-- Timestamps -->
      <div class="field">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <i class="pi pi-clock mr-2"></i>Thông tin thời gian
        </label>
        <div class="space-y-2 p-3 bg-gray-50 rounded-lg text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Ngày tạo:</span>
            <span class="font-medium">{{ formatDateTime(account.created_at) }}</span>
          </div>
          <div class="flex justify-between" v-if="account.updated_at !== account.created_at">
            <span class="text-gray-600">Cập nhật lần cuối:</span>
            <span class="font-medium">{{ formatDateTime(account.updated_at) }}</span>
          </div>
          <div class="flex justify-between" v-if="account.last_used_at">
            <span class="text-gray-600">Lần dùng cuối:</span>
            <span class="font-medium">{{ formatDateTime(account.last_used_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between w-full">
        <Button
          label="Đóng"
          severity="secondary"
          outlined
          @click="$emit('update:visible', false)"
        />
        <div class="flex gap-2">
          <Button
            label="Chỉnh sửa"
            icon="pi pi-pencil"
            severity="warning"
            outlined
            @click="handleEdit"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAccountsStore } from '@/stores/accounts'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Avatar from 'primevue/avatar'

const props = defineProps({
  visible: Boolean,
  account: Object
})

const emit = defineEmits(['update:visible', 'edit', 'needMasterPassword'])

const accountsStore = useAccountsStore()
const toast = useToast()

// State
const showPassword = ref(false)
const showNote = ref(false)
const decryptedPassword = ref('')
const decryptedNote = ref('')
const loadingPassword = ref(false)
const loadingNote = ref(false)
const copiedUsername = ref(false)
const copiedPassword = ref(false)

// Watch for account changes
watch(() => props.account, () => {
  // Reset state when account changes
  showPassword.value = false
  showNote.value = false
  decryptedPassword.value = ''
  decryptedNote.value = ''
  copiedUsername.value = false
  copiedPassword.value = false
})

// Methods
const togglePasswordVisibility = async () => {
  if (!showPassword.value) {
    // Show password - decrypt it
    loadingPassword.value = true
    try {
      decryptedPassword.value = await accountsStore.getDecryptedPassword(props.account)
      showPassword.value = true
    } catch (error) {
      // Check if error is related to master password
      if (error.message.includes('Master password') || error.message.includes('giải mã')) {
        emit('needMasterPassword', { type: 'viewPassword', account: props.account })
      }
      
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: error.message || 'Không thể giải mã mật khẩu',
        life: 3000
      })
    } finally {
      loadingPassword.value = false
    }
  } else {
    // Hide password
    showPassword.value = false
    decryptedPassword.value = ''
  }
}

const toggleNoteVisibility = async () => {
  if (!showNote.value) {
    // Show note - decrypt it
    loadingNote.value = true
    try {
      decryptedNote.value = await accountsStore.getDecryptedNote(props.account)
      showNote.value = true
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: error.message || 'Không thể giải mã ghi chú',
        life: 3000
      })
    } finally {
      loadingNote.value = false
    }
  } else {
    // Hide note
    showNote.value = false
    decryptedNote.value = ''
  }
}

const copyPassword = async () => {
  try {
    const result = await accountsStore.copyPassword(props.account)
    if (result.success) {
      copiedPassword.value = true
      setTimeout(() => {
        copiedPassword.value = false
      }, 2000)
      
      toast.add({
        severity: 'success',
        summary: 'Đã sao chép!',
        detail: 'Mật khẩu đã được sao chép vào clipboard',
        life: 2000
      })
    } else {
      // Check if error is related to master password
      if (result.error.includes('Master password') || result.error.includes('giải mã')) {
        emit('needMasterPassword', { type: 'copyPassword', account: props.account })
      }
      
      toast.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: result.error,
        life: 3000
      })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: error.message || 'Không thể sao chép mật khẩu',
      life: 3000
    })
  }
}

const copyToClipboard = async (text, type) => {
  try {
    await navigator.clipboard.writeText(text)
    if (type === 'username') {
      copiedUsername.value = true
      setTimeout(() => {
        copiedUsername.value = false
      }, 2000)
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Không thể sao chép vào clipboard',
      life: 3000
    })
  }
}

const getFullUrl = (url) => {
  if (!url) return ''
  
  // Add https:// if URL doesn't have a protocol
  if (!url.match(/^https?:\/\//i)) {
    return 'https://' + url
  }
  
  return url
}

const openWebsite = () => {
  const url = getFullUrl(props.account.website_url)
  window.open(url, '_blank')
}

const handleEdit = () => {
  emit('edit', props.account)
  emit('update:visible', false)
}

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.field {
  @apply mb-4;
}

.field label {
  @apply font-medium text-gray-700;
}
</style>

