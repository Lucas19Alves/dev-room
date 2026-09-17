<script setup>
import { ref } from "vue";
import { templates } from "../flow/catalog";
import BrandLogo from "./ui/BrandLogo.vue";
defineProps({ signedIn: Boolean });
const emit = defineEmits(["enter", "login"]);
const selected = ref("enem");
const examples = [
  { id: "enem", label: "Estudar para o ENEM", icon: "✳" },
  { id: "code", label: "Construir um projeto", icon: "⌘" },
  { id: "week", label: "Organizar a semana", icon: "◈" },
];
const faqs = [
  {
    q: "O que é um Flow?",
    a: "É um espaço preparado para um objetivo. Ele reúne contexto, ferramentas, execução, sessões e histórico de progresso.",
  },
  {
    q: "Posso montar meu espaço do zero?",
    a: "Sim. Use um modelo como ponto de partida ou escolha cada componente. Você pode adicionar, remover e reorganizar as ferramentas quando quiser.",
  },
  {
    q: "Meus conteúdos ficam públicos?",
    a: "Não. Seus Flows são privados. Se você publicar um modelo, somente a definição é compartilhada. Tarefas, notas, links e sessões continuam na sua conta.",
  },
  {
    q: "O que acontece se minha conexão cair?",
    a: "Suas alterações são salvas neste navegador. Ao reconectar, o Noma tenta sincronizar com sua conta. Se houver alterações conflitantes em outro dispositivo, você será avisado.",
  },
];
</script>
<template>
  <div class="marketing">
    <header class="landing-nav">
      <a class="brand" href="/" aria-label="Noma — início"><BrandLogo /></a>
      <nav aria-label="Conheça o Noma">
        <a href="#como-funciona">Como funciona</a
        ><a href="#possibilidades">Possibilidades</a
        ><a href="#perguntas">Perguntas</a>
      </nav>
      <div class="button-group">
        <button class="text-button" @click="emit('login')">
          {{ signedIn ? "Meu espaço" : "Entrar" }}</button
        ><button class="dark-button" @click="emit('enter')">
          {{ signedIn ? "Abrir Noma" : "Criar minha conta" }} ↗
        </button>
      </div>
    </header>
    <section class="landing-hero">
      <div class="landing-intro">
        <span class="hero-pill">✧ &nbsp; SEU OBJETIVO. SEU FLOW.</span>
        <h1>
          Um lugar para<br />o que você quer<br /><em>fazer acontecer.</em>
        </h1>
        <p>
          Diga o que quer realizar e receba um espaço preparado.<br />Contexto,
          ferramentas, sessões e progresso reunidos em um Flow.
        </p>
        <div class="landing-ctas">
          <button class="dark-button" @click="emit('enter')">
            Encontrar meu Flow <span>↗</span></button
          ><a class="landing-secondary" href="#como-funciona"
            >Conhecer o Noma <span>↓</span></a
          >
        </div>
        <div class="landing-assurances">
          <span>✓ &nbsp; Seu conteúdo é privado</span
          ><span>✓ &nbsp; Funciona mesmo offline</span>
        </div>
      </div>
      <div class="landing-preview">
        <div class="preview-bar">
          <span class="preview-dots">● ● ●</span
          ><span>Seu próximo passo, em um só lugar.</span><span>✧</span>
        </div>
        <div class="preview-canvas">
          <div class="preview-title">
            <div>
              <small>MEU FLOW / ESTUDOS</small>
              <h2>Minha aprovação no ENEM</h2>
            </div>
            <span class="preview-avatar">L</span>
          </div>
          <div class="preview-status">
            <span>● &nbsp; Um passo de cada vez.</span
            ><span>Em foco &nbsp; ◷</span>
          </div>
          <div class="preview-widgets">
            <div class="preview-widget preview-pomodoro">
              <header>◷ &nbsp; Pomodoro <span>···</span></header>
              <div class="preview-ring">
                <strong>24:59</strong><small>Tempo para focar</small>
              </div>
              <span class="preview-pause">Ⅱ &nbsp; Em andamento</span>
            </div>
            <div class="preview-widget">
              <header>☑ &nbsp; Checklist <span>···</span></header>
              <small class="preview-meta">1 de 3 passos concluídos</small>
              <p class="preview-task complete">
                <i>✓</i> Revisar o conteúdo de hoje
              </p>
              <p class="preview-task"><i></i> Resolver 10 questões</p>
              <p class="preview-task"><i></i> Esboçar minha redação</p>
              <span class="preview-add">＋ &nbsp; Um novo passo…</span>
            </div>
            <div class="preview-widget preview-note">
              <header>▤ &nbsp; Notas <span>···</span></header>
              <p>
                Não preciso fazer tudo hoje.<br />Só preciso dar o próximo
                passo.
              </p>
              <small>Deixe suas ideias por aqui.</small>
            </div>
            <div class="preview-widget preview-music">
              <header>♫ &nbsp; Música <span>···</span></header>
              <div>
                <span class="record-art">♫</span>
                <p>
                  Um pouco de calma<small>Sua trilha para se concentrar</small>
                </p>
              </div>
              <div class="preview-wave">
                <i
                  v-for="i in 24"
                  :key="i"
                  :style="{ height: 8 + ((i * 7) % 20) + 'px' }"
                ></i>
              </div>
            </div>
          </div>
        </div>
        <div class="preview-caption">
          Uma prévia do seu espaço. Você decide o que entra.
        </div>
      </div>
    </section>
    <div class="landing-values">
      <span>MENOS DISTRAÇÕES.</span><span>MAIS CLAREZA.</span
      ><span>NO SEU RITMO.</span><span>DO SEU JEITO.</span>
    </div>
    <section id="como-funciona" class="landing-section">
      <div class="landing-section-heading">
        <span class="eyebrow">DA INTENÇÃO À AÇÃO</span>
        <h2>Você traz o objetivo.<br />O espaço acompanha.</h2>
        <p>Não comece procurando ferramentas. Comece pelo que importa.</p>
      </div>
      <div class="landing-steps">
        <article>
          <span>01 / ESCOLHA</span>
          <div class="step-illustration">◈</div>
          <h3>O que você quer fazer?</h3>
          <p>
            Estudar, criar ou organizar. Encontre um modelo pensado para seu
            objetivo.
          </p>
        </article>
        <article>
          <span>02 / PERSONALIZE</span>
          <div class="step-illustration">▦</div>
          <h3>Um espaço com a sua cara.</h3>
          <p>
            Combine componentes, ajuste o tempo de foco e deixe só o que ajuda
            você.
          </p>
        </article>
        <article>
          <span>03 / CONTINUE</span>
          <div class="step-illustration">↗</div>
          <h3>Volte de onde parou.</h3>
          <p>
            Seu contexto, suas ideias e seu progresso ficam juntos para a
            próxima sessão.
          </p>
        </article>
      </div>
    </section>
    <section id="possibilidades" class="landing-section intentions">
      <div class="landing-section-heading">
        <span class="eyebrow">UM FLOW PARA CADA INTENÇÃO</span>
        <h2>Muitos objetivos.<br /><em>Um lugar para começar.</em></h2>
      </div>
      <div class="intent-layout">
        <div class="intent-options">
          <button
            v-for="item in examples"
            :key="item.id"
            :class="{ chosen: selected === item.id }"
            @click="selected = item.id"
          >
            <span>{{ item.icon }}</span
            ><strong>{{ item.label }}</strong
            ><span>↗</span></button
          ><button @click="emit('enter', 'blank')">
            <span>＋</span><strong>Quero criar do meu jeito</strong
            ><span>↗</span>
          </button>
        </div>
        <article
          v-for="template in templates.filter((t) => t.id === selected)"
          :key="template.id"
          class="intent-card"
          :class="template.color"
        >
          <span class="eyebrow">{{ template.category }}</span
          ><span class="intent-symbol">{{ template.icon }}</span>
          <h3>{{ template.name }}</h3>
          <p>{{ template.description }}</p>
          <span class="intent-count"
            >{{ template.components.length }} componentes para começar.
            Infinitas formas de ser seu.</span
          ><button class="dark-button" @click="emit('enter', template.id)">
            Começar com este Flow ↗
          </button>
        </article>
      </div>
    </section>
    <section class="landing-continuity">
      <div>
        <span class="eyebrow">SEU PROGRESSO TEM HISTÓRIA</span>
        <h2>Pequenos passos.<br /><em>Uma jornada só sua.</em></h2>
        <p>
          Conclua uma sessão, acompanhe seu tempo no Flow Map e leve um cartão
          do seu progresso com você. Sem competição. Sem pressa.
        </p>
        <button class="outline" @click="emit('enter')">
          Começar minha jornada ↗
        </button>
      </div>
      <div class="journey-illustration">
        <div class="journey-label">
          <strong>Dedicação que ganha forma</strong><span>✳</span>
        </div>
        <div class="sample-map" aria-hidden="true">
          <i
            v-for="n in 112"
            :key="n"
            :class="`sample-${(n * 7 + (n % 5)) % 4}`"
          ></i>
        </div>
        <span class="preview-caption">Exemplo ilustrativo do Flow Map</span>
        <p>Um próximo passo, todos os dias.</p>
      </div>
    </section>
    <section id="perguntas" class="landing-section faq-section">
      <div class="landing-section-heading">
        <span class="eyebrow">ANTES DE COMEÇAR</span>
        <h2>Um pouco mais<br />sobre seu novo espaço.</h2>
      </div>
      <div class="faq-list">
        <details v-for="faq in faqs" :key="faq.q">
          <summary>{{ faq.q }}<span>＋</span></summary>
          <p>{{ faq.a }}</p>
        </details>
      </div>
    </section>
    <section class="landing-final">
      <span>✧</span>
      <h2>Seu próximo passo<br />merece um espaço.</h2>
      <p>Encontre seu Flow. O resto começa com você.</p>
      <button class="dark-button" @click="emit('enter')">
        Criar meu primeiro Flow ↗
      </button>
    </section>
    <footer class="landing-footer">
      <a class="brand" href="/" aria-label="Noma — início"><BrandLogo /></a>
      <p>Um Flow preparado para o que você quer realizar.</p>
      <span>© {{ new Date().getFullYear() }} Noma</span>
    </footer>
  </div>
</template>
