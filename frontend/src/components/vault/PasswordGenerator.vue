<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    header="Tạo mật khẩu tự động"
    :style="{ width: '500px' }"
    modal
  >
    <div class="space-y-4">
      <!-- Generated Password Display -->
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="font-mono text-lg flex-1 break-all">{{ generatedPassword }}</span>
          <Button
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            rounded
            v-tooltip.top="'Tạo lại'"
            @click="generateNewPassword"
          />
          <Button
            icon="pi pi-copy"
            severity="info"
            outlined
            rounded
            v-tooltip.top="'Sao chép'"
            @click="copyToClipboard"
          />
        </div>
        
        <!-- Strength Indicator -->
        <div class="flex items-center gap-2">
          <ProgressBar
            :value="passwordStrength * 25"
            :showValue="false"
            class="h-2 w-full"
            :class="{
              '!bg-red-500': passwordStrength <= 1,
              '!bg-orange-500': passwordStrength === 2,
              '!bg-yellow-500': passwordStrength === 3,
              '!bg-green-500': passwordStrength >= 4
            }"
          />
          <span class="text-xs font-medium whitespace-nowrap" :class="{
            'text-red-600': passwordStrength <= 1,
            'text-orange-600': passwordStrength === 2,
            'text-yellow-600': passwordStrength === 3,
            'text-green-600': passwordStrength >= 4
          }">
            {{ strengthLabel }}
          </span>
        </div>
      </div>

      <!-- Length Slider -->
      <div class="field">
        <label class="flex justify-between items-center mb-2">
          <span class="text-sm font-medium text-gray-700">Độ dài mật khẩu</span>
          <span class="text-sm font-bold text-blue-600">{{ options.length }}</span>
        </label>
        <Slider
          v-model="options.length"
          :min="8"
          :max="64"
          @change="generateNewPassword"
        />
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>8</span>
          <span>64</span>
        </div>
      </div>

      <!-- Character Options -->
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <Checkbox
            id="uppercase"
            v-model="options.includeUppercase"
            :binary="true"
            @change="generateNewPassword"
          />
          <label for="uppercase" class="text-sm">Chữ hoa (A-Z)</label>
        </div>

        <div class="flex items-center gap-2">
          <Checkbox
            id="lowercase"
            v-model="options.includeLowercase"
            :binary="true"
            @change="generateNewPassword"
          />
          <label for="lowercase" class="text-sm">Chữ thường (a-z)</label>
        </div>

        <div class="flex items-center gap-2">
          <Checkbox
            id="numbers"
            v-model="options.includeNumbers"
            :binary="true"
            @change="generateNewPassword"
          />
          <label for="numbers" class="text-sm">Số (0-9)</label>
        </div>

        <div class="flex items-center gap-2">
          <Checkbox
            id="symbols"
            v-model="options.includeSymbols"
            :binary="true"
            @change="generateNewPassword"
          />
          <label for="symbols" class="text-sm">Ký tự đặc biệt (!@#$%^&*)</label>
        </div>
      </div>

      <!-- Tips -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div class="flex gap-2">
          <i class="pi pi-info-circle text-blue-600 mt-0.5"></i>
          <div class="text-xs text-blue-800">
            <p class="font-medium mb-1">Mẹo bảo mật mật khẩu:</p>
            <ul class="list-disc list-inside space-y-1">
              <li>Sử dụng ít nhất 12 ký tự để bảo mật tốt hơn</li>
              <li>Kết hợp nhiều loại ký tự</li>
              <li>Tránh các từ hoặc mẫu phổ biến</li>
              <li>Sử dụng mật khẩu riêng cho mỗi tài khoản</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between w-full">
        <Button
          label="Hủy"
          severity="secondary"
          outlined
          @click="$emit('update:visible', false)"
        />
        <Button
          label="Sử dụng mật khẩu"
          @click="usePassword"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { generatePassword, calculatePasswordStrength, getPasswordStrengthInfo } from '@/utils/crypto'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Slider from 'primevue/slider'
import Checkbox from 'primevue/checkbox'
import ProgressBar from 'primevue/progressbar'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['update:visible', 'password-generated'])

const toast = useToast()

// State
const generatedPassword = ref('')
const options = reactive({
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true
})

// Computed
const passwordStrength = computed(() => {
  return calculatePasswordStrength(generatedPassword.value)
})

const strengthLabel = computed(() => {
  const info = getPasswordStrengthInfo(passwordStrength.value)
  return info.label
})

// Methods
const generateNewPassword = () => {
  try {
    generatedPassword.value = generatePassword(options)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: error.message || 'Không thể tạo mật khẩu',
      life: 3000
    })
  }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(generatedPassword.value)
    toast.add({
      severity: 'success',
      summary: 'Đã sao chép!',
      detail: 'Mật khẩu đã được sao chép vào clipboard',
      life: 2000
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Không thể sao chép mật khẩu',
      life: 3000
    })
  }
}

const usePassword = () => {
  emit('password-generated', generatedPassword.value)
  toast.add({
    severity: 'success',
    summary: 'Thành công',
    detail: 'Mật khẩu đã được áp dụng',
    life: 2000
  })
}

// Watch for dialog visibility
watch(() => props.visible, (newVal) => {
  if (newVal) {
    generateNewPassword()
  }
}, { immediate: true })
</script>

<style scoped>
.field {
  @apply mb-4;
}
</style>

