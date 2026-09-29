<script setup>
defineProps({ name: String, tools: Array })
defineEmits(['open'])
</script>

<template>
  <section class="workspace-welcome" aria-label="Início">
    <div class="workspace-eyebrow"><span></span> SEU ESPAÇO DE TRABALHO</div>
    <h1>Menos distração.<br><span>Mais espaço para criar.</span></h1>
    <p>Bom ter você por aqui{{ name ? `, ${name}` : '' }}. Escolha uma ferramenta e faça o dia acontecer.</p>
    <div class="workspace-shortcuts">
      <button v-for="tool in tools" :key="tool.type" @click="$emit('open', tool.type)">
        <font-awesome-icon :icon="tool.icon" />
        <span>{{ tool.label }}<small>{{ tool.description }}</small></span>
        <span class="shortcut-arrow" aria-hidden="true">↗</span>
      </button>
    </div>
    <div class="workspace-footnote">Seu trabalho é salvo automaticamente neste navegador.</div>
  </section>
</template>
