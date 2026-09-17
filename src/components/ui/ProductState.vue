<script setup>
defineProps({
  kind: { type: String, default: "empty" },
  title: String,
  description: String,
  compact: Boolean,
});
</script>
<template>
  <div
    class="product-state"
    :class="[`product-state--${kind}`, { compact }]"
    :role="kind === 'error' ? 'alert' : 'status'"
  >
    <span class="product-state__icon" aria-hidden="true">{{
      {
        loading: "◌",
        empty: "✳",
        error: "!",
        offline: "↯",
        syncing: "↻",
        success: "✓",
      }[kind]
    }}</span>
    <div>
      <strong>{{ title }}</strong>
      <p v-if="description">{{ description }}</p>
    </div>
    <slot />
  </div>
</template>
