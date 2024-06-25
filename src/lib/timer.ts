import { Game } from './game'
import { percent } from './utils/math'

export class Timer {
    time?: number
    setTime?: number

    constructor(
        public game: Game,
        timeLeft?: number
    ) {
        this.time = timeLeft === undefined ? undefined : game.time + timeLeft
        this.setTime = timeLeft
    }

    set(timeLeft = 0) {
        this.time = this.game.time + timeLeft
        this.setTime = timeLeft
    }

    get() {
        return this.time !== undefined ? this.game.time - this.time : 0
    }

    unset() {
        this.time = undefined
    }

    isSet() {
        return this.time !== undefined
    }

    active() {
        return this.time !== undefined && this.game.time <= this.time
    }

    elapsed() {
        return this.time !== undefined && this.game.time > this.time
    }

    getPercent() {
        return this.time !== undefined && this.setTime !== undefined
            ? percent(this.time - this.game.time, this.setTime, 0)
            : 0
    }

    valueOf() {
        return this.get()
    }
}
