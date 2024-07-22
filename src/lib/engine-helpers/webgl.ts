import { Game } from '../engine-objects'
import { vec2 } from './vector'

const INDICIES_PER_INSTANCE = 11
const MAX_INSTANCES = 1e4
const INSTANCE_BYTE_STRIDE = INDICIES_PER_INSTANCE * 4
const INSTANCE_BUFFER_SIZE = MAX_INSTANCES * INSTANCE_BYTE_STRIDE

export class WebGL {
    gl: WebGL2RenderingContext
    glShader: WebGLProgram
    glPostShader?: WebGLProgram
    glActiveTexture: WebGLTexture
    glPostTexture: WebGLTexture
    glArrayBuffer: WebGLBuffer
    glGeometryBuffer: WebGLBuffer
    glPositionData: Float32Array
    glColorData: Uint32Array
    glInstanceCount: number
    glAdditive = 0
    glBatchAdditive = 0

    constructor(public game: Game) {
        const gl = game.glCanvas.getContext('webgl2') as WebGL2RenderingContext
        if (!gl) throw new Error('WebGL2 not supported')
        this.gl = gl
        this.glShader = this.createProgram(
            `#version 300 es                // specify GLSL ES version
                precision highp float;      // use highp for better accuracy
                uniform mat4 m;             // transform matrix
                in vec2 g;                  // geometry
                in vec4 p,u,c,a;            // position/size, uvs, color, additiveColor
                in float r;                 // rotation
                out vec2 v;                 // return uv, color, additiveColor
                out vec4 d,e;               // return uv, color, additiveColor
                void main(){                // shader entry point
                    vec2 s=(g-.5)*p.zw;     // get size offset
                    gl_Position=m*vec4(p.xy+s*cos(r)-vec2(-s.y,s)*sin(r),1,1); // transform position
                    v=mix(u.xw,u.zy,g);     // pass uv to fragment shader
                    d=c;e=a;                // pass colors to fragment shader
                }`,
            `#version 300 es                // specify GLSL ES version
                precision highp float;      // use highp for better accuracy
                in vec2 v;                  // uv
                in vec4 d,e;                // color, additiveColor
                uniform sampler2D s;        // texture
                out vec4 c;                 // out color
                void main(){                // shader entry point
                    c=texture(s,v)*d+e;     // modulate texture by color plus additive
                }`
        ) as WebGLProgram

        const glInstanceData = new ArrayBuffer(INSTANCE_BUFFER_SIZE)
        const geometry = new Float32Array([(this.glInstanceCount = 0), 0, 1, 0, 0, 1, 1, 1])

        this.glPositionData = new Float32Array(glInstanceData)
        this.glColorData = new Uint32Array(glInstanceData)
        this.glArrayBuffer = gl.createBuffer() as WebGLBuffer
        this.glGeometryBuffer = gl.createBuffer() as WebGLBuffer
        this.glActiveTexture = this.createTexture()
        this.glPostTexture = this.createTexture()

        gl.bindBuffer(gl.ARRAY_BUFFER, this.glGeometryBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW)

        console.info('WebGL initialized')
        document.body.appendChild(game.glCanvas)
    }

    compileShader(source: string, type: GLenum) {
        const { gl } = this
        const shader = gl.createShader(type) as WebGLShader
        gl.shaderSource(shader, source)
        gl.compileShader(shader)

        return shader as WebGLShader
    }

    createProgram(vsSource: string, fsSource: string) {
        const { gl } = this
        const program = gl.createProgram() as WebGLProgram
        gl.attachShader(program, this.compileShader(vsSource, gl.VERTEX_SHADER))
        gl.attachShader(program, this.compileShader(fsSource, gl.FRAGMENT_SHADER))
        gl.linkProgram(program)

        return program as WebGLProgram
    }

