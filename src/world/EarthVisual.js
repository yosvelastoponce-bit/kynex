import * as THREE from 'three'
import { EARTH_ANGULAR_DIAMETER, EARTH_CONFIG } from './EarthSystem.js'

const DISTANCE = 5000
const RADIUS = DISTANCE * Math.tan(EARTH_ANGULAR_DIAMETER * Math.PI / 360)

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Independent illumination keeps Earth's phase correct even when the local
// south-polar terrain has its direct sunlight switched off.
const fragmentShader = `
  uniform sampler2D surfaceMap;
  uniform vec3 sunDirection;
  uniform float opacity;
  uniform float ambientLevel;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    vec4 surface = texture2D(surfaceMap, vUv);
    if (surface.a < 0.03) discard;
    float daylight = max(dot(normalize(vWorldNormal), normalize(sunDirection)), 0.0);
    gl_FragColor = vec4(surface.rgb * (ambientLevel + 1.55 * daylight), surface.a * opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

function cloudTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const context = canvas.getContext('2d')
  const image = context.createImageData(512, 256)
  const hash = (x, y) => {
    let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) | 0
    n = Math.imul(n ^ n >>> 13, 1274126177)
    return ((n ^ n >>> 16) >>> 0) / 4294967296
  }
  const noise = (x, y, columns) => {
    const ix = Math.floor(x), iy = Math.floor(y)
    const fx = x - ix, fy = y - iy
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy)
    const a = hash((ix + columns) % columns, iy) * (1 - sx) + hash((ix + 1) % columns, iy) * sx
    const b = hash((ix + columns) % columns, iy + 1) * (1 - sx) + hash((ix + 1) % columns, iy + 1) * sx
    return a * (1 - sy) + b * sy
  }
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 512; x++) {
      const v = noise(x / 512 * 14, y / 38, 14) * 0.55
        + noise(x / 512 * 31, y / 17, 31) * 0.3
        + noise(x / 512 * 74, y / 7, 74) * 0.15
      const alpha = Math.max(0, Math.min(180, (v - 0.53) * 800))
      const i = (y * 512 + x) * 4
      image.data[i] = 238
      image.data[i + 1] = 242
      image.data[i + 2] = 244
      image.data[i + 3] = alpha
    }
  }
  context.putImageData(image, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function createEarthVisual(scene) {
  const group = new THREE.Group()
  const axis = new THREE.Group()
  axis.rotation.z = Math.PI - EARTH_CONFIG.axialTilt * Math.PI / 180
  group.add(axis)
  const geometry = new THREE.SphereGeometry(RADIUS, 48, 32)
  const sunVector = new THREE.Vector3(1, 0, 0)
  const placeholder = new THREE.DataTexture(new Uint8Array([32, 84, 128, 255]), 1, 1)
  placeholder.colorSpace = THREE.SRGBColorSpace
  placeholder.needsUpdate = true
  const clouds = cloudTexture()
  const uniforms = (map, opacity, ambientLevel) => ({
    surfaceMap: { value: map }, sunDirection: { value: sunVector },
    opacity: { value: opacity }, ambientLevel: { value: ambientLevel },
  })
  const surfaceMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms(placeholder, 1, 0.035), vertexShader, fragmentShader,
  })
  const cloudMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms(clouds, 0.7, 0.012), vertexShader, fragmentShader,
    transparent: true, depthWrite: false,
  })
  const surface = new THREE.Mesh(geometry, surfaceMaterial)
  const cloudShell = new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 1.008, 48, 32), cloudMaterial)
  axis.add(surface, cloudShell)
  scene.add(group)
  let loadedTexture
  let disposed = false
  new THREE.TextureLoader().load('/assets/earth-nasa-bmng-2k.jpg', (texture) => {
    if (disposed) { texture.dispose(); return }
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    loadedTexture = texture
    surfaceMaterial.uniforms.surfaceMap.value = texture
  })

  function update(cameraPosition, state, solarDirection) {
    group.position.set(
      cameraPosition.x + state.direction.x * DISTANCE,
      cameraPosition.y + state.direction.y * DISTANCE,
      cameraPosition.z + state.direction.z * DISTANCE,
    )
    surface.rotation.y = state.spinRadians
    cloudShell.rotation.y = state.spinRadians + state.days * Math.PI / 6
    sunVector.set(solarDirection.x, solarDirection.y, solarDirection.z)
  }

  return {
    update,
    dispose: () => {
      disposed = true
      scene.remove(group)
      geometry.dispose()
      cloudShell.geometry.dispose()
      surfaceMaterial.dispose()
      cloudMaterial.dispose()
      placeholder.dispose()
      loadedTexture?.dispose()
      clouds.dispose()
    },
  }
}
