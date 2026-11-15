<script setup>
import { nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'

const emit = defineEmits(['close', 'step-change'])
const step = ref(0)
const nextButton = ref(null)
const guideCard = ref(null)
const cardStyle = ref({})
const focusStyle = ref({})
const line = ref(null)
let raisedElement = null
let highlightedTarget = null

const topics = [
  { label: 'Bienvenida', title: 'Tu misión comienza aquí', detail: 'Explorarás un sector del borde de Shackleton, cerca del polo sur lunar. Esta guía presenta los instrumentos del simulador y cómo usarlos. Puedes saltarla en cualquier momento.', action: 'Al terminar, haz clic en la escena para capturar el ratón.' },
  { label: 'Movimiento', title: 'Camina sobre la Luna', detail: 'Usa W A S D para caminar, el ratón para mirar y ESPACIO para saltar. La gravedad simulada es lunar y el relieve sostiene al astronauta. ESC libera el ratón y pausa la exploración.', action: 'Si Pointer Lock no está disponible, arrastra para mirar.' },
  { label: 'Terreno 3D', title: 'Reconoce el suelo que pisas', detail: 'El relieve 3D procede de un recorte del modelo de elevación NASA LOLA Site04. Los cráteres, las pendientes y la altura condicionan la ruta. El material gris del suelo es provisional.', action: 'Observa el horizonte y busca caminos seguros alrededor de las depresiones.' },
  { label: 'Mapa local', title: 'Oriéntate con el mapa', detail: 'El panel derecho permite ver imagen orbital LROC, altura y pendiente del mismo sector. El punto verde indica tu posición; su triángulo muestra hacia dónde miras. También verás la base y otros marcadores.', action: 'Cambia de capa y compara lo que muestra el mapa con el terreno.' },
  { label: 'Tiempo y Sol', title: 'Experimenta con la luz', detail: 'En Información → El Sol y el paso del tiempo puedes pausar, acelerar o restablecer el reloj. La dirección solar modifica las sombras del suelo y del mapa. Los ángulos locales son un modelo educativo pendiente de validación astronómica.', action: 'Prueba otro ritmo temporal y observa cómo cambian luz y sombra.' },
  { label: 'Tierra y órbitas', title: 'Mira hacia la Tierra', detail: 'La Tierra visible, su fase y el diagrama Sol–Tierra–Luna ayudan a entender la geometría espacial. Su posición aparente es ilustrativa y todavía no se ha validado con efemérides y horizonte local de Site04.', action: 'Abre Información → La Tierra y sus órbitas para ver el diagrama.' },
  { label: 'Temperatura', title: 'Compara zonas iluminadas y oscuras', detail: 'El panel térmico estima la temperatura según la exposición solar del lugar. Es una simulación educativa: no se dispone de una medición Diviner para esta posición e instante.', action: 'Abre Información → ¿Qué tan fría está la Luna?' },
  { label: 'Radiación', title: 'Evalúa la exposición', detail: 'El dosímetro estima radiación cósmica y permite ensayar un evento solar SEP hipotético. La dosis local no es una medición real; CRaTER observa radiación desde órbita. En el mapa, Q sirve para inspeccionar el suelo.', action: 'Abre Información → Radiación del espacio.' },
  { label: 'Base lunar', title: 'Explora el puesto KYNEX', detail: 'La base es una infraestructura ficticia de entrenamiento. Acércate a un equipo: E lo utiliza y F muestra su ficha. El módulo de acceso y la esclusa controlan la entrada al hábitat.', action: 'Sigue los marcadores del mapa hasta el puesto lunar.' },
  { label: 'Soporte vital', title: 'Gestiona el hábitat', detail: 'Dentro de la base, el sistema ECLSS simula oxígeno, CO₂, presión, humedad, energía y controles de seguridad. Sus valores son parte de un escenario de aprendizaje, no telemetría de una base real.', action: 'Consulta Mi misión y la base para revisar el estado de la instalación.' },
  { label: 'Muestras y datos', title: 'Aprende de cada decisión', detail: 'La misión de muestras permite examinar material lunar en el laboratorio simulado. Información → Fuentes y metodología distingue datos observados, cálculos derivados, modelos y escenarios ficticios.', action: 'Pulsa R durante la exploración para abrir Información. Allí puedes volver a ver esta guía.' },
]
const targets = [
  '.brand', '.controls > div:first-child', '.reticle', '.polar-map',
  '[aria-controls="info-sun"]', '[aria-controls="info-earth"]',
  '[aria-controls="info-temperature"]', '[aria-controls="info-radiation"]',
  '[aria-controls="info-mission"]', '[aria-controls="info-mission"]',
  '[aria-controls="info-sources"]',
]

function positionGuide() {
  const target = document.querySelector(targets[step.value])
  const card = guideCard.value
  if (!target || !card) return
  if (highlightedTarget !== target) {
    highlightedTarget?.classList.remove('guide-target')
    highlightedTarget = target
    target.classList.add('guide-target')
  }
  const toRaise = target.closest('.topbar, .info-drawer, .controls') ?? target
  if (raisedElement !== toRaise) {
    raisedElement?.classList.remove('guide-raised')
    raisedElement = toRaise
    raisedElement.classList.add('guide-raised')
  }
  const rect = target.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const cardWidth = card.offsetWidth
  const cardHeight = card.offsetHeight
  const targetX = rect.left + rect.width / 2
  const targetY = rect.top + rect.height / 2
  const left = Math.max(12, Math.min(vw - cardWidth - 12,
    targetX < vw / 2 ? vw - cardWidth - 30 : 30))
  const top = Math.max(12, Math.min(vh - cardHeight - 12, targetY - cardHeight / 2))
  cardStyle.value = { left: `${left}px`, top: `${top}px` }
  const edgeX = left > targetX ? left : left + cardWidth
  const edgeY = Math.max(top + 35, Math.min(top + cardHeight - 35, targetY))
  line.value = { x1: edgeX, y1: edgeY, x2: targetX, y2: targetY }
  focusStyle.value = { left: `${rect.left - 5}px`, top: `${rect.top - 5}px`, width: `${rect.width + 10}px`, height: `${rect.height + 10}px` }
}

watch(step, async (index) => {
  emit('step-change', index)
  await nextTick()
  // The parent renders the selected information section in the same update.
  requestAnimationFrame(() => {
    const target = document.querySelector(targets[index])
    if (target?.closest('.info-drawer')) {
      const drawer = target.closest('.info-drawer')
      const rect = target.getBoundingClientRect()
      const drawerRect = drawer.getBoundingClientRect()
      if (rect.top < drawerRect.top + 50 || rect.bottom > drawerRect.bottom - 15) {
        drawer.scrollTop += rect.top - drawerRect.top - 85
      }
    }
    requestAnimationFrame(positionGuide)
  })
}, { immediate: true })

function onKeydown(event) {
  if (event.code === 'Escape') {
    event.preventDefault()
    emit('close')
  } else if (event.code === 'ArrowRight' && step.value < topics.length - 1) {
    step.value++
  } else if (event.code === 'ArrowLeft' && step.value > 0) {
    step.value--
  }
}
onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', positionGuide)
  nextButton.value?.focus()
  requestAnimationFrame(positionGuide)
})
onBeforeUnmount(() => {
  raisedElement?.classList.remove('guide-raised')
  highlightedTarget?.classList.remove('guide-target')
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', positionGuide)
})
</script>

