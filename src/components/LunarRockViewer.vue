<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'

const canvas = ref(null)
let renderer, scene, camera, sample, resizeObserver, animationFrame, pointer

function resize() {
  if (!canvas.value || !renderer) return
  const { width, height } = canvas.value.getBoundingClientRect()
  if (!width || !height) return
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

function makeRock() {
  const geometry = new THREE.IcosahedronGeometry(0.82, 3)
  const positions = geometry.attributes.position
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i)
    const shape = 1 + 0.1 * Math.sin(x * 13 + y * 8) * Math.cos(z * 11 - y * 4)
    positions.setXYZ(i, x * shape, y * shape * 0.82, z * shape * 0.94)
  }
  geometry.computeVertexNormals()
  const rock = new THREE.Group()
  rock.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    color: 0x81796a, roughness: 0.96, metalness: 0.02, flatShading: true,
  })))

  const grains = [
    { color: 0xe7ddbb, position: [-0.3, 0.25, 0.54], scale: [0.19, 0.14, 0.1] },
    { color: 0x789181, position: [0.27, 0.06, 0.66], scale: [0.14, 0.2, 0.09] },
    { color: 0xb9a76d, position: [0.02, -0.32, 0.61], scale: [0.13, 0.11, 0.08] },
    { color: 0xddd2b0, position: [0.47, 0.28, 0.32], scale: [0.1, 0.13, 0.08] },
    { color: 0x687a6d, position: [-0.48, -0.05, 0.4], scale: [0.12, 0.1, 0.08] },
  ]
  for (const grain of grains) {
    const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0),
      new THREE.MeshStandardMaterial({ color: grain.color, roughness: 0.78, flatShading: true }))
    mesh.position.set(...grain.position)
    mesh.scale.set(...grain.scale)
    rock.add(mesh)
  }
  return rock
}

function animate() {
  animationFrame = requestAnimationFrame(animate)
  if (sample && !pointer) sample.rotation.y += 0.003
  renderer.render(scene, camera)
}

function handlePointerDown(event) {
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }
  canvas.value.setPointerCapture(event.pointerId)
}

function handlePointerMove(event) {
  if (!pointer || pointer.id !== event.pointerId) return
  sample.rotation.y += (event.clientX - pointer.x) * 0.012
  sample.rotation.x = THREE.MathUtils.clamp(sample.rotation.x + (event.clientY - pointer.y) * 0.012, -1.1, 1.1)
  pointer.x = event.clientX
  pointer.y = event.clientY
}

function handlePointerUp() { pointer = null }

function handleWheel(event) {
  camera.position.z = THREE.MathUtils.clamp(camera.position.z + Math.sign(event.deltaY) * 0.18, 1.65, 3.8)
}

onMounted(() => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color('#10191b')
  camera = new THREE.PerspectiveCamera(36, 1, 0.1, 20)
  camera.position.set(0, 0, 2.8)
  renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  scene.add(new THREE.HemisphereLight(0xcfe8e0, 0x28251e, 2.1))
  const key = new THREE.DirectionalLight(0xffe6b8, 3.2)
  key.position.set(-2, 3, 4)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0x9ac4df, 1.2)
  fill.position.set(3, -1, 2)
  scene.add(fill)
  sample = makeRock()
  scene.add(sample)
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas.value)
  resize()
  animate()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrame)
  resizeObserver?.disconnect()
  if (sample) {
    sample.traverse(object => {
      object.geometry?.dispose()
      object.material?.dispose()
    })
  }
  renderer?.dispose()
})
</script>

<template>
  <div class="lunar-rock-viewer">
    <canvas
      ref="canvas"
      aria-label="Muestra lunar tridimensional. Arrastra para girar y usa la rueda para acercar."
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @wheel.prevent="handleWheel"
    />
    <div class="rock-viewer-instructions">ARRASTRA PARA GIRAR · RUEDA PARA ACERCAR</div>
  </div>
</template>
