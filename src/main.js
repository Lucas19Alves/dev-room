import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faUser, faCoffee, faClock, faCog, faStopwatch, faMusic, faListCheck, faTerminal, faBook, faStickyNote, faEyeSlash, faCode, faRocket, faSearch, faComments, faPlug, faPalette, faTrash, faBackwardStep, faShuffle, faPlay, faPause, faRepeat, faForwardStep, faDroplet, faDatabase, faCopy, faVolumeHigh, faVolumeLow, faXmark, faBars, faHeart, faUserGear, faCheck, faChair, faCookieBite, faWindowMaximize, faHandshake, faFaceSmileBeam, faMugHot, faArrowLeft, faArrowRight, faUpRightAndDownLeftFromCenter, faDownLeftAndUpRightToCenter, faPlus, faThLarge, faRightToBracket, faCubes, faUserLock, faGlobe, faUserAstronaut, faLightbulb } from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fa } from '@faker-js/faker'

library.add(
  faUser, faCoffee, faClock, faCog, faStopwatch, faMusic, faListCheck, faTerminal, faBook, faStickyNote, faEyeSlash, faCode, faRocket, faSearch, faComments, faPlug, faPalette, faTrash, faBackwardStep, faShuffle, faPlay, faPause, faRepeat, faForwardStep, faDroplet, faDatabase, faCopy, faVolumeHigh, faVolumeLow, faXmark, faBars, faHeart, faUserGear, faCheck, faChair, faCookieBite, faWindowMaximize, faHandshake, faFaceSmileBeam, faMugHot, faArrowLeft, faArrowRight, faUpRightAndDownLeftFromCenter, faDownLeftAndUpRightToCenter, faPlus, faThLarge, faRightToBracket, faCubes, faUserLock,
  faGithub, faGlobe, faUserAstronaut, faLightbulb
)

const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')
