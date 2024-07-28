import { Howl } from 'howler'
import { Constructable, GameConfig } from '../../types'
import { preload } from '../utils/preload'
import { lerp } from '../utils/math'
import { delay } from '../utils/helpers'
import { BodyStyle, CanvasStyle, DefaultColors } from '../constants'
import { PostProcess } from '../engine-helpers/post-process'
import { Color } from '../engine-helpers/color'
import { Draw } from '../engine-helpers/draw'
import { Input } from '../engine-helpers/input'
import { Timer } from '../engine-helpers/timer'
import { Vector } from '../engine-helpers/vector'
import { Entity } from './entity'
import { Scene } from './scene'

/**
 * Represents a game engine that manages scenes, assets, and game state.
 */
export class Game {
    /** Canvas element for rendering the game. */
    canvas: HTMLCanvasElement

    /** Canvas rendering context. */
    ctx: CanvasRenderingContext2D

    /** Draw object for rendering 2D shapes and images. */
    draw = new Draw(this)

    /** The post-processing effect to apply to the game. */
    postProcess?: PostProcess

    /** Flag indicating whether the game should render pixel-perfect. */
    pixelPerfect = false

    /** Input object for handling user input. */
    input: Input = new Input(this)

    /** Background color of the game. */
    backgroundColor = DefaultColors.DarkBlue

    /** Primary color. Used for text, and other UI elements like preloader. */
    primaryColor = DefaultColors.White

    /** Secondary color. Used for text, and other UI elements like preloader. */
    secondaryColor = DefaultColors.LightBlue

    /** Image assets record containing image elements. */
    images: Record<string, HTMLImageElement> = {}

    // textures: Record<string, WebGLTexture> = {}

    /** Sound assets record containing Howl objects. */
    sounds: Record<string, Howl> = {}

    /** Object classes record containing entity classes. */
    objectClasses: Record<string, Constructable<Entity>> = {}

    /** Scene classes record containing scene classes. */
    sceneClasses: Record<string, Constructable<Scene>> = {}

    /** Current scene being played. */
    currentScene: Scene | null = null

    /** Scene record containing all scenes. */
    scenes: Record<string, Scene> = {}

    /** Optional settings for the game. */
    settings: Record<string, any> = {}

    /** Animation frame ID for the game loop. */
    animationFrame?: number

    /** Game width. */
    width = window.innerWidth

    /** Game height. */
    height = window.innerHeight

    /** Debug mode flag. */
    debug = false

    /** Game pause flag. */
    paused = false

    /** Game frame rate. */
    frameRate = 60

    /** Game delta time. */
    delta = 1 / 60

    /** Game average frames per second. */
    avgFPS = 0

    /** Game frame counter. */
    frame = 0

    /** Game time. */
    time = 0

    /** Game time in real seconds. */
    timeReal = 0

    /** Game frame time last. */
    frameTimeLast = 0

    /** Game frame time buffer. */
    frameTimeBuffer = 0

    /** Game preloader percent. */
    preloadPercent = 0

    /** Game global audio volume. */
    audioVolume = 1

    /**
     * Creates a new game instance.
     * @param {GameConfig} config - The game configuration.
     * @param {Record<string, string>} preload - The preload record.
     */
    constructor(
        public config: GameConfig,
        public preload: Record<string, string>
    ) {
        this.canvas = document.createElement('canvas')

        this.objectClasses = config?.entities || {}
        this.sceneClasses = config?.scenes || {}
        this.debug = !!config.debug
        this.pixelPerfect = !!config?.pixelPerfect
        this.backgroundColor = config?.backgroundColor ? new Color(config.backgroundColor) : this.backgroundColor
        this.primaryColor = config?.primaryColor ? new Color(config.primaryColor) : this.primaryColor
        this.secondaryColor = config?.secondaryColor ? new Color(config.secondaryColor) : this.secondaryColor
        this.canvas.setAttribute('style', `${CanvasStyle} ${this.pixelPerfect ? 'image-rendering: pixelated;' : ''}`)
        this.canvas.style.backgroundColor = this.backgroundColor.toString()
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D

        document.body.style.cssText = `${BodyStyle} background: ${this.backgroundColor.toString()};`
        document.body.appendChild(this.canvas)

        window.addEventListener('resize', this.onResize.bind(this))
        this.onResize()

        if (config?.postProcessShader) this.postProcess = new PostProcess(this, config.postProcessShader)
        if (!!config.global) window.Platfuse = this
    }

    /**
     * Starts the game engine and initializes the scenes.
     * @param sceneName - Optional name of the scene to start with.
     */
    async start(sceneName?: string) {
        this.update()
        const assets = await preload(this.preload, p => (this.preloadPercent = p))
        Object.keys(assets).forEach((key: string) => {
            if (assets[key] instanceof HTMLImageElement) {
                this.images[key] = assets[key]
            } else if (assets[key] instanceof Howl) {
                this.sounds[key] = assets[key]
            }
        })
        await Promise.all(
            Object.keys(this.sceneClasses).map(async sceneName => {
                const Model = this.sceneClasses[sceneName]
                const s: Scene = new Model(this, sceneName)
                await s.preInit()
                this.scenes[sceneName] = s
            })
        )
        await delay(1000)
        if (sceneName) {
            this.playScene(sceneName)
        }
    }

