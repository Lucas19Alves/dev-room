<template>
  <div class="flex flex-col gap-3">
    <div v-if="currentWallpaper" class="relative rounded-lg overflow-hidden h-32 bg-gray-800 flex items-center justify-center">
      <img :src="currentWallpaper" alt="Papel de parede atual" class="w-full h-full object-cover object-center" />
      <button 
        @click="removeWallpaper" 
        class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center transition"
        title="Remover papel de parede"
      >
        <font-awesome-icon icon="fa-solid fa-xmark" class="text-xs" />
      </button>
    </div>
    <div v-else class="rounded-lg h-32 bg-gray-800 flex items-center justify-center border border-dashed border-gray-600">
      <span class="text-gray-400 text-sm">Nenhum papel de parede definido</span>
    </div>
    
    <div class="flex flex-col gap-2">
      <label for="wallpaper-upload" class="text-xs text-gray-400">
        Escolha uma imagem (JPEG ou PNG, máx 7MB)
      </label>
      <input 
        type="file" 
        id="wallpaper-upload" 
        class="hidden"
        accept=".jpg,.jpeg,.png" 
        @change="handleFileUpload" 
        ref="fileInput"
      />
      
      <div class="flex gap-2">
        <button 
          @click="$refs.fileInput.click()" 
          class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition text-xs font-bold flex-1"
        >
          Escolher Imagem
        </button>
        <button 
          v-if="currentWallpaper"
          @click="removeWallpaper" 
          class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition text-xs font-bold"
        >
          Remover
        </button>
      </div>
    </div>
    <div v-if="wallpaperError" class="text-red-400 text-xs mt-1">
      {{ wallpaperError }}
    </div>
    <div v-if="wallpaperSuccess" class="text-green-400 text-xs mt-1">
      {{ wallpaperSuccess }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  setWallpaper: {
    type: Function,
    required: true
  }
})

const WALLPAPER_KEY = 'dev-room-wallpaper'
const WALLPAPER_CLASS = 'has-wallpaper'
const fileInput = ref(null)
const wallpaperError = ref('')
const wallpaperSuccess = ref('')
const currentWallpaper = ref('')

function applyWallpaper(imageUrl) {
  if (!imageUrl) return
  
  // Adicionar classe identificadora ao HTML e body
  document.documentElement.classList.add(WALLPAPER_CLASS)
  document.body.classList.add(WALLPAPER_CLASS)
  
  // Aplicar ao HTML e body para maior compatibilidade
  const wallpaperStyle = `url('${imageUrl}')`;
  document.documentElement.style.backgroundImage = wallpaperStyle
  document.documentElement.style.backgroundSize = 'cover'
  document.documentElement.style.backgroundPosition = 'center center'
  document.documentElement.style.backgroundRepeat = 'no-repeat'
  document.documentElement.style.backgroundAttachment = 'fixed'
  
  document.body.style.backgroundImage = wallpaperStyle
  document.body.style.backgroundSize = 'cover'
  document.body.style.backgroundPosition = 'center center'
  document.body.style.backgroundRepeat = 'no-repeat'
  document.body.style.backgroundAttachment = 'fixed'
}

function removeWallpaperStyles() {
  // Remover classe identificadora
  document.documentElement.classList.remove(WALLPAPER_CLASS)
  document.body.classList.remove(WALLPAPER_CLASS)
  
  // Limpar estilos
  document.documentElement.style.backgroundImage = 'none'
  document.body.style.backgroundImage = 'none'
}

function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  
  wallpaperError.value = '' // Limpar qualquer erro anterior
  
  // Verificar tipo de arquivo
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    wallpaperError.value = 'Apenas imagens JPEG ou PNG são permitidas'
    setTimeout(() => wallpaperError.value = '', 3000)
    return
  }
  
  // Verificar tamanho (máximo 7MB)
  if (file.size > 7 * 1024 * 1024) {
    wallpaperError.value = 'A imagem deve ter no máximo 7MB'
    setTimeout(() => wallpaperError.value = '', 3000)
    return
  }
  
  // Mostrar mensagem de processamento para imagens grandes
  if (file.size > 5 * 1024 * 1024) {
    wallpaperSuccess.value = 'Processando imagem, aguarde...'
  }
  
  // Carregar a imagem original
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64Image = e.target.result
    
    try {
      // Salvar a imagem no localStorage
      localStorage.setItem(WALLPAPER_KEY, base64Image)
      currentWallpaper.value = base64Image
      
      // Aplicar como papel de parede
      applyWallpaper(base64Image)
      
      // Chamamos a função prop
      props.setWallpaper(base64Image)
      
      wallpaperSuccess.value = 'Papel de parede aplicado com sucesso!'
      setTimeout(() => wallpaperSuccess.value = '', 3000)
    } catch (error) {
      // Em caso de erro (geralmente por tamanho), tentar otimizar
      if (error.name === 'QuotaExceededError' || error.message && error.message.includes('storage')) {
        // Tentar redimensionar a imagem
        const img = new Image()
        img.onload = () => {
          optimizeImageForStorage(img, file.type)
        }
        img.onerror = () => {
          wallpaperError.value = 'Erro ao processar a imagem'
          setTimeout(() => wallpaperError.value = '', 3000)
        }
        img.src = base64Image
      } else {
        wallpaperError.value = 'Erro ao aplicar papel de parede'
        setTimeout(() => wallpaperError.value = '', 3000)
      }
    }
  }
  
  reader.onerror = () => {
    wallpaperError.value = 'Erro ao ler o arquivo'
    setTimeout(() => wallpaperError.value = '', 3000)
  }
  
  // Ler como DataURL para preservar qualidade
  reader.readAsDataURL(file)
  
  // Limpar input para permitir reenvio do mesmo arquivo
  event.target.value = null
}

