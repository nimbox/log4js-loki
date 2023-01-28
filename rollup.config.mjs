import typescript from 'rollup-plugin-typescript2';

export default {

    input: 'src/index.ts',

    output: [{
        file: './dist/index.js',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
    }, {
        file: 'dist/index.mjs',
        format: 'esm',
        exports: 'named',
        sourcemap: true
    }],

    external: [
        'axios'
    ],

    plugins: [
        typescript()
    ]

};