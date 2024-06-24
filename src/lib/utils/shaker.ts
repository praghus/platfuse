import { Camera } from '../camera'
import { Vector, clamp } from './math'

export class Shaker {
    isRunning = false
    duration = 0
    progress = 0
    elapsed = 0
    delta = 1 / 60
    intensity = new Vector()
    offset = new Vector()

    constructor(public camera: Camera) {}

    start(duration: number, intensity: Vector) {
        this.isRunning = true
        this.duration = duration
        this.intensity = new Vector(intensity.x, intensity.y)
        this.offset = new Vector(0, 0)
        this.progress = 0
        this.elapsed = 0
    }

    update() {
        if (!this.isRunning) return
        const { resolution } = this.camera
        this.elapsed += this.delta * 1000
        this.progress = clamp(this.elapsed / this.duration, 0, 1)

        if (this.elapsed < this.duration) {
            this.offset = new Vector(
                Math.random() * this.intensity.x * resolution.x * 2 - this.intensity.x * resolution.x,
                Math.random() * this.intensity.y * resolution.y * 2 - this.intensity.y * resolution.y
            )
        } else {
            this.reset()
        }
    }

    reset() {
        this.isRunning = false
        this.offset = new Vector(0, 0)
    }
}
