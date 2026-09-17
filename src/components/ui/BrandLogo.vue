<script setup>
defineProps({ compact: Boolean, light: Boolean });
</script>
<template>
  <span class="noma-brand" :class="{ compact, light }">
    <img src="/icons/n-logo.png" alt="" />
    <strong v-if="!compact">noma</strong><span class="sr-only">Noma</span>
  </span>
</template>
