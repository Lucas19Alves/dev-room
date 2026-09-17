<script setup>
defineProps({ labelledby: { type: String, default: "modal-title" } });
defineEmits(["close"]);
</script>
<template>
  <div class="n-modal-backdrop modal-backdrop" @click.self="$emit('close')">
    <section
      class="n-modal modal"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="labelledby"
      tabindex="-1"
    >
      <button
        class="n-modal__close modal-close"
        aria-label="Fechar diálogo"
        @click="$emit('close')"
      >
        ×
      </button>
      <slot />
    </section>
  </div>
</template>
