import pkg from './package.json' assert { type: 'json' }
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import rollupNodePolyFill from 'rollup-plugin-node-polyfills'
import versionInjector from 'rollup-plugin-version-injector'

const external = ['howler', 'tmx-map-parser']
const commonPlugins = [versionInjector(), rollupNodePolyFill(), typescript({ tsconfig: './tsconfig.json' })]

export default [
    // browser-friendly UMD build
    {
        input: 'src/index.ts',
        external,
        output: {
            globals: {
                howler: 'howler',
                'tmx-map-parser': 'tmx-map-parser'
            },
            name: 'platfuse',
            file: pkg.browser,
            format: 'umd'
        },
        plugins: [...commonPlugins, commonjs()]
    },
    {
        input: 'src/index.ts',
        external,
        output: [
            { file: pkg.main, format: 'cjs' },
            { file: pkg.module, format: 'es' }
        ],
        plugins: commonPlugins
    }
]
