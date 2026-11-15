import * as THREE from 'three'

// Sidereal rotation, relative to distant stars. The solar circuit is longer.
export const LUNAR_SIDEREAL_DAYS = 27.321661

export function starRotationRadians(days) {
  const phase = (days % LUNAR_SIDEREAL_DAYS) / LUNAR_SIDEREAL_DAYS
  return phase === 0 ? 0 : -2 * Math.PI * phase
}

export function createStars() {
  const count = 950
  const positions = new Float32Array(count * 3)
  let seed = 911
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  for (let i = 0; i < count; i++) {
    const theta = random() * Math.PI * 2
    const y = random() * 0.85 + 0.15
    const radius = Math.sqrt(1 - y * y)
    positions[i * 3] = Math.cos(theta) * radius * 700
    positions[i * 3 + 1] = y * 700
    positions[i * 3 + 2] = Math.sin(theta) * radius * 700
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({ color: 0xd6e2ee, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.7, depthWrite: false })
  const points = new THREE.Points(geometry, material)

  return {
    points,
    update(cameraPosition, days) {
      // Keep the distant sky centred on the astronaut; looking changes its
      // apparent direction, while walking produces negligible parallax.
      points.position.copy(cameraPosition)
      points.rotation.y = starRotationRadians(days)
    },
    dispose() { geometry.dispose(); material.dispose() },
  }
}
