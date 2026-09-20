import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

createApp(App).mount("#app");
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  });
}
