import * as THREE from 'three'

const DISTANCE = 3000
const ANGULAR_DIAMETER = 0.5 * Math.PI / 180

function haloTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(64, 64, 8, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255,233,195,0.12)')
  gradient.addColorStop(0.2, 'rgba(255,205,142,0.12)')
  gradient.addColorStop(1, 'rgba(255,205,142,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

export function createSunVisual(scene) {
  const radius = Math.tan(ANGULAR_DIAMETER / 2) * DISTANCE
  const geometry = new THREE.SphereGeometry(radius, 24, 16)
  const material = new THREE.MeshBasicMaterial({ color: 0xfff3db, toneMapped: false, depthWrite: false })
  const disc = new THREE.Mesh(geometry, material)
  disc.renderOrder = 1
  const texture = haloTexture()
  const haloMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false })
  const halo = new THREE.Sprite(haloMaterial)
  halo.scale.set(165, 165, 1)
  halo.renderOrder = 2
  scene.add(disc, halo)

  function update(cameraPosition, direction) {
    const x = cameraPosition.x + direction.x * DISTANCE
    const y = cameraPosition.y + direction.y * DISTANCE
    const z = cameraPosition.z + direction.z * DISTANCE
    disc.position.set(x, y, z)
    halo.position.copy(disc.position)
  }

  return {
    update,
    dispose: () => {
      scene.remove(disc, halo)
      geometry.dispose()
      material.dispose()
      haloMaterial.dispose()
      texture.dispose()
    },
  }
}
