#! /usr/bin/env node

const debug = require('debug')('sol2uml')

const program = require('commander')

program
  .usage('[options] <file or root folder>\n\nGenerates UML diagrams from Solidity source code')
  .option('-v, --verbose', 'With debugging statements')
  .option('-f, --outputFormat [value]', 'Output file format: svg, png, dot or all', 'svg')
  .option('-n, --outputFileName [value]', 'Output file name')
  .option('-c, --clusterFolders', 'Cluster contracts into source folders')
  .parse(process.argv)

if (program.verbose) {
  process.env.DEBUG = 'sol2uml'
}

// This function needs to be loaded after the DEBUG env variable has been set
import { convert } from './converter'

let fileOrFolder: string
if(program.args.length === 0) {
  fileOrFolder = process.cwd()
}
else {
  fileOrFolder = program.args[0]
}

convert(fileOrFolder, program.outputFormat, program.outputFileName, program.clusterFolders).then(() => {
  debug(`Finished`)
})
