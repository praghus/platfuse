import { Game } from '../game'
import { Scene } from '../scene'
import { Vector, clamp } from './math'

const gl_ONE = 1,
    gl_TRIANGLE_STRIP = 5,
    gl_SRC_ALPHA = 770,
    gl_ONE_MINUS_SRC_ALPHA = 771,
    gl_BLEND = 3042,
    gl_TEXTURE_2D = 3553,
    gl_UNSIGNED_BYTE = 5121,
    gl_FLOAT = 5126,
    gl_RGBA = 6408,
    gl_NEAREST = 9728,
    // gl_LINEAR = 9729,
    gl_TEXTURE_MAG_FILTER = 10240,
    gl_TEXTURE_MIN_FILTER = 10241,
    gl_TEXTURE_WRAP_S = 10242,
    gl_TEXTURE_WRAP_T = 10243,
    gl_COLOR_BUFFER_BIT = 16384,
    gl_CLAMP_TO_EDGE = 33071,
    gl_TEXTURE0 = 33984,
    gl_ARRAY_BUFFER = 34962,
    gl_STATIC_DRAW = 35044,
    gl_DYNAMIC_DRAW = 35048,
    gl_FRAGMENT_SHADER = 35632,
    gl_VERTEX_SHADER = 35633,
    // gl_COMPILE_STATUS = 35713,
    // gl_LINK_STATUS = 35714,
    gl_UNPACK_FLIP_Y_WEBGL = 37440,
    // constants for batch rendering
    gl_INDICIES_PER_VERT = 6,
    gl_MAX_BATCH = 1e5,
    gl_VERTEX_BYTE_STRIDE = 4 * 2 * 2 + 4 * 2, // vec2 * 2 + (char * 4) * 2
    gl_VERTEX_BUFFER_SIZE = gl_MAX_BATCH * gl_VERTEX_BYTE_STRIDE

let mainCanvas: HTMLCanvasElement
let mainContext: CanvasRenderingContext2D

let glCanvas: HTMLCanvasElement
let glContext: WebGLRenderingContext

let glActiveTexture: WebGLTexture,
    glShader: WebGLProgram | null,
    glArrayBuffer: WebGLBuffer | null,
    glPositionData: Float32Array = new Float32Array(),
    glColorData: Uint32Array = new Uint32Array(),
    glBatchCount: number,
    glBatchAdditive: number,
    glAdditive: number,
    glPostShader: WebGLProgram | null,
    glPostArrayBuffer: WebGLBuffer | null,
    glPostTexture: WebGLTexture | null

export function glInit(game: Game) {
    glCanvas = document.createElement('canvas')
    glContext = glCanvas.getContext('webgl2') as WebGLRenderingContext

    mainCanvas = game.canvas
    mainContext = game.ctx

    // glCanvas.setAttribute('style', 'background-color:#ffffff')
    // document.body.appendChild(glCanvas)

    glShader = glCreateProgram(
        '#version 300 es\n' + // specify GLSL ES version
            'precision highp float;' + // use highp for better accuracy
            'uniform mat4 m;' + // transform matrix
            'in vec4 p,c,a;' + // position, uv, color, additiveColor
            'out vec4 v,d,e;' + // return uv, color, additiveColor
            'void main(){' + // shader entry point
            'gl_Position=m*vec4(p.xy,1,1);' + // transform position
            'v=p;d=c;e=a;' + // pass stuff to fragment shader
            '}', // end of shader
        '#version 300 es\n' + // specify GLSL ES version
            'precision highp float;' + // use highp for better accuracy
            'in vec4 v,d,e;' + // position, uv, color, additiveColor
            'uniform sampler2D s;' + // texture
            'out vec4 c;' + // out color
            'void main(){' + // shader entry point
            'c=texture(s,v.zw)*d+e;' + // modulate texture by color plus additive
            '}' // end of shader
    )

    // init buffers
    const vertexData = new ArrayBuffer(gl_VERTEX_BUFFER_SIZE)
    glArrayBuffer = glContext.createBuffer()
    glPositionData = new Float32Array(vertexData)
    glColorData = new Uint32Array(vertexData)
    glBatchCount = 0
    // document.body.appendChild(glCanvas)
    console.info('WebGL initialized')
}

