<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :header="isEditMode ? 'Sửa tài khoản' : 'Thêm tài khoản mới'"
    :style="{ width: '600px' }"
    modal
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Service Name -->
      <div class="field">
        <label for="service_name" class="block text-sm font-medium text-gray-700 mb-2">
          Tên dịch vụ *
        </label>
        <InputText
          id="service_name"
          v-model="form.service_name"
          placeholder="Ví dụ: Gmail, Facebook, GitHub"
          class="w-full"
          :class="{ 'p-invalid': errors.service_name }"
          required
        />
        <small v-if="errors.service_name" class="text-red-500">{{ errors.service_name }}</small>
      </div>

      <!-- Username/Email -->
      <div class="field">
        <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
          Tên đăng nhập/Email *
        </label>
        <InputText
          id="username"
          v-model="form.username"
          placeholder="email@example.com hoặc tên đăng nhập"
          class="w-full"
          :class="{ 'p-invalid': errors.username }"
          required
        />
        <small v-if="errors.username" class="text-red-500">{{ errors.username }}</small>
      </div>

      <!-- Password -->
      <div class="field">
        <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
          Mật khẩu *
        </label>
        <div class="flex gap-2">
          <Password
            id="password"
            v-model="form.password"
            :placeholder="isEditMode ? 'Để trống để giữ mật khẩu hiện tại' : 'Nhập mật khẩu'"
            class="flex-1"
            :class="{ 'p-invalid': errors.password }"
            :feedback="false"
            toggleMask
            :required="!isEditMode"
            :pt="{
              input: {
                class: 'w-full px-3 py-2',
                style: 'width: 100% !important; min-width: 100% !important;'
              },
              root: {
                class: 'w-full',
                style: 'width: 100% !important;'
              }
            }"
          />
          <Button
            type="button"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            v-tooltip.top="'Tạo mật khẩu tự động'"
            @click="showPasswordGenerator = true"
          />
        </div>
        <small v-if="errors.password" class="text-red-500">{{ errors.password }}</small>
        
        <!-- Password Strength Indicator -->
        <div v-if="form.password" class="mt-2">
          <div class="flex items-center gap-2">
            <ProgressBar
              :value="passwordStrength * 25"
              :showValue="false"
              :class="{
                'h-2 w-full': true,
                '!bg-red-500': passwordStrength <= 1,
                '!bg-orange-500': passwordStrength === 2,
                '!bg-yellow-500': passwordStrength === 3,
                '!bg-green-500': passwordStrength >= 4
              }"
            />
            <span class="text-xs font-medium" :class="{
              'text-red-600': passwordStrength <= 1,
              'text-orange-600': passwordStrength === 2,
              'text-yellow-600': passwordStrength === 3,
              'text-green-600': passwordStrength >= 4
            }">
              {{ strengthLabel }}
            </span>
          </div>
        </div>
      </div>

      <!-- Website URL -->
      <div class="field">
        <label for="website_url" class="block text-sm font-medium text-gray-700 mb-2">
          Website URL
        </label>
        <InputText
          id="website_url"
          v-model="form.website_url"
          placeholder="https://example.com"
          class="w-full"
        />
      </div>

      <!-- Category -->
      <div class="field">
        <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
          Danh mục
        </label>
        <Dropdown
          id="category"
          v-model="form.category"
          :options="accountsStore.categories"
          placeholder="Chọn danh mục"
          class="w-full"
        />
      </div>

      <!-- Note -->
      <div class="field">
        <label for="note" class="block text-sm font-medium text-gray-700 mb-2">
          Ghi chú
        </label>
        <Textarea
          id="note"
          v-model="form.note"
          placeholder="Ghi chú bổ sung (tùy chọn)"
          rows="3"
          class="w-full"
        />
      </div>

      <!-- Favorite -->
      <div class="field flex items-center gap-2">
        <Checkbox
          id="favorite"
          v-model="form.favorite"
          :binary="true"
        />
        <label for="favorite" class="text-sm font-medium text-gray-700">
          Đánh dấu yêu thích
        </label>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-between w-full">
        <Button
          label="Hủy"
          severity="secondary"
          outlined
          @click="$emit('update:visible', false)"
        />
        <Button
          :label="isEditMode ? 'Cập nhật' : 'Lưu'"
          :loading="accountsStore.loading"
          @click="handleSubmit"
        />
      </div>
    </template>

    <!-- Password Generator Dialog -->
    <PasswordGenerator
      v-model:visible="showPasswordGenerator"
      @password-generated="handlePasswordGenerated"
    />
  </Dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useAccountsStore } from '@/stores/accounts'
