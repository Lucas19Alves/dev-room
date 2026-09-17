import { onUnmounted, ref, watch } from "vue";
import { readComponentData, writeComponentData } from "../utils/storage";

export function useFlowComponentStorage(type, fallback, delay = 250) {
  const state = ref(readComponentData(type, fallback));
  let saveTimer = null;

  function save() {
    clearTimeout(saveTimer);
    saveTimer = null;
    writeComponentData(type, state.value);
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
