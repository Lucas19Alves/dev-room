// Inicialização imediata do papel de parede, antes de qualquer coisa
(function() {
  const WALLPAPER_KEY = 'dev-room-wallpaper';
  const WALLPAPER_CLASS = 'has-wallpaper';
  
  // Função para aplicar o papel de parede
  function applyWallpaper(imageUrl) {
    if (!imageUrl) return;
    
    // Adicionar classe identificadora
    document.documentElement.classList.add(WALLPAPER_CLASS);
    document.body.classList.add(WALLPAPER_CLASS);
    
    // Aplicar ao HTML e body para maior compatibilidade
    const wallpaperStyle = `url('${imageUrl}')`;
    document.documentElement.style.backgroundImage = wallpaperStyle;
    document.documentElement.style.backgroundSize = 'cover';
    document.documentElement.style.backgroundPosition = 'center center';
    document.documentElement.style.backgroundRepeat = 'no-repeat';
    document.documentElement.style.backgroundAttachment = 'fixed';
    
    document.body.style.backgroundImage = wallpaperStyle;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
  }
  
  // Verificar se há papel de parede salvo
  const savedWallpaper = localStorage.getItem(WALLPAPER_KEY);
  if (savedWallpaper) {
    // Aplicar imediatamente se possível
    if (document.body) {
      applyWallpaper(savedWallpaper);
    } else {
      // Caso o body ainda não esteja disponível
      document.addEventListener('DOMContentLoaded', function() {
        applyWallpaper(savedWallpaper);
      });
    }
    
    // Garantir que o papel de parede seja aplicado após o carregamento completo
    window.addEventListener('load', function() {
      applyWallpaper(savedWallpaper);
    });
  }
})();

import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faUser, faCoffee, faClock, faCog, faStopwatch, faMusic, faListCheck, faTerminal, faBook, faStickyNote,
  faEyeSlash, faCode, faRocket, faSearch, faMagnifyingGlass, faComments, faPlug, faPalette, faTrash,
  faBackwardStep, faShuffle, faPlay, faPause, faRepeat, faForwardStep, faDroplet, faDatabase, faCopy,
  faVolumeHigh, faVolumeLow, faXmark, faBars, faHeart, faUserGear, faCheck, faChair, faCookieBite,
  faWindowMaximize, faHandshake, faFaceSmileBeam, faMugHot, faArrowLeft, faArrowRight,
  faUpRightAndDownLeftFromCenter, faDownLeftAndUpRightToCenter, faPlus, faThLarge, faRightToBracket,
  faArrowRightFromBracket, faCubes, faUserLock, faGlobe, faUserAstronaut, faLightbulb, faGear, faRobot,
  faImage
} from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(
  faUser, faCoffee, faClock, faCog, faStopwatch, faMusic, faListCheck, faTerminal, faBook, faStickyNote,
  faEyeSlash, faCode, faRocket, faSearch, faMagnifyingGlass, faComments, faPlug, faPalette, faTrash,
  faBackwardStep, faShuffle, faPlay, faPause, faRepeat, faForwardStep, faDroplet, faDatabase, faCopy,
  faVolumeHigh, faVolumeLow, faXmark, faBars, faHeart, faUserGear, faCheck, faChair, faCookieBite,
  faWindowMaximize, faHandshake, faFaceSmileBeam, faMugHot, faArrowLeft, faArrowRight,
  faUpRightAndDownLeftFromCenter, faDownLeftAndUpRightToCenter, faPlus, faThLarge, faRightToBracket,
  faArrowRightFromBracket, faCubes, faUserLock, faGlobe, faUserAstronaut, faLightbulb, faGear,
  faGithub, faRobot, faImage
)

const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')

// Aplicar novamente o papel de parede após a montagem do app Vue
// Isso garante que ele persista após qualquer configuração que o Vue possa fazer
app.config.globalProperties.$nextTick(() => {
  const WALLPAPER_KEY = 'dev-room-wallpaper';
  const savedWallpaper = localStorage.getItem(WALLPAPER_KEY);
  if (savedWallpaper) {
    document.body.style.backgroundImage = `url('${savedWallpaper}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
    
    document.documentElement.style.backgroundImage = `url('${savedWallpaper}')`;
    document.documentElement.style.backgroundSize = 'cover';
    document.documentElement.style.backgroundPosition = 'center center';
    document.documentElement.style.backgroundRepeat = 'no-repeat';
    document.documentElement.style.backgroundAttachment = 'fixed';
  }
});
