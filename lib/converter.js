"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require('debug')('sol2uml');
const fs_1 = require("fs");
const umlClass_1 = require("./umlClass");
const verror_1 = require("verror");
const path = require('path');
const Viz = require('viz.js');
const svg_to_png = require('svg-to-png');
exports.generateFilesFromUmlClasses = async (umlClasses, outputBaseName, outputFormat = 'svg', outputFilename, clusterFolders = false) => {
    const dot = convertUmlClasses2Dot(umlClasses, clusterFolders);
    if (outputFormat === 'dot' || outputFormat === 'all') {
        writeDot(dot, outputFilename);
        // No need to continue if only generating a dot file
        if (outputFormat === 'dot') {
            return;
        }
    }
    if (!outputFilename) {
        // If all output then extension is svg
        const outputExt = outputFormat === 'all' ? 'svg' : outputFormat;
        // if outputBaseName is a folder
        try {
            const folderOrFile = fs_1.lstatSync(outputBaseName);
            if (folderOrFile.isDirectory()) {
                const parsedDir = path.parse(process.cwd());
                outputBaseName = path.join(process.cwd(), parsedDir.name);
            }
        }
        catch (err) { } // we can ignore errors as it just means outputBaseName is not a folder
        outputFilename = outputBaseName + '.' + outputExt;
    }
    const svg = convertDot2Svg(dot);
    // write svg file even if only wanting png file as we generateFilesFromUmlClasses svg files to png
    await writeSVG(svg, outputFilename, outputFormat);
    if (outputFormat === 'png' || outputFormat === 'all') {
        await writePng(svg, outputFilename);
    }
};
exports.convertUmlClassesToSvg = async (umlClasses, clusterFolders = false) => {
    const dot = convertUmlClasses2Dot(umlClasses, clusterFolders);
    return convertDot2Svg(dot);
};
function convertUmlClasses2Dot(umlClasses, clusterFolders = false) {
    let dotString = `
digraph UmlClassDiagram {
rankdir=BT
color=black
arrowhead=open
node [shape=record, style=filled, fillcolor=gray95]`;
    // Sort UML Classes by folder of source file
    const umlClassesSortedBySourceFiles = sortUmlClassesBySourceFolder(umlClasses);
    let sourceFolder = '';
    for (const umlClass of umlClassesSortedBySourceFiles) {
        if (sourceFolder !== umlClass.codeSource) {
            // Need to close off the last subgraph if not the first
            if (sourceFolder != '') {
                dotString += '\n}';
            }
            dotString += `
subgraph ${getSubGraphName(clusterFolders)} {
label="${umlClass.codeSource}"`;
            sourceFolder = umlClass.codeSource;
        }
        dotString += umlClass.dotUmlClass();
    }
    // Need to close off the last subgraph if not the first
    if (sourceFolder != '') {
        dotString += '\n}';
    }
    dotString += addAssociationsToDot(umlClasses);
    // Need to close off the last the digraph
    dotString += '\n}';
    debug(dotString);
    return dotString;
}
exports.convertUmlClasses2Dot = convertUmlClasses2Dot;
let subGraphCount = 0;
function getSubGraphName(clusterFolders = false) {
    if (clusterFolders) {
        return ` cluster_${subGraphCount++}`;
    }
    return ` graph_${subGraphCount++}`;
}
function sortUmlClassesBySourceFolder(umlClasses) {
    return umlClasses.sort((a, b) => {
        if (a.codeSource < b.codeSource) {
            return -1;
        }
        if (a.codeSource > b.codeSource) {
            return 1;
        }
        return 0;
    });
}
function addAssociationsToDot(umlClasses) {
    let dotString = '';
    let nameToIdMap = {};
    for (const umlClass of umlClasses) {
        nameToIdMap[umlClass.name] = umlClass;
    }
    // for each class
    for (const sourceUmlClass of umlClasses) {
        // for each association in that class
        for (const association of Object.values(sourceUmlClass.associations)) {
            // find the target class
            const targetUmlClass = nameToIdMap[association.targetUmlClassName];
            if (targetUmlClass) {
                dotString += addAssociationToDot(sourceUmlClass, targetUmlClass, association);
            }
        }
    }
    return dotString;
}
exports.addAssociationsToDot = addAssociationsToDot;
function addAssociationToDot(sourceUmlClass, targetUmlClass, association) {
    let dotString = `\n${sourceUmlClass.id} -> ${targetUmlClass.id} [`;
    if (association.referenceType == umlClass_1.ReferenceType.Memory ||
        association.realization &&
            targetUmlClass.stereotype === umlClass_1.ClassStereotype.Interface) {
        dotString += 'style=dashed, ';
    }
    if (association.realization) {
        dotString += 'arrowhead=empty, arrowsize=3, ';
        if (!targetUmlClass.stereotype) {
            dotString += 'weight=4, ';
        }
        else {
            dotString += 'weight=3, ';
        }
    }
    return dotString + ']';
}
function convertDot2Svg(dot) {
    debug(`About to convert dot to SVG`);
    try {
        return Viz(dot);
    }
    catch (err) {
        console.error(`Failed to convert dot to SVG. ${err.message}`);
        console.log(dot);
        throw new verror_1.VError(err, `Failed to parse dot string`);
    }
}
exports.convertDot2Svg = convertDot2Svg;
function writeDot(dot, dotFilename = 'classDiagram.dot') {
    debug(`About to write Dot file to ${dotFilename}`);
    fs_1.writeFile(dotFilename, dot, err => {
        if (err) {
            throw new verror_1.VError(err, `Failed to write Dot file to ${dotFilename}`);
        }
        else {
            console.log(`Dot file written to ${dotFilename}`);
        }
    });
}
exports.writeDot = writeDot;
function writeSVG(svg, svgFilename = 'classDiagram.svg', outputFormats = 'png') {
    debug(`About to write SVN file to ${svgFilename}`);
    if (outputFormats === 'png') {
        const parsedFile = path.parse(svgFilename);
        if (!parsedFile.dir) {
            svgFilename = process.cwd() + '/' + parsedFile.name + '.svg';
        }
        else {
            svgFilename = parsedFile.dir + '/' + parsedFile.name + '.svg';
        }
    }
    return new Promise((resolve, reject) => {
        fs_1.writeFile(svgFilename, svg, err => {
            if (err) {
                reject(new verror_1.VError(err, `Failed to write SVG file to ${svgFilename}`));
            }
            else {
                console.log(`Generated svg file ${svgFilename}`);
                resolve();
            }
        });
    });
}
exports.writeSVG = writeSVG;
async function writePng(svg, filename) {
    // get svg file name from png file name
    const parsedPngFile = path.parse(filename);
    const pngDir = (parsedPngFile.dir === "") ? '.' : path.resolve(parsedPngFile.dir);
    const svgFilename = pngDir + '/' + parsedPngFile.name + '.svg';
    const pngFilename = pngDir + '/' + parsedPngFile.name + '.png';
    debug(`About to convert svg file ${svgFilename} to png file ${pngFilename}`);
    try {
        await svg_to_png.convert(path.resolve(svgFilename), pngDir);
    }
    catch (err) {
        throw new verror_1.VError(err, `Failed to convert SVG file ${svgFilename} to PNG file ${pngFilename}`);
    }
    console.log(`Generated png file ${pngFilename}`);
}
exports.writePng = writePng;
//# sourceMappingURL=converter.js.map