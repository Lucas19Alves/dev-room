import { ref, computed } from "vue";

const STORAGE_KEY = "noma-theme";

// Shared reactive state across components
const preference = ref("system");
const systemDark = ref(false);

let initialized = false;

function getSystemDark() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function updateDom(mode) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;

  // Update mobile status bar theme color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", mode === "dark" ? "#0c1412" : "#294a38");
  }
}

function initTheme() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  systemDark.value = getSystemDark();

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark" || saved === "system") {
    preference.value = saved;
  } else {
    // If previous version stored just 'dark' or 'light', keep it; otherwise default to system
    preference.value = "system";
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleSystemChange = (e) => {
    systemDark.value = e.matches;
    if (preference.value === "system") {
      updateDom(e.matches ? "dark" : "light");
    }
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", handleSystemChange);
  } else if (mediaQuery.addListener) {
    mediaQuery.addListener(handleSystemChange);
  }

  // Apply immediately on init
  const activeMode =
    preference.value === "system"
      ? systemDark.value
        ? "dark"
        : "light"
      : preference.value;
  updateDom(activeMode);
}

export function useTheme() {
  initTheme();

  const resolvedTheme = computed(() => {
    if (preference.value === "system") {
      return systemDark.value ? "dark" : "light";
    }
    return preference.value;
  });

  const isDark = computed(() => resolvedTheme.value === "dark");

  function setTheme(newTheme) {
    if (!["system", "light", "dark"].includes(newTheme)) return;
    preference.value = newTheme;
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn("Could not save theme preference to localStorage", e);
    }
    const mode =
      newTheme === "system" ? (systemDark.value ? "dark" : "light") : newTheme;
    updateDom(mode);
  }

  function toggleTheme() {
    // When toggling quickly via button: switch between light and dark
    const next = isDark.value ? "light" : "dark";
    setTheme(next);
  }

  return {
    preference,
    resolvedTheme,
    isDark,
    setTheme,
    toggleTheme,
  };
}
