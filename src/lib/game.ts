import * as dat from 'dat.gui'
import { Howl, Howler } from 'howler'
import { Scene } from './scene'
import { lerp } from './utils/math'
import { Constructable, GameConfig } from '../types'
import { Draw } from './utils/draw'
import { Entity } from './entity'
import { Input } from './input'

// const MOUSE_BUTTONS = ['left', 'middle', 'right', 'back', 'forward']

export class Game {
    ctx: CanvasRenderingContext2D
    backgroundColor = '#000'
    mainCanvas: HTMLCanvasElement
    gui?: dat.GUI
    draw: Draw
    assets: Record<string, HTMLImageElement | HTMLAudioElement> = {}
    soundFiles: Record<string, string> = {}
    sounds: Record<string, Howl> = {}
    objectClasses: Record<string, Constructable<Entity>> = {}
    sceneClasses: Record<string, Constructable<Scene>> = {}
    scenes: Record<string, Scene> = {}
    timeouts: Record<string, any> = {}
    settings: Record<string, any> = {}
    animationFrame?: number
    width = window.innerWidth
    height = window.innerHeight
    debug = false
    loaded = false
    paused = true
    currentScene: Scene | null = null

    frameRate = 60
    frame = 0
    time = 0
    timeReal = 0
    frameTimeLastMS = 0
    frameTimeBufferMS = 0
    avgFPS = 0
    delta = 1 / 60

    input = new Input()

    constructor(
        config: GameConfig,
        public preload: Record<string, string>
    ) {
        document.body.appendChild((this.mainCanvas = document.createElement('canvas')))
        this.ctx = this.mainCanvas.getContext('2d') as CanvasRenderingContext2D
        const canvasPixelated = true
        const styleCanvas =
            'position:absolute;' +
            'top:50%;left:50%;transform:translate(-50%,-50%);' +
            (canvasPixelated ? 'image-rendering:pixelated' : '')
        this.mainCanvas.setAttribute('style', styleCanvas)

        if (config?.fixedSize?.x) {
            // clear canvas and set fixed size
            this.mainCanvas.width = config.fixedSize.x
            this.mainCanvas.height = config.fixedSize.y

            // fit to window by adding space on top or bottom if necessary
            const aspect = innerWidth / innerHeight
            const fixedAspect = this.mainCanvas.width / this.mainCanvas.height
            this.mainCanvas.style.width = aspect < fixedAspect ? '100%' : ''
            this.mainCanvas.style.height = aspect < fixedAspect ? '' : '100%'
        } else {
            // clear canvas and set size to same as window
            this.mainCanvas.width = this.width
            this.mainCanvas.height = this.height
        }
        this.ctx.imageSmoothingEnabled = false

        this.sceneClasses = config.scenes
        this.objectClasses = config.entities
        this.width = this.mainCanvas.width // config?.width || config.canvas.width
        this.height = this.mainCanvas.height //config?.height || config.canvas.height

        this.debug = !!config.debug

        this.draw = new Draw(this.ctx)
        this.debug && this.datGui()

        if (!!config.global) window.Platfuse = this
    }

    async onLoad(loadedAssets: Record<string, HTMLImageElement | HTMLAudioElement>) {
        this.assets = loadedAssets
        await Promise.all(
            Object.keys(this.sceneClasses).map(async sceneName => {
                const Model = this.sceneClasses[sceneName]
                const s: Scene = new Model(this)
                await s.init()
                this.scenes[sceneName] = s
                return s
            })
        )
        this.loaded = true
        this.update()
    }

    async init() {
        this.loaded = false
        let loadedCount = 0
        const count = Object.keys(this.preload).length
        const indicator = (p: number) => this.draw.preloader(0, 0, p)
        const load = (key: string) => {
            const src = this.preload[key]
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
        const promises = Object.keys(this.preload).map(async (key: string) => ({
            [key]: await load(key)
        }))
        const loadedAssets = Object.assign({}, ...(await Promise.all(promises)))
        await this.onLoad(loadedAssets)

        return Promise.resolve(loadedAssets)
    }

    update(frameTimeMS = 0) {
        // this.fireEvents()
        const frameTimeDeltaMS = frameTimeMS - this.frameTimeLastMS
        this.frameTimeLastMS = frameTimeMS
        this.avgFPS = lerp(0.05, this.avgFPS, 1e3 / (frameTimeDeltaMS || 1))
        // const debugSpeedUp   = debug && keyIsDown(107); // +
        // const debugSpeedDown = debug && keyIsDown(109); // -
        // if (debug) // +/- to speed/slow time
        //     frameTimeDeltaMS *= debugSpeedUp ? 5 : debugSpeedDown ? .2 : 1;
        this.timeReal += frameTimeDeltaMS / 1e3
        this.frameTimeBufferMS += (this.paused ? 0 : 1) * frameTimeDeltaMS
        // if (!debugSpeedUp)
        // this.frameTimeBufferMS = Math.min(this.frameTimeBufferMS, 50) // clamp incase of slow framerate

        const scene = this.currentScene
        if (this.loaded && scene) {
            if (this.paused) {
            } else {
                let deltaSmooth = 0
                if (this.frameTimeBufferMS < 0 && this.frameTimeBufferMS > -9) {
                    // force an update each frame if time is close enough (not just a fast refresh rate)
                    deltaSmooth = this.frameTimeBufferMS
                    this.frameTimeBufferMS = 0
                }
                // update multiple frames if necessary in case of slow framerate
                for (; this.frameTimeBufferMS >= 0; this.frameTimeBufferMS -= 1e3 / this.frameRate) {
                    // increment frame and update time
                    this.time = this.frame++ / this.frameRate
                    this.delta = 1 / this.avgFPS

                    // update game and objects
                    this.input.update()

                    // scene
                    scene.updateLayers()
                    scene.updateObjects()
                    scene.update()
                    scene.updateCamera()

                    //     gameUpdate()
                    //     engineObjectsUpdate()

                    // do post update
                    //     debugUpdate()
                    //     gameUpdatePost()
                    this.input.postUpdate()
                    //     inputUpdatePost()
                }

                // add the time smoothing back in
                this.frameTimeBufferMS += deltaSmooth
            }
            scene.draw(/*this*/)
            this.debug && this.draw.fillText(this.avgFPS.toFixed(1), 10, this.mainCanvas.height - 20, '#fff', 1)
        }
        this.animationFrame = requestAnimationFrame((time: number) => this.update(time))
    }

    start() {
        this.paused = false
    }

    pause() {
        this.paused = true
    }

    restart() {
        this.pause()
        this.start()
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

    playScene(idx: string) {
        if (this.scenes[idx] instanceof Scene) {
            this.currentScene = this.scenes[idx]
            this.restart()
        } else throw new Error('Scene not found!')
    }

    getCurrentScene() {
        if (this.currentScene instanceof Scene) {
            return this.currentScene
        } else throw new Error('No current scene!')
    }

    getImage(name: string) {
        if (this.assets[name] instanceof HTMLImageElement) {
            return this.assets[name] as HTMLImageElement
        } else throw new Error('Invalid image!')
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
