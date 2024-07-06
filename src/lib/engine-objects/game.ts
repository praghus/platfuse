import { Howl, Howler } from 'howler'
import { Constructable, GameConfig } from '../../types'
import { preload } from '../utils/preload'
import { lerp } from '../utils/helpers'
import { Color, Draw, Input, Timer, Vector } from '../engine-helpers'
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
    draw = new Draw(this)
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    input: Input = new Input(this)
    backgroundColor = DefaultColors.DarkBlue
    primaryColor = DefaultColors.White
    secondaryColor = DefaultColors.LightBlue
    assets: Record<string, HTMLImageElement | HTMLAudioElement> = {}
    sounds: Record<string, Howl> = {}
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
    preloadPercent = 0

    constructor(
        public config: GameConfig,
        public preload: Record<string, string>
    ) {
        document.body.appendChild((this.canvas = document.createElement('canvas')))
        this.objectClasses = config?.entities || {}
        this.debug = !!config.debug
        this.backgroundColor = config?.backgroundColor ? new Color(config.backgroundColor) : this.backgroundColor
        this.primaryColor = config?.primaryColor ? new Color(config.primaryColor) : this.primaryColor
        this.secondaryColor = config?.secondaryColor ? new Color(config.secondaryColor) : this.secondaryColor
        this.canvas.setAttribute('style', canvasStyle)
        this.canvas.style.backgroundColor = this.backgroundColor.toString()
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
        window.addEventListener('resize', this.onResize.bind(this))
        this.onResize()

        if (!!config.global) window.Platfuse = this
    }

    /**
     * Initializes the game engine.
     * @param SceneClass Optional parameter specifying the scene class to play after initialization.
     */
    async init(SceneClass?: Constructable<Scene>) {
        const drawPreloader = (p: number) => {
            this.draw.preloader(p)
            this.animationFrame = requestAnimationFrame(() => drawPreloader(p))
        }
        this.assets = await preload(this.preload, drawPreloader)
        if (SceneClass) {
            await this.playScene(SceneClass)
        }
    }

    /**
     * Plays a scene by instantiating the provided `SceneClass` and initializing it.
     * @param SceneClass The class of the scene to be played.
     */
    async playScene(SceneClass: Constructable<Scene>) {
        this.currentScene = new SceneClass(this)
        await this.currentScene.init()
        setTimeout(() => this.start(), 500)
    }

    /**
     * Starts the game.
     */
    start() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame)
        }
        this.paused = false
        this.update()
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
     * @param frameTimeMS The time elapsed since the last frame in milliseconds.
     */
    update(frameTimeMS = 0) {
        const scene = this.currentScene
        const frameTimeDeltaMS = frameTimeMS - this.frameTimeLastMS

        this.frameTimeLastMS = frameTimeMS
        this.avgFPS = lerp(0.05, this.avgFPS, 1e3 / (frameTimeDeltaMS || 1))
        this.timeReal += frameTimeDeltaMS / 1e3
        this.frameTimeBufferMS += (this.paused ? 0 : 1) * frameTimeDeltaMS

        if (scene instanceof Scene) {
            if (this.paused) {
                scene.postUpdate()
                this.input.postUpdate()
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
        } else {
            console.warn('No scene to render!')
        }
        this.animationFrame = requestAnimationFrame((time: number) => this.update(time))
    }

    /**
     * Toggles the pause state of the game.
     * @param paused - Optional. Specifies whether the game should be paused or not. Default is true.
     */
    togglePause(paused = true) {
        this.paused = paused
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
        if (this.assets[name] instanceof HTMLImageElement) {
            return this.assets[name] as HTMLImageElement
        } else throw new Error('Invalid image!')
    }

    /**
     * Retrieves a sound by its name.
     * @param name - The name of the sound to retrieve.
     * @returns The Howl instance representing the sound.
     * @throws Error if the sound is invalid.
     */
    getSound(name: string) {
        if (this.sounds[name] instanceof Howl) {
            return this.sounds[name] as Howl
        } else if (this.assets[name] instanceof HTMLAudioElement) {
            return (this.sounds[name] = new Howl({ src: this.assets[name].src }))
        } else throw new Error('Invalid sound!')
    }

    /**
     * Plays the sound with the specified name.
     * @param name - The name of the sound to play.
     */
    playSound(name: string) {
        this.getSound(name)?.play()
    }

    /**
     * Sets the global audio volume.
     * @param volume - The volume level to set.
     */
    setAudioVolume(volume: number) {
        Howler.volume(volume)
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
