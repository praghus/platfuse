import { Game } from '../engine-objects'
import { percent } from '../utils/helpers'
import { Vector, vec2 } from './vector'

const isTouchDevice = window.ontouchstart !== undefined
const preventDefaultInput = false

// @todo: Add support for touch events and gamepad input.
export class Input {
    mouseWheel = 0
    mouseScreenPos = vec2()
    keyboardData: Record<string, number> = {}
    pointerData: Record<number, number> = {}

    constructor(public game: Game) {
        document.addEventListener('keydown', e => this.#onKeyDown(e), false)
        document.addEventListener('keyup', e => this.#onKeyUp(e), false)
        document.addEventListener('mousedown', e => this.#onMouseDown(e))
        document.addEventListener('mousemove', e => this.#onMouseMove(e))
        document.addEventListener('mouseup', e => this.#onMouseUp(e))
        document.addEventListener('wheel', e => this.#onWheel(e))
    }

    #onKeyDown = (e: KeyboardEvent) => {
        if (!e.repeat) {
            this.keyboardData[e.code] = 3
        }
        preventDefaultInput && e.preventDefault()
    }

    #onKeyUp = (e: KeyboardEvent) => {
        this.keyboardData[e.code] = 4
    }

    #onMouseDown(e: MouseEvent) {
        this.pointerData[e.button] = 3
        this.#onMouseMove(e)
        e.button && e.preventDefault()
    }

    #onMouseUp(e: MouseEvent) {
        this.pointerData[e.button] = (this.pointerData[e.button] & 2) | 4
    }

    #onMouseMove(e: MouseEvent) {
        this.mouseScreenPos = this.#getMouseScreenPos(vec2(e.x, e.y))
    }

    #onWheel(e: WheelEvent) {
        e.ctrlKey || (this.mouseWheel = Math.sign(e.deltaY))
    }

    #getMouseScreenPos(pos: Vector) {
        const { canvas } = this.game
        const rect = canvas.getBoundingClientRect()
        return vec2(canvas.width, canvas.height).multiply(
            vec2(percent(pos.x, rect.left, rect.right), percent(pos.y, rect.top, rect.bottom))
        )
    }

    keyIsDown(key: string) {
        return this.keyboardData[key] & 1
    }

    keyWasPressed(key: string) {
        return this.keyboardData[key] & 2 ? 1 : 0
    }

    keyWasReleased(key: string) {
        return this.keyboardData[key] & 4 ? 1 : 0
    }

    mouseIsDown(button: number) {
        return this.pointerData[button] & 1
    }

    mouseWasPressed(button: number) {
        return this.pointerData[button] & 2 ? 1 : 0
    }

    mouseWasReleased(button: number) {
        return this.pointerData[button] & 4 ? 1 : 0
    }

    clearInput() {
        this.keyboardData = {}
        this.pointerData = {}
    }

    update() {
        // clear input when lost focus (prevent stuck keys)
        isTouchDevice || document.hasFocus() || this.clearInput()
    }

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
