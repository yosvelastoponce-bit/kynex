<script setup>
defineProps({ info: { type: Object, required: true } })
defineEmits(['close'])
</script>

<template>
  <aside class="base-info" :aria-label="`Información de ${info.name}`">
    <div class="base-info-heading"><span>ARCHIVO TÉCNICO / OUTPOST 01</span><button type="button" aria-label="Cerrar información" @click="$emit('close')">×</button></div>
    <h2>{{ info.name }}</h2>
    <dl>
      <div><dt>FUNCIÓN</dt><dd>{{ info.function }}</dd></div>
      <div><dt>DEPENDENCIAS</dt><dd>{{ info.dependencies }}</dd></div>
      <div><dt>AYUDA A CONTROLAR</dt><dd>{{ info.controls }}</dd></div>
      <div><dt>ESTADO</dt><dd>{{ info.status }}</dd></div>
    </dl>
    <div v-if="info.layers" class="base-info-layers"><b>CAPAS CONCEPTUALES</b><div v-for="layer in info.layers" :key="layer">◇ {{ layer }}</div></div>
    <a :href="info.source" target="_blank" rel="noopener noreferrer">REFERENCIA NASA ↗</a>
    <div class="base-info-note">Modelo educativo · pulsa F para cerrar</div>
  </aside>
</template>
