"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require('debug')('sol2uml');
const fs_1 = require("fs");
const verror_1 = require("verror");
const parser_1 = require("./parser");
const umlClass_1 = require("./umlClass");
const path = require('path');
const Viz = require('viz.js');
const svg_to_png = require('svg-to-png');
exports.convert = async (fileOrFolder, outputFormat = 'svg', outputFilename, clusterFolders = false) => {
    const files = await parser_1.getSolidityFilesFromFolderOrFile(fileOrFolder);
    let umlClasses = [];
    for (const file of files) {
        umlClasses = umlClasses.concat(await parser_1.parseSolidityFile(file));
    }
    const dot = convertUmlClasses2Dot(umlClasses, clusterFolders);
    if (outputFormat === 'dot' || outputFormat === 'all') {
        writeDot(dot, outputFilename);
        // No need to continue if only generating a dot file
        if (outputFormat === 'dot') {
            return;
        }
    }
    if (!outputFilename) {
        // If all output then extension is svn
        const outputExt = outputFormat === 'all' ? 'svg' : outputFormat;
        outputFilename = fileOrFolder + '.' + outputExt;
    }
    const svg = convertDot2Svg(dot);
    if (outputFormat === 'svg' || outputFormat === 'all') {
        writeSVG(svg, outputFilename);
    }
    if (outputFormat === 'png' || outputFormat === 'all') {
        writePng(svg, outputFilename, outputFormat);
    }
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
        if (sourceFolder !== umlClass.sourceFileFolder) {
            // Need to close off the last subgraph if not the first
            if (sourceFolder != '') {
                dotString += '\n}';
            }
            dotString += `
subgraph ${getSubGraphName(clusterFolders)} {
label="${umlClass.sourceFileFolder}"`;
            sourceFolder = umlClass.sourceFileFolder;
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
        if (a.sourceFileFolder < b.sourceFileFolder) {
            return -1;
        }
        if (a.sourceFileFolder > b.sourceFileFolder) {
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
            else {
                debug(`Warning - could not find target id for Uml Class with name ${association.targetUmlClassName} and stereotype ${association.targetUmlClassStereotype}`);
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
            debug(`Dot file written to ${dotFilename}`);
        }
    });
}
exports.writeDot = writeDot;
function writeSVG(svg, svgFilename = 'classDiagram.svn') {
    debug(`About to write SVN file to ${svgFilename}`);
    fs_1.writeFile(svgFilename, svg, err => {
        if (err) {
            throw new verror_1.VError(err, `Failed to write SVG file to ${svgFilename}`);
        }
        else {
            debug(`Generated SVG file ${svgFilename}`);
        }
    });
}
exports.writeSVG = writeSVG;
function writePng(svg, pngFilename = 'classDiagram.png', outputFormats = 'png') {
    // TODO need to get correct svn file name
    const svgFilename = pngFilename + ".svg";
    debug(`About to convert svg file ${svgFilename} to png file ${pngFilename}`);
    const svgInput = path.resolve(path.join(process.cwd(), svgFilename));
    svg_to_png.convert([svgInput], process.cwd())
        .then(() => {
        debug(`Generated PNG file ${pngFilename}`);
    })
        .catch((err) => {
        throw new verror_1.VError(err, `Failed to convert SVG file ${svgInput} to PNG file ${pngFilename}`);
    });
    if (outputFormats === 'png') {
        // TODO delete the svg file
    }
}
exports.writePng = writePng;
//# sourceMappingURL=converter.js.map