// Função para otimizar apenas se necessário (quando a imagem for muito grande para o localStorage)
function optimizeImageForStorage(img, mimeType) {
  // Criar canvas para redimensionar
  const canvas = document.createElement('canvas')
  // Redimensionar para 1920x1080 mantendo proporção
  const maxWidth = 1920
  const maxHeight = 1080
  
  let newWidth = img.width
  let newHeight = img.height
  
  if (newWidth > maxWidth || newHeight > maxHeight) {
    if (newWidth / newHeight > maxWidth / maxHeight) {
      newWidth = maxWidth
      newHeight = Math.round(img.height * (maxWidth / img.width))
    } else {
      newHeight = maxHeight
      newWidth = Math.round(img.width * (maxHeight / img.height))
    }
  }
  
  canvas.width = newWidth
  canvas.height = newHeight
  
  // Desenhar imagem redimensionada
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, newWidth, newHeight)
  
  // Otimizar e salvar
  try {
    const optimizedImage = canvas.toDataURL(mimeType, 0.9)
    localStorage.setItem(WALLPAPER_KEY, optimizedImage)
    currentWallpaper.value = optimizedImage
    
    // Aplicar como papel de parede
    applyWallpaper(optimizedImage)
    
    // Chamamos a função prop
    props.setWallpaper(optimizedImage)
    
    wallpaperSuccess.value = 'Imagem redimensionada e aplicada com sucesso!'
    setTimeout(() => wallpaperSuccess.value = '', 3000)
  } catch (error) {
    wallpaperError.value = 'Erro ao otimizar a imagem. Tente uma imagem menor.'
    setTimeout(() => wallpaperError.value = '', 4000)
  }
}

function removeWallpaper() {
  localStorage.removeItem(WALLPAPER_KEY)
  currentWallpaper.value = ''
  
  // Remover papel de parede
  removeWallpaperStyles()
  
  // Remover papel de parede via prop
  props.setWallpaper(null)
  
  wallpaperSuccess.value = 'Papel de parede removido!'
  setTimeout(() => wallpaperSuccess.value = '', 3000)
}

// Função para restaurar o papel de parede
function restoreWallpaper() {
  const savedWallpaper = localStorage.getItem(WALLPAPER_KEY)
  if (savedWallpaper) {
    currentWallpaper.value = savedWallpaper
    applyWallpaper(savedWallpaper)
    props.setWallpaper(savedWallpaper)
  }
}

// Função para garantir que o papel de parede seja aplicado em diferentes momentos
function setupWallpaperRestoration() {
  // Se o conteúdo já foi carregado
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    restoreWallpaper()
  } else {
    // Caso contrário, aguardar o carregamento
    document.addEventListener('DOMContentLoaded', restoreWallpaper)
  }
  
  // Adicionar outro evento para ter certeza que o papel de parede é aplicado
  window.addEventListener('load', restoreWallpaper)
}

onMounted(() => {
  // Inicializar o papel de parede
  restoreWallpaper()
  
  // Configurar restauração para garantir persistência
  setupWallpaperRestoration()
})

onBeforeUnmount(() => {
  // Limpar event listeners
  document.removeEventListener('DOMContentLoaded', restoreWallpaper)
  window.removeEventListener('load', restoreWallpaper)
})
</script>

<style>
/* Estilos específicos para quando há papel de parede */
html.has-wallpaper,
body.has-wallpaper {
  background-attachment: fixed !important;
  background-size: cover !important;
  background-position: center center !important;
  background-repeat: no-repeat !important;
}
</style> 