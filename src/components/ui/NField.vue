<script setup>
defineProps({
  label: { type: String, required: true },
  hint: String,
  error: String,
  inputId: { type: String, required: true },
});
</script>
<template>
  <label class="n-field" :for="inputId">
    <span>{{ label }}</span
    ><slot />
    <small v-if="error" class="n-field__error" role="alert">{{ error }}</small>
    <small v-else-if="hint">{{ hint }}</small>
  </label>
</template>
