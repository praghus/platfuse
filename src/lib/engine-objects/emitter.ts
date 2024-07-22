import { ParticleConfig } from '../../types'
import { rand } from '../utils/helpers'
import { Shape } from '../constants'
import { Color } from '../engine-helpers/color'
import { Vector, vec2 } from '../engine-helpers/vector'
import { randPointOnCircle } from '../engine-helpers/vector'
import { Entity } from './entity'
import { Particle } from './particle'
import { Scene } from './scene'

/**
 * Represents an emitter object that spawns particles in a scene.
 */
export class Emitter extends Entity {
    /** The type of the emitter. */
    type = 'Platfuse.Emitter'

    /** The position of the emitter. */
    pos: Vector

    /** The shape of the particle. */
    shape: Shape = Shape.Rectangle

    /** The angle to emit the particles. */
    angle = 0

    /** The size of the emitter. It can be a float for circle diameter or a vec2 for rectangle dimensions. */
    emitSize: Vector | number

    /** How long the emitter stays alive (0 is forever). */
    emitTime = 0

    /** How many particles per second to spawn. If set to 0, no particles will be emitted. */
    emitRate = 100

    /** The local angle to apply velocity to particles from the emitter. */
    emitConeAngle = Math.PI

    /** The color at the start of the particle's life. It is randomized between start colors. */
    colorStart = new Color()

    /** The color at the end of the particle's life. It is randomized between end colors. */
    colorEnd = new Color()

    /** How long particles live. */
    ttl = 0.5

    /** The size of particles at the start. */
    sizeStart = 0.1

    /** The size of particles at the end. */
    sizeEnd = 1

    /** The speed of particles when spawned. */
    speed = 0.1

    /** How much to dampen particle speed. */
    damping = 1

    /** How much to dampen particle angular speed. */
    angleDamping = 1

    /** How much gravity affects particles. */
    gravityScale = 0

    /** The cone for the start particle angle. */
    particleConeAngle = Math.PI

    /** How quickly particles fade in at the start/end in percent of life. */
    fadeRate = 0.1

    /** The randomness percent. */
    randomness = 0.2

    /** Whether particles collide against tiles. */
    collideTiles = false

    /** Whether particles collide against objects. */
    collideObjects = false

    /** The render order of particles. */
    renderOrder = 0

    /** If set, the particle is drawn as a trail, stretched in the direction of velocity. */
    stretchScale = 0

    /** Time buffer for emit rate. */
    timeBuffer = 0

    /**
     * Creates a new Emitter instance.
     * @param scene - The scene the emitter belongs to.
     * @param obj - Additional properties for the emitter.
     */
    constructor(
        public scene: Scene,
        public obj: ParticleConfig
    ) {
        super(scene, obj)
        this.pos = obj?.pos || vec2()
        this.angle = obj?.angle || 0
        this.emitSize = obj?.emitSize || 0
        this.emitTime = obj?.emitTime || 0
        this.emitRate = obj?.emitRate || this.emitRate
        this.elasticity = obj?.elasticity || this.elasticity
        this.emitConeAngle = obj?.emitConeAngle || this.emitConeAngle
        this.colorStart = obj?.colorStart || this.colorStart
        this.colorEnd = obj?.colorEnd || this.colorEnd
        this.ttl = obj?.ttl || this.ttl
        this.sizeStart = obj?.sizeStart || this.sizeStart
        this.sizeEnd = obj?.sizeEnd || this.sizeEnd
        this.speed = obj?.speed || this.speed
        this.damping = obj?.damping || this.damping
        this.angleDamping = obj?.angleDamping || this.angleDamping
        this.gravityScale = obj?.gravityScale || this.gravityScale
        this.particleConeAngle = obj?.particleConeAngle || this.particleConeAngle
        this.fadeRate = obj?.fadeRate || this.fadeRate
        this.randomness = obj?.randomness || this.randomness
        this.collideTiles = !!obj?.collideTiles
        this.collideObjects = !!obj?.collideObjects
        this.stretchScale = obj?.stretchScale || this.stretchScale
        this.elasticity = obj?.elasticity || this.elasticity
        this.shape = obj?.shape || this.shape
    }

    /**
     * Updates the emitter.
     * @remarks
     * This method is responsible for updating the emitter's behavior, such as emitting particles
     * based on the emit rate and time. If the emitter's alive time exceeds the emit time,
     * the emitter is destroyed.
     */
    update() {
        const { delta } = this.scene.game
        if (!this.emitTime || this.getAliveTime() <= this.emitTime) {
            if (this.emitRate) {
                const rate = 1 / this.emitRate
                for (this.timeBuffer += delta; this.timeBuffer > 0; this.timeBuffer -= rate) this.emitParticle()
            }
        } else this.destroy()
    }

    /**
     * Randomizes the given value by applying randomness.
     * @param v - The value to be randomized.
     * @returns The randomized value.
     */
    randomize(v: number) {
        return v + v * rand(this.randomness, -this.randomness)
    }

    /**
     * Emits a particle from the emitter.
     */
    emitParticle() {
        const pos = this.pos.add(
            this.emitSize instanceof Vector
                ? vec2(rand(-0.5, 0.5), rand(-0.5, 0.5)).multiply(this.emitSize).rotate(this.angle)
                : randPointOnCircle(this.emitSize / 2)
        )

        const angle = this.angle + rand(this.particleConeAngle, -this.particleConeAngle)
        const particle = new Particle(this.scene, { ...this.obj, angle, pos })
        const ttl = this.randomize(this.ttl)
        const sizeStart = this.randomize(this.sizeStart)
        const sizeEnd = this.randomize(this.sizeEnd)
        const speed = this.randomize(this.speed)
        const coneAngle = rand(this.emitConeAngle, -this.emitConeAngle)
        const forceAngle = this.angle + coneAngle

        particle.shape = this.shape
        particle.colorStart = this.colorStart
        particle.colorEnd = this.colorEnd.subtract(this.colorStart)
        particle.renderOrder = this.renderOrder
        particle.damping = this.damping
        particle.angleDamping = this.angleDamping
        particle.elasticity = this.elasticity
        particle.friction = this.friction
        particle.gravityScale = this.gravityScale
        particle.collideTiles = this.collideTiles
        particle.collideObjects = this.collideObjects
        particle.force = vec2().setAngle(forceAngle, speed)
        particle.ttl = ttl
        particle.sizeStart = sizeStart
        particle.sizeDelta = sizeEnd - sizeStart
        particle.fadeRate = this.fadeRate
        particle.stretchScale = this.stretchScale
        particle.layerId = this.layerId

        this.scene.objects.push(particle)
    }

    /**
     * Draws the emitter.
     */
    draw() {}
}
