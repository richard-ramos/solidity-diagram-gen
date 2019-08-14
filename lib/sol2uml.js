#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require('debug')('sol2uml');
const program = require('commander');
program
    .usage('[options] <file or root folder>\n\nGenerates UML diagrams from Solidity source code')
    .option('-v, --verbose', 'With debugging statements')
    .option('-f, --outputFormat [value]', 'Output file format: svg, png, dot or all', 'svg')
    .option('-n, --outputFileName [value]', 'Output file name')
    .option('-c, --clusterFolders', 'Cluster contracts into source folders')
    .parse(process.argv);
if (program.verbose) {
    process.env.DEBUG = 'sol2uml';
}
// This function needs to be loaded after the DEBUG env variable has been set
const converter_1 = require("./converter");
let fileOrFolder;
if (program.args.length === 0) {
    fileOrFolder = process.cwd();
}
else {
    fileOrFolder = program.args[0];
}
converter_1.convert(fileOrFolder, program.outputFormat, program.outputFileName, program.clusterFolders).then(() => {
    debug(`Finished`);
});
//# sourceMappingURL=sol2uml.js.map