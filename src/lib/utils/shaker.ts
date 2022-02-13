import { Game } from '../game'
import { Vec2, clamp } from './math'

export default class Shaker {
    isRunning = false
    duration = 0
    progress = 0
    elapsed = 0
    intensity = new Vec2()
    offset = new Vec2()

    constructor(public game: Game) {}

    start(duration: number, intensity: Vec2) {
        this.isRunning = true
        this.duration = duration
        this.intensity.set(intensity.x, intensity.y)
        this.offset.set(0)
        this.progress = 0
        this.elapsed = 0
    }

    update() {
        if (!this.isRunning) return
        const { delta, resolution } = this.game
        this.elapsed += delta * 1000
        this.progress = clamp(this.elapsed / this.duration, 0, 1)

        if (this.elapsed < this.duration) {
            this.offset.set(
                Math.random() * this.intensity.x * resolution.x * 2 - this.intensity.x * resolution.x,
                Math.random() * this.intensity.y * resolution.y * 2 - this.intensity.y * resolution.y
            )
        } else {
            this.reset()
        }
    }

    reset() {
        this.isRunning = false
        this.offset.set(0)
    }
}
