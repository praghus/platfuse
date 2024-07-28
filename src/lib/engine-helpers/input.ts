import { Game } from '../engine-objects/game'
import { percent } from '../utils/math'
import { vec2 } from '../utils/geometry'
import { Vector } from './vector'

const isTouchDevice = window.ontouchstart !== undefined
const preventDefaultInput = false

// TODO: Add support for touch events and gamepad input.
/**
 * Represents the Input class.
 */
export class Input {
    /** The mouse wheel value. */
    mouseWheel = 0

    /** The mouse screen position. */
    mouseScreenPos = vec2()

    /** The keyboard data. */
    keyboardData: Record<string, number> = {}

    /** The pointer data. */
    pointerData: Record<number, number> = {}

    /**
     * Creates an instance of the Input class.
     * @param {Game} game - The game instance.
     */
    constructor(public game: Game) {
        document.addEventListener('keydown', e => this.#onKeyDown(e), false)
        document.addEventListener('keyup', e => this.#onKeyUp(e), false)
        document.addEventListener('mousedown', e => this.#onMouseDown(e))
        document.addEventListener('mousemove', e => this.#onMouseMove(e))
        document.addEventListener('mouseup', e => this.#onMouseUp(e))
        document.addEventListener('wheel', e => this.#onWheel(e))
    }

    /**
     * Handles the keydown event.
     * @private
     * @param {KeyboardEvent} e - The keyboard event.
     */
    #onKeyDown = (e: KeyboardEvent) => {
        if (!e.repeat) {
            this.keyboardData[e.code] = 3
        }
        preventDefaultInput && e.preventDefault()
    }

    /**
     * Handles the keyup event.
     * @private
     * @param {KeyboardEvent} e - The keyboard event.
     */
    #onKeyUp = (e: KeyboardEvent) => {
        this.keyboardData[e.code] = 4
    }

    /**
     * Handles the mousedown event.
     * @private
     * @param {MouseEvent} e - The mouse event.
     */
    #onMouseDown(e: MouseEvent) {
        this.pointerData[e.button] = 3
        this.#onMouseMove(e)
        e.button && e.preventDefault()
    }

    /**
     * Handles the mouseup event.
     * @private
     * @param {MouseEvent} e - The mouse event.
     */
    #onMouseUp(e: MouseEvent) {
        this.pointerData[e.button] = (this.pointerData[e.button] & 2) | 4
    }

    /**
     * Handles the mousemove event.
     * @private
     * @param {MouseEvent} e - The mouse event.
     */
    #onMouseMove(e: MouseEvent) {
        this.mouseScreenPos = this.#getMouseScreenPos(vec2(e.x, e.y))
    }

    /**
     * Handles the wheel event.
     * @private
     * @param {WheelEvent} e - The wheel event.
     */
    #onWheel(e: WheelEvent) {
        e.ctrlKey || (this.mouseWheel = Math.sign(e.deltaY))
    }

    /**
     * Calculates the mouse screen position.
     * @private
     * @param {Vector} pos - The mouse position.
     * @returns {Vector} The mouse screen position.
     */
    #getMouseScreenPos(pos: Vector) {
        const { canvas } = this.game
        const rect = canvas.getBoundingClientRect()
        return vec2(canvas.width, canvas.height).multiply(
            vec2(percent(pos.x, rect.left, rect.right), percent(pos.y, rect.top, rect.bottom))
        )
    }

    /**
     * Checks if a key is currently down.
     * @param {string} key - The key to check.
     * @returns {number} 1 if the key is down, otherwise 0.
     */
    keyIsDown(key: string) {
        return this.keyboardData[key] & 1
    }

    /**
     * Checks if a key was pressed.
     * @param {string} key - The key to check.
     * @returns {number} 1 if the key was pressed, otherwise 0.
     */
    keyWasPressed(key: string) {
        return this.keyboardData[key] & 2 ? 1 : 0
    }

    /**
     * Checks if a key was released.
     * @param {string} key - The key to check.
     * @returns {number} 1 if the key was released, otherwise 0.
     */
    keyWasReleased(key: string) {
        return this.keyboardData[key] & 4 ? 1 : 0
    }

    /**
     * Checks if a mouse button is currently down.
     * @param {number} button - The button to check.
     * @returns {number} 1 if the button is down, otherwise 0.
     */
    mouseIsDown(button: number) {
        return this.pointerData[button] & 1
    }

    /**
     * Checks if a mouse button was pressed.
     * @param {number} button - The button to check.
     * @returns {number} 1 if the button was pressed, otherwise 0.
     */
    mouseWasPressed(button: number) {
        return this.pointerData[button] & 2 ? 1 : 0
    }

    /**
     * Checks if a mouse button was released.
     * @param {number} button - The button to check.
     * @returns {number} 1 if the button was released, otherwise 0.
     */
    mouseWasReleased(button: number) {
        return this.pointerData[button] & 4 ? 1 : 0
    }

    /**
     * Clears the input data.
     */
    clearInput() {
        this.keyboardData = {}
        this.pointerData = {}
    }

    /**
     * Updates the input state.
     */
    update() {
        // clear input when lost focus (prevent stuck keys)
        isTouchDevice || document.hasFocus() || this.clearInput()
    }

    /**
     * Performs post-update operations on the input state.
     */
    postUpdate() {
        for (const i in this.keyboardData) {
            this.keyboardData[i] &= 1
        }
        for (const i in this.pointerData) {
            this.pointerData[i] &= 1
        }
        this.mouseWheel = 0
    }
}