    createTexture(image?: TexImageSource) {
        const { gl } = this
        // build the texture
        const texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)
        if (image) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
        } else {
            // create a 1x1 pixel texture if no image is provided
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]))
        }

        // use point filtering for pixelated rendering
        const filter = gl.NEAREST //canvasPixelated ? gl.NEAREST : gl.LINEAR
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

        return texture as WebGLTexture
    }

    preRender() {
        const { game, gl, glShader, glArrayBuffer, glGeometryBuffer } = this
        const { glCanvas, currentScene, width, height } = game
        const scale = currentScene?.camera.scale || 1

        // clear and set to same size as main canvas
        glCanvas.style.width = game.canvas.style.width
        glCanvas.style.height = game.canvas.style.height
        gl.viewport(0, 0, (glCanvas.width = game.width), (glCanvas.height = game.height))
        gl.clear(gl.COLOR_BUFFER_BIT)

        // set up the shader
        gl.useProgram(glShader)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, (this.glActiveTexture = this.createTexture()))

        // set vertex attributes
        let offset = (this.glAdditive = this.glBatchAdditive = 0)
        const initVertexAttribArray = (name: string, type: GLenum, typeSize: number, size: number) => {
            const location = gl.getAttribLocation(glShader, name)
            const stride = typeSize && INSTANCE_BYTE_STRIDE // only if not geometry
            const divisor = typeSize && 1 // only if not geometry
            const normalize = typeSize === 1 // only if color
            gl.enableVertexAttribArray(location)
            gl.vertexAttribPointer(location, size, type, normalize, stride, offset)
            gl.vertexAttribDivisor(location, divisor)
            offset += size * typeSize
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, glGeometryBuffer)
        initVertexAttribArray('g', gl.FLOAT, 0, 2) // geometry
        gl.bindBuffer(gl.ARRAY_BUFFER, glArrayBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, INSTANCE_BUFFER_SIZE, gl.DYNAMIC_DRAW)
        initVertexAttribArray('p', gl.FLOAT, 4, 4) // position & size
        initVertexAttribArray('u', gl.FLOAT, 4, 4) // texture coords
        initVertexAttribArray('c', gl.UNSIGNED_BYTE, 1, 4) // color
        initVertexAttribArray('a', gl.UNSIGNED_BYTE, 1, 4) // additiveColor
        initVertexAttribArray('r', gl.FLOAT, 4, 1) // rotation

        // build the transform matrix
        const s = vec2(scale * 2).divide(vec2(width, height))
        // const p = vec2(-1)

        gl.uniformMatrix4fv(
            gl.getUniformLocation(glShader, 'm'),
            false,
            // prettier-ignore
            new Float32Array([
                s.x, 0, 0, 0,
                0, -s.y, 0, 0,
                1, 1, 1, 1,
               -2, 0, 0, 0
            ])
        )
    }

    setTexture(texture: WebGLTexture) {
        // must flush cache with the old texture to set a new one
        if (texture == this.glActiveTexture) return
        const { gl } = this
        this.flush()
        gl.bindTexture(gl.TEXTURE_2D, (this.glActiveTexture = texture))
    }

    flush() {
        if (!this.glInstanceCount) return
        const { gl } = this
        const destBlend = this.glBatchAdditive ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA
        gl.blendFuncSeparate(gl.SRC_ALPHA, destBlend, gl.ONE, destBlend)
        gl.enable(gl.BLEND)
        // draw all the sprites in the batch and reset the buffer
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.glPositionData)
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.glInstanceCount)
        this.glInstanceCount = 0
        this.glBatchAdditive = this.glAdditive
    }

    // eslint-disable-next-line max-params
    draw(
        x: number,
        y: number,
        sizeX: number,
        sizeY: number,
        angle: number,
        uv0X: number,
        uv0Y: number,
        uv1X: number,
        uv1Y: number,
        rgba: number,
        rgbaAdditive = 0
    ) {
        // flush if there is not enough room or if different blend mode
        if (this.glInstanceCount >= MAX_INSTANCES - 1 || this.glBatchAdditive !== this.glAdditive) {
            this.flush()
        }

        let offset = this.glInstanceCount * INDICIES_PER_INSTANCE
        this.glPositionData[offset++] = x
        this.glPositionData[offset++] = y
        this.glPositionData[offset++] = sizeX
        this.glPositionData[offset++] = sizeY
        this.glPositionData[offset++] = uv0X
        this.glPositionData[offset++] = uv0Y
        this.glPositionData[offset++] = uv1X
        this.glPositionData[offset++] = uv1Y
        this.glColorData[offset++] = rgba
        this.glColorData[offset++] = rgbaAdditive
        this.glPositionData[offset++] = -angle
        this.glInstanceCount++
    }

    initPostProcess(shaderCode = 'void mainImage(out vec4 c,vec2 p){c=texture(iChannel0,p/iResolution.xy);}') {
        this.glPostShader = this.createProgram(
            `#version 300 es 
                precision highp float;
                in vec2 p; 
                void main(){ 
                    gl_Position=vec4(p+p-1.,1,1);
                }`,
            `#version 300 es
                precision highp float;
                uniform sampler2D iChannel0;
                uniform vec3 iResolution;
                uniform float iTime;
                out vec4 c;
                ${shaderCode}
                void main(){
                    mainImage(c,gl_FragCoord.xy);
                    c.a=1.;
                }`
        )
        this.game.canvas.style.visibility = 'hidden'
    }

    renderPostProcess() {
        if (!this.glPostShader) return

        const { game, gl, glPostShader, glGeometryBuffer, glPostTexture } = this
        const { ctx, canvas, glCanvas, time } = game
        const vertexByteStride = 8
        const pLocation = gl.getAttribLocation(glPostShader, 'p')
        const uniformLocation = (name: string) => gl.getUniformLocation(glPostShader, name)

        this.flush()
        // copy to the main canvas
        ctx.drawImage(glCanvas, 0, 0)

        // setup shader program to draw one triangle
        gl.useProgram(glPostShader)
        gl.bindBuffer(gl.ARRAY_BUFFER, glGeometryBuffer)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
        gl.disable(gl.BLEND)
        // set textures, pass in the 2d canvas and gl canvas in separate texture channels
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, glPostTexture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
        // set vertex position attribute
        gl.enableVertexAttribArray(pLocation)
        gl.vertexAttribPointer(pLocation, 2, gl.FLOAT, false, vertexByteStride, 0)
        // set uniforms and draw
        gl.uniform1i(uniformLocation('iChannel0'), 0)
        gl.uniform1f(uniformLocation('iTime'), time)
        gl.uniform3f(uniformLocation('iResolution'), canvas.width, canvas.height, 1)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
}
