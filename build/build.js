const rollup = require('rollup')
const buble = require('rollup-plugin-buble')
const uglify = require('uglify-js')
const gzipSize = require('gzip-size')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const pkg = require('../package.json')
const cwd = process.cwd()
const ENV_RE = /process\.env\.ENV/g
const jsDocRegExp = /\/\*\*([\w\W]*?)\*\//g

const comment = `/**
 * ${pkg.name} v${pkg.version}
 * Copyright 2018-2019 Ranjay
 * Released under the MIT License
 * ${pkg.homepage}
 */\r\n`

const options = {
  format: 'iife',
  name: pkg.name.replace(/-(\w)/g, (match, $1) => $1.toLocaleUpperCase())
}

async function build() {
  const bundle = await rollup.rollup({
    input: path.join(cwd, pkg.main),
    plugins: [
      buble()
    ]
  })

  const data = await bundle.generate(options)
  let code = data.output[0].code
  // remove jsdoc
  code = code.replace(jsDocRegExp, '')

  code = fs.readFileSync(path.join(cwd, 'build/wrapper.js')).toString().replace('INSERT', code.split('\n').slice(1, -3).join('\n')).replace("'use strict'", '"use strict"')
  const developmentCode = comment + code.replace(ENV_RE, '"development"')
  const productionCode = comment + uglify.minify(code.replace(ENV_RE, '"production"')).code

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

build()