import { calculatePasswordStrength, getPasswordStrengthInfo } from '@/utils/crypto'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import PasswordGenerator from './PasswordGenerator.vue'

const props = defineProps({
  visible: Boolean,
  account: Object
})

const emit = defineEmits(['update:visible', 'saved'])

const accountsStore = useAccountsStore()

// State
const showPasswordGenerator = ref(false)
const errors = reactive({})

// Form data
const form = reactive({
  service_name: '',
  username: '',
  password: '',
  website_url: '',
  category: 'General',
  note: '',
  favorite: false
})

// Computed
const isEditMode = computed(() => !!props.account)

const passwordStrength = computed(() => {
  return calculatePasswordStrength(form.password)
})

const strengthLabel = computed(() => {
  const info = getPasswordStrengthInfo(passwordStrength.value)
  return info.label
})

// Watch for account prop changes
watch(() => props.account, async (newAccount) => {
  if (newAccount) {
    // Load account data for editing
    form.service_name = newAccount.service_name
    form.username = newAccount.username
    form.website_url = newAccount.website_url || ''
    form.category = newAccount.category
    form.favorite = newAccount.favorite
    
    // Decrypt note if exists
    if (newAccount.encrypted_note) {
      try {
        form.note = await accountsStore.getDecryptedNote(newAccount)
      } catch {
        form.note = ''
      }
    } else {
      form.note = ''
    }
    
    form.password = '' // Don't load password for security
  } else {
    // Reset form for new account
    Object.assign(form, {
      service_name: '',
      username: '',
      password: '',
      website_url: '',
      category: 'General',
      note: '',
      favorite: false
    })
  }
  
  // Clear errors
  Object.keys(errors).forEach(key => delete errors[key])
}, { immediate: true })

// Methods
const validateForm = () => {
  Object.keys(errors).forEach(key => delete errors[key])
  
  if (!form.service_name) {
    errors.service_name = 'Tên dịch vụ là bắt buộc'
  }
  
  if (!form.username) {
    errors.username = 'Tên đăng nhập là bắt buộc'
  }
  
  if (!isEditMode.value && !form.password) {
    errors.password = 'Mật khẩu là bắt buộc'
  }
  
  return Object.keys(errors).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  try {
    let result
    
    if (isEditMode.value) {
      // Update existing account
      const updateData = {
        service_name: form.service_name,
        username: form.username,
        website_url: form.website_url,
        category: form.category,
        favorite: form.favorite,
        note: form.note
      }
      
      // Only include password if changed
      if (form.password) {
        updateData.password = form.password
      }
      
      result = await accountsStore.updateAccount(props.account.id, updateData)
    } else {
      // Create new account
      result = await accountsStore.createAccount(form)
    }
    
    if (result.success) {
      emit('saved')
      emit('update:visible', false)
    } else {
      // Display error
      console.error('Save failed:', result.error)
      
      // If error is an object (validation errors), display them
      if (typeof result.error === 'object') {
        Object.keys(result.error).forEach(key => {
          errors[key] = Array.isArray(result.error[key]) 
            ? result.error[key][0] 
            : result.error[key]
        })
      }
    }
  } catch (error) {
    console.error('Error saving account:', error)
  }
}

const handlePasswordGenerated = (password) => {
  form.password = password
  showPasswordGenerator.value = false
}
</script>

<style scoped>
.field {
  @apply mb-4;
}

.field label {
  @apply font-medium text-gray-700;
}

/* Force full width for password inputs in flex container */
:deep(.p-password) {
  width: 100% !important;
  flex: 1 !important;
}

:deep(.p-password .p-inputtext) {
  width: 100% !important;
  min-width: 100% !important;
}

:deep(.p-password-input) {
  width: 100% !important;
  min-width: 100% !important;
}

/* Ensure flex container takes full width */
.flex.gap-2 {
  width: 100%;
}

.flex-1 {
  flex: 1 !important;
  width: 100% !important;
}
</style>

