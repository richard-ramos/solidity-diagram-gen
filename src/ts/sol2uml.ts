#! /usr/bin/env node

import EtherscanParser from './etherscanParser'
import { parseUmlClassesFromFiles } from './fileParser'
import { UmlClass} from './umlClass'

const debug = require('debug')('sol2uml')

const program = require('commander')

program
  .usage(`<fileFolderAddress> [options]

Generates UML diagrams from Solidity source code.
If no file, folder or address is passes as the first argument, the working folder is used.
When a folder is used, all *.sol files are found in that folder and all sub folders.
If an Ethereum address with a 0x prefix is passed, the verified source code from Etherscan will be used.`)
  .option('-v, --verbose', 'With debugging statements')
  .option('-f, --outputFormat [value]', 'Output file format: svg, png, dot or all', 'svg')
  .option('-n, --outputFileName [value]', 'Output file name')
  .option('-c, --clusterFolders', 'Cluster contracts into source folders')
  .parse(process.argv)

if (program.verbose) {
  process.env.DEBUG = 'sol2uml'
}

// This function needs to be loaded after the DEBUG env variable has been set
import { convertUmlClasses } from './converter'

async function sol2uml() {

  let fileFolderAddress: string
  if(program.args.length === 0) {
    fileFolderAddress = process.cwd()
  }
  else {
    fileFolderAddress = program.args[0]
  }

  let umlClasses: UmlClass[]
  if (fileFolderAddress.match(/^0x([A-Fa-f0-9]{40})$/)) {
    debug(`argument ${fileFolderAddress} is an Ethereum address so checking Etherscan for the verified source code`)
    // TODO move api key as an option
    const etherscanParser = new EtherscanParser('ZAD4UI2RCXCQTP38EXS3UY2MPHFU5H9KB1')
    umlClasses = await etherscanParser.getUmlClasses(fileFolderAddress)
  }
  else {
    umlClasses = await parseUmlClassesFromFiles([fileFolderAddress])
  }

  convertUmlClasses(umlClasses, fileFolderAddress, program.outputFormat, program.outputFileName, program.clusterFolders).then(() => {
    debug(`Finished`)
  })
}

sol2uml()
