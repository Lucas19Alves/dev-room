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
  faArrowRightFromBracket, faCubes, faUserLock, faGlobe, faUserAstronaut, faLightbulb, faGear
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
  faGithub
)

const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')
