#! /usr/bin/env node

const program = require('commander')
const generateDiagram = require('./src/generator').generateDiagram

program
  .usage('[options] <file or root folder>\n\nGenerates UML diagrams from Solidity source code')
  .option('-v, --verbose', 'With debugging statements')
  .option('-o, --output [value]', 'File outputs: svg, png or both', 'svg')
  .parse(process.argv)

if (program.verbose) {
  process.env.DEBUG = 'solidity-diagram-gen'
}

if(program.args.length === 0) {

  generateDiagram( process.cwd(), program.output )
}
else {

  generateDiagram( program.args[0], program.output )
}



