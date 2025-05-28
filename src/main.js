// Inicialização imediata do papel de parede, antes de qualquer coisa
(function() {
  const WALLPAPER_KEY = 'dev-room-wallpaper';
  const WALLPAPER_CLASS = 'has-wallpaper';
  
  function applyWallpaper(imageUrl) {
    if (!imageUrl) return;
    document.documentElement.classList.add(WALLPAPER_CLASS);
    document.body.classList.add(WALLPAPER_CLASS);
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
  
  const savedWallpaper = localStorage.getItem(WALLPAPER_KEY);
  if (savedWallpaper) {
    if (document.body) {
      applyWallpaper(savedWallpaper);
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        applyWallpaper(savedWallpaper);
      });
    }
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
  faEyeSlash, faCode, faRocket, faSearch, faMagnifyingGlass, faComments, faPlug, faPalette, faTrash, faPenToSquare,
  faBackwardStep, faShuffle, faPlay, faPause, faRepeat, faForwardStep, faDroplet, faDatabase, faCopy,
  faVolumeHigh, faVolumeLow, faXmark, faBars, faHeart, faUserGear, faCheck, faChair, faCookieBite,
  faWindowMaximize, faHandshake, faFaceSmileBeam, faMugHot, faArrowLeft, faArrowRight,
  faUpRightAndDownLeftFromCenter, faDownLeftAndUpRightToCenter, faPlus, faThLarge, faRightToBracket,
  faArrowRightFromBracket, faCubes, faUserLock, faGlobe, faUserAstronaut, faLightbulb, faGear, faRobot,
  faImage, faTableColumns, faKey, faCircleInfo, faPaperPlane, faCodePullRequest, faCodeCommit, faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(
  faUser, faCoffee, faClock, faCog, faStopwatch, faMusic, faListCheck, faTerminal, faBook, faStickyNote,
  faEyeSlash, faCode, faRocket, faSearch, faMagnifyingGlass, faComments, faPlug, faPalette, faTrash, faPenToSquare,
  faBackwardStep, faShuffle, faPlay, faPause, faRepeat, faForwardStep, faDroplet, faDatabase, faCopy,
  faVolumeHigh, faVolumeLow, faXmark, faBars, faHeart, faUserGear, faCheck, faChair, faCookieBite,
  faWindowMaximize, faHandshake, faFaceSmileBeam, faMugHot, faArrowLeft, faArrowRight,
  faUpRightAndDownLeftFromCenter, faDownLeftAndUpRightToCenter, faPlus, faThLarge, faRightToBracket,
  faArrowRightFromBracket, faCubes, faUserLock, faGlobe, faUserAstronaut, faLightbulb, faGear,
  faGithub, faRobot, faImage, faTableColumns, faKey, faCircleInfo, faPaperPlane, faCodePullRequest,
  faCodeCommit, faCircleExclamation,
)

const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')
