<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    header="Password Generator"
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
            v-tooltip.top="'Regenerate'"
            @click="generateNewPassword"
          />
          <Button
            icon="pi pi-copy"
            severity="info"
            outlined
            rounded
            v-tooltip.top="'Copy'"
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
          <span class="text-sm font-medium text-gray-700">Password Length</span>
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
          <label for="uppercase" class="text-sm">Uppercase Letters (A-Z)</label>
        </div>

        <div class="flex items-center gap-2">
          <Checkbox
            id="lowercase"
            v-model="options.includeLowercase"
            :binary="true"
            @change="generateNewPassword"
          />
          <label for="lowercase" class="text-sm">Lowercase Letters (a-z)</label>
        </div>

        <div class="flex items-center gap-2">
          <Checkbox
            id="numbers"
            v-model="options.includeNumbers"
            :binary="true"
            @change="generateNewPassword"
          />
          <label for="numbers" class="text-sm">Numbers (0-9)</label>
        </div>

        <div class="flex items-center gap-2">
          <Checkbox
            id="symbols"
            v-model="options.includeSymbols"
            :binary="true"
            @change="generateNewPassword"
          />
          <label for="symbols" class="text-sm">Symbols (!@#$%^&*)</label>
        </div>
      </div>

      <!-- Tips -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div class="flex gap-2">
          <i class="pi pi-info-circle text-blue-600 mt-0.5"></i>
          <div class="text-xs text-blue-800">
            <p class="font-medium mb-1">Password Security Tips:</p>
            <ul class="list-disc list-inside space-y-1">
              <li>Use at least 12 characters for better security</li>
              <li>Include a mix of character types</li>
              <li>Avoid common words or patterns</li>
              <li>Use unique passwords for each account</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between w-full">
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          @click="$emit('update:visible', false)"
        />
        <Button
          label="Use Password"
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
      summary: 'Error',
      detail: error.message || 'Failed to generate password',
      life: 3000
    })
  }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(generatedPassword.value)
    toast.add({
      severity: 'success',
      summary: 'Copied!',
      detail: 'Password copied to clipboard',
      life: 2000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to copy password',
      life: 3000
    })
  }
}

const usePassword = () => {
  emit('password-generated', generatedPassword.value)
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Password applied',
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