export function glPreRender(scene: Scene) {
    const camera = scene.camera

    // clear and set to same size as main canvas
    glContext.viewport(0, 0, (glCanvas.width = mainCanvas.width), (glCanvas.height = mainCanvas.height))
    glContext.clear(gl_COLOR_BUFFER_BIT)

    // set up the shader
    glContext.useProgram(glShader)
    glContext.activeTexture(gl_TEXTURE0)

    // @todo: dodac tekstury ------------------------------------------------------------------------------------------
    // glContext.bindTexture(gl_TEXTURE_2D, (glActiveTexture = textureInfos[0].glTexture))
    // ----------------------------------------------------------------------------------------------------------------

    glContext.bindBuffer(gl_ARRAY_BUFFER, glArrayBuffer)
    glContext.bufferData(gl_ARRAY_BUFFER, gl_VERTEX_BUFFER_SIZE, gl_DYNAMIC_DRAW)
    glAdditive = 0

    // set vertex attributes
    let offset = 0
    const initVertexAttribArray = (name: string, type: number, typeSize: number, size: number, normalize = false) => {
        if (glShader) {
            const location = glContext.getAttribLocation(glShader, name)
            glContext.enableVertexAttribArray(location)
            glContext.vertexAttribPointer(location, size, type, normalize, gl_VERTEX_BYTE_STRIDE, offset)
            offset += size * typeSize
        }
    }
    initVertexAttribArray('p', gl_FLOAT, 4, 4) // position & texture coords
    initVertexAttribArray('c', gl_UNSIGNED_BYTE, 1, 4, false) // color
    initVertexAttribArray('a', gl_UNSIGNED_BYTE, 1, 4, false) // additiveColor

    // build the transform matrix
    // const sx = (2 * cameraScale) / mainCanvas.width
    // const sy = (2 * cameraScale) / mainCanvas.height
    // const cx = -1 - sx * cameraPos.x
    // const cy = -1 - sy * cameraPos.y

    const sx = (2 * 32) / mainCanvas.width
    const sy = (2 * 20) / mainCanvas.height
    const cx = -1 - sx * -camera.pos.x
    const cy = -1 - sy * -camera.pos.y

    if (glShader) {
        glContext.uniformMatrix4fv(
            glContext.getUniformLocation(glShader, 'm'),
            false,
            new Float32Array([sx, 0, 0, 0, 0, sy, 0, 0, 1, 1, -1, 1, cx, cy, 0, 0])
        )
    }
}

export function glSetTexture(texture: WebGLTexture) {
    // must flush cache with the old texture to set a new one
    if (texture == glActiveTexture) return
    glFlush()
    glContext.bindTexture(gl_TEXTURE_2D, (glActiveTexture = texture))
}

function glCompileShader(source: string, type: GLenum) {
    const shader = glContext.createShader(type)
    if (shader) {
        glContext.shaderSource(shader, source)
        glContext.compileShader(shader)
    }
    return shader
}

function glCreateProgram(vsSource: string, fsSource: string) {
    const program = glContext.createProgram()
    if (program) {
        glContext.attachShader(program, glCompileShader(vsSource, gl_VERTEX_SHADER) as WebGLShader)
        glContext.attachShader(program, glCompileShader(fsSource, gl_FRAGMENT_SHADER) as WebGLShader)
        glContext.linkProgram(program)
    }
    return program
}

export function glCreateTexture(image?: TexImageSource) {
    // build the texture
    const texture = glContext.createTexture()
    glContext.bindTexture(gl_TEXTURE_2D, texture)
    if (image) glContext.texImage2D(gl_TEXTURE_2D, 0, gl_RGBA, gl_RGBA, gl_UNSIGNED_BYTE, image)

    // use point filtering for pixelated rendering
    const filter = gl_NEAREST //canvasPixelated ? gl_NEAREST : gl_LINEAR
    glContext.texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MIN_FILTER, filter)
    glContext.texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MAG_FILTER, filter)
    glContext.texParameteri(gl_TEXTURE_2D, gl_TEXTURE_WRAP_S, gl_CLAMP_TO_EDGE)
    glContext.texParameteri(gl_TEXTURE_2D, gl_TEXTURE_WRAP_T, gl_CLAMP_TO_EDGE)
    return texture
}

function glFlush() {
    if (!glBatchCount) return

    const destBlend = glBatchAdditive ? gl_ONE : gl_ONE_MINUS_SRC_ALPHA
    glContext.blendFuncSeparate(gl_SRC_ALPHA, destBlend, gl_ONE, destBlend)
    glContext.enable(gl_BLEND)

    // draw all the sprites in the batch and reset the buffer
    glContext.bufferSubData(gl_ARRAY_BUFFER, 0, glPositionData.subarray(0, glBatchCount * gl_INDICIES_PER_VERT))
    glContext.drawArrays(gl_TRIANGLE_STRIP, 0, glBatchCount)
    glBatchCount = 0
    glBatchAdditive = glAdditive
}

export function glCopyToContext(context: CanvasRenderingContext2D, forceDraw?: boolean) {
    if (!glBatchCount && !forceDraw) return
    glFlush()
    if (forceDraw) context.drawImage(glCanvas, 0, 0)
}

