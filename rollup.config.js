import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import pkg from './package.json'

export default [
    // browser-friendly UMD build
    {
        input: 'src/index.ts',
        external: ['dat.gui', 'howler'],
        output: {
            globals: {
                'dat.gui': 'dat.gui',
                howler: 'howler',
                sat: 'sat'
            },
            name: 'platfuse',
            file: pkg.browser,
            format: 'umd'
        },
        plugins: [nodeResolve(), commonjs(), typescript({ tsconfig: './tsconfig.json' })]
    },
    {
        input: 'src/index.ts',
        external: ['dat.gui', 'howler', 'sat'],
        output: [
            { file: pkg.main, format: 'cjs' },
            { file: pkg.module, format: 'es' }
        ],
        plugins: [nodeResolve(), typescript({ tsconfig: './tsconfig.json' })]
    }
]
