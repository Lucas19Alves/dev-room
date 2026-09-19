<script setup>
import { useTheme } from "../../composables/useTheme";

const props = defineProps({
  variant: {
    type: String,
    default: "button", // 'button' | 'segmented'
    validator: (v) => ["button", "segmented"].includes(v),
  },
  showLabel: {
    type: Boolean,
    default: false,
  },
});

const { preference, resolvedTheme, isDark, setTheme, toggleTheme } = useTheme();
</script>

<template>
  <!-- Segmented Control (for Settings / AccountPanel) -->
  <div
    v-if="variant === 'segmented'"
    class="theme-segmented"
    role="radiogroup"
    aria-label="Selecionar tema do sistema"
  >
    <button
      type="button"
      role="radio"
      :aria-checked="preference === 'system'"
      :class="{ active: preference === 'system' }"
      @click="setTheme('system')"
    >
      <svg
        class="theme-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
      <span>Sistema</span>
    </button>

    <button
      type="button"
      role="radio"
      :aria-checked="preference === 'light'"
      :class="{ active: preference === 'light' }"
      @click="setTheme('light')"
    >
      <svg
        class="theme-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
      <span>Claro</span>
    </button>

    <button
      type="button"
      role="radio"
      :aria-checked="preference === 'dark'"
      :class="{ active: preference === 'dark' }"
      @click="setTheme('dark')"
    >
      <svg
        class="theme-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
      <span>Escuro</span>
    </button>
  </div>

  <!-- Single Toggle Button (for Headers & Topbars) -->
  <button
    v-else
    type="button"
    class="theme-toggle-btn"
    :title="isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'"
    :aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'"
    @click="toggleTheme"
  >
    <div class="icon-swap" :class="{ 'is-dark': isDark }">
      <!-- Sun icon (shown in dark mode to switch to light) -->
      <svg
        class="icon-sun"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>

      <!-- Moon icon (shown in light mode to switch to dark) -->
      <svg
        class="icon-moon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </div>

    <span v-if="showLabel" class="toggle-label">
      {{ isDark ? "Claro" : "Escuro" }}
    </span>
  </button>
</template>

<style scoped>
.theme-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  border: 1px solid var(--noma-border);
  background: var(--noma-surface);
  color: var(--noma-ink-soft);
  cursor: pointer;
  padding: 0;
  transition:
    background-color var(--noma-transition),
    border-color var(--noma-transition),
    color var(--noma-transition),
    transform 120ms ease;
}

.theme-toggle-btn:hover {
  background: var(--noma-surface-soft);
  color: var(--noma-ink);
  border-color: var(--noma-border-strong);
}

.theme-toggle-btn:active {
  transform: scale(0.94);
}

.icon-swap {
  position: relative;
  width: 17px;
  height: 17px;
  display: grid;
  place-items: center;
}

.icon-sun,
.icon-moon {
  position: absolute;
  width: 17px;
  height: 17px;
  transition:
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 180ms ease;
}

/* Light mode state: Moon is visible, Sun is rotated away */
.icon-swap:not(.is-dark) .icon-sun {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
  pointer-events: none;
}

.icon-swap:not(.is-dark) .icon-moon {
  opacity: 1;
  transform: rotate(0deg) scale(1);
}

/* Dark mode state: Sun is visible, Moon is rotated away */
.icon-swap.is-dark .icon-sun {
  opacity: 1;
  transform: rotate(0deg) scale(1);
  color: #f3c464;
}

.icon-swap.is-dark .icon-moon {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
  pointer-events: none;
}

.toggle-label {
  font-size: 11px;
  font-weight: 550;
}

/* Segmented Control */
.theme-segmented {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: var(--noma-surface-soft);
  border: 1px solid var(--noma-border);
  border-radius: var(--noma-radius-md);
}

.theme-segmented button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: var(--noma-radius-sm);
  border: 1px solid transparent;
  background: transparent;
  color: var(--noma-ink-soft);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color var(--noma-transition),
    color var(--noma-transition),
    box-shadow var(--noma-transition);
}

.theme-segmented button:hover:not(.active) {
  color: var(--noma-ink);
}

.theme-segmented button.active {
  background: var(--noma-surface);
  color: var(--noma-ink);
  font-weight: 600;
  border-color: var(--noma-border);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.theme-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
</style>