<template>
  <div class="guide-overlay">
    <div class="guide-focus" :style="focusStyle" aria-hidden="true" />
    <svg v-if="line" class="guide-line" width="100%" height="100%" aria-hidden="true"><line :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2" /><circle :cx="line.x2" :cy="line.y2" r="5" /></svg>
    <section ref="guideCard" class="guide-card" :style="cardStyle" role="dialog" aria-modal="true" aria-labelledby="guide-title" aria-describedby="guide-description">
      <header class="guide-header">
        <div><span class="guide-eyebrow">KYNEX / GUÍA DE EXPLORACIÓN</span><div class="guide-progress">{{ String(step + 1).padStart(2, '0') }} / {{ String(topics.length).padStart(2, '0') }}</div></div>
        <button type="button" class="guide-skip" @click="emit('close')">SALTAR GUÍA <span aria-hidden="true">×</span></button>
      </header>
      <div class="guide-body">
        <div class="guide-topic">{{ topics[step].label }}</div>
        <h2 id="guide-title">{{ topics[step].title }}</h2>
        <p id="guide-description">{{ topics[step].detail }}</p>
        <div class="guide-action"><span aria-hidden="true">✦</span>{{ topics[step].action }}</div>
      </div>
      <nav class="guide-steps" aria-label="Secciones de la guía">
        <button v-for="(topic, index) in topics" :key="topic.label" type="button" :class="{ active: index === step }" :aria-label="`${index + 1}: ${topic.label}`" :aria-current="index === step ? 'step' : undefined" @click="step = index" />
      </nav>
      <footer class="guide-footer">
        <button type="button" class="guide-back" :disabled="step === 0" @click="step--">← ANTERIOR</button>
        <button ref="nextButton" type="button" class="guide-next" @click="step === topics.length - 1 ? emit('close') : step++">{{ step === topics.length - 1 ? 'COMENZAR EXPLORACIÓN' : 'SIGUIENTE' }} <span aria-hidden="true">↗</span></button>
      </footer>
    </section>
  </div>
</template>
