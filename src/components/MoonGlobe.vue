<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps({ sunDirection: { type: Object, required: true } })
const mount = ref(null)
let renderer, observer, geometry, material, texture
let sun, renderGlobe
let disposed = false

watch(() => props.sunDirection, (direction) => {
  if (!sun || !direction) return
  sun.position.set(direction.x * 4, direction.y * 4, direction.z * 4)
  renderGlobe?.()
})

onMounted(() => {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 10)
  camera.position.set(0, 0, 4.1)
  const sphere = new THREE.Mesh(
    geometry = new THREE.SphereGeometry(1.25, 64, 40),
    material = new THREE.MeshStandardMaterial({ color: 0xb6b6b4, roughness: 1 }),
  )
  sphere.rotation.set(-0.35, 2.4, 0)
  scene.add(sphere)
  scene.add(new THREE.AmbientLight(0xaab9c8, 0.14))
  sun = new THREE.DirectionalLight(0xfff3df, 2.5)
  sun.position.set(props.sunDirection.x * 4, props.sunDirection.y * 4, props.sunDirection.z * 4)
  scene.add(sun)
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  mount.value.appendChild(renderer.domElement)

  function render() {
    if (!mount.value || disposed) return
    const size = Math.max(1, mount.value.clientWidth)
    renderer.setSize(size, size, false)
    camera.aspect = 1
    camera.updateProjectionMatrix()
    renderer.render(scene, camera)
  }
  renderGlobe = render
  observer = new ResizeObserver(render)
  observer.observe(mount.value)
  new THREE.TextureLoader().load('/assets/moon-lroc-2k.jpg', (loaded) => {
    if (disposed) { loaded.dispose(); return }
    texture = loaded
    texture.colorSpace = THREE.SRGBColorSpace
    material.map = texture
    material.needsUpdate = true
    render()
  })
  render()
})

onBeforeUnmount(() => {
  disposed = true
  observer?.disconnect()
  geometry?.dispose()
  material?.dispose()
  texture?.dispose()
  renderer?.dispose()
  renderer?.domElement.remove()
  sun = null
  renderGlobe = null
})
</script>

<template>
  <aside class="moon-globe" aria-label="Esfera de la Luna con indicador del polo sur">
    <div ref="mount" class="moon-globe-canvas" />
    <div class="moon-globe-pole" aria-hidden="true"><span /></div>
    <div class="moon-globe-label"><strong>LA LUNA</strong><span>POLO SUR ↓</span></div>
  </aside>
</template>
