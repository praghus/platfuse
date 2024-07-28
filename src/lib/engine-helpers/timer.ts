import { Game } from '../engine-objects/game'
import { percent } from '../utils/math'

/**
 * Represents a timer used in a game.
 */
export class Timer {
    /** The time value for the timer. */
    time?: number

    /** The initial time value for the timer. */
    ts?: number

    /**
     * Creates a new Timer instance.
     * @param game The game object.
     * @param t The initial time value for the timer.
     */
    constructor(
        public game: Game,
        t?: number
    ) {
        this.time = t === undefined ? undefined : game.time + t
        this.ts = t
    }

    /**
     * Sets the time value for the timer.
     * @param t The time value to set.
     */
    set(t = 0) {
        this.time = this.game.time + t
        this.ts = t
    }

    /**
     * Unsets the time value for the timer.
     */
    unset() {
        this.time = undefined
    }

    /**
     * Checks if the timer is set.
     * @returns True if the timer is set, false otherwise.
     */
    isSet() {
        return this.time !== undefined
    }

    /**
     * Checks if the timer is active.
     * @returns True if the timer is active, false otherwise.
     */
    isActive() {
        return this.time !== undefined && this.game.time <= this.time
    }

    /**
     * Checks if the timer is done.
     * @returns True if the timer is done, false otherwise.
     */
    isDone() {
        return this.time !== undefined && this.game.time > this.time
    }

    /**
     * Gets the elapsed time since the timer was set.
     * @returns The elapsed time in milliseconds.
     */
    getTime() {
        return this.time !== undefined ? this.game.time - this.time : 0
    }

    /**
     * Gets the percentage of time remaining for the timer.
     * @returns The percentage value between 0 and 100.
     */
    getPercent() {
        return this.time !== undefined && this.ts !== undefined ? percent(this.time - this.game.time, this.ts, 0) : 0
    }
}
