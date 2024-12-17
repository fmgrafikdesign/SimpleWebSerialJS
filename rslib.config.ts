import {defineConfig, type Syntax} from '@rslib/core';

// Oldest browsers that support the Web Serial API fully supported es2020 (Chrome 89, Opera 76)
const syntax: Syntax = 'es2020';

export default defineConfig({
    lib: [
        {
            format: 'umd',
            umdName: 'SimpleWebSerial',
            syntax,
            output: {
                filename: {
                    js: 'simple-web-serial.min.js',
                },
                minify: true,
                sourceMap: true,
            },
        },
        {
            format: 'esm',
            syntax,
            output: {
                filename: {
                    js: '[name].esm.mjs',
                },
            },
        },
        {
            format: 'cjs',
            syntax,
            output: {
                filename: {
                    js: '[name].cjs.js',
                },
            },
        },
    ],
    output: {
        target: 'web',
    },
});