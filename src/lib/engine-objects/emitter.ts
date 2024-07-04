import { ParticleConfig } from '../../types'
import { Color, Vector, randVector, vec2 } from '../engine-helpers'
import { rand } from '../utils/helpers'
import { Entity } from './entity'
import { Particle } from './particle'
import { Scene } from './scene'

const randPointOnCircle = (radius = 1, minRadius = 0) =>
    radius > 0 ? randVector(radius * rand(minRadius / radius, 1) ** 0.5) : new Vector()

export class Emitter extends Entity {
    type = 'emitter'
    pos: Vector
    angle = 0 //                    Angle to emit the particles
    emitSize: Vector | number //    World space size of the emitter (float for circle diameter, vec2 for rect)
    emitTime = 0 //                 How long to stay alive (0 is forever)
    emitRate = 100 //               How many particles per second to spawn, does not emit if 0
    emitConeAngle = Math.PI //      Local angle to apply velocity to particles from emitter
    colorStart = new Color() //     Color at start of life 1, randomized between start colors
    colorEnd = new Color() //       Color at end of life, randomized between end colors
    ttl = 0.5 //                    How long particles live
    sizeStart = 0.1 //              How big are particles at start
    sizeEnd = 1 //                  How big are particles at end
    speed = 0.1 //                  How fast are particles when spawned
    damping = 1 //                  How much to dampen particle speed
    angleDamping = 1 //             How much to dampen particle angular speed
    gravityScale = 0 //             How much does gravity effect particles
    particleConeAngle = Math.PI //  Cone for start particle angle
    fadeRate = 0.1 //               How quick to fade in particles at start/end in percent of life
    randomness = 0.2 //             Randomness percent
    collideTiles = false //         Collide against tiles
    renderOrder = 0 //              Render order
    stretchScale = 0 //             If set the partile is drawn as a trail, stretched in the drection of velocity
    timeBuffer = 0 //               Time buffer for emit rate

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
        this.stretchScale = obj?.stretchScale || this.stretchScale
        this.elasticity = obj?.elasticity || this.elasticity
    }

    update() {
        const { delta } = this.scene.game
        if (!this.emitTime || this.getAliveTime() <= this.emitTime) {
            if (this.emitRate) {
                const rate = 1 / this.emitRate
                for (this.timeBuffer += delta; this.timeBuffer > 0; this.timeBuffer -= rate) this.emitParticle()
            }
        } else this.destroy()
    }

    randomize(v: number) {
        return v + v * rand(this.randomness, -this.randomness)
    }

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

        particle.colorStart = this.colorStart // @todo: randomize colors
        particle.colorEndDelta = this.colorEnd.subtract(this.colorStart) // @todo: randomize colors
        particle.renderOrder = this.renderOrder
        particle.damping = this.damping
        particle.angleDamping = this.angleDamping
        particle.elasticity = this.elasticity
        particle.friction = this.friction
        particle.gravityScale = this.gravityScale
        particle.collideTiles = this.collideTiles
        particle.force = vec2().setAngle(forceAngle, speed)
        particle.ttl = ttl
        particle.sizeStart = sizeStart
        particle.sizeDelta = sizeEnd - sizeStart
        particle.fadeRate = this.fadeRate
        particle.stretchScale = this.stretchScale
        particle.layerId = this.layerId

        this.scene.objects.push(particle)
    }

    draw() {}
}
