<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { templates } from "../flow/catalog";
import BrandLogo from "./ui/BrandLogo.vue";
import PricingPlans from "./PricingPlans.vue";
defineProps({ signedIn: Boolean });
const emit = defineEmits(["enter", "login"]);
const selected = ref("enem");
const selectedTemplate = computed(() =>
  templates.find((template) => template.id === selected.value),
);
const landingRoot = ref(null);
let revealObserver;
const examples = [
  { id: "enem", label: "Estudar para o ENEM", icon: "✳" },
  { id: "code", label: "Construir um projeto", icon: "⌘" },
  { id: "week", label: "Organizar a semana", icon: "◈" },
  { id: "teacher", label: "Ensinar uma turma", icon: "⌁" },
];
onMounted(() => {
  if (
    !landingRoot.value ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    },
    { threshold: 0.14, rootMargin: "0px 0px -32px 0px" },
  );
  landingRoot.value
    .querySelectorAll(
      ".landing-section, .landing-continuity, .landing-final, .landing-values",
    )
    .forEach((section) => revealObserver.observe(section));
});
onUnmounted(() => revealObserver?.disconnect());
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
  <div ref="landingRoot" class="marketing">
    <header class="landing-nav">
      <a class="brand" href="/" aria-label="Noma — início"><BrandLogo /></a>
      <nav aria-label="Conheça o Noma">
        <a href="#como-funciona">Como funciona</a
        ><a href="#possibilidades">Possibilidades</a><a href="#planos">Planos</a
        ><a href="#perguntas">Perguntas</a>
      </nav>
      <div class="button-group">
        <a class="landing-plan-button" href="#planos">Planos</a>
        <button class="text-button landing-login-button" @click="emit('login')">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l4-4-4-4m4 4H3"
            />
          </svg>
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
          ferramentas e próximos passos reunidos em um Flow feito para você.
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
              <small>HOJE · ESTUDOS PARA O ENEM</small>
              <h2>Minha aprovação no ENEM</h2>
            </div>
            <span class="preview-avatar">L</span>
          </div>
          <div class="preview-status">
            <span>O próximo passo já está à vista.</span
            ><span>3 prioridades</span>
          </div>
          <div class="preview-experience">
            <div class="preview-now">
              <span>AGORA</span
              ><strong>Revisar funções antes de seguir para questões</strong
              ><button type="button" tabindex="-1">Começar por aqui ↗</button>
            </div>
            <div class="preview-flowline">
              <i></i
              ><span
                ><strong>Plano da semana</strong
                ><small>Matemática · 2 de 4 momentos</small></span
              ><b>50%</b>
            </div>
            <div class="preview-insight">
              <span>✳</span>
              <p>
                Na última prática, funções pediram mais atenção.<small
                  >O Noma trouxe esse tópico de volta.</small
                >
              </p>
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
            Comece com um modelo ou crie um caminho seu, sem precisar programar.
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
        <Transition name="intent-switch" mode="out-in">
          <article
            v-if="selectedTemplate"
            :key="selectedTemplate.id"
            class="intent-card"
            :class="selectedTemplate.color"
          >
            <span class="eyebrow">{{ selectedTemplate.category }}</span
            ><span class="intent-symbol">{{ selectedTemplate.icon }}</span>
            <h3>{{ selectedTemplate.name }}</h3>
            <p>{{ selectedTemplate.description }}</p>
            <span class="intent-count"
              >{{ selectedTemplate.components.length }} componentes para
              começar. Infinitas formas de ser seu.</span
            ><button
              class="dark-button"
              @click="emit('enter', selectedTemplate.id)"
            >
              Começar com este Flow ↗
            </button>
          </article>
          <article v-else key="teacher" class="intent-card mint intent-custom">
            <span class="eyebrow">UM FLOW SEU</span
            ><span class="intent-symbol">⌁</span>
            <h3>Uma experiência criada por você.</h3>
            <p>
              Monte módulos, atividades, materiais e prazos sem programar.
              Compartilhe a estrutura para cada aluno seguir seu próprio
              caminho.
            </p>
            <span class="intent-count"
              >Professor, turma ou um objetivo que ainda não tem modelo.</span
            ><button class="dark-button" @click="emit('enter', 'blank')">
              Conhecer o criador de Flows ↗
            </button>
          </article>
        </Transition>
      </div>
    </section>
    <section class="landing-continuity">
      <div>
        <span class="eyebrow">SEU PROGRESSO TEM HISTÓRIA</span>
        <h2>Pequenos passos.<br /><em>Uma jornada só sua.</em></h2>
        <p>
          Veja as decisões, os estudos e os passos que realmente aconteceram.
          Seu avanço não cabe apenas em horas de foco.
        </p>
        <button class="outline" @click="emit('enter')">
          Começar minha jornada ↗
        </button>
      </div>
      <div class="journey-illustration">
        <div class="journey-label">
          <strong>Um registro do que mudou</strong><span>✳</span>
        </div>
        <div class="sample-map" aria-hidden="true">
          <i
            v-for="n in 112"
            :key="n"
            :class="`sample-${(n * 7 + (n % 5)) % 4}`"
          ></i>
        </div>
        <span class="preview-caption">Exemplo ilustrativo do Flow Map</span>
        <p>Esta semana: uma prática concluída, um tópico revisado.</p>
      </div>
    </section>
    <section id="planos" class="landing-section landing-plans-section">
      <div class="landing-section-heading" style="padding-bottom: 2em;">
        <span class="eyebrow"
          >UM COMEÇO LEVE. MAIS ESPAÇO QUANDO PRECISAR.</span
        >
        <h2>Planos que acompanham<br /><em>o seu caminho.</em></h2>
        <p>
          Comece gratuitamente e conheça os recursos. Se quiser avançar, entre
          na sua conta para escolher o Pro.
        </p>
      </div>
      <PricingPlans
        mode="public"
        :signed-in="signedIn"
        @login="emit('login')"
        @enter="emit('enter')"
      />
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
