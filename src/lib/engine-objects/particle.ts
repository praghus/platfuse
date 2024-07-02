import { Color, vec2 } from '../engine-helpers'
import { Emitter } from './emitter'
import { Entity } from './entity'
import { Scene } from './scene'

export class Particle extends Entity {
    color = new Color(1, 1, 1, 1)
    colorEndDelta = new Color(1, 1, 1, 0)
    lifeTime = 0
    sizeStart = 0.1
    sizeDelta = 0
    fadeRate = 0.1
    additive = false
    trailScale = 0
    localSpaceEmitter?: Emitter

    constructor(
        public scene: Scene,
        obj: Record<string, any>
    ) {
        super(scene, obj)
        this.pos = obj?.pos || vec2()
    }

    draw() {
        const { time } = this.scene.game

        const p = Math.min((time - this.spawnTime) / this.lifeTime, 1)
        const radius = this.sizeStart + p * this.sizeDelta
        this.size = vec2(radius)

        const fadeRate = this.fadeRate / 2
        const color = new Color(
            this.color.r + p * this.colorEndDelta.r,
            this.color.b + p * this.colorEndDelta.b,
            (this.color.a + p * this.colorEndDelta.a) *
                (p < fadeRate ? p / fadeRate : p > 1 - fadeRate ? (1 - p) / fadeRate : 1)
        )

        this.color = color

        if (this.trailScale) {
            let force = this.force
            if (this.localSpaceEmitter) force = force.rotate(-this.localSpaceEmitter.angle)
            const speed = force.length()
            if (speed) {
                const direction = force.scale(1 / speed)
                const trailLength = speed * this.trailScale
                this.size.y = Math.max(this.size.x, trailLength)
                this.angle = direction.angle()
            }
        }

        if (p === 1) {
            this.dead = true
        }

        super.draw()
    }
}
