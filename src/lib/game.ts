import * as dat from 'dat.gui'
import { Howl, Howler } from 'howler'
import { Scene } from './scene'
import { Vec2 } from './utils/math'
import { getPerformance } from './utils/helpers'
import { Constructable, StringTMap } from '../types'
import { Draw } from './utils/draw'
import { Entity } from './entity'

type TConfig = {
    width?: number
    height?: number
    canvas: HTMLCanvasElement
    entities: StringTMap<Constructable<Entity>>
    scenes: Constructable<Scene>[]
    backgroundColor?: string
    preloaderColor?: string
    scale?: number
    global?: boolean
    debug?: boolean
}

type TColors = {
    backgroundColor?: string
    preloaderColor?: string
}

export class Game {
    resolution = new Vec2()
    then = getPerformance()
    ctx: CanvasRenderingContext2D
    gui?: dat.GUI
    draw: Draw
    assets: StringTMap<HTMLImageElement | HTMLAudioElement> = {}
    soundFiles: StringTMap<string> = {}
    sounds: StringTMap<Howl> = {}
    objectClasses: StringTMap<Constructable<Entity>> = {}
    sceneClasses: Constructable<Scene>[] = []
    scenes: Scene[] = []
    colors: TColors
    events: StringTMap<any> = {}
    keyStates: StringTMap<any> = {}
    timeouts: Record<string, any> = {}
    animationFrame?: number
    width: number
    height: number
    scale: number
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

    constructor(config: TConfig) {
        this.ctx = config.canvas.getContext('2d') as CanvasRenderingContext2D
        this.sceneClasses = config.scenes
        this.objectClasses = config.entities
        this.width = config?.width || config.canvas.width
        this.height = config?.height || config.canvas.height
        this.scale = config.scale || 1
        this.debug = !!config.debug
        this.colors = {
            backgroundColor: config?.backgroundColor || '#000',
            preloaderColor: config?.preloaderColor || '#222'
        }
        this.draw = new Draw(this.ctx)
        this.debug && this.datGui()
        document.addEventListener('keydown', e => this.onKey(true, e), false)
        document.addEventListener('keyup', e => this.onKey(false, e), false)
        if (!!config.global) window.Platfuse = this
    }

    async onLoad(loadedAssets: StringTMap<HTMLImageElement | HTMLAudioElement>) {
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

    async preload(assets: StringTMap<string>) {
        this.loaded = false
        let loadedCount = 0
        const count = Object.keys(assets).length
        const indicator = (p: number) => this.draw.preloader(p, this.resolution, this.scale, this.colors)
        const load = (key: string) => {
            const src = assets[key]
            return new Promise(res => {
                if (/\.(gif|jpe?g|png|webp|bmp)$/i.test(src)) {
                    const img = new Image()
                    img.src = src
                    img.onload = () => {
                        indicator(++loadedCount / count)
                        return res(img)
                    }
                } else if (/\.(webm|mp3|wav)$/i.test(src)) {
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

        return loadedAssets
    }

    frame(time: number): void {
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

    loop(): void {
        const scene = this.getCurrentScene()
        if (scene instanceof Scene) {
            this.fireEvents()
            scene.update()
            scene.draw()
        }
    }

    start(): void {
        this.stoped = false
        this.animationFrame = requestAnimationFrame((time: number) => this.frame(time))
    }

    stop(): void {
        this.stoped = true
        this.animationFrame && cancelAnimationFrame(this.animationFrame)
    }

    restart(): void {
        this.stop()
        this.start()
    }

    fireEvents(): void {
        Object.keys(this.keyStates).map((key: string) => {
            if (typeof this.events[key] === 'function') {
                this.events[key]()
            }
        })
    }

    onKey(pressed: boolean, e: KeyboardEvent) {
        pressed ? (this.keyStates[e.code] = pressed) : delete this.keyStates[e.code]
        e.preventDefault && e.preventDefault()
        e.stopPropagation && e.stopPropagation()
    }

    isKeyDown(key: string): boolean {
        return this.keyStates[key] || false
    }

    onKeyDown(k: string | string[], cb: () => void) {
        this.events = Array.isArray(k)
            ? Object.assign({}, this.events, ...k.map(key => ({ [key]: cb })))
            : { ...this.events, [k]: cb }
    }

    getCurrentScene(): Scene {
        if (this.scenes[this.currentScene] instanceof Scene) {
            return this.scenes[this.currentScene]
        } else throw new Error('No current scene!')
    }

    getImage(name: string): HTMLImageElement {
        if (this.assets[name] instanceof HTMLImageElement) {
            return this.assets[name] as HTMLImageElement
        } else throw new Error('Invalid image!')
    }

    playScene(idx: number): void {
        this.currentScene = idx
        this.restart()
    }

    setScale(scale: number): void {
        this.scale = scale
        this.onResize()
    }

    setSize(width: number, height: number, scale?: number): void {
        this.width = width
        this.height = height
        this.setScale(scale || this.scale)
    }

    onResize() {
        this.resolution.x = Math.round(this.width / this.scale)
        this.resolution.y = Math.round(this.height / this.scale)
        if (this.scenes[this.currentScene] instanceof Scene) {
            this.scenes[this.currentScene].resize(this)
        }
    }

    wait(id: string, fn: () => void, duration: number): void {
        if (!this.timeouts[id]) {
            this.timeouts[id] = setTimeout(() => {
                this.cancelWait(id)
                typeof fn === 'function' && fn()
            }, duration)
        }
    }

    cancelWait(id: string): void {
        if (this.timeouts[id]) {
            clearTimeout(this.timeouts[id])
            delete this.timeouts[id]
        }
    }

    datGui(): void {
        if (this.gui) this.gui.destroy()
        this.gui = new dat.GUI()
        this.gui.add(this, 'fps').listen()
    }

    setAudioVolume(volume: number): void {
        Howler.volume(volume)
    }

    playSound(name: string): void {
        if (this.sounds[name] instanceof Howl) {
            this.sounds[name].play()
        } else if (this.soundFiles[name]) {
            this.sounds[name] = new Howl({ src: this.soundFiles[name] })
            this.sounds[name].play()
        } else throw new Error('Invalid sound!')
    }

    loopSound(name: string, volume = 1): void {
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
