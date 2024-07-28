import { Shape } from '../constants'
import { Color } from '../engine-helpers/color'
import { vec2 } from '../utils/geometry'
import { Entity } from './entity'
import { Scene } from './scene'

/**
 * Represents a particle in the Platfuse game engine.
 */
export class Particle extends Entity {
    /** The type of the particle. */
    type = 'Platfuse.Particle'

    /** The shape of the particle. */
    shape: Shape = Shape.Rectangle

    /** The starting color of the particle. */
    colorStart = new Color()

    /** The color delta of the particle. */
    colorEnd = new Color()

    /** The time to live (in seconds) of the particle. */
    ttl = 0

    /** The starting size of the particle. */
    sizeStart = 0.1

    /** The size delta of the particle. */
    sizeDelta = 0

    /** The rate at which the particle fades. */
    fadeRate = 0.1

    /** The scale of the particle's stretch effect. */
    stretchScale = 0

    /**
     * Creates a new Particle instance.
     * @param scene The scene the particle belongs to.
     * @param obj Additional properties for the particle.
     */
    constructor(
        public scene: Scene,
        obj: Record<string, any>
    ) {
        super(scene, obj)
        this.pos = obj?.pos || vec2()
    }

    /**
     * Draws the particle on the canvas.
     */
    draw() {
        const { time } = this.scene.game
        const p = Math.min((time - this.spawnTime) / this.ttl, 1)
        const radius = this.sizeStart + p * this.sizeDelta
        const fading = this.fadeRate / 2

        this.size = vec2(radius)
        this.color = new Color(
            this.colorStart.r + p * this.colorEnd.r,
            this.colorStart.g + p * this.colorEnd.g,
            this.colorStart.b + p * this.colorEnd.b,
            (this.colorStart.a + p * this.colorEnd.a) *
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
            this.destroy()
        }

        super.draw()
    }

    /**
     * Do not display debug information for the particle.
     */
    displayDebug() {}
}
