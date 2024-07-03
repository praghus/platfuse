import { Color, vec2 } from '../engine-helpers'
import { Entity } from './entity'
import { Scene } from './scene'

export class Particle extends Entity {
    colorStart = new Color()
    colorEndDelta = new Color()
    ttl = 0
    sizeStart = 0.1
    sizeDelta = 0
    fadeRate = 0.1
    stretchScale = 0

    constructor(
        public scene: Scene,
        obj: Record<string, any>
    ) {
        super(scene, obj)
        this.pos = obj?.pos || vec2()
    }

    draw() {
        const { time } = this.scene.game

        const p = Math.min((time - this.spawnTime) / this.ttl, 1)
        const radius = this.sizeStart + p * this.sizeDelta
        const fading = this.fadeRate / 2

        this.size = vec2(radius)
        this.color = new Color(
            this.colorStart.r + p * this.colorEndDelta.r,
            this.colorStart.g + p * this.colorEndDelta.g,
            this.colorStart.b + p * this.colorEndDelta.b,
            (this.colorStart.a + p * this.colorEndDelta.a) *
                (p < fading ? p / fading : p > 1 - fading ? (1 - p) / fading : 1)
        )

        if (this.stretchScale) {
            const speed = this.force.length()
            if (speed) {
                const direction = this.force.scale(1 / speed)
                const trailLength = speed * this.stretchScale
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
