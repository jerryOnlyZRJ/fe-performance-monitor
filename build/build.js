const rollup = require('rollup')
// 编译ES6
const babel = require('rollup-plugin-babel')
// 将编译过的代码转化为ES6 Module的格式，解决`'default' is not exported`问题
const commonjs = require('rollup-plugin-commonjs')
// 打包通过npm安装的依赖
// 特别注意，不需要打包的依赖一定要在inputOptions中添加external和ouputOptions中的globals
const resolve = require('rollup-plugin-node-resolve')
const uglify = require('uglify-js')
const gzipSize = require('gzip-size')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const pkg = require('../package.json')
const cwd = process.cwd()
const ENV_RE = /process\.env\.ENV/g
const jsDocRegExp = /\/\*\*([\w\W]*?)\*\//g
// iife or umd
const argv = require('yargs-parser')(process.argv.slice(2))
const outputFormat = argv.format || 'iife'

const comment = `/**
 * ${pkg.name} v${pkg.version}
 * Copyright 2018-2019 ${pkg.author}
 * Released under the ${pkg.license} License
 * ${pkg.homepage}
 */\r\n`

const options = {
    format: outputFormat,
    name: pkg.name.replace(/-(\w)/g, (match, $1) => $1.toLocaleUpperCase())
}

function generateDistFiles(developmentCode, productionCode) {
    if (!fs.existsSync(path.join(cwd, 'dist'))) {
        fs.mkdirSync(path.join(cwd, 'dist'))
    }
    fs.writeFileSync(path.join(cwd, `dist/${pkg.name}.js`), developmentCode)
    fs.writeFileSync(path.join(cwd, `dist/${pkg.name}.min.js`), productionCode)

    console.log(chalk.cyan.bold('File size:'))
    console.log(chalk.green(`${pkg.name} development -> `) + chalk.bold(developmentCode.length / 1000 + 'kb'))
    console.log(chalk.green(`${pkg.name} production -> `) + chalk.bold(productionCode.length / 1000 + 'kb'))
    console.log(chalk.cyan.bold('File size after gzip:'))
    console.log(chalk.green(`${pkg.name} development (gzipped) -> `) + chalk.bold(gzipSize.sync(developmentCode) / 1000 + 'kb'))
    console.log(chalk.green(`${pkg.name} production (gzipped) -> `) + chalk.bold(gzipSize.sync(productionCode) / 1000 + 'kb'))
}

async function build() {
    const bundle = await rollup.rollup({
        input: outputFormat === 'iife' ? path.join(cwd, pkg.main) : path.join(cwd, 'build/umd-wrapper.js'),
        plugins: [
            babel({
                exclude: /node_modules/
            }),
            commonjs(),
            resolve()
        ]
    })

    const data = await bundle.generate(options)
    let code = data.output[0].code
    // remove jsdoc
    code = code.replace(jsDocRegExp, '')

    if (outputFormat === 'iife') {
        code = fs.readFileSync(path.join(cwd, 'build/iife-wrapper.js')).toString().replace('INSERT', code.split('\n').slice(1, -3).join('\n')).replace("'use strict'", '"use strict"')
    }
    const developmentCode = comment + code.replace(ENV_RE, '"development"')
    const productionCode = comment + uglify.minify(code.replace(ENV_RE, '"production"')).code

    generateDistFiles(developmentCode, productionCode)
}

build()