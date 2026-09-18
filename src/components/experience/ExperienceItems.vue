<script setup>
defineProps({
  items: { type: Array, default: () => [] },
  cards: { type: Boolean, default: false },
});
</script>

<template>
  <div
    v-if="items.length"
    :class="cards ? 'experience-item-grid' : 'experience-item-list'"
  >
    <article
      v-for="item in items"
      :key="item.id"
      :class="cards ? 'experience-item-card' : 'experience-item'"
    >
      <div :class="cards ? '' : 'experience-item__copy'">
        <small v-if="item.status || item.subtitle">{{
          item.subtitle || item.status
        }}</small>
        <strong>{{ item.title }}</strong>
      </div>
      <span v-if="item.dueAt || item.resource" class="experience-item__meta">
        {{ item.dueAt || "Recurso disponível" }}
      </span>
    </article>
  </div>
  <div v-else class="specialized-empty">
    <p>Nenhum item registrado ainda.</p>
  </div>
</template>
