import * as THREE from 'three'
import { heightAt } from './LunarTerrain.js'
import { OUTPOST } from './BasePlacement.js'

function shellGeometry() {
  const vertices = [], uvs = [], indices = []
  const axial = 40, radial = 48, radius = 2, centerY = 1
  for (let a = 0; a < axial; a++) {
    const x0 = -5 + a * 10 / axial, x1 = -5 + (a + 1) * 10 / axial
    for (let r = 0; r < radial; r++) {
      const t0 = r * Math.PI * 2 / radial, t1 = (r + 1) * Math.PI * 2 / radial
      const midY = centerY + radius * Math.cos((t0 + t1) / 2)
      const midZ = radius * Math.sin((t0 + t1) / 2)
      // Cut the actual doorway through the cylindrical skin.
      if (Math.abs((x0 + x1) / 2) < 1.1 && midZ > 1.35 && midY > -0.1 && midY < 2.4) continue
      const first = vertices.length / 3
      for (const [x, t] of [[x0, t0], [x1, t0], [x1, t1], [x0, t1]]) {
        vertices.push(x, centerY + radius * Math.cos(t), radius * Math.sin(t))
        uvs.push((x + 5) / 10, t / (Math.PI * 2))
      }
      indices.push(first, first + 1, first + 2, first, first + 2, first + 3)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export function createLunarBaseModel(floorY, sampleHeight = heightAt, origin = OUTPOST) {
  const root = new THREE.Group()
  root.name = origin.name
  root.position.set(origin.x, floorY, origin.z)
  const mat = {
    shell: new THREE.MeshStandardMaterial({ color: 0xabb4b2, metalness: 0.48, roughness: 0.48, side: THREE.DoubleSide }),
    inner: new THREE.MeshStandardMaterial({ color: 0x76828a, metalness: 0.25, roughness: 0.72 }),
    frame: new THREE.MeshStandardMaterial({ color: 0x4b5e62, metalness: 0.72, roughness: 0.38 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x19282d, metalness: 0.55, roughness: 0.56 }),
    deck: new THREE.MeshStandardMaterial({ color: 0x53605e, metalness: 0.55, roughness: 0.6 }),
    blue: new THREE.MeshStandardMaterial({ color: 0x24445b, metalness: 0.32, roughness: 0.43 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xb39a63, metalness: 0.54, roughness: 0.52 }),
    mint: new THREE.MeshStandardMaterial({ color: 0x7ccfb7, metalness: 0.25, roughness: 0.4, emissive: 0x1a4c3a, emissiveIntensity: 0.35 }),
    white: new THREE.MeshStandardMaterial({ color: 0xcbd3cb, metalness: 0.18, roughness: 0.7 }),
  }
  const box = (parent, w, h, d, x, y, z, material, shadow = false) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
    mesh.position.set(x, y, z)
    mesh.castShadow = shadow
    mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }
  const cylinder = (parent, radiusTop, radiusBottom, length, x, y, z, material, segments = 16, shadow = false) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, length, segments), material)
    mesh.position.set(x, y, z)
    mesh.castShadow = shadow
    mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }
  const localGround = (x, z) => sampleHeight(origin.x + x, origin.z + z) - floorY
  const label = (message, x, y, z, width = 2.1) => {
    const canvas = document.createElement('canvas')
    canvas.width = 512; canvas.height = 112
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#142328'; ctx.fillRect(0, 0, 512, 112)
    ctx.strokeStyle = '#8cd5bc'; ctx.lineWidth = 5; ctx.strokeRect(4, 4, 504, 104)
    ctx.fillStyle = '#d9ede0'; ctx.font = 'bold 35px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(message, 256, 58)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 112 / 512),
      new THREE.MeshBasicMaterial({ map: texture, transparent: false, side: THREE.DoubleSide }))
    mesh.position.set(x, y, z)
    root.add(mesh)
    return mesh
  }

  // Level foundation. Every visible support reaches its own sampled ground point.
  box(root, 12.4, 0.34, 9, 0, -0.17, 1.1, mat.deck, true)
  for (const x of [-5.5, -2, 2, 5.5]) for (const z of [-2.8, 4.4]) {
    const ground = localGround(x, z)
    const top = -0.25
    const length = Math.max(0.18, top - ground)
    cylinder(root, 0.12, 0.17, length, x, ground + length / 2, z, mat.frame, 12)
    cylinder(root, 0.31, 0.31, 0.1, x, ground + 0.05, z, mat.dark, 12)
  }
  // Gridded walkway and a shallow ramp down to the procedural surface.
  for (let z = 5.65; z < 9.4; z += 0.42) {
    const t = (z - 5.4) / 4
    const y = (1 - t) * 0 + t * localGround(0, z)
    box(root, 2.35, 0.08, 0.34, 0, y - 0.04, z, mat.deck)
  }
  for (const x of [-1.3, 1.3]) box(root, 0.055, 0.06, 4.2, x, -0.04, 7.4, mat.gold)

  // Closed pressure shell with a physically open side hatch; interior is visible.
  const shell = new THREE.Mesh(shellGeometry(), mat.shell)
  shell.castShadow = true; shell.receiveShadow = true
  root.add(shell)
  for (const x of [-5, 5]) {
    const end = cylinder(root, 2, 2, 0.17, x, 1, 0, mat.shell, 40, true)
    end.rotation.z = Math.PI / 2
  }
  for (const x of [-4.65, -2.5, 2.5, 4.65]) {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(2.025, 0.045, 8, 40), mat.frame)
    hoop.position.set(x, 1, 0); hoop.rotation.y = Math.PI / 2
    root.add(hoop)
  }
  for (const x of [-4.1, 4.1]) box(root, 0.18, 0.08, 3.65, x, 2.96, 0, mat.gold)
  box(root, 9.6, 0.14, 3.35, 0, -0.01, 0, mat.inner)
  label(origin.name === 'KYNEX OUTPOST 01' ? 'KYNEX / OUTPOST 01' : 'PUNTO DE APOYO', -3.2, 1.45, 1.96, 2.7)

  // Airlock chamber, side panels and two separate sliding doors.
  box(root, 2.5, 0.13, 3.3, 0, 0.01, 3.55, mat.inner)
  for (const x of [-1.25, 1.25]) box(root, 0.17, 2.6, 3.2, x, 1.32, 3.55, mat.shell, true)
  box(root, 2.7, 0.16, 3.35, 0, 2.68, 3.55, mat.shell, true)
  for (const z of [1.96, 5.14]) {
    for (const x of [-1.07, 1.07]) box(root, 0.29, 2.65, 0.2, x, 1.32, z, mat.frame)
    box(root, 2.4, 0.22, 0.22, 0, 2.55, z, mat.frame)
    box(root, 2.4, 0.15, 0.24, 0, 0.03, z, mat.frame)
  }
  const innerDoor = box(root, 1.78, 2.34, 0.13, 0, 1.25, 1.96, mat.dark, true)
  const outerDoor = box(root, 1.78, 2.34, 0.13, 0, 1.25, 5.14, mat.dark, true)
  for (const door of [innerDoor, outerDoor]) {
    box(door, 0.7, 0.07, 0.15, 0, 0.57, 0, mat.gold)
    box(door, 0.45, 0.42, 0.15, 0, -0.25, 0, mat.frame)
  }
  for (const z of [2.5, 4.55]) {
    box(root, 0.28, 0.45, 0.1, 1.1, 1.25, z, mat.dark)
    box(root, 0.12, 0.12, 0.12, 1.1, 1.42, z, mat.mint)
  }
  box(root, 0.9, 0.11, 0.75, 0, 2.55, 3.55, mat.white)
  const airlockLight = new THREE.PointLight(0xcde8dc, 1.3, 7)
  airlockLight.position.set(0, 2.25, 3.55); root.add(airlockLight)
  // Entry work light keeps the hatch legible during the long polar shadows.
  const entryLight = new THREE.PointLight(0xcde8dc, 3.2, 8)
  entryLight.position.set(0, 3.08, 6.0); root.add(entryLight)
  box(root, 0.8, 0.08, 0.3, 0, 3.04, 5.7, mat.white)
  label('ESCLUSA / EVA', 0, 2.9, 5.2, 1.6)

  // Interior stations line the sides so the central walking route stays clear.
  for (const x of [-2.8, 2.8]) {
    const light = new THREE.PointLight(0xdcebe1, 1.5, 7)
    light.position.set(x, 2.25, 0); root.add(light)
    box(root, 0.8, 0.08, 0.3, x, 2.65, 0, mat.white)
  }
  box(root, 2.05, 0.9, 1.1, -3.3, 0.45, -1.08, mat.dark)
  for (let i = 0; i < 3; i++) box(root, 0.52, 0.35, 0.04, -3.9 + i * 0.61, 1.07, -0.49, mat.blue)
  box(root, 2.2, 0.62, 1.05, 2.9, 0.31, -1.08, mat.frame)
  box(root, 2.05, 0.16, 0.95, 2.9, 0.7, -1.08, mat.white)
  box(root, 1.8, 1.75, 0.78, -3.4, 0.88, 1.25, mat.frame)
  for (const x of [-3.9, -3.4, -2.9]) box(root, 0.32, 0.24, 0.05, x, 1.15, 1.66, mat.mint)
  for (const x of [3.15, 3.75]) box(root, 0.9, 1.35, 0.75, x, 0.68, 1.28, mat.deck)
  label('ECLSS', -3.35, 2.03, 1.72, 1.25)
  label('O2 / ELECTROLISIS', -3.75, 1.75, 1.73, 1.3)
  label('CAPTURA CO2', -2.55, 1.75, 1.73, 1.3)
  label('O2 / N2 RESERVAS', 3.25, 1.83, 1.73, 1.5)
  label('CONTROL AMBIENTAL', -3.35, 1.55, -0.43, 1.9)
  const activityIndicators = {
    sample: new THREE.MeshBasicMaterial({ color: 0xa2784f }),
    garden: new THREE.MeshBasicMaterial({ color: 0xa2784f }),
    observatory: new THREE.MeshBasicMaterial({ color: 0xa2784f }),
  }
  box(root, 0.52, 0.14, 0.42, 2.8, 0.91, -1.08, mat.dark)
  box(root, 0.19, 0.3, 0.16, 2.78, 1.1, -1.08, mat.blue)
  const microscopeTube = cylinder(root, 0.045, 0.07, 0.27, 2.78, 1.38, -1.08, mat.gold, 12)
  microscopeTube.rotation.x = Math.PI / 2
  for (const [x, material] of [[2.3, mat.gold], [3.25, mat.mint]]) {
    const sample = new THREE.Mesh(new THREE.DodecahedronGeometry(0.13, 0), material)
    sample.position.set(x, 0.94, -1.08)
    root.add(sample)
  }
  box(root, 0.12, 0.12, 0.1, 2.05, 1.12, -0.75, activityIndicators.sample)
  label('LAB / ROCAS', 2.85, 1.45, -0.48, 1.55)
  for (const x of [3.15, 3.75]) {
    box(root, 0.48, 0.16, 0.5, x, 1.46, 1.28, mat.dark)
    box(root, 0.43, 0.045, 0.44, x, 1.56, 1.28, mat.gold)
    const stem = cylinder(root, 0.035, 0.045, 0.3, x, 1.73, 1.28, mat.mint, 8)
    stem.rotation.z = x === 3.15 ? -0.12 : 0.12
    for (const side of [-1, 1]) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), mat.mint)
      leaf.scale.set(0.7, 1.3, 0.7)
      leaf.position.set(x + side * 0.12, 1.78 + side * 0.03, 1.28)
      root.add(leaf)
    }
  }
  box(root, 0.12, 0.12, 0.1, 2.55, 1.7, 0.95, activityIndicators.garden)
  label('CULTIVO LUNAR', 3.45, 2.16, 0.88, 1.75)
  for (const [x, angle] of [[0.52, -0.3], [0.88, 0.3], [0.7, 0]]) {
    const leg = cylinder(root, 0.025, 0.035, 0.72, x, 0.46, -1.48, mat.frame, 8)
    leg.rotation.z = angle
  }
  const telescopeTube = cylinder(root, 0.12, 0.15, 0.76, 0.7, 1.45, -1.28, mat.gold, 16)
  telescopeTube.rotation.x = Math.PI / 2
  const telescopeLens = cylinder(root, 0.17, 0.17, 0.08, 0.7, 1.45, -0.86, mat.blue, 16)
  telescopeLens.rotation.x = Math.PI / 2
  box(root, 0.12, 0.12, 0.1, 0.97, 1.73, -0.98, activityIndicators.observatory)
  label('OBSERVATORIO', 0.7, 2.02, -1.7, 1.8)
  const indicatorMaterials = {
    generator: new THREE.MeshBasicMaterial({ color: 0xa2784f }),
    scrubber: new THREE.MeshBasicMaterial({ color: 0xa2784f }),
    ventilation: new THREE.MeshBasicMaterial({ color: 0xa2784f }),
  }
  for (const [x, key] of [[-3.8, 'generator'], [-2.85, 'scrubber']]) {
    box(root, 0.65, 0.88, 0.12, x, 0.76, 1.71, mat.blue)
    box(root, 0.16, 0.16, 0.14, x, 1.38, 1.79, indicatorMaterials[key])
  }
  for (const x of [3.08, 3.78]) {
    cylinder(root, 0.24, 0.24, 0.95, x, 0.68, 1.72, mat.white, 12)
    cylinder(root, 0.26, 0.26, 0.1, x, 1.2, 1.72, mat.gold, 12)
  }
  box(root, 8.2, 0.24, 0.28, 0, 2.55, -0.9, mat.frame)
  for (const x of [-2.5, 0, 2.5]) box(root, 0.55, 0.09, 0.55, x, 2.41, -0.9, mat.dark)
  box(root, 0.35, 0.2, 0.1, 0, 2.15, -1.78, indicatorMaterials.ventilation)
  for (const x of [-4.5, 4.5]) {
    box(root, 0.14, 0.6, 2.4, x, 1.3, 0.1, mat.gold)
    box(root, 0.3, 0.22, 0.16, x, 1.78, 0.75, mat.mint)
  }

  // Exterior service unit with conceptual oxygen, water and power connectors.
  const techGround = localGround(13, 0)
  box(root, 5, 2.7, 3, 13, techGround + 1.35, 0, mat.shell, true)
  box(root, 5.1, 0.12, 3.1, 13, techGround + 2.73, 0, mat.frame)
  for (const x of [11.2, 12.1, 13.0, 13.9, 14.8]) box(root, 0.08, 1.65, 0.06, x, techGround + 1.45, 1.55, mat.frame)
  label('ECLSS / SOPORTE VITAL', 13, techGround + 2.1, 1.57, 2.7)
  box(root, 5, 0.14, 0.18, 7.9, techGround + 0.8, 0, mat.gold)

  // A steerable, nearly upright array is visually appropriate for low polar Sun.
  const solarPivot = new THREE.Group()
  solarPivot.position.set(-15, localGround(-15, -2) + 1.72, -2)
  root.add(solarPivot)
  for (const x of [-3.3, -1.1, 1.1, 3.3]) {
    const panel = box(solarPivot, 2.03, 1.72, 0.1, x, 0.22, 0, mat.blue, true)
    panel.rotation.x = -0.13
    for (const offset of [-0.52, 0, 0.52]) box(solarPivot, 0.035, 1.6, 0.12, x + offset, 0.22, 0, mat.frame)
    box(solarPivot, 2.02, 0.035, 0.13, x, 0.22, 0, mat.frame)
    cylinder(root, 0.08, 0.1, 1.55, -15 + x, localGround(-15 + x, -2) + 0.78, -2, mat.frame)
  }
  label('ARREGLO SOLAR', -15, localGround(-15, 1.5) + 0.65, 1.5, 2)

  // Batteries are set away from the entry route and enclosed conceptually.
  for (const x of [10.8, 12]) {
    const ground = localGround(x, 8)
    box(root, 1.05, 1.15, 1.55, x, ground + 0.58, 8, mat.frame, true)
    box(root, 0.82, 0.08, 0.05, x, ground + 0.74, 8.8, mat.gold)
  }
  label('BATERIAS', 11.4, localGround(11.4, 8.85) + 1.38, 8.85, 1.6)

  // Communications mast and directional dish.
  const antennaGround = localGround(17, -8)
  cylinder(root, 0.12, 0.2, 6, 17, antennaGround + 3, -8, mat.frame, 12, true)
  for (const y of [1.1, 2.3, 3.5, 4.7]) box(root, 1.1, 0.06, 0.06, 17, antennaGround + y, -8, mat.gold)
  const dish = cylinder(root, 1.05, 0.22, 0.35, 17, antennaGround + 5.3, -7.65, mat.white, 24)
  dish.rotation.x = Math.PI / 2
  box(root, 0.7, 0.38, 0.55, 17, antennaGround + 0.25, -8, mat.dark)
  label('COMUNICACIONES', 17, antennaGround + 1.2, -7.55, 2.1)

  // Rear heat rejection surface. This does not model interior heat transport.
  for (const x of [-3.2, -2.4, -1.6, -0.8]) {
    const ground = localGround(x, -4.2)
    box(root, 0.55, 2.1, 0.09, x, ground + 1.35, -4.2, mat.frame, true)
    box(root, 0.43, 1.75, 0.1, x, ground + 1.35, -4.15, mat.dark)
  }
  label('RADIADOR', -2, localGround(-2, -4.1) + 2.7, -4.1, 1.5)
  box(root, 1.25, 0.85, 0.65, 2.6, 0.43, 6.1, mat.frame)
  label('CONTROL DE POLVO', 2.6, 1.35, 6.46, 1.8)

  const fieldSample = new THREE.Group()
  fieldSample.position.set(4, localGround(4, 11.5) + 0.34, 11.5)
  const fieldRock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 1),
    new THREE.MeshStandardMaterial({ color: 0x857a65, roughness: 0.96, flatShading: true }))
  fieldRock.scale.set(1.15, 0.82, 0.92)
  fieldRock.rotation.set(0.18, 0.47, 0.2)
  fieldRock.castShadow = true
  fieldRock.receiveShadow = true
  fieldSample.add(fieldRock)
  for (const [x, y, color] of [[-0.18, 0.18, 0xd7cfb5], [0.2, 0.07, 0x9ca58a], [0.02, -0.2, 0xb4a16d]]) {
    const grain = new THREE.Mesh(new THREE.DodecahedronGeometry(0.085, 0),
      new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true }))
    grain.position.set(x, y, 0.23)
    fieldSample.add(grain)
  }
  root.add(fieldSample)
  label('ROCA / E', 4, localGround(4, 11.5) + 1.15, 11.5, 1.35)

  let innerPosition = 0, outerPosition = 0
  function update(airlock, solar, dt, eclss, discoveries, sampleMission) {
    const targetInner = airlock.interiorOpen ? 1.85 : 0
    const targetOuter = airlock.exteriorOpen ? 1.85 : 0
    const alpha = Math.min(1, dt * 7)
    const oldInner = innerPosition, oldOuter = outerPosition
    innerPosition += (targetInner - innerPosition) * alpha
    outerPosition += (targetOuter - outerPosition) * alpha
    innerDoor.position.x = innerPosition
    outerDoor.position.x = outerPosition
    if (solar) solarPivot.rotation.y = Math.atan2(solar.direction.x, solar.direction.z)
    if (eclss) for (const [key, material] of Object.entries(indicatorMaterials)) {
      material.color.setHex(eclss.operating[key] ? 0x6ee4b6 : 0xa2784f)
    }
    if (discoveries) for (const [key, material] of Object.entries(activityIndicators)) {
      material.color.setHex(discoveries[key] ? 0x6ee4b6 : 0xa2784f)
    }
    if (sampleMission) fieldSample.visible = sampleMission.status === 'field'
    return Math.abs(oldInner - innerPosition) > 0.01 || Math.abs(oldOuter - outerPosition) > 0.01
  }
  function dispose() {
    const geometries = new Set(), materials = new Set(), textures = new Set()
    root.traverse(object => {
      if (!object.isMesh) return
      geometries.add(object.geometry)
      const list = Array.isArray(object.material) ? object.material : [object.material]
      for (const material of list) {
        materials.add(material)
        if (material.map) textures.add(material.map)
      }
    })
    for (const item of geometries) item.dispose()
    for (const item of materials) item.dispose()
    for (const item of textures) item.dispose()
  }
  return { root, update, dispose, localGround }
}
