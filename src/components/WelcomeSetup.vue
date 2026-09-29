<script setup>
import { ref } from 'vue'
const props = defineProps({ busy: Boolean, name: String })
defineEmits(['start', 'login'])
const name = ref(props.name || '')
</script>
<template>
  <div class="welcome-overlay">
    <section class="welcome-card" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <img src="/icons/dev-room-mark.svg" alt="" width="52" height="52">
      <div class="workspace-eyebrow">BEM-VINDO AO DEV ROOM</div>
      <h1 id="welcome-title">Um lugar para<br>entrar no ritmo.</h1>
      <p>Notas, tarefas, código e foco. Suas ferramentas favoritas, juntas em um espaço que é seu.</p>
      <form @submit.prevent="$emit('start', name.trim())">
        <label for="welcome-name">Como podemos chamar você?</label>
        <input id="welcome-name" v-model="name" maxlength="60" autocomplete="given-name" placeholder="Seu nome ou apelido (opcional)">
        <button class="welcome-primary" type="submit">Começar meu dia <span aria-hidden="true">→</span></button>
      </form>
      <button class="welcome-github" :disabled="busy" @click="$emit('login')"><font-awesome-icon icon="fa-brands fa-github" /> {{ busy ? 'Conectando…' : 'Conectar com GitHub' }}</button>
      <small>Use sem conta ou conecte o GitHub para sincronizar seu espaço.<br>O backup usa um repositório privado; o GitHub solicita acesso a repositórios.</small>
    </section>
  </div>
</template>
