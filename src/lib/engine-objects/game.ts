import * as dat from 'dat.gui'

import { Constructable, GameConfig } from '../../types'
import { glInit, glRenderPostProcess } from '../utils/webgl'
import { preload } from '../utils/preload'
import { lerp } from '../utils/helpers'
import { Draw, Input, Timer } from '../engine-helpers'
import { DefaultColors } from '../constants'
import { Entity } from './entity'
import { Scene } from './scene'

const canvasStyle = `
    position:absolute;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%);
    image-rendering:pixelated
`

export class Game {
    useWebGL = false
    draw = new Draw(this)
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    gui?: dat.GUI
    input: Input = new Input(this)
    backgroundColor = DefaultColors.Black
    primaryColor = DefaultColors.White
    secondaryColor = DefaultColors.LightBlue
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
    paused = true
    frameRate = 60
    delta = 1 / 60
    avgFPS = 0
    frame = 0
    time = 0
    timeReal = 0
    frameTimeLastMS = 0
    frameTimeBufferMS = 0

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
        this.primaryColor = config?.preloaderColor || this.primaryColor
        this.canvas.setAttribute('style', canvasStyle)
        this.canvas.style.backgroundColor = this.backgroundColor.toString()
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
        this.debug && this.enableDebugGUI()

        document.body.style.background = this.backgroundColor.toString()
        window.addEventListener('resize', this.onResize.bind(this))

        this.onResize()

        if (!!config.global) window.Platfuse = this
    }

    /**
     * Initializes the game engine.
     * @returns {Promise<void>} A promise that resolves when the initialization is complete.
     */
    async init() {
        this.assets = await preload(this.preload, (p: number) => this.draw.preloader(p))
        await Promise.all(
            Object.keys(this.sceneClasses).map(async sceneName => {
                const Model = this.sceneClasses[sceneName]
                const s: Scene = new Model(this)
                await s.init()
                this.scenes[sceneName] = s
                return s
            })
        )
        this.useWebGL && glInit(this)
        setTimeout(() => this.update(), 500)
    }

    /**
     * Handles the resize event of the game window.
     */
    onResize() {
        this.width = window.innerWidth
        this.height = window.innerHeight
        if (this.config?.fixedSize?.x) {
            this.canvas.width = this.config.fixedSize.x
            this.canvas.height = this.config.fixedSize.y

            const aspect = innerWidth / innerHeight
            const fixedAspect = this.canvas.width / this.canvas.height

            this.canvas.style.width = aspect < fixedAspect ? '100%' : ''
            this.canvas.style.height = aspect < fixedAspect ? '' : '100%'
        } else {
            this.canvas.width = this.width
            this.canvas.height = this.height
        }
        this.width = this.canvas.width
        this.height = this.canvas.height
    }

    /**
     * Updates the game state and renders the scene.
     * @param frameTimeMS The time elapsed since the last frame in milliseconds.
     */
    update(frameTimeMS = 0) {
        const scene = this.currentScene
        const frameTimeDeltaMS = frameTimeMS - this.frameTimeLastMS

        this.frameTimeLastMS = frameTimeMS
        this.avgFPS = lerp(0.05, this.avgFPS, 1e3 / (frameTimeDeltaMS || 1))
        this.timeReal += frameTimeDeltaMS / 1e3
        this.frameTimeBufferMS += (this.paused ? 0 : 1) * frameTimeDeltaMS

        if (scene) {
            if (this.paused) {
            } else {
                let deltaSmooth = 0
                if (this.frameTimeBufferMS < 0 && this.frameTimeBufferMS > -9) {
                    deltaSmooth = this.frameTimeBufferMS
                    this.frameTimeBufferMS = 0
                }
                for (; this.frameTimeBufferMS >= 0; this.frameTimeBufferMS -= 1e3 / this.frameRate) {
                    this.time = this.frame++ / this.frameRate
                    this.delta = 1 / this.avgFPS
                    // update input
                    this.input.update()
                    // update scene
                    scene.updateLayers()
                    scene.updateObjects()
                    scene.update()
                    scene.updateCamera()
                    // do post update
                    scene.postUpdate()
                    this.input.postUpdate()
                }
                this.frameTimeBufferMS += deltaSmooth
            }
            scene.draw()
            this.useWebGL && glRenderPostProcess(this.time)
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

    /**
     * Plays the specified scene by its index.
     *
     * @param idx - The index of the scene to play.
     * @throws {Error} If the scene is not found.
     */
    playScene(idx: string) {
        if (this.scenes[idx] instanceof Scene) {
            this.currentScene = this.scenes[idx]
            this.restart()
        } else throw new Error('Scene not found!')
    }

    /**
     * Returns the current scene of the game.
     * @returns The current scene if it exists, otherwise throws an error.
     */
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

    /**
     * Creates a new Timer object.
     * @param timeLeft - The initial time left for the timer (optional).
     * @returns A new Timer instance.
     */
    timer(timeLeft?: number) {
        return new Timer(this, timeLeft)
    }

    /**
     * Enables the debug GUI for the game.
     */
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
