<script setup>
import { nextTick, ref } from "vue";
import { usePlatform } from "./flow/usePlatform";
import BrandLogo from "./components/ui/BrandLogo.vue";
import ProductState from "./components/ui/ProductState.vue";
import NModal from "./components/ui/NModal.vue";
import FlowOnboarding from "./components/FlowOnboarding.vue";
import FlowReview from "./components/FlowReview.vue";
import OverviewPage from "./components/OverviewPage.vue";
import FlowBuilder from "./components/FlowBuilder.vue";
import AccountPanel from "./components/AccountPanel.vue";
import PlanPanel from "./components/PlanPanel.vue";
import SettingsIcon from "./components/ui/SettingsIcon.vue";
const mobileMenuOpen = ref(false);
const mobileMenuButton = ref(null);
const sidebarCloseButton = ref(null);
function openMobileMenu() {
  mobileMenuOpen.value = true;
  nextTick(() => sidebarCloseButton.value?.focus());
}
function closeMobileMenu() {
  mobileMenuOpen.value = false;
  if (!modal.value) nextTick(() => mobileMenuButton.value?.focus());
}
function openSettings() {
  modal.value = "account";
  mobileMenuOpen.value = false;
  nextTick(() => document.querySelector(".n-modal")?.focus());
}
function setMobileMenuButton(element) {
  mobileMenuButton.value = element;
}
function setSidebarCloseButton(element) {
  sidebarCloseButton.value = element;
}
const {
  components,
  componentIds,
  componentTypes,
  activeComponents,
  templates,
  discoverableTemplates,
  store,
  supabase,
  syncNow,
  exportBackup,
  loadCloudVersion,
  importGuest,
  initialize,
  safeUrl,
  tools,
  page,
  filter,
  search,
  activeId,
  modal,
  step,
  draft,
  flowName,
  displayName,
  email,
  message,
  paywallFlow,
  busy,
  adding,
  newTask,
  linkTitle,
  linkUrl,
  community,
  communityLoading,
  communityError,
  savedFlows,
  showArchived,
  archiveFlow,
  now,
  can,
  billingState,
  previewTemplate,
  viewTemplate,
  experienceView,
  executeOverviewAction,
  summary,
  active,
  activeDefinitionUpdate,
  experience,
  experienceComponent,
  categories,
  filtered,
  sessions,
  totalMinutes,
  completed,
  remainingTasks,
  taskGroups,
  session,
  seconds,
  clock,
  focusRunningFor,
  focusBreakFor,
  focusDisplayFor,
  activity,
  perform,
  choose,
  toggleComponent,
  createFlow,
  openFlow,
  update,
  updateManualMetric,
  executeAction,
  executeCommand,
  createOpportunity,
  updateOpportunity,
  updateOpportunityStatus,
  addTask,
  addLink,
  editComponents,
  removeComponent,
  moveComponent,
  toggleSession,
  finishSession,
  toggleFocus,
  resetFocus,
  downloadCard,
  navigate,
  publish,
  shareLink,
  sendLink,
  deleteTemplate,
  deleteFlow,
  finishReview,
  delayReview,
  dismissReview,
  signOut,
  copyLink,
} = usePlatform();
</script>
<template>
  <div class="platform" @keydown.esc="closeMobileMenu">
    <button
      v-if="mobileMenuOpen"
      class="mobile-drawer-scrim"
      aria-label="Fechar navegação"
      @click="closeMobileMenu"
    ></button>
    <aside
      id="main-navigation"
      class="sidebar"
      :class="{ 'mobile-drawer-open': mobileMenuOpen }"
      :inert="modal ? true : undefined"
      @keydown.esc.stop="closeMobileMenu"
    >
      <div class="sidebar-mobile-head">
        <a
          class="brand"
          href="#"
          aria-label="Noma — descobrir Flows"
          @click.prevent="
            closeMobileMenu();
            navigate('explore');
          "
          ><BrandLogo
        /></a>
        <button
          class="sidebar-close-button"
          aria-label="Fechar navegação"
          :ref="setSidebarCloseButton"
          @click="closeMobileMenu"
        >
          ×
        </button>
      </div>
      <a
        class="brand sidebar-desktop-brand"
        href="#"
        aria-label="Noma — descobrir Flows"
        @click.prevent="
          closeMobileMenu();
          navigate('explore');
        "
        ><BrandLogo
      /></a>
      <div class="workspace-label">ESPAÇO PESSOAL <span>⌄</span></div>
      <nav aria-label="Navegação principal" @click="closeMobileMenu">
        <button
          aria-label="Hoje"
          :class="{ selected: page === 'today' }"
          @click="navigate('today')"
        >
          <span>◷</span> Hoje
        </button>
        <button
          aria-label="Calendário"
          :class="{ selected: page === 'calendar' }"
          @click="navigate('calendar')"
        >
          <span>▦</span> Calendário
        </button>
        <button
          aria-label="Descobrir Flows"
          :class="{ selected: page === 'explore' }"
          @click="navigate('explore')"
        >
          <span>◈</span> Descobrir Flows <b>NOVO</b>
        </button>
        <button
          aria-label="Meus Flows"
          :class="{ selected: page === 'flows' || page === 'workspace' }"
          @click="navigate('flows')"
        >
          <span>▦</span> Meus Flows
          <small>{{ store.account.flows.length }}</small>
        </button>
        <button
          aria-label="Minha jornada"
          :class="{ selected: page === 'history' }"
          @click="navigate('history')"
        >
          <span>◷</span> Minha jornada
        </button>
        <button
          aria-label="Comunidade"
          :class="{ selected: page === 'community' }"
          @click="navigate('community')"
        >
          <span>◎</span> Comunidade
        </button>
        <button
          class="mobile-account-link"
          :class="{ selected: modal === 'account' }"
          aria-label="Configurações"
          @click="openSettings"
        >
          <SettingsIcon />
          Configurações
        </button>
      </nav>
      <div v-if="store.account.flows.length" class="recent">
        <p>SEUS ESPAÇOS</p>
        <button
          v-for="flow in store.account.flows.slice(0, 5)"
          :key="flow.id"
          @click="
            openFlow(flow);
            closeMobileMenu();
          "
        >
          <i :class="flow.identity.color"></i>{{ flow.identity.name }}
        </button>
      </div>
      <div class="sidebar-bottom">
        <div class="small-promo">
          <span>✧</span
          ><strong>Grandes coisas começam<br />com um pequeno Flow.</strong>
          <p>Encontre espaço para o que importa.</p>
        </div>
        <button class="profile" @click="openSettings">
          <span class="avatar">{{
            (store.account.name || "V").slice(0, 1).toUpperCase()
          }}</span
          ><span
            ><strong>{{
              store.account.name || "Seu espaço começa aqui"
            }}</strong
            ><small>{{
              store.user ? "Conta conectada" : "Modo local · neste dispositivo"
            }}</small></span
          ><span class="profile-settings-icon" aria-hidden="true">
            <SettingsIcon />
          </span>
        </button>
      </div>
    </aside>
    <main :inert="modal || mobileMenuOpen ? true : undefined">
      <header class="topbar">
        <div class="topbar-context">
          <button
            class="mobile-menu-trigger"
            aria-label="Abrir menu de navegação"
            aria-controls="main-navigation"
            :aria-expanded="mobileMenuOpen"
            :ref="setMobileMenuButton"
            @click="openMobileMenu"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span class="breadcrumb">Seu espaço</span><span class="slash">/</span
          >{{
            {
              explore: "Descobrir Flows",
              today: "Hoje",
              calendar: "Calendário",
              flows: "Meus Flows",
              workspace: active?.identity.name,
              history: "Minha jornada",
              community: "Comunidade",
            }[page]
          }}
        </div>
        <div class="top-actions">
          <span class="sync"><i></i>{{ store.status }}</span>
          <button
            class="plan-topbar-button"
            :class="{
              'plan-topbar-button-active':
                billingState.available && can('unlimitedFlows'),
            }"
            :aria-label="
              billingState.available && can('unlimitedFlows')
                ? 'Noma Pro ativo'
                : 'Conhecer os planos'
            "
            @click="modal = 'plans'"
          >
            <span class="plan-topbar-mark" aria-hidden="true">
              <svg viewBox="0 0 20 20">
                <path
                  d="M10 1.8 12.4 7.6 18.7 8.2 14 12.3 15.4 18.4 10 15.2 4.6 18.4 6 12.3 1.3 8.2 7.6 7.6 10 1.8Z"
                />
              </svg>
            </span>
            <span class="plan-topbar-copy">
              <strong>{{
                billingState.available && can("unlimitedFlows")
                  ? "Pro ativo"
                  : "Planos"
              }}</strong>
              <small>{{
                billingState.available && can("unlimitedFlows")
                  ? "Sua assinatura"
                  : "Conheça Free e Pro"
              }}</small>
            </span>
          </button>
          <button
            class="icon-button"
            aria-label="Configurações"
            @click="openSettings"
          >
            <SettingsIcon />
          </button>
        </div>
      </header>
      <div v-if="store.error" class="alert" role="alert">
        {{ store.error }}
        <template v-if="store.conflict"
          ><button @click="exportBackup">Exportar cópia local</button
          ><button @click="perform(loadCloudVersion)">
            Carregar versão da nuvem
          </button></template
        ><button v-else-if="store.ready" @click="syncNow">
          Tentar novamente
        </button>
      </div>
      <ProductState
        v-if="!store.ready"
        :kind="store.error ? 'error' : 'loading'"
        :title="
          store.error
            ? 'Não foi possível abrir seu espaço'
            : 'Preparando seu espaço…'
        "
        :description="store.error"
        ><button v-if="store.error" class="outline" @click="initialize">
          Tentar novamente
        </button></ProductState
      >
      <div v-else class="content">
        <template v-if="page === 'explore' || page === 'community'">
          <div class="eyebrow">
            {{
              page === "community"
                ? "PONTOS DE PARTIDA COMPARTILHADOS"
                : "UM OBJETIVO, UM PRÓXIMO PASSO"
            }}
          </div>
          <div class="page-heading">
            <div>
              <h1>
                {{
                  page === "community"
                    ? "Bons Flows merecem ser compartilhados."
                    : "O que você quer colocar em movimento?"
                }}
              </h1>
              <p>
                {{
                  page === "community"
                    ? "Conheça um Flow e leve apenas a estrutura para o seu espaço."
                    : "Comece pelo resultado que importa. O caminho pode se adaptar com você."
                }}
              </p>
            </div>
            <button class="outline" @click="choose(templates[5])">
              ＋ Criar do zero
            </button>
          </div>
          <section v-if="page === 'explore'" class="hero">
            <div class="hero-copy">
              <span class="hero-pill"
                ><span>✧</span> UM NOVO JEITO DE ENTRAR NO RITMO</span
              >
              <h2>
                Um espaço que se adapta<br />ao <em>seu próximo passo.</em>
              </h2>
              <p>
                Estudar, criar, organizar ou recomeçar. Encontre seu próximo
                passo<br class="desktop-only" />
                em um Flow feito para o que você quer realizar.
              </p>
              <button class="dark-button" @click="choose(templates[0])">
                Encontrar meu primeiro Flow <span>↗</span></button
              ><small>Personalizável por você. Pronto para começar.</small>
            </div>
            <div class="hero-art" aria-hidden="true">
              <div class="orbit orbit-one"></div>
              <div class="orbit orbit-two"></div>
              <div class="art-spark">✧</div>
              <div class="mini-card mini-focus">
                <span>◷ &nbsp; TEMPO PARA FOCAR</span><strong>25:00</strong>
                <div class="mini-progress"></div>
                <small>Uma coisa de cada vez.</small>
              </div>
              <div class="mini-card mini-tasks">
                <span>☑ &nbsp; MEU PRÓXIMO PASSO</span>
                <p><b>✓</b> Encontrar meu objetivo</p>
                <p><b>✓</b> Preparar meu espaço</p>
                <p><i></i> Fazer acontecer</p>
              </div>
              <div class="floating-label">✳ &nbsp; No seu ritmo.</div>
            </div>
          </section>
          <div class="section-title">
            <div>
              <h2>
                {{
                  page === "community"
                    ? "Feitos pela comunidade"
                    : "Um Flow para cada intenção"
                }}
              </h2>
              <p>
                {{
                  page === "community"
                    ? "Configurações compartilhadas. O conteúdo do seu espaço continua só seu."
                    : "Experiências para começar por um objetivo. Crie uma sua quando quiser."
                }}
              </p>
            </div>
            <span v-if="page === 'explore'" class="count"
              >{{ discoverableTemplates.length }} pontos de partida</span
            >
          </div>
          <div class="filter-row">
            <div class="filters">
              <button
                v-for="category in categories"
                :key="category"
                :class="{ active: filter === category }"
                @click="filter = category"
              >
                {{ category }}
              </button>
            </div>
            <label class="search"
              ><span>⌕</span
              ><input
                v-model="search"
                placeholder="Buscar um Flow…"
                aria-label="Buscar um Flow"
            /></label>
          </div>
          <div class="template-grid">
            <article
              v-for="template in filtered"
              :key="template.id"
              class="template-card"
            >
              <div class="card-visual" :class="template.color">
                <span class="card-category">{{ template.category }}</span
                ><span v-if="template.tier === 'pro'" class="template-tier"
                  >NOMA PRO</span
                ><span class="large-symbol">{{ template.icon }}</span>
                <div class="visual-lines"><i></i><i></i><i></i></div>
                <span class="card-star">✧</span>
              </div>
              <div class="card-body">
                <small>{{ template.tag || "DA COMUNIDADE" }}</small>
                <h3>{{ template.name }}</h3>
                <p>{{ template.description }}</p>
                <div class="card-context">
                  <span>{{ template.objective || template.description }}</span>
                </div>
                <div class="card-footer">
                  <span>{{
                    template.owner ? "Comunidade Noma" : "Por Noma"
                  }}</span
                  ><button @click="viewTemplate(template)">Conhecer ↗</button
                  ><button @click="choose(template)">
                    {{
                      template.tier === "pro" && !can("unlimitedFlows")
                        ? "Conhecer Pro"
                        : template.id === "blank"
                          ? "Criar Flow"
                          : "Usar Flow"
                    }}
                    ↗
                  </button>
                </div>
                <button
                  v-if="template.owner && template.owner === store.user?.id"
                  class="text-button"
                  @click="perform(() => deleteTemplate(template.id))"
                >
                  Retirar publicação
                </button>
              </div>
            </article>
          </div>
          <ProductState
            v-if="page === 'community' && communityLoading"
            kind="loading"
            title="Buscando Flows compartilhados…"
            compact
          />
          <ProductState
            v-else-if="page === 'community' && communityError"
            kind="offline"
            title="Seus próprios Flows continuam disponíveis."
            :description="communityError"
            compact
            ><button class="outline" @click="perform(loadCommunity)">
              Tentar novamente
            </button></ProductState
          >
          <div v-if="!filtered.length" class="empty">
            <h3>
              {{
                page === "community"
                  ? "Ainda não há modelos públicos."
                  : "Nenhum Flow encontrado."
              }}
            </h3>
            <p>
              {{
                page === "community"
                  ? "Quando alguém publicar um ponto de partida, você poderá encontrá-lo aqui."
                  : "Tente outra busca ou crie um Flow do seu jeito."
              }}
            </p>
          </div>
          <div v-if="page === 'explore'" class="bottom-note">
            <span>◈</span> Escolha um ponto de partida ou crie um caminho seu.
          </div>
        </template>
        <template v-else-if="page === 'today' || page === 'calendar'">
          <OverviewPage
            :view="page"
            :flows="store.account.flows"
            :now="now"
            :full-history="can('fullHistory')"
            @open="openFlow"
            @action="executeOverviewAction"
            @discover="navigate('explore')"
            @plans="modal = 'account'"
          />
        </template>
        <template v-else-if="page === 'flows'">
          <div class="eyebrow">SEU PRÓXIMO PASSO ESTÁ AQUI</div>
          <div class="page-heading">
            <div>
              <h1>
                {{
                  store.account.name
                    ? `Bom te ver, ${store.account.name}.`
                    : "Encontre o seu ritmo."
                }}
              </h1>
              <p>Seu contexto continua aqui. Retome de onde parou.</p>
            </div>
            <button class="dark-button" @click="navigate('explore')">
              ＋ Novo Flow
            </button>
          </div>
          <div class="flow-list-controls">
            <span class="flow-list-status">{{
              showArchived ? "Flows arquivados" : "Flows ativos"
            }}</span>
            <button
              class="text-button flow-list-archive-link"
              @click="showArchived = !showArchived"
            >
              {{ showArchived ? "Ver ativos" : "Ver arquivados" }}
            </button>
            <small v-if="!can('unlimitedFlows')" class="flow-list-plan"
              >{{ savedFlows.length }} de 3 espaços ativos no plano Free</small
            >
          </div>
          <div class="stats">
            <div>
              <small>SEUS ESPAÇOS</small
              ><strong>{{ store.account.flows.length }}</strong>
            </div>
            <div>
              <small>TEMPO DEDICADO</small
              ><strong>{{ totalMinutes }} <em>min</em></strong>
            </div>
            <div>
              <small>SESSÕES CONCLUÍDAS</small
              ><strong>{{ sessions.length }}</strong>
            </div>
          </div>
          <section v-if="session" class="resume">
            <div>
              <span class="eyebrow">UMA SESSÃO EM ANDAMENTO</span>
              <h2>
                {{
                  store.account.flows.find((f) => f.id === session.flowId)
                    ?.identity.name
                }}
              </h2>
              <p>{{ clock(seconds) }} de dedicação até agora.</p>
            </div>
            <button
              class="dark-button"
              @click="
                openFlow(
                  store.account.flows.find((f) => f.id === session.flowId),
                )
              "
            >
              Continuar sessão ↗
            </button>
          </section>
          <div class="template-grid">
            <article
              v-for="flow in savedFlows"
              :key="flow.id"
              class="saved-flow"
            >
              <span class="flow-icon" :class="flow.identity.color">{{
                flow.identity.icon
              }}</span
              ><small>{{ flow.identity.category }}</small>
              <h2>{{ flow.identity.name }}</h2>
              <p>{{ flow.objective || "Um objetivo em movimento." }}</p>
              <p>{{ remainingTasks(flow) }} próximos passos em aberto</p>
              <span
                v-if="flow.archivedAt || flow.status === 'archived'"
                class="archived-badge"
                >Arquivado · dados preservados</span
              >
              <small
                >Última alteração:
                {{
                  new Date(flow.updatedAt).toLocaleDateString("pt-BR")
                }}</small
              ><button class="outline" @click="openFlow(flow)">
                Entrar no Flow ↗
              </button>
              <button class="text-button" @click="archiveFlow(flow)">
                {{
                  flow.archivedAt || flow.status === "archived"
                    ? "Reativar Flow"
                    : "Arquivar Flow"
                }}
              </button>
            </article>
          </div>
          <div v-if="!savedFlows.length" class="empty">
            <span>✳</span>
            <h2>
              {{
                showArchived
                  ? "Nenhum Flow arquivado."
                  : "Todo objetivo merece um espaço."
              }}
            </h2>
            <p>
              {{
                showArchived
                  ? "Seus Flows arquivados aparecerão aqui."
                  : "Escolha uma experiência pronta ou crie um Flow do seu jeito."
              }}
            </p>
            <button class="dark-button" @click="navigate('explore')">
              Descobrir um Flow ↗
            </button>
          </div>
        </template>
        <template v-else-if="page === 'workspace' && active">
          <div class="eyebrow">{{ active.identity.category }} / SEU FLOW</div>
          <div class="page-heading">
            <div>
              <input
                class="flow-title"
                v-model="active.identity.name"
                maxlength="100"
                aria-label="Nome do Flow"
                @change="update"
              />
              <p>Contexto, próximos passos e progresso no mesmo lugar.</p>
            </div>
            <div class="button-group">
              <button class="outline" @click="adding = !adding">
                Personalizar Flow</button
              ><button class="outline" @click="modal = 'publish'">
                Compartilhar</button
              ><button
                class="icon-button"
                aria-label="Excluir Flow"
                @click="modal = 'delete'"
              >
                ×
              </button>
            </div>
          </div>
          <component
            :is="experienceComponent"
            :flow="active"
            :update="activeDefinitionUpdate"
            :experience="experience"
            @review="modal = 'review'"
            @metric="updateManualMetric"
            @action="executeAction"
            @command="executeCommand"
            @opportunity="createOpportunity"
            @opportunity-update="updateOpportunity"
            @opportunity-status="updateOpportunityStatus"
          />
          <section v-if="adding" class="component-picker">
            <div class="section-title">
              <h2>O que faz sentido para este Flow?</h2>
              <button @click="adding = false">Concluir ✓</button>
            </div>
            <div class="picker-grid">
              <button
                v-for="component in components"
                :key="component.id"
                @click="editComponents(component.id)"
              >
                <span>{{ component.icon }}</span
                ><strong>{{ component.name }}</strong
                ><small
                  >Adicionar +<template
                    v-if="
                      componentTypes(active).filter(
                        (type) => type === component.id,
                      ).length
                    "
                  >
                    ·
                    {{
                      componentTypes(active).filter(
                        (type) => type === component.id,
                      ).length
                    }}
                    em uso</template
                  ></small
                >
              </button>
            </div>
            <p>
              Você pode adicionar mais de uma instância. Remover um componente
              preserva seu conteúdo para uma restauração futura.
            </p>
          </section>
          <div v-if="adding" class="customize-surface">
            <p class="subtle">
              Capacidades avançadas ficam aqui. O estado vivo do seu Flow
              continua acima.
            </p>
          </div>
          <div v-if="adding" class="workspace-grid">
            <section
              v-for="(component, index) in activeComponents(active)"
              :key="`${active.id}:${component.id}`"
              class="tool-panel"
              :class="{
                'wide-panel': [
                  'tasks',
                  'notes',
                  'links',
                  'tracker',
                  'kanban',
                  'playground',
                ].includes(component.type),
              }"
            >
              <header>
                <h3>
                  <span>{{
                    components.find((c) => c.id === component.type)?.icon
                  }}</span
                  >{{
                    component.config?.title ||
                    components.find((c) => c.id === component.type)?.name
                  }}
                </h3>
                <div>
                  <button
                    :disabled="index === 0"
                    aria-label="Mover componente para cima"
                    @click="moveComponent(index, -1)"
                  >
                    ↑</button
                  ><button
                    :disabled="index === activeComponents(active).length - 1"
                    aria-label="Mover componente para baixo"
                    @click="moveComponent(index, 1)"
                  >
                    ↓</button
                  ><button
                    :aria-label="`Remover ${components.find((c) => c.id === component.type)?.name}`"
                    @click="removeComponent(component.id)"
                  >
                    ×
                  </button>
                </div>
              </header>
              <div class="legacy-tool">
                <component
                  :is="tools[component.type]"
                  v-if="tools[component.type]"
                  :flow="active"
                  :component-config="component.config || {}"
                  :storage-key="component.id"
                  :display="
                    component.type === 'focus' ? focusDisplayFor : undefined
                  "
                  :running="
                    component.type === 'focus' ? focusRunningFor : undefined
                  "
                  :on-toggle="
                    component.type === 'focus' ? toggleFocus : undefined
                  "
                  :on-reset="
                    component.type === 'focus' ? resetFocus : undefined
                  "
                  :on-session-toggle="
                    component.type === 'focus' ? toggleSession : undefined
                  "
                  :session="component.type === 'focus' ? session : undefined"
                  :session-seconds="
                    component.type === 'focus' ? seconds : undefined
                  "
                />
              </div>
            </section>
          </div>
          <div v-if="!activeComponents(active).length" class="empty">
            <h2>Seu espaço está aberto a possibilidades.</h2>
            <button class="dark-button" @click="adding = true">
              Adicionar componentes
            </button>
          </div>
        </template>
        <template v-else-if="page === 'history'">
          <div class="eyebrow">CADA PEQUENO PASSO CONTA</div>
          <div class="page-heading">
            <div>
              <h1>Sua dedicação ganha forma.</h1>
              <p>Um registro do tempo que você investe no que importa.</p>
            </div>
          </div>
          <div class="stats">
            <div>
              <small>TEMPO DE FOCO</small
              ><strong>{{ totalMinutes }} <em>min</em></strong>
            </div>
            <div>
              <small>SESSÕES CONCLUÍDAS</small
              ><strong>{{ sessions.length }}</strong>
            </div>
            <div>
              <small>DIAS ATIVOS</small
              ><strong>{{
                activity.filter((d) => d.minutes > 0).length
              }}</strong>
            </div>
          </div>
          <section class="journey">
            <div class="section-title">
              <h2>Flow Map</h2>
              <span>Últimos 364 dias</span>
            </div>
            <div class="heatmap">
              <div
                v-for="day in activity"
                :key="day.key"
                :class="`level-${day.level}`"
                :title="`${day.key}: ${Math.floor(day.minutes)} min`"
              ></div>
            </div>
            <p class="subtle">
              Cada quadrado é um dia. Quanto mais escuro, mais tempo dedicado.
            </p>
          </section>
          <div class="section-title">
            <h2>Seus últimos momentos de foco</h2>
          </div>
          <div v-for="record in sessions" :key="record.id" class="history-row">
            <span class="flow-icon" :class="record.color">✳</span>
            <div>
              <strong>{{ record.name }}</strong
              ><small>{{
                new Date(record.endedAt).toLocaleString("pt-BR")
              }}</small>
            </div>
            <span
              >{{ Math.floor(record.seconds / 60) }} min ·
              {{ record.tasks }} tarefas</span
            ><button
              class="outline"
              @click="
                summary = record;
                modal = 'summary';
              "
            >
              Ver cartão ↗
            </button>
          </div>
          <div v-if="!sessions.length" class="empty">
            <h2>Sua história começa com uma sessão.</h2>
            <p>
              Abra um Flow, comece a sessão e conclua para registrar seu
              progresso.
            </p>
          </div>
        </template>
      </div>
    </main>
    <div v-if="message" class="toast" role="status">
      {{ message
      }}<button aria-label="Fechar aviso" @click="message = ''">×</button>
    </div>
    <NModal
      v-if="modal"
      @close="
        modal = null;
        paywallFlow = '';
      "
    >
      <template v-if="modal === 'create'">
        <FlowBuilder
          v-if="draft?.id === 'blank'"
          @complete="createFlow"
          @cancel="modal = null"
        />
        <FlowOnboarding
          v-else-if="draft"
          :definition="draft"
          :components="components"
          :default-display-name="store.account.name"
          @complete="createFlow"
          @cancel="modal = null"
        />
      </template>
      <template v-else-if="modal === 'review'">
        <FlowReview
          v-if="active"
          :flow="active"
          @complete="finishReview"
          @postpone="delayReview"
          @skip="dismissReview"
        />
      </template>
      <template v-else-if="modal === 'account'"
        ><AccountPanel
          :account="store.account"
          :user="store.user"
          :status="store.status"
          @export="exportBackup"
          @sync="syncNow"
          @logout="perform(signOut)"
          @import="perform(importGuest)"
          @flows="
            modal = null;
            navigate('flows');
          "
      /></template>
      <template v-else-if="modal === 'plans'">
        <PlanPanel :user="store.user" :required-flow="paywallFlow" />
      </template>
      <template v-else-if="modal === 'preview' && previewTemplate">
        <div class="eyebrow">
          {{
            previewTemplate.owner ? "DA COMUNIDADE" : previewTemplate.category
          }}
        </div>
        <h2 id="modal-title">{{ previewTemplate.name }}</h2>
        <p>{{ previewTemplate.objective || previewTemplate.description }}</p>
        <p>{{ previewTemplate.description }}</p>
        <div
          v-if="previewTemplate.experience?.layout?.length"
          class="preview-structure"
        >
          <strong>Este Flow prepara</strong>
          <ul>
            <li
              v-for="section in previewTemplate.experience.layout.filter(
                (section) => section.type !== 'hero',
              )"
              :key="section.id || section.title"
            >
              {{ section.title }}
            </li>
          </ul>
        </div>
        <button class="dark-button" @click="choose(previewTemplate)">
          {{
            previewTemplate.id === "blank"
              ? "Criar do meu jeito"
              : "Começar com este Flow"
          }}
          ↗
        </button>
      </template>
      <template v-else-if="modal === 'publish'"
        ><div class="eyebrow">COMPARTILHE UM PONTO DE PARTIDA</div>
        <h2 id="modal-title">Transformar em modelo público?</h2>
        <p>
          O nome, a categoria, os componentes e a duração do foco ficarão
          públicos. Suas tarefas, notas, links e sessões não serão incluídos.
        </p>
        <button class="dark-button" :disabled="busy" @click="perform(publish)">
          {{ busy ? "Publicando…" : "Publicar modelo" }}
        </button></template
      >
      <template v-else-if="modal === 'share'"
        ><h2 id="modal-title">Seu Flow pode inspirar alguém.</h2>
        <p>
          Quem abrir este link poderá criar seu próprio espaço a partir do seu
          modelo.
        </p>
        <input
          :value="shareLink"
          readonly
          aria-label="Link público do Flow"
          @focus="$event.target.select()"
        /><button class="dark-button" @click="perform(copyLink)">
          Copiar link
        </button></template
      >
      <template v-else-if="modal === 'summary'"
        ><div class="summary-card">
          <div class="eyebrow">NOMA / MEU FLOW</div>
          <h2 id="modal-title">
            {{ Math.floor(summary.seconds / 60) }} min<br />para o que importa.
          </h2>
          <h3>{{ summary.name }}</h3>
          <p>
            {{ summary.tasks }} tarefas concluídas ·
            {{ summary.pomodoros }} ciclos de foco
          </p>
          <small>Um próximo passo, todos os dias.</small>
        </div>
        <button class="dark-button" @click="downloadCard">
          ↓ Baixar cartão da sessão
        </button></template
      >
      <template v-else-if="modal === 'delete'"
        ><h2 id="modal-title">Excluir este Flow?</h2>
        <p>
          O conteúdo e o histórico de “{{ active?.identity.name }}” serão
          removidos. Essa ação não pode ser desfeita.
        </p>
        <button class="outline" @click="exportBackup">
          Exportar dados antes</button
        ><button class="danger" @click="deleteFlow">
          Excluir Flow
        </button></template
      >
    </NModal>
  </div>
</template>
