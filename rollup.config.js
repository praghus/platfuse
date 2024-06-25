import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import rollupNodePolyFill from 'rollup-plugin-node-polyfills'
import pkg from './package.json' assert { type: 'json' }

const external = ['dat.gui', 'tmx-map-parser']

// const resolve = {
//     alias: {
//         buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6',
//         process: 'rollup-plugin-node-polyfills/polyfills/process-es6',
//         util: 'rollup-plugin-node-polyfills/polyfills/util',
//         sys: 'util',
//         events: 'rollup-plugin-node-polyfills/polyfills/events',
//         stream: 'rollup-plugin-node-polyfills/polyfills/stream',
//         path: 'rollup-plugin-node-polyfills/polyfills/path',
//         querystring: 'rollup-plugin-node-polyfills/polyfills/qs',
//         punycode: 'rollup-plugin-node-polyfills/polyfills/punycode',
//         url: 'rollup-plugin-node-polyfills/polyfills/url',
//         string_decoder: 'rollup-plugin-node-polyfills/polyfills/string-decoder',
//         http: 'rollup-plugin-node-polyfills/polyfills/http',
//         https: 'rollup-plugin-node-polyfills/polyfills/http',
//         os: 'rollup-plugin-node-polyfills/polyfills/os',
//         assert: 'rollup-plugin-node-polyfills/polyfills/assert',
//         constants: 'rollup-plugin-node-polyfills/polyfills/constants',
//         _stream_duplex: 'rollup-plugin-node-polyfills/polyfills/readable-stream/duplex',
//         _stream_passthrough: 'rollup-plugin-node-polyfills/polyfills/readable-stream/passthrough',
//         _stream_readable: 'rollup-plugin-node-polyfills/polyfills/readable-stream/readable',
//         _stream_writable: 'rollup-plugin-node-polyfills/polyfills/readable-stream/writable',
//         _stream_transform: 'rollup-plugin-node-polyfills/polyfills/readable-stream/transform',
//         timers: 'rollup-plugin-node-polyfills/polyfills/timers',
//         console: 'rollup-plugin-node-polyfills/polyfills/console',
//         vm: 'rollup-plugin-node-polyfills/polyfills/vm',
//         zlib: 'rollup-plugin-node-polyfills/polyfills/zlib',
//         tty: 'rollup-plugin-node-polyfills/polyfills/tty',
//         domain: 'rollup-plugin-node-polyfills/polyfills/domain'
//     }
// }

export default [
    // browser-friendly UMD build
    {
        input: 'src/index.ts',
        external,
        output: {
            globals: {
                'dat.gui': 'dat.gui',
                'tmx-map-parser': 'tmx-map-parser'
            },
            name: 'platfuse',
            file: pkg.browser,
            format: 'umd'
        },
        plugins: [ rollupNodePolyFill(), commonjs(), typescript({ tsconfig: './tsconfig.json' })]
    },
    {
        input: 'src/index.ts',
        external,
        output: [
            { file: pkg.main, format: 'cjs' },
            { file: pkg.module, format: 'es' }
        ],
        plugins: [ rollupNodePolyFill(), typescript({ tsconfig: './tsconfig.json' })]
    }
]
