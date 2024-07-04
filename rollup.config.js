import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import rollupNodePolyFill from 'rollup-plugin-node-polyfills'
import pkg from './package.json' assert { type: 'json' }

const external = ['howler', 'tmx-map-parser']

export default [
    // browser-friendly UMD build
    {
        input: 'src/index.ts',
        external,
        output: {
            globals: {
                'howler': 'howler',
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
