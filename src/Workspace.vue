<script setup>
import { usePlatform } from "./flow/usePlatform";
import BrandLogo from "./components/ui/BrandLogo.vue";
import ProductState from "./components/ui/ProductState.vue";
import NModal from "./components/ui/NModal.vue";
import FlowOnboarding from "./components/FlowOnboarding.vue";
import FlowHome from "./components/FlowHome.vue";
import FlowReview from "./components/FlowReview.vue";
const {
  components,
  componentIds,
  templates,
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
  busy,
  adding,
  newTask,
  linkTitle,
  linkUrl,
  community,
  summary,
  focusRunning,
  focusBreak,
  active,
  activeDefinitionUpdate,
  categories,
  filtered,
  sessions,
  totalMinutes,
  completed,
  taskGroups,
  session,
  seconds,
  clock,
  focusDisplay,
  activity,
  perform,
  choose,
  toggleComponent,
  createFlow,
  openFlow,
  update,
  addTask,
  addLink,
  editComponents,
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
  <div class="platform">
    <aside class="sidebar" :inert="modal ? true : undefined">
      <a
        class="brand"
        href="#"
        aria-label="Noma — descobrir Flows"
        @click.prevent="navigate('explore')"
        ><BrandLogo
      /></a>
      <div class="workspace-label">ESPAÇO PESSOAL <span>⌄</span></div>
      <nav aria-label="Navegação principal">
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
      </nav>
      <div v-if="store.account.flows.length" class="recent">
        <p>SEUS ESPAÇOS</p>
        <button
          v-for="flow in store.account.flows.slice(0, 5)"
          :key="flow.id"
          @click="openFlow(flow)"
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
        <button class="profile" @click="modal = 'account'">
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
          ><span>⚙</span>
        </button>
      </div>
    </aside>
    <main :inert="modal ? true : undefined">
      <header class="topbar">
        <div>
          <span class="breadcrumb">Seu espaço</span><span class="slash">/</span
          >{{
            {
              explore: "Descobrir Flows",
              flows: "Meus Flows",
              workspace: active?.identity.name,
              history: "Minha jornada",
              community: "Comunidade",
            }[page]
          }}
        </div>
        <div class="top-actions">
          <span class="sync"><i></i>{{ store.status }}</span
          ><button
            class="icon-button"
            aria-label="Abrir conta"
            @click="modal = 'account'"
          >
            {{ store.user ? "◎" : "↗" }}
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
          <div class="eyebrow">MENOS DISTRAÇÕES. MAIS POSSIBILIDADES.</div>
          <div class="page-heading">
            <div>
              <h1>
                {{
                  page === "community"
                    ? "Bons Flows merecem ser compartilhados."
                    : "O que você quer fazer hoje?"
                }}
              </h1>
              <p>Escolha um objetivo. Encontre seu Flow. Faça acontecer.</p>
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
                Estudar, criar, organizar ou recomeçar. Reúna as ferramentas<br
                  class="desktop-only"
                />
                certas em um Flow feito para o que você quer realizar.
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
                    : "Pontos de partida pensados para você. Todos podem ser personalizados."
                }}
              </p>
            </div>
            <span v-if="page === 'explore'" class="count"
              >{{ templates.length }} possibilidades para começar</span
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
                ><span class="large-symbol">{{ template.icon }}</span>
                <div class="visual-lines"><i></i><i></i><i></i></div>
                <span class="card-star">✧</span>
              </div>
              <div class="card-body">
                <small>{{ template.tag || "DA COMUNIDADE" }}</small>
                <h3>{{ template.name }}</h3>
                <p>{{ template.description }}</p>
                <div class="component-chips">
                  <span
                    v-for="id in template.components.slice(0, 3)"
                    :key="id"
                    >{{ components.find((c) => c.id === id)?.name }}</span
                  ><span v-if="template.components.length > 3"
                    >+{{ template.components.length - 3 }}</span
                  ><span v-if="!template.components.length"
                    >Você escolhe os componentes</span
                  >
                </div>
                <div class="card-footer">
                  <span>{{
                    template.owner ? "Comunidade Noma" : "Por Noma"
                  }}</span
                  ><button @click="choose(template)">
                    {{ template.id === "blank" ? "Criar Flow" : "Usar Flow" }} ↗
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
          <div v-if="!filtered.length" class="empty">
            <h3>
              {{
                !supabase && page === "community"
                  ? "A comunidade estará aqui em breve."
                  : "Nenhum Flow encontrado."
              }}
            </h3>
            <p>
              {{
                !supabase && page === "community"
                  ? "Conecte o Supabase para publicar e descobrir modelos de outros usuários."
                  : "Tente outra busca ou crie um Flow do seu jeito."
              }}
            </p>
          </div>
          <div class="bottom-note">
            <span>◈</span> As ferramentas se adaptam ao seu objetivo. E não o
            contrário.
          </div>
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
              v-for="flow in store.account.flows"
              :key="flow.id"
              class="saved-flow"
            >
              <span class="flow-icon" :class="flow.identity.color">{{
                flow.identity.icon
              }}</span
              ><small>{{ flow.identity.category }}</small>
              <h2>{{ flow.identity.name }}</h2>
              <p>
                {{ componentIds(flow).length }} componentes ·
                {{ flow.sessions.length }} sessões
              </p>
              <p>
                {{
                  (flow.componentData.tasks?.items || []).filter((t) => !t.done)
                    .length
                }}
                tarefas restantes
              </p>
              <small
                >Última alteração:
                {{
                  new Date(flow.updatedAt).toLocaleDateString("pt-BR")
                }}</small
              ><button class="outline" @click="openFlow(flow)">
                Entrar no Flow ↗
              </button>
            </article>
          </div>
          <div v-if="!store.account.flows.length" class="empty">
            <span>✳</span>
            <h2>Todo objetivo merece um espaço.</h2>
            <p>Escolha um modelo ou comece com uma tela em branco.</p>
            <button class="dark-button" @click="navigate('explore')">
              Descobrir meu primeiro Flow ↗
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
              <p>Um objetivo. Suas ferramentas. Tudo no mesmo lugar.</p>
            </div>
            <div class="button-group">
              <button class="outline" @click="adding = !adding">
                ＋ Componentes</button
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
          <FlowHome
            :flow="active"
            :update="activeDefinitionUpdate"
            @review="modal = 'review'"
          />
          <section class="session-bar">
            <span class="session-dot"></span>
            <div>
              <strong>{{
                session?.flowId === active.id
                  ? "Seu tempo de dedicação"
                  : "Pronto para entrar no ritmo?"
              }}</strong
              ><small>{{
                session?.flowId === active.id
                  ? "Construa sua jornada, uma sessão por vez."
                  : "Comece uma sessão para acompanhar seu progresso."
              }}</small>
            </div>
            <strong class="session-time">{{
              session?.flowId === active.id ? clock(seconds) : "00:00"
            }}</strong
            ><button class="dark-button" @click="toggleSession">
              {{
                session?.flowId === active.id && session.running
                  ? "Ⅱ Pausar"
                  : "▶ Começar"
              }}</button
            ><button
              v-if="session?.flowId === active.id"
              class="outline"
              @click="finishSession"
            >
              Concluir sessão
            </button>
          </section>
          <section v-if="adding" class="component-picker">
            <div class="section-title">
              <h2>O que faz sentido para este Flow?</h2>
              <button @click="adding = false">Concluir ✓</button>
            </div>
            <div class="picker-grid">
              <button
                v-for="component in components"
                :key="component.id"
                :class="{ chosen: componentIds(active).includes(component.id) }"
                @click="editComponents(component.id)"
              >
                <span>{{ component.icon }}</span
                ><strong>{{ component.name }}</strong
                ><small>{{
                  componentIds(active).includes(component.id)
                    ? "Adicionado ✓"
                    : "Adicionar +"
                }}</small>
              </button>
            </div>
            <p>
              Remover um componente preserva seu conteúdo. Você pode adicioná-lo
              novamente.
            </p>
          </section>
          <div class="workspace-grid">
            <section
              v-for="(id, index) in componentIds(active)"
              :key="`${active.id}:${id}`"
              class="tool-panel"
              :class="{
                'wide-panel': ['tracker', 'kanban', 'playground'].includes(id),
              }"
            >
              <header>
                <h3>
                  <span>{{ components.find((c) => c.id === id)?.icon }}</span
                  >{{ components.find((c) => c.id === id)?.name }}
                </h3>
                <div>
                  <button
                    :disabled="index === 0"
                    aria-label="Mover componente para cima"
                    @click="moveComponent(index, -1)"
                  >
                    ↑</button
                  ><button
                    :disabled="index === componentIds(active).length - 1"
                    aria-label="Mover componente para baixo"
                    @click="moveComponent(index, 1)"
                  >
                    ↓</button
                  ><button
                    :aria-label="`Remover ${components.find((c) => c.id === id)?.name}`"
                    @click="editComponents(id)"
                  >
                    ×
                  </button>
                </div>
              </header>
              <div v-if="id === 'focus'" class="focus-tool">
                <span class="eyebrow">{{
                  focusBreak ? "RESPIRE UM POUCO" : "UMA COISA DE CADA VEZ"
                }}</span>
                <div class="timer-ring">
                  <strong>{{ focusDisplay }}</strong
                  ><small>{{ focusBreak ? "Pausa" : "Tempo de foco" }}</small>
                </div>
                <div class="button-group">
                  <button class="dark-button" @click="toggleFocus">
                    {{ focusRunning ? "Pausar" : "Iniciar" }}</button
                  ><button class="outline" @click="resetFocus">
                    Reiniciar
                  </button>
                </div>
                <label
                  >Duração do foco
                  <input
                    v-model.number="active.properties.focusMinutes"
                    type="number"
                    min="1"
                    max="180"
                    @change="
                      active.properties.focusMinutes = Math.max(
                        1,
                        Math.min(
                          180,
                          Number(active.properties.focusMinutes) || 25,
                        ),
                      );
                      resetFocus();
                      update();
                    "
                  />
                  min</label
                >
              </div>
              <div v-else-if="id === 'tasks'" class="tool-content">
                <p class="subtle">
                  {{ completed }} de
                  {{ active.componentData.tasks?.items?.length || 0 }} passos
                  concluídos
                </p>
                <form class="inline-form" @submit.prevent="addTask">
                  <input
                    v-model="newTask"
                    placeholder="Qual é o próximo passo?"
                    aria-label="Nova tarefa"
                  /><button type="submit" aria-label="Adicionar tarefa">
                    ＋
                  </button>
                </form>
                <div v-for="group in taskGroups" :key="group.name" class="task-group">
                  <h4>{{ group.name }}</h4>
                  <div v-for="task in group.items" :key="task.id" class="task-row">
                    <input
                      v-model="task.done"
                      type="checkbox"
                      :aria-label="task.text"
                      @change="update"
                    /><input
                      v-model="task.text"
                      :class="{ done: task.done }"
                      aria-label="Texto da tarefa"
                      @change="update"
                    /><button
                      aria-label="Excluir tarefa"
                      @click="
                        active.componentData.tasks.items =
                          active.componentData.tasks.items.filter(
                            (t) => t.id !== task.id,
                          );
                        update();
                      "
                    >
                      ×
                    </button>
                  </div>
                </div>
                <p
                  v-if="!active.componentData.tasks?.items?.length"
                  class="hint"
                >
                  Seu próximo passo pode ser pequeno. Comece por ele.
                </p>
              </div>
              <div v-else-if="id === 'notes'" class="tool-content">
                <textarea
                  v-model="active.componentData.notes.text"
                  class="notes-area"
                  placeholder="Deixe suas ideias por aqui…"
                  aria-label="Notas deste Flow"
                  @input="update"
                ></textarea
                ><small class="subtle">Suas ideias ficam neste Flow.</small>
              </div>
              <div v-else-if="id === 'links'" class="tool-content">
                <form class="link-form" @submit.prevent="addLink">
                  <input
                    v-model="linkTitle"
                    placeholder="Nome da referência"
                    aria-label="Título do link"
                  />
                  <div class="inline-form">
                    <input
                      v-model="linkUrl"
                      placeholder="https://…"
                      aria-label="URL da referência"
                      required
                    /><button aria-label="Adicionar link">＋</button>
                  </div>
                </form>
                <div
                  v-for="link in active.componentData.links?.items"
                  :key="link.id"
                  class="link-row"
                >
                  <a
                    :href="safeUrl(link.url) || undefined"
                    target="_blank"
                    rel="noopener noreferrer"
                    >↗ {{ link.title }}</a
                  ><button
                    aria-label="Excluir link"
                    @click="
                      active.componentData.links.items =
                        active.componentData.links.items.filter(
                          (l) => l.id !== link.id,
                        );
                      update();
                    "
                  >
                    ×
                  </button>
                </div>
                <p
                  v-if="!active.componentData.links?.items?.length"
                  class="hint"
                >
                  Materiais de estudo, referências e atalhos. Tudo à mão.
                </p>
              </div>
              <div v-else class="legacy-tool">
                <component
                  :is="tools[id]"
                  v-if="tools[id]"
                  :flow="id === 'tracker' ? active : undefined"
                  :component-config="
                    id === 'tracker'
                      ? active.components.find(
                          (component) => component.type === id,
                        )?.config || {}
                      : undefined
                  "
                  :storage-key="
                    id === 'tracker'
                      ? active.components.find(
                          (component) => component.type === id,
                        )?.id || id
                      : undefined
                  "
                />
              </div>
            </section>
          </div>
          <div v-if="!componentIds(active).length" class="empty">
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
    <NModal v-if="modal" @close="modal = null">
      <template v-if="modal === 'create'">
        <FlowOnboarding
          v-if="draft"
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
        ><div class="eyebrow">SEU ESPAÇO, COM VOCÊ</div>
        <h2 id="modal-title">
          {{ store.user ? "Sua conta" : "Continue de qualquer lugar." }}
        </h2>
        <p>
          Conecte sua conta para sincronizar seus Flows e compartilhar modelos
          com a comunidade.
        </p>
        <div v-if="!supabase" class="setup-info">
          <strong>Supabase ainda não configurado</strong>
          <p>
            O modo local está disponível. Para ativar contas e a comunidade,
            configure o projeto conforme o README.
          </p>
        </div>
        <template v-else-if="store.user"
          ><p>{{ store.user.email }}</p>
          <button
            class="outline"
            :disabled="busy"
            @click="perform(importGuest)"
          >
            Importar meus Flows deste dispositivo</button
          ><button class="outline" @click="syncNow">Sincronizar agora</button
          ><button class="outline" @click="perform(signOut)">
            Sair da conta
          </button></template
        >
        <form v-else @submit.prevent="perform(sendLink)">
          <label
            >Seu e-mail<input
              v-model="email"
              type="email"
              autocomplete="email"
              required
              placeholder="voce@exemplo.com" /></label
          ><button class="dark-button" :disabled="busy">
            {{ busy ? "Enviando…" : "Receber link de acesso →" }}
          </button>
          <p class="hint">Sem senha. Enviaremos um link para o seu e-mail.</p>
        </form>
        <hr />
        <button class="text-button" @click="exportBackup">
          ↓ Exportar uma cópia dos meus dados
        </button></template
      >
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
