import { onUnmounted, ref, watch } from "vue";
import { readComponentData, writeComponentData } from "../utils/storage";

export function useFlowComponentStorage(
  key,
  fallback,
  delay = 250,
  legacyKey = null,
) {
  const state = ref(readComponentData(key, fallback, legacyKey));
  let saveTimer = null;

  function save() {
    clearTimeout(saveTimer);
    saveTimer = null;
    writeComponentData(key, state.value);
  }

  watch(
    state,
    () => {
      clearTimeout(saveTimer);
      saveTimer = window.setTimeout(save, delay);
    },
    { deep: true },
  );

  onUnmounted(() => {
    if (saveTimer) save();
  });

  return { state, save };
}
