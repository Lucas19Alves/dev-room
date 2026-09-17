<script setup>
defineProps({
  variant: { type: String, default: "primary" },
  busy: Boolean,
  disabled: Boolean,
  type: { type: String, default: "button" },
});
</script>
<template>
  <button
    :type="type"
    class="n-button"
    :class="`n-button--${variant}`"
    :disabled="disabled || busy"
    :aria-busy="busy || undefined"
  >
    <span v-if="busy" class="n-spinner" aria-hidden="true"></span><slot />
  </button>
</template>
