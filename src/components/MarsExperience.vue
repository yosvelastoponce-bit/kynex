<script setup>
import { ref } from 'vue'

const emit = defineEmits(['menu'])
const frame = ref(null)
const ready = ref(false)
const navigationNotice = ref('')
const marsUrl = `${import.meta.env.BASE_URL}mars/index.html`

function returnToMenu() {
  navigationNotice.value = ''
  // Keep the original document mounted: its mission, samples and rover stay in memory.
  // Use its own Escape handler to close any panel and pause, never its reset button.
  const doc = frame.value?.contentDocument
  const win = frame.value?.contentWindow
  if (doc && win && doc.getElementById('intro')?.classList.contains('leaving')) {
    for (let attempt = 0; attempt < 6; attempt++) {
      if (!doc.getElementById('pauseScreen')?.classList.contains('hidden')) break
      doc.dispatchEvent(new win.KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true }))
      doc.dispatchEvent(new win.KeyboardEvent('keyup', { code: 'Escape', key: 'Escape', bubbles: true }))
    }
    for (const code of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'Space', 'KeyE']) {
      doc.dispatchEvent(new win.KeyboardEvent('keyup', { code, bubbles: true }))
    }
    // The original rescue sequence temporarily ignores Escape. Do not leave it running unseen.
    if (doc.getElementById('pauseScreen')?.classList.contains('hidden')) {
      navigationNotice.value = 'Espera a que termine el rescate para volver al menú.'
      return
    }
  }
  if (doc?.pointerLockElement) doc.exitPointerLock()
  emit('menu')
}
</script>

<template>
  <section class="mars-experience" aria-label="KYNEX · Marte">
    <header class="mars-navigation">
      <span>✦ KYNEX <small>/ MARS FRONTIER</small></span>
      <button type="button" @click="returnToMenu">← MENÚ DE MUNDOS</button>
    </header>
    <p v-if="!ready" class="mars-loading" role="status">Cargando Marte…</p>
    <p v-if="navigationNotice" class="mars-loading" role="status">{{ navigationNotice }}</p>
    <iframe ref="frame" :src="marsUrl" title="MARS FRONTIER · Exploración de Marte" allow="fullscreen" @load="ready = true" />
  </section>
</template>

<style scoped>
.mars-experience { position: fixed; inset: 0; z-index: 200; background: #100c0a; display: flex; flex-direction: column; }
.mars-navigation { height: 46px; flex-shrink: 0; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #120e0d; border-bottom: 1px solid #ad795645; color: #f0d8c4; font: 600 13px monospace; letter-spacing: .08em; }
.mars-navigation small { color: #b79b87; font-size: 10px; }
.mars-navigation button { background: #ffffff0a; border: 1px solid #d6ac8050; border-radius: 7px; padding: 8px 12px; color: #ffe3cb; font: 11px monospace; cursor: pointer; }
.mars-navigation button:hover, .mars-navigation button:focus-visible { background: #b8876030; outline: 1px solid #d6ac80; }
iframe { flex: 1; min-height: 0; width: 100%; border: 0; }
.mars-loading { position: absolute; top: 56px; left: 20px; color: #ffe3cb; }
@media (max-width: 520px) { .mars-navigation { padding: 0 10px; } .mars-navigation small { display: none; } }
</style>
