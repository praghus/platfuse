import { Camera } from '../camera'
import { Vec2, clamp } from './math'

export default class Shaker {
    isRunning = false
    duration = 0
    progress = 0
    elapsed = 0
    intensity = new Vec2()
    offset = new Vec2()

    constructor(public camera: Camera) {}

    start(duration: number, intensity: Vec2) {
        this.isRunning = true
        this.duration = duration
        this.intensity.set(intensity.x, intensity.y)
        this.offset.set(0)
        this.progress = 0
        this.elapsed = 0
    }

    update(delta: number) {
        if (!this.isRunning) return

        this.elapsed += delta * 1000
        this.progress = clamp(this.elapsed / this.duration, 0, 1)

        if (this.elapsed < this.duration) {
            const { width, height } = this.camera
            this.offset.set(
                Math.random() * this.intensity.x * width * 2 - this.intensity.x * width,
                Math.random() * this.intensity.y * height * 2 - this.intensity.y * height
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
