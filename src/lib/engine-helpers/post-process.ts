import { CustomShader } from '../../types'
import { Game } from '../engine-objects/game'

/**
 * The `PostProcess` class represents a post-processing effect that can be applied to the game.
 */
export class PostProcess {
    /** The WebGL canvas element. */
    glCanvas = document.createElement('canvas')

    /** The WebGL rendering context. */
    gl: WebGL2RenderingContext

    /** The WebGL program used for rendering the post-processing effect. */
    glPostShader: WebGLProgram

    /** The WebGL buffer for the geometry. */
    glGeometryBuffer: WebGLBuffer

    /** The WebGL texture used for rendering the post-processing effect. */
    glPostTexture: WebGLTexture

    /** The uniforms used for rendering the post-processing effect. */
    glUniforms: Record<string, any> = {}

    /**
     * Represents a post-process object used for rendering custom shaders.
     * @param game - The game object.
     * @param shader - The custom shader object.
     */
    constructor(
        public game: Game,
        shader: CustomShader
    ) {
        const gl = (this.gl = this.glCanvas.getContext('webgl2') as WebGL2RenderingContext)
        const geometry = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1])

        this.glPostShader = this.createProgram(shader.vertexShader, shader.fragmentShader)
        this.glUniforms = shader.uniforms || {}
        this.glGeometryBuffer = gl.createBuffer() as WebGLBuffer
        this.glPostTexture = this.createTexture() as WebGLTexture
        this.glCanvas.style.cssText = this.game.canvas.style.cssText
        this.game.canvas.style.visibility = 'hidden'

        gl.bindBuffer(gl.ARRAY_BUFFER, this.glGeometryBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW)

        document.body.appendChild(this.glCanvas)
    }

    /**
     * Compiles a shader from the provided source code.
     * @param source - The source code of the shader.
     * @param type - The type of the shader (e.g., `gl.VERTEX_SHADER` or `gl.FRAGMENT_SHADER`).
     * @returns The compiled shader.
     */
    compileShader(source: string, type: GLenum) {
        const { gl } = this
        const shader = gl.createShader(type) as WebGLShader

        gl.shaderSource(shader, source)
        gl.compileShader(shader)

        return shader as WebGLShader
    }

    /**
     * Creates a WebGL program using the provided vertex and fragment shaders.
     * @param vs The vertex shader source code.
     * @param fs The fragment shader source code.
     * @returns The created WebGL program.
     */
    createProgram(vs: string, fs: string) {
        const { gl } = this
        const program = gl.createProgram() as WebGLProgram

        gl.attachShader(program, this.compileShader(vs, gl.VERTEX_SHADER))
        gl.attachShader(program, this.compileShader(fs, gl.FRAGMENT_SHADER))
        gl.linkProgram(program)

        return program as WebGLProgram
    }

    /**
     * Creates a WebGL texture from the given image.
     * @param image - The image to be used as the texture. If not provided, an empty texture will be created.
     * @returns The created WebGL texture.
     */
    createTexture(image?: TexImageSource) {
        const { gl } = this
        const texture = gl.createTexture()
        const filter = this.game.pixelPerfect ? gl.NEAREST : gl.LINEAR

        gl.bindTexture(gl.TEXTURE_2D, texture)
        image && gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

        return texture as WebGLTexture
    }

    /**
     * Renders the post-processing effect.
     */
    render() {
        const { game, gl, glCanvas, glPostShader, glGeometryBuffer, glPostTexture } = this
        const { canvas } = game
        const pLocation = gl.getAttribLocation(glPostShader, 'p')
        const uniformLocation = (name: string) => gl.getUniformLocation(glPostShader, name)

        gl.viewport(0, 0, (glCanvas.width = canvas.width), (glCanvas.height = canvas.height))
        gl.useProgram(glPostShader)
        gl.bindBuffer(gl.ARRAY_BUFFER, glGeometryBuffer)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
        gl.disable(gl.BLEND)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, glPostTexture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
        gl.enableVertexAttribArray(pLocation)
        gl.vertexAttribPointer(pLocation, 2, gl.FLOAT, false, 8, 0)

        Object.keys(this.glUniforms).forEach((name: string) => {
            const { value, type } = this.glUniforms[name]
            const v = typeof value === 'function' ? value(game) : value
            const uniform = uniformLocation(name)
            if (uniform) {
                if (typeof v === 'number') {
                    type === 'i' ? gl.uniform1i(uniform, v) : gl.uniform1f(uniform, v)
                } else if (typeof v === 'boolean') {
                    gl.uniform1i(uniform, v ? 1 : 0)
                } else if (v instanceof Array) {
                    if (v.length === 2) {
                        gl.uniform2f(uniform, v[0], v[1])
                    } else if (v.length === 3) {
                        gl.uniform3f(uniform, v[0], v[1], v[2])
                    } else if (v.length === 4) {
                        gl.uniform4f(uniform, v[0], v[1], v[2], v[3])
                    }
                }
            }
        })

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        // ctx.drawImage(glCanvas, 0, 0)
    }
}
