import * as dat from 'dat.gui'
import { Howl, Howler } from 'howler'
import { Scene } from './scene'
import { Vector } from './utils/math'
import { getPerformance } from './utils/helpers'
import { Constructable, GameConfig } from '../types'
import { Draw } from './utils/draw'
import { Entity } from './entity'

const MOUSE_BUTTONS = ['left', 'middle', 'right', 'back', 'forward']

export class Game {
    resolution = new Vector()
    then = getPerformance()
    ctx: CanvasRenderingContext2D
    gui?: dat.GUI
    draw: Draw
    assets: Record<string, HTMLImageElement | HTMLAudioElement> = {}
    soundFiles: Record<string, string> = {}
    sounds: Record<string, Howl> = {}
    objectClasses: Record<string, Constructable<Entity>> = {}
    sceneClasses: Constructable<Scene>[] = []
    scenes: Scene[] = []
    colors: Record<string, string>
    events: Record<string, any> = {}
    mouseEvents: Record<string, any> = {}
    keyStates: Record<string, any> = {}
    timeouts: Record<string, any> = {}
    settings: Record<string, any> = {}
    animationFrame?: number
    mouseStates: Record<string, any> = {}
    mousePos = new Vector()
    mouseDeltaPos = new Vector()
    mouseStarted = false
    isMouseMoved = false
    width = window.innerWidth
    height = window.innerHeight
    scale = 1
    debug = false
    paused = false
    loaded = false
    stoped = true
    currentScene = 0
    lastFrameTime = 0
    frameTime = 0
    lastLoop = 0
    delta = 0
    fps = 60

    constructor(config: GameConfig) {
        this.ctx = config.canvas.getContext('2d') as CanvasRenderingContext2D
        this.sceneClasses = config.scenes
        this.objectClasses = config.entities
        this.width = config?.width || config.canvas.width
        this.height = config?.height || config.canvas.height
        this.scale = config?.scale || 1
        this.debug = !!config.debug
        this.colors = {
            backgroundColor: config?.backgroundColor || '#000',
            preloaderColor: config?.preloaderColor || '#222'
        }
        this.draw = new Draw(this.ctx)
        this.debug && this.datGui()
        document.addEventListener('keydown', e => this.onKey(true, e), false)
        document.addEventListener('keyup', e => this.onKey(false, e), false)
        document.addEventListener('mousedown', e => this.onMouseDown(e))
        document.addEventListener('mousemove', e => this.onMouseMove(e))
        document.addEventListener('mouseup', e => this.onMouseUp(e))
        if (!!config.global) window.Platfuse = this
    }

    async onLoad(loadedAssets: Record<string, HTMLImageElement | HTMLAudioElement>) {
        this.assets = loadedAssets
        this.scenes = await Promise.all(
            this.sceneClasses.map(async Model => {
                const s: Scene = new Model(this)
                await s.init()
                return s
            })
        )
        this.loaded = true
    }

