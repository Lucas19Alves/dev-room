<script setup>
import ProductState from "./ProductState.vue";
defineProps({ caption: String, state: String, stateText: String });
</script>
<template>
  <div class="tool-layout">
    <div v-if="caption || $slots.actions" class="tool-layout__top">
      <p v-if="caption" class="tool-caption">{{ caption }}</p>
      <div><slot name="actions" /></div>
    </div>
    <ProductState v-if="state" :kind="state" :title="stateText" compact
      ><slot name="state-action"
    /></ProductState>
    <slot v-else />
    <div v-if="$slots.footer" class="tool-layout__footer">
      <slot name="footer" />
    </div>
  </div>
</template>
