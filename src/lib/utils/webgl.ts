import { Game } from '../engine-objects/game'
import { vec2, Vector } from '../engine-helpers/vector'

const INDICIES_PER_INSTANCE = 11,
    MAX_INSTANCES = 1e4,
    INSTANCE_BYTE_STRIDE = INDICIES_PER_INSTANCE * 4,
    INSTANCE_BUFFER_SIZE = MAX_INSTANCES * INSTANCE_BYTE_STRIDE

let mainCanvas: HTMLCanvasElement,
    mainContext: CanvasRenderingContext2D,
    mainCanvasSize: Vector,
    glCanvas: HTMLCanvasElement,
    gl: WebGL2RenderingContext,
    glShader: WebGLProgram,
    glActiveTexture: WebGLTexture,
    glArrayBuffer: WebGLBuffer,
    glGeometryBuffer: WebGLBuffer,
    glPositionData: Float32Array,
    glColorData: Uint32Array,
    glInstanceCount: number,
    glAdditive: number,
    glBatchAdditive: number

function glInit(game: Game) {
    glCanvas = game.glCanvas
    gl = glCanvas.getContext('webgl2') as WebGL2RenderingContext

    mainCanvas = game.canvas
    mainContext = game.ctx
    mainCanvasSize = vec2(mainCanvas.width, mainCanvas.height)

    // glCanvas.setAttribute('style', 'background-color:#000000')
    document.body.appendChild(glCanvas)

    // setup vertex and fragment shaders
    glShader = glCreateProgram(
        '#version 300 es\n' + // specify GLSL ES version
            'precision highp float;' + // use highp for better accuracy
            'uniform mat4 m;' + // transform matrix
            'in vec2 g;' + // geometry
            'in vec4 p,u,c,a;' + // position/size, uvs, color, additiveColor
            'in float r;' + // rotation
            'out vec2 v;' + // return uv, color, additiveColor
            'out vec4 d,e;' + // return uv, color, additiveColor
            'void main(){' + // shader entry point
            'vec2 s=(g-.5)*p.zw;' + // get size offset
            'gl_Position=m*vec4(p.xy+s*cos(r)-vec2(-s.y,s)*sin(r),1,1);' + // transform position
            'v=mix(u.xw,u.zy,g);' + // pass uv to fragment shader
            'd=c;e=a;' + // pass colors to fragment shader
            '}', // end of shader
        '#version 300 es\n' + // specify GLSL ES version
            'precision highp float;' + // use highp for better accuracy
            'in vec2 v;' + // uv
            'in vec4 d,e;' + // color, additiveColor
            'uniform sampler2D s;' + // texture
            'out vec4 c;' + // out color
            'void main(){' + // shader entry point
            'c=texture(s,v)*d+e;' + // modulate texture by color plus additive
            '}' // end of shader
    ) as WebGLProgram

    // init buffers
    const glInstanceData = new ArrayBuffer(INSTANCE_BUFFER_SIZE)
    glPositionData = new Float32Array(glInstanceData)
    glColorData = new Uint32Array(glInstanceData)
    glArrayBuffer = gl.createBuffer() as WebGLBuffer
    glGeometryBuffer = gl.createBuffer() as WebGLBuffer

    // create the geometry buffer, triangle strip square
    const geometry = new Float32Array([(glInstanceCount = 0), 0, 1, 0, 0, 1, 1, 1])
    gl.bindBuffer(gl.ARRAY_BUFFER, glGeometryBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW)
    console.info('WebGL initialized')
}

function glPreRender(game: Game) {
    const scale = game.currentScene?.camera.scale || 1
    // clear and set to same size as main canvas
    glCanvas.style.width = game.canvas.style.width
    glCanvas.style.height = game.canvas.style.height
    gl.viewport(0, 0, (glCanvas.width = game.width), (glCanvas.height = game.height))
    gl.clear(gl.COLOR_BUFFER_BIT)

    // set up the shader
    gl.useProgram(glShader)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, (glActiveTexture = glCreateTexture()))

    // set vertex attributes
    let offset = (glAdditive = glBatchAdditive = 0)
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
    const s = vec2(scale * 2).divide(mainCanvasSize)
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

function glSetTexture(texture: WebGLTexture) {
    // must flush cache with the old texture to set a new one
    if (texture == glActiveTexture) return
    glFlush()
    gl.bindTexture(gl.TEXTURE_2D, (glActiveTexture = texture))
}

function glCompileShader(source: string, type: GLenum) {
    // build the shader
    const shader = gl.createShader(type) as WebGLShader
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    return shader
}

function glCreateProgram(vsSource: string, fsSource: string) {
    const program = gl.createProgram() as WebGLProgram
    gl.attachShader(program, glCompileShader(vsSource, gl.VERTEX_SHADER))
    gl.attachShader(program, glCompileShader(fsSource, gl.FRAGMENT_SHADER))
    gl.linkProgram(program)

    return program
}