// eslint-disable-next-line max-params
export function glDraw(
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
    const vertCount = 6
    if (glBatchCount >= gl_MAX_BATCH - vertCount || glBatchAdditive != glAdditive) glFlush()

    const c = Math.cos(angle) / 2,
        s = Math.sin(angle) / 2
    const cx = c * sizeX,
        cy = c * sizeY,
        sx = s * sizeX,
        sy = s * sizeY

    const positionData = [
        x - cx + sy,
        y + cy + sx,
        uv0X,
        uv0Y,
        x - cx - sy,
        y - cy + sx,
        uv0X,
        uv1Y,
        x + cx + sy,
        y + cy - sx,
        uv1X,
        uv0Y,
        x + cx - sy,
        y - cy - sx,
        uv1X,
        uv1Y
    ]

    // setup 2 triangle strip quad
    // eslint-disable-next-line space-in-parens
    for (let i = vertCount, offset = glBatchCount * gl_INDICIES_PER_VERT; i--; ) {
        let j = clamp(i - 1, 0, 3) * 4 // degenerate tri at ends
        glPositionData[offset++] = positionData[j++]
        glPositionData[offset++] = positionData[j++]
        glPositionData[offset++] = positionData[j++]
        glPositionData[offset++] = positionData[j++]
        glColorData[offset++] = rgba
        glColorData[offset++] = rgbaAdditive
    }

    glBatchCount += vertCount
}

export function glDrawPoints(points: Vector[], rgba: number) {
    // flush if there is not enough room or if different blend mode
    const vertCount = points.length + 2
    if (glBatchCount >= gl_MAX_BATCH - vertCount || glBatchAdditive != glAdditive) glFlush()

    // setup triangle strip from list of points
    // eslint-disable-next-line space-in-parens
    for (let i = vertCount, offset = glBatchCount * gl_INDICIES_PER_VERT; i--; ) {
        const j = clamp(i - 1, 0, vertCount - 3) // degenerate tri at ends
        const h = j >> 1
        const point = points[j % 2 ? h : vertCount - 3 - h]
        glPositionData[offset++] = point.x
        glPositionData[offset++] = point.y
        glPositionData[offset++] = 0 // uvx
        glPositionData[offset++] = 0 // uvy
        glColorData[offset++] = 0 // nothing to tint
        glColorData[offset++] = rgba // apply rgba via additive
    }
    glBatchCount += vertCount
}

export function glInitPostProcess(shaderCode: string) {
    if (!shaderCode)
        // default shader pass through
        shaderCode = 'void mainImage(out vec4 c,vec2 p){c=texture(iChannel0,p/iResolution.xy);}'

    // create the shader
    glPostShader = glCreateProgram(
        '#version 300 es\n' + // specify GLSL ES version
            'precision highp float;' + // use highp for better accuracy
            'in vec2 p;' + // position
            'void main(){' + // shader entry point
            'gl_Position=vec4(p,1,1);' + // set position
            '}', // end of shader
        '#version 300 es\n' + // specify GLSL ES version
            'precision highp float;' + // use highp for better accuracy
            'uniform sampler2D iChannel0;' + // input texture
            'uniform vec3 iResolution;' + // size of output texture
            'uniform float iTime;' + // time passed
            'out vec4 c;' + // out color
            '\n' +
            shaderCode +
            '\n' + // insert custom shader code
            'void main(){' + // shader entry point
            'mainImage(c,gl_FragCoord.xy);' + // call post process function
            'c.a=1.;' + // always use full alpha
            '}' // end of shader
    )

    // create buffer and texture
    glPostArrayBuffer = glContext.createBuffer()
    glPostTexture = glCreateTexture()
    // glPostIncludeOverlay = includeOverlay

    // hide the original 2d canvas
    mainCanvas.style.visibility = 'hidden'
}

// Post processing
// ------------------------------------------------------------------------------------------
export function glRenderPostProcess(time: number) {
    glFlush()
    mainContext.drawImage(glCanvas, 0, 0) // copy to the main canvas

    // set textures, pass in the 2d canvas and gl canvas in separate texture channels
    if (glPostTexture) {
        glContext.activeTexture(gl_TEXTURE0)
        glContext.bindTexture(gl_TEXTURE_2D, glPostTexture)
        glContext.texImage2D(gl_TEXTURE_2D, 0, gl_RGBA, gl_RGBA, gl_UNSIGNED_BYTE, mainCanvas)
    }

    if (glPostShader) {
        // setup shader program to draw one triangle
        glContext.useProgram(glPostShader)
        glContext.disable(gl_BLEND)
        glContext.bindBuffer(gl_ARRAY_BUFFER, glPostArrayBuffer)
        glContext.bufferData(gl_ARRAY_BUFFER, new Float32Array([-3, 1, 1, -3, 1, 1]), gl_STATIC_DRAW)
        glContext.pixelStorei(gl_UNPACK_FLIP_Y_WEBGL, true)

        // set vertex position attribute
        const vertexByteStride = 8
        const pLocation = glContext.getAttribLocation(glPostShader, 'p')
        glContext.enableVertexAttribArray(pLocation)
        glContext.vertexAttribPointer(pLocation, 2, gl_FLOAT, false, vertexByteStride, 0)

        // set uniforms and draw
        const uniformLocation = (name: string) => glPostShader && glContext.getUniformLocation(glPostShader, name)
        glContext.uniform1i(uniformLocation('iChannel0'), 0)
        glContext.uniform1f(uniformLocation('iTime'), time)
        glContext.uniform3f(uniformLocation('iResolution'), mainCanvas.width, mainCanvas.height, 1)
        glContext.drawArrays(gl_TRIANGLE_STRIP, 0, 3)
    }
}
