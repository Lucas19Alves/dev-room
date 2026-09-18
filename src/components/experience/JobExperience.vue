<script setup>
import FlowHome from "../FlowHome.vue";

defineProps({
  flow: { type: Object, required: true },
  update: { type: Object, default: null },
  experience: { type: Object, required: true },
});
defineEmits([
  "review",
  "metric",
  "action",
  "opportunity",
  "opportunity-status",
  "opportunity-update",
]);
</script>

<template>
  <FlowHome
    :flow="flow"
    :update="update"
    :experience="experience"
    @review="$emit('review')"
    @metric="$emit('metric', $event)"
    @action="(action, operation) => $emit('action', action, operation)"
    @opportunity="$emit('opportunity', $event)"
    @opportunity-update="$emit('opportunity-update', $event)"
    @opportunity-status="
      (id, status) => $emit('opportunity-status', id, status)
    "
  />
</template>