function glCreateTexture(image?: TexImageSource) {
    // build the texture
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    if (image) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    } else {
        // create a 1x1 pixel texture if no image is provided
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 255, 255, 255]))
    }

    // use point filtering for pixelated rendering
    const filter = gl.NEAREST //canvasPixelated ? gl.NEAREST : gl.LINEAR
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    return texture as WebGLTexture
}

function glFlush() {
    if (!glInstanceCount) return

    const destBlend = glBatchAdditive ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA
    gl.blendFuncSeparate(gl.SRC_ALPHA, destBlend, gl.ONE, destBlend)
    gl.enable(gl.BLEND)

    // draw all the sprites in the batch and reset the buffer
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, glPositionData)
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, glInstanceCount)
    glInstanceCount = 0
    glBatchAdditive = glAdditive
}

// eslint-disable-next-line max-params
function glDraw(
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
    if (glInstanceCount >= MAX_INSTANCES - 1 || glBatchAdditive != glAdditive) glFlush()

    let offset = glInstanceCount * INDICIES_PER_INSTANCE
    glPositionData[offset++] = x
    glPositionData[offset++] = y
    glPositionData[offset++] = sizeX
    glPositionData[offset++] = sizeY
    glPositionData[offset++] = uv0X
    glPositionData[offset++] = uv0Y
    glPositionData[offset++] = uv1X
    glPositionData[offset++] = uv1Y
    glColorData[offset++] = rgba
    glColorData[offset++] = rgbaAdditive
    glPositionData[offset++] = -angle
    glInstanceCount++
}

function glCopyToContext(context: CanvasRenderingContext2D, forceDraw?: boolean) {
    if (!glInstanceCount && !forceDraw) return
    glFlush()
    // do not draw in overlay mode because the canvas is visible
    if (forceDraw) context.drawImage(glCanvas, 0, 0)
}

// Post processing
// ------------------------------------------------------------------------------------------
let glPostShader: WebGLProgram,
    // glPostArrayBuffer: WebGLBuffer,
    glPostTexture: WebGLTexture

function glInitPostProcess(shaderCode?: string) {
    if (!shaderCode)
        // default shader pass through
        shaderCode = 'void mainImage(out vec4 c,vec2 p){c=texture(iChannel0,p/iResolution.xy);}'

    // create the shader
    glPostShader = glCreateProgram(
        '#version 300 es\n' + // specify GLSL ES version
            'precision highp float;' + // use highp for better accuracy
            'in vec2 p;' + // position
            'void main(){' + // shader entry point
            'gl_Position=vec4(p+p-1.,1,1);' + // set position
            '}', // end of shader
        '#version 300 es\n' + // specify GLSL ES version
            'precision highp float;' + // use highp for better accuracy
            'uniform sampler2D iChannel0;' + // input texture
            'uniform vec3 iResolution;' + // size of output texture
            'uniform float iTime;' + // time
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
    // glPostArrayBuffer = gl.createBuffer() as WebGLBuffer
    glPostTexture = glCreateTexture(undefined) as WebGLTexture

    // hide the original 2d canvas
    mainCanvas.style.visibility = 'hidden'
}

function glRenderPostProcess(time: number) {
    if (!glPostShader) return

    // prepare to render post process shader
    // if (glEnable) {
    glFlush() // clear out the buffer
    mainContext.drawImage(glCanvas, 0, 0) // copy to the main canvas
    // } else {
    //     // set the viewport
    //     gl.viewport(0, 0, (glCanvas.width = mainCanvas.width), (glCanvas.height = mainCanvas.height))
    // }

    // setup shader program to draw one triangle
    gl.useProgram(glPostShader)
    gl.bindBuffer(gl.ARRAY_BUFFER, glGeometryBuffer)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    gl.disable(gl.BLEND)

    // set textures, pass in the 2d canvas and gl canvas in separate texture channels
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, glPostTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mainCanvas)

    // set vertex position attribute
    const vertexByteStride = 8
    const pLocation = gl.getAttribLocation(glPostShader, 'p')
    gl.enableVertexAttribArray(pLocation)
    gl.vertexAttribPointer(pLocation, 2, gl.FLOAT, false, vertexByteStride, 0)

    // set uniforms and draw
    const uniformLocation = (name: string) => gl.getUniformLocation(glPostShader, name)
    gl.uniform1i(uniformLocation('iChannel0'), 0)
    gl.uniform1f(uniformLocation('iTime'), time)
    gl.uniform3f(uniformLocation('iResolution'), mainCanvas.width, mainCanvas.height, 1)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}

export {
    glInit,
    glPreRender,
    glCreateTexture,
    glSetTexture,
    glDraw,
    glFlush,
    glCopyToContext,
    glInitPostProcess,
    glRenderPostProcess
}
