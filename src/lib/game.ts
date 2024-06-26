import * as dat from 'dat.gui'

import { Constructable, GameConfig } from '../types'
import { lerp } from './utils/math'
import { Draw } from './draw'
import { Scene } from './scene'
import { Entity } from './entity'
import { Input } from './input'
import { preloadAssets } from './utils/preload'
import { Timer } from './timer'
import { COLORS } from './utils/constants'

const canvasStyle = `
    position:absolute;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%);
    image-rendering:pixelated
`

export class Game {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    gui?: dat.GUI
    draw: Draw
    input = new Input()
    assets: Record<string, HTMLImageElement | HTMLAudioElement> = {}
    objectClasses: Record<string, Constructable<Entity>> = {}
    sceneClasses: Record<string, Constructable<Scene>> = {}
    currentScene: Scene | null = null
    scenes: Record<string, Scene> = {}
    settings: Record<string, any> = {}
    animationFrame?: number
    width = window.innerWidth
    height = window.innerHeight
    debug = false
    ready = false
    paused = true
    frameRate = 60
    frame = 0
    time = 0
    timeReal = 0
    frameTimeLastMS = 0
    frameTimeBufferMS = 0
    avgFPS = 0
    delta = 1 / 60

    backgroundColor: string = COLORS.BLACK
    preloaderColor: string = COLORS.WHITE

    constructor(
        public config: GameConfig,
        public preload: Record<string, string>
    ) {
        document.body.appendChild((this.canvas = document.createElement('canvas')))

        this.sceneClasses = config.scenes
        this.objectClasses = config.entities
        this.sceneClasses = config.scenes
        this.objectClasses = config.entities
        this.debug = !!config.debug
        this.backgroundColor = config?.backgroundColor || this.backgroundColor
        this.preloaderColor = config?.preloaderColor || this.preloaderColor
        this.canvas.setAttribute('style', canvasStyle)
        this.canvas.style.backgroundColor = this.backgroundColor
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
        this.draw = new Draw(this)
        this.debug && this.enableDebugGUI()

        this.onResize()
        window.addEventListener('resize', this.onResize.bind(this))
        if (!!config.global) window.Platfuse = this
    }

    async init() {
        this.ready = false
        this.assets = await preloadAssets(this.preload, (p: number) => this.draw.preloader(p))
        await Promise.all(
            Object.keys(this.sceneClasses).map(async sceneName => {
                const Model = this.sceneClasses[sceneName]
                const s: Scene = new Model(this)
                await s.init()
                this.scenes[sceneName] = s
                return s
            })
        )
        this.ready = true
        this.update()
    }

    /**
     * Handles the resize event of the game window.
     */
    onResize() {
        this.width = window.innerWidth
        this.height = window.innerHeight
        if (this.config?.fixedSize?.x) {
            // clear canvas and set fixed size
            this.canvas.width = this.config.fixedSize.x
            this.canvas.height = this.config.fixedSize.y

            // fit to window by adding space on top or bottom if necessary
            const aspect = innerWidth / innerHeight
            const fixedAspect = this.canvas.width / this.canvas.height
            this.canvas.style.width = aspect < fixedAspect ? '100%' : ''
            this.canvas.style.height = aspect < fixedAspect ? '' : '100%'
        } else {
            // clear canvas and set size to same as window
            this.canvas.width = this.width
            this.canvas.height = this.height
        }
        // Pixelated rendering
        this.width = this.canvas.width
        this.height = this.canvas.height
    }

    /**
     * Updates the game state and renders the scene.
     * @param frameTimeMS The time elapsed since the last frame in milliseconds.
     */
    update(frameTimeMS = 0) {
        // this.fireEvents()
        const scene = this.currentScene
        const frameTimeDeltaMS = frameTimeMS - this.frameTimeLastMS

        this.frameTimeLastMS = frameTimeMS
        this.avgFPS = lerp(0.05, this.avgFPS, 1e3 / (frameTimeDeltaMS || 1))
        this.timeReal += frameTimeDeltaMS / 1e3
        this.frameTimeBufferMS += (this.paused ? 0 : 1) * frameTimeDeltaMS

        if (this.ready && scene) {
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

                    // do post update
                    // scene.updatePost()
                    this.input.postUpdate()
                }

                // add the time smoothing back in
                this.frameTimeBufferMS += deltaSmooth
            }
            scene.draw(/*this*/)
            this.debug && this.draw.fillText(this.avgFPS.toFixed(1), 10, this.canvas.height - 20, '#fff', 1)
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

    // @todo: implement getter for audio files
    getImage(name: string) {
        if (this.assets[name] instanceof HTMLImageElement) {
            return this.assets[name] as HTMLImageElement
        } else throw new Error('Invalid image!')
    }

    timer(timeLeft?: number) {
        return new Timer(this, timeLeft)
    }

    enableDebugGUI() {
        if (this.gui) this.gui.destroy()
        this.gui = new dat.GUI()
    }
}

/**
 * Global declaration for the Platfuse window object.
 */
declare global {
    interface Window {
        Platfuse: any
    }
}