    /**
     * Plays the specified scene.
     * @param sceneName - The name of the scene to play.
     * @param restart - Whether to restart the scene if it is already playing. Default is `false`.
     * @throws Error if the specified scene is not found.
     */
    playScene(sceneName: string, restart = false) {
        if (this.currentScene && this.currentScene.name === sceneName && !restart) return
        if (!this.scenes[sceneName]) {
            throw new Error(`Scene '${sceneName}' not found!`)
        }
        if (this.currentScene) {
            this.currentScene.destroy()
        }
        const scene = this.scenes[sceneName]
        if (scene.tmxMap) {
            scene.createFromTmxMap()
        }
        scene.init()
        this.currentScene = scene
    }

    /**
     * Restarts the current scene.
     */
    restartScene() {
        if (this.currentScene) {
            this.playScene(this.currentScene.name, true)
        }
    }

    /**
     * Handles the resize event of the game window.
     */
    onResize() {
        this.width = window.innerWidth
        this.height = window.innerHeight
        if (this.config?.fixedSize instanceof Vector) {
            const { fixedSize } = this.config
            const aspect = innerWidth / innerHeight
            const fixedAspect = fixedSize.x / fixedSize.y
            this.canvas.width = fixedSize.x
            this.canvas.height = fixedSize.y
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
     * @param frameTime The time elapsed since the last frame in milliseconds.
     */
    update(frameTime = 0) {
        const scene = this.currentScene
        const frameTimeDelta = frameTime - this.frameTimeLast

        this.frameTimeLast = frameTime
        this.avgFPS = lerp(0.05, this.avgFPS, 1e3 / (frameTimeDelta || 1))
        this.timeReal += frameTimeDelta / 1e3
        this.frameTimeBuffer += (this.paused ? 0 : 1) * frameTimeDelta

        if (scene instanceof Scene) {
            if (this.paused) {
                scene.postUpdate()
                this.input.postUpdate()
            } else {
                let deltaSmooth = 0
                if (this.frameTimeBuffer < 0 && this.frameTimeBuffer > -9) {
                    deltaSmooth = this.frameTimeBuffer
                    this.frameTimeBuffer = 0
                }
                for (; this.frameTimeBuffer >= 0; this.frameTimeBuffer -= 1e3 / this.frameRate) {
                    this.time = this.frame++ / this.frameRate
                    this.delta = 1 / this.avgFPS
                    // update input
                    this.input.update()
                    // update scene
                    scene.updateLayers()
                    scene.updateObjects()
                    scene.update()
                    scene.updateCamera()
                    // post update
                    scene.postUpdate()
                    scene.postUpdateLayers()
                    this.input.postUpdate()
                }
                this.frameTimeBuffer += deltaSmooth
            }
            scene.draw()
        } else {
            this.time = this.frame++ / this.frameRate
            this.draw.preloader(this.preloadPercent)
        }
        this?.postProcess?.render()
        this.animationFrame = requestAnimationFrame((time: number) => this.update(time))
    }

    /**
     * Toggles the pause state of the game.
     * @param paused - Optional. Specifies whether the game should be paused or not. Default is true.
     */
    togglePause(paused = !this.paused) {
        this.paused = paused
    }

    /**
     * Gets the resolution of the game.
     * @returns A Vector representing the width and height of the game.
     */
    getResolution() {
        return new Vector(this.width, this.height)
    }

    /**
     * Sets the optional settings for the game.
     * @param value - The new settings value.
     */
    setSettings(value: any) {
        this.settings = value
    }

    /**
     * Sets a setting value for the game.
     * @param key - The key of the setting.
     * @param value - The value to set for the setting.
     */
    setSetting(key: string, value: any) {
        this.settings = { ...this.settings, [key]: value }
    }

    /**
     * Retrieves the value of a setting based on the provided key.
     * @param key - The key of the setting to retrieve.
     * @returns The value of the setting.
     */
    getSetting(key: string) {
        return this.settings[key]
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
     * Retrieves an image by its name from the assets.
     * @param name - The name of the image to retrieve.
     * @returns The HTMLImageElement corresponding to the specified name.
     * @throws Error if the image is not found in the assets.
     */
    getImage(name: string) {
        if (this.images[name]) return this.images[name]
        else throw new Error(`'${name}' is not a valid image!`)
    }

    /**
     * Plays the sound with the specified name.
     * @param name - The name of the sound to play.
     */
    playSound(name: string) {
        if (this.sounds[name]) {
            this.sounds[name].volume(this.audioVolume)
            this.sounds[name].play()
        }
    }

    /**
     * Sets the global audio volume.
     * @param volume - The volume level to set.
     */
    setAudioVolume(volume: number) {
        this.audioVolume = volume
    }

    /**
     * Toggles the fullscreen mode.
     */
    toggleFullscreen() {
        if (!!document.fullscreenElement) {
            if (document.exitFullscreen) document.exitFullscreen()
        } else if (document.body.requestFullscreen) document.body.requestFullscreen()
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