    async preload(assets: Record<string, string>) {
        this.loaded = false
        let loadedCount = 0
        const count = Object.keys(assets).length
        const indicator = (p: number) => this.draw.preloader(p, this.resolution, this.scale, this.colors)
        const load = (key: string) => {
            const src = assets[key]
            return new Promise(res => {
                if (/\.(gif|jpe?g|png|webp|bmp)$/i.test(src) || /(data:image\/[^;]+;base64[^"]+)$/i.test(src)) {
                    const img = new Image()
                    img.src = src
                    img.onload = () => {
                        indicator(++loadedCount / count)
                        return res(img)
                    }
                } else if (/\.(webm|mp3|wav)$/i.test(src) || /(data:audio\/[^;]+;base64[^"]+)$/i.test(src)) {
                    const audio = new Audio()
                    audio.addEventListener(
                        'canplaythrough',
                        () => {
                            indicator(++loadedCount / count)
                            this.soundFiles[key] = src
                            return res(audio)
                        },
                        false
                    )
                    audio.src = src
                } else return Promise.resolve()
            })
        }
        const promises = Object.keys(assets).map(async (key: string) => ({
            [key]: await load(key)
        }))
        const loadedAssets = Object.assign({}, ...(await Promise.all(promises)))
        await this.onLoad(loadedAssets)

        return Promise.resolve(loadedAssets)
    }

    frame(time: number) {
        if (this.loaded && !this.stoped) {
            const now = getPerformance()
            this.delta = (time - this.lastFrameTime) / 1000
            this.frameTime += (now - this.lastLoop - this.frameTime) / 100
            this.fps = 1000 / this.frameTime
            this.lastLoop = now
            if (!this.paused && this.delta < 0.2) {
                this.loop()
            }
            this.lastFrameTime = time
            this.animationFrame = requestAnimationFrame((time: number) => this.frame(time))
        }
    }

    loop() {
        const scene = this.getCurrentScene()
        if (scene instanceof Scene) {
            this.fireEvents()
            scene.update()
            scene.draw()
            // effects
        }
    }

    start() {
        this.stoped = false
        this.animationFrame = requestAnimationFrame((time: number) => this.frame(time))
    }

    stop() {
        this.stoped = true
        this.animationFrame && cancelAnimationFrame(this.animationFrame)
    }

    restart() {
        this.stop()
        this.start()
    }

    fireEvents() {
        Object.keys(this.keyStates).map((key: string) => {
            if (typeof this.events[key] === 'function') {
                this.events[key]()
            }
        })
    }

    fireMouseEvent(type: string) {
        if (typeof this.mouseEvents[type] === 'function') {
            this.mouseEvents[type](this.mousePos)
        }
    }

    setSettings(value: any) {
        this.settings = value
    }

    setSetting(key: string, value: any) {
        this.settings = { ...this.settings, [key]: value }
    }

    getSetting(key: string) {
        return this.settings[key]
    }

    setMousePos(x: number, y: number) {
        const mpos = new Vector(Math.floor(x / this.scale), Math.floor(y / this.scale))
        if (this.mouseStarted) {
            this.mouseDeltaPos = mpos.sub(this.mousePos)
        }
        this.mousePos = mpos
        this.mouseStarted = true
        this.isMouseMoved = true
    }

    onMouseDown(e: MouseEvent) {
        const m = MOUSE_BUTTONS[e.button]
        if (m) {
            this.mouseStates[m] = 'pressed'
            this.fireMouseEvent(e.type)
        }
    }

    onMouseMove(e: MouseEvent) {
        this.setMousePos(e.offsetX, e.offsetY)
        this.fireMouseEvent(e.type)
    }

    onMouseUp(e: MouseEvent) {
        const m = MOUSE_BUTTONS[e.button]
        if (m) {
            this.mouseStates[m] = 'released'
            this.fireMouseEvent(e.type)
        }
    }

    onKey(pressed: boolean, e: KeyboardEvent) {
        pressed ? (this.keyStates[e.code] = pressed) : delete this.keyStates[e.code]
        e.preventDefault && e.preventDefault()
        e.stopPropagation && e.stopPropagation()
    }

    onKeyDown(k: string | string[], cb: () => void) {
        this.events = Array.isArray(k)
            ? Object.assign({}, this.events, ...k.map(key => ({ [key]: cb })))
            : { ...this.events, [k]: cb }
    }

    onMouseEvent(k: string | string[], cb: (pos: Vector) => void) {
        this.mouseEvents = Array.isArray(k)
            ? Object.assign({}, this.mouseEvents, ...k.map(key => ({ [key]: cb })))
            : { ...this.mouseEvents, [k]: cb }

        console.info(this.mouseEvents)
    }

    getCurrentScene() {
        if (this.scenes[this.currentScene] instanceof Scene) {
            return this.scenes[this.currentScene]
        } else throw new Error('No current scene!')
    }

    getImage(name: string) {
        if (this.assets[name] instanceof HTMLImageElement) {
            return this.assets[name] as HTMLImageElement
        } else throw new Error('Invalid image!')
    }

    playScene(idx: number) {
        this.currentScene = idx
        this.restart()
    }

    setScale(scale: number) {
        this.scale = scale
        this.resolution.x = Math.round(this.width / this.scale)
        this.resolution.y = Math.round(this.height / this.scale)
    }

    setSize(width: number, height: number, scale?: number) {
        this.width = width
        this.height = height
        this.setScale(scale || this.scale)
    }

    wait(id: string, fn: () => void, duration: number) {
        if (!this.timeouts[id]) {
            this.timeouts[id] = setTimeout(() => {
                this.cancelWait(id)
                typeof fn === 'function' && fn()
            }, duration)
        }
    }

    cancelWait(id: string) {
        if (this.timeouts[id]) {
            clearTimeout(this.timeouts[id])
            delete this.timeouts[id]
        }
    }

    datGui() {
        if (this.gui) this.gui.destroy()
        this.gui = new dat.GUI()
        this.gui.add(this, 'fps').listen()
    }

    setAudioVolume(volume: number) {
        Howler.volume(volume)
    }

    playSound(name: string) {
        if (this.sounds[name] instanceof Howl) {
            this.sounds[name].play()
        } else if (this.soundFiles[name]) {
            this.sounds[name] = new Howl({ src: this.soundFiles[name] })
            this.sounds[name].play()
        } else throw new Error('Invalid sound!')
    }

    loopSound(name: string, volume = 1) {
        if (this.soundFiles[name]) {
            this.sounds[name] = new Howl({ src: this.soundFiles[name], loop: true, volume })
            this.sounds[name].play()
        } else throw new Error('Invalid sound!')
    }
}

declare global {
    interface Window {
        Platfuse: any
    }
}
