import { Game } from '../engine-objects/game'
import { percent } from '../utils/helpers'

export class Timer {
    time?: number
    ts?: number

    constructor(
        public game: Game,
        t?: number
    ) {
        this.time = t === undefined ? undefined : game.time + t
        this.ts = t
    }

    set(t = 0) {
        this.time = this.game.time + t
        this.ts = t
    }

    unset() {
        this.time = undefined
    }

    isSet() {
        return this.time !== undefined
    }

    isActive() {
        return this.time !== undefined && this.game.time <= this.time
    }

    isDone() {
        return this.time !== undefined && this.game.time > this.time
    }

    getTime() {
        return this.time !== undefined ? this.game.time - this.time : 0
    }

    getPercent() {
        return this.time !== undefined && this.ts !== undefined ? percent(this.time - this.game.time, this.ts, 0) : 0
    }
}
