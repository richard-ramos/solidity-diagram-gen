#!/usr/bin/env node

var command = require('../command.js');


let arguments = process.argv.slice(2);

let filepath;

if(arguments.length == 0){
    filepath = process.cwd();    
} else {
    filepath = arguments[0];
}

command.generateDiagram(filepath);


