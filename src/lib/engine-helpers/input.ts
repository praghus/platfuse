const isTouchDevice = window.ontouchstart !== undefined
const preventDefaultInput = false

export class Input {
    mouseWheel = 0
    inputData: Record<string, number> = {}

    constructor() {
        document.addEventListener('keydown', e => this.#onKeyDown(e), false)
        document.addEventListener('keyup', e => this.#onKeyUp(e), false)
        // document.addEventListener('mousedown', e => this.onMouseDown(e))
        // document.addEventListener('mousemove', e => this.onMouseMove(e))
        // document.addEventListener('mouseup', e => this.onMouseUp(e))
    }

    #onKeyDown = (e: KeyboardEvent) => {
        if (!e.repeat) {
            this.inputData[e.code] = 3
        }
        preventDefaultInput && e.preventDefault()
    }

    #onKeyUp = (e: KeyboardEvent) => {
        this.inputData[e.code] = 4
    }

    keyIsDown(key: string) {
        return this.inputData[key] & 1
    }

    keyWasPressed(key: string) {
        return this.inputData[key] & 2 ? 1 : 0
    }

    keyWasReleased(key: string) {
        return this.inputData[key] & 4 ? 1 : 0
    }

    clearInput() {
        this.inputData = {}
    }

    update() {
        // clear input when lost focus (prevent stuck keys)
        isTouchDevice || document.hasFocus() || this.clearInput()
    }

    postUpdate() {
        // clear input to prepare for next frame
        for (const i in this.inputData) {
            this.inputData[i] &= 1
        }
        this.mouseWheel = 0
    }
}
