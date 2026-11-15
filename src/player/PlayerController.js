import * as THREE from 'three'

const EYE_HEIGHT = 1.7
const GRAVITY = 1.62

export class PlayerController {
  constructor(camera, element, onLockChange, onControlMode, environment, onBoundary = () => {}) {
    this.camera = camera
    this.element = element
    this.onLockChange = onLockChange
    this.onControlMode = onControlMode
    this.environment = environment
    this.onBoundary = onBoundary
    this.keys = new Set()
    this.velocity = new THREE.Vector3()
    this.verticalVelocity = 0
    this.onGround = true
    this.locked = false
    this.fallback = false
    this.dragging = false
    this.lastPointer = { x: 0, y: 0 }
    this.yaw = Math.PI / 3
    this.pitch = -0.19
    camera.rotation.order = 'YXZ'
    camera.position.set(0, environment.groundHeightAt(0, 18) + EYE_HEIGHT, 18)
    camera.rotation.set(this.pitch, this.yaw, 0)

    this.handleKeyDown = (event) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(event.code)) event.preventDefault()
      if (event.code === 'Escape' && this.fallback) { this.fallback = false; this.dragging = false; this.keys.clear(); this.onLockChange(false) }
      this.keys.add(event.code)
      if (event.code === 'Space' && (this.locked || this.fallback) && this.onGround) {
        this.verticalVelocity = 2.55
        this.onGround = false
      }
    }
    this.handleKeyUp = (event) => this.keys.delete(event.code)
    this.handleMouseMove = (event) => {
      if (!this.locked && !(this.fallback && this.dragging)) return
      const dx = this.locked ? event.movementX : event.clientX - this.lastPointer.x
      const dy = this.locked ? event.movementY : event.clientY - this.lastPointer.y
      this.lastPointer = { x: event.clientX, y: event.clientY }
      this.yaw -= dx * 0.0022
      this.pitch = THREE.MathUtils.clamp(this.pitch - dy * 0.0022, -1.48, 1.48)
      camera.rotation.set(this.pitch, this.yaw, 0)
    }
    this.handleLockChange = () => {
      this.locked = document.pointerLockElement === this.element
      if (!this.locked && !this.fallback) this.keys.clear()
      if (this.locked) this.onControlMode('pointer')
      this.onLockChange(this.locked || this.fallback)
    }
    this.handleBlur = () => {
      this.keys.clear()
      if (this.locked) document.exitPointerLock()
      if (this.fallback) { this.fallback = false; this.dragging = false; this.onLockChange(false) }
    }
    this.handlePointerDown = (event) => {
      if (!this.fallback) return
      this.dragging = true
      this.lastPointer = { x: event.clientX, y: event.clientY }
    }
    this.handlePointerUp = () => { this.dragging = false }
    document.addEventListener('keydown', this.handleKeyDown)
    document.addEventListener('keyup', this.handleKeyUp)
    document.addEventListener('mousemove', this.handleMouseMove)
    document.addEventListener('pointerlockchange', this.handleLockChange)
    window.addEventListener('blur', this.handleBlur)
    element.addEventListener('pointerdown', this.handlePointerDown)
    window.addEventListener('pointerup', this.handlePointerUp)
  }

  async start() {
    try {
      if (!this.element.requestPointerLock) throw new Error('Pointer Lock unavailable')
      await this.element.requestPointerLock()
    } catch {
      this.fallback = true
      this.onControlMode('drag')
      this.onLockChange(true)
    }
  }

  setStartPosition(x, z, sampleHeight, yaw = 0) {
    this.keys.clear()
    this.velocity.set(0, 0, 0)
    this.verticalVelocity = 0
    this.onGround = true
    this.yaw = yaw
    this.pitch = -0.19
    this.camera.position.set(x, sampleHeight(x, z) + EYE_HEIGHT, z)
    this.camera.rotation.set(this.pitch, this.yaw, 0)
  }

  release() {
    this.keys.clear()
    this.fallback = false
    this.dragging = false
    if (this.locked && document.pointerLockElement === this.element) {
      document.exitPointerLock()
      return
    }
    this.locked = false
    this.onLockChange(false)
  }

  update(dt) {
    if (!this.locked && !this.fallback) return
    const forward = Number(this.keys.has('KeyW')) - Number(this.keys.has('KeyS'))
    const right = Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA'))
    const input = new THREE.Vector2(right, forward)
    if (input.lengthSq() > 1) input.normalize()
    const speed = this.onGround ? 5.2 : 3.5
    const targetX = (Math.cos(this.yaw) * input.x - Math.sin(this.yaw) * input.y) * speed
    const targetZ = (-Math.sin(this.yaw) * input.x - Math.cos(this.yaw) * input.y) * speed
    const smoothing = 1 - Math.exp(-(this.onGround ? 9 : 2.3) * dt)
    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetX, smoothing)
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetZ, smoothing)
    const previous = { x: this.camera.position.x, z: this.camera.position.z }
    const proposed = { x: previous.x + this.velocity.x * dt, z: previous.z + this.velocity.z * dt }
    const next = this.environment?.resolveMovement(previous, proposed) ?? proposed
    if (Math.abs(next.x - proposed.x) > 0.001 || Math.abs(next.z - proposed.z) > 0.001) {
      const bounds = this.environment.bounds
      if (bounds && (proposed.x <= bounds.minX || proposed.x >= bounds.maxX
        || proposed.z <= bounds.minZ || proposed.z >= bounds.maxZ)) this.onBoundary()
    }
    this.camera.position.x = next.x
    this.camera.position.z = next.z
    this.verticalVelocity -= GRAVITY * dt
    this.camera.position.y += this.verticalVelocity * dt
    const ground = this.environment.groundHeightAt(this.camera.position.x, this.camera.position.z) + EYE_HEIGHT
    if (this.camera.position.y <= ground) {
      this.camera.position.y = ground
      this.verticalVelocity = 0
      this.onGround = true
    }
  }

  dispose() {
    if (document.pointerLockElement === this.element) document.exitPointerLock()
    document.removeEventListener('keydown', this.handleKeyDown)
    document.removeEventListener('keyup', this.handleKeyUp)
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('pointerlockchange', this.handleLockChange)
    window.removeEventListener('blur', this.handleBlur)
    this.element.removeEventListener('pointerdown', this.handlePointerDown)
    window.removeEventListener('pointerup', this.handlePointerUp)
  }
}
