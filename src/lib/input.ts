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

        // // update mouse world space position
        // mousePos = screenToWorld(mousePosScreen)

        // // update gamepads if enabled
        // gamepadsUpdate()
        // console.info(this.inputData)
    }

    postUpdate() {
        // clear input to prepare for next frame
        for (const i in this.inputData) {
            this.inputData[i] &= 1
        }
        this.mouseWheel = 0
    }
}
/*
{
    onkeydown = (e) =>
    {
        if (debug && e.target != document.body) return
        if (!e.repeat)
        {
            inputData[isUsingGamepad = 0][e.which] = 3
            if (inputWASDEmulateDirection)
                inputData[0][remapKey(e.which)] = 3
        }
        preventDefaultInput && e.preventDefault()
    }

    onkeyup = (e) =>
    {
        if (debug && e.target != document.body) return
        inputData[0][e.which] = 4
        if (inputWASDEmulateDirection)
            inputData[0][remapKey(e.which)] = 4
    }

    // handle remapping wasd keys to directions
    function remapKey(c)
    { 
        return inputWASDEmulateDirection ? 
            c == 87 ? 38 : c == 83 ? 40 : c == 65 ? 37 : c == 68 ? 39 : c : c 
    }
}
    */
