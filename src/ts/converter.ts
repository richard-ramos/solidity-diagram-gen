
const debug = require('debug')('sol2uml')

import {writeFile} from 'fs'
import {VError} from 'verror'
import {getSolidityFilesFromFolderOrFile, parseSolidityFile} from './parser'
import {Association, ClassStereotype, ReferenceType, UmlClass} from './umlClass'

const path = require('path')
const Viz = require('viz.js')
const svg_to_png = require('svg-to-png')

export type OutputFormats = 'svg' | 'png' | 'dot' | 'all'

export const convert = async(fileOrFolder: string, outputFormat: OutputFormats = 'svg', outputFilename?: string, clusterFolders: boolean = false): Promise<void> => {

    const files = await getSolidityFilesFromFolderOrFile( fileOrFolder )

    let umlClasses: UmlClass[] = []

    for (const file of files) {
        umlClasses = umlClasses.concat(await parseSolidityFile(file))
    }

    const dot = convertUmlClasses2Dot(umlClasses, clusterFolders)

    if (outputFormat === 'dot' || outputFormat === 'all') {
        writeDot(dot, outputFilename)

        // No need to continue if only generating a dot file
        if (outputFormat === 'dot') { return }
    }

    if (!outputFilename) {
        // If all output then extension is svn
        const outputExt = outputFormat === 'all' ? 'svg' : outputFormat
        outputFilename = fileOrFolder + '.' + outputExt
    }

    const svg = convertDot2Svg(dot)

    if (outputFormat === 'svg' || outputFormat === 'all') {
        writeSVG(svg, outputFilename)
    }

    if (outputFormat === 'png' || outputFormat === 'all') {
        writePng(svg, outputFilename, outputFormat)
    }
}

export function convertUmlClasses2Dot(umlClasses: UmlClass[], clusterFolders: boolean = false): string {

    let dotString: string = `
digraph UmlClassDiagram {
rankdir=BT
color=black
arrowhead=open
node [shape=record, style=filled, fillcolor=gray95]`

    // Sort UML Classes by folder of source file
    const umlClassesSortedBySourceFiles = sortUmlClassesBySourceFolder(umlClasses)

    let sourceFolder = ''
    for (const umlClass of umlClassesSortedBySourceFiles) {
        if (sourceFolder !== umlClass.sourceFileFolder) {
            // Need to close off the last subgraph if not the first
            if (sourceFolder != '') {
                dotString += '\n}'
            }

            dotString += `
subgraph ${getSubGraphName(clusterFolders)} {
label="${umlClass.sourceFileFolder}"`

            sourceFolder = umlClass.sourceFileFolder
        }
        dotString += umlClass.dotUmlClass()
    }

    // Need to close off the last subgraph if not the first
    if (sourceFolder != '') {
        dotString += '\n}'
    }

    dotString += addAssociationsToDot(umlClasses)

    // Need to close off the last the digraph
    dotString += '\n}'

    debug(dotString)

    return dotString
}

let subGraphCount = 0
function getSubGraphName(clusterFolders: boolean = false) {
    if (clusterFolders) {
        return ` cluster_${subGraphCount++}`
    }
    return ` graph_${subGraphCount++}`
}

function sortUmlClassesBySourceFolder(umlClasses: UmlClass[]): UmlClass[] {
    return umlClasses.sort((a, b) => {
        if (a.sourceFileFolder < b.sourceFileFolder) {
            return -1
        }
        if (a.sourceFileFolder > b.sourceFileFolder) {
            return 1
        }
        return 0
    })
}

export function addAssociationsToDot(umlClasses: UmlClass[]): string {
    let dotString: string = ''
    let nameToIdMap: {[className: string]: UmlClass} = {}

    for (const umlClass of umlClasses) {
        nameToIdMap[umlClass.name] = umlClass
    }

    // for each class
    for (const sourceUmlClass of umlClasses) {
        // for each association in that class
        for (const association of Object.values(sourceUmlClass.associations)) {
            // find the target class
            const targetUmlClass = nameToIdMap[association.targetUmlClassName]
            if (targetUmlClass) {
                dotString += addAssociationToDot(sourceUmlClass, targetUmlClass, association)
            }
            else {
                debug(`Warning - could not find target id for Uml Class with name ${association.targetUmlClassName} and stereotype ${association.targetUmlClassStereotype}`)
            }
        }
    }

    return dotString
}

function addAssociationToDot(sourceUmlClass: UmlClass, targetUmlClass: UmlClass, association: Association): string {

    let dotString = `\n${sourceUmlClass.id} -> ${targetUmlClass.id} [`

    if (association.referenceType == ReferenceType.Memory ||
        association.realization &&
        targetUmlClass.stereotype === ClassStereotype.Interface)
    {
        dotString += 'style=dashed, '
    }

    if (association.realization) {
        dotString += 'arrowhead=empty, arrowsize=3, '
        if (!targetUmlClass.stereotype) {
            dotString += 'weight=4, '
        }
        else {
            dotString += 'weight=3, '
        }
    }

    return dotString + ']'
}

export function convertDot2Svg(dot: string): any {

    debug(`About to convert dot to SVG`)

    try {
        return Viz(dot)
    }
    catch (err) {
        console.error(`Failed to convert dot to SVG. ${err.message}`)
        console.log(dot)
        throw new VError(err, `Failed to parse dot string`)
    }
}

export function writeDot(dot: string, dotFilename = 'classDiagram.dot') {

    debug(`About to write Dot file to ${dotFilename}`)

    writeFile(dotFilename, dot, err => {
        if (err) {
            throw new VError(err, `Failed to write Dot file to ${dotFilename}`)
        } else {
            debug(`Dot file written to ${dotFilename}`)
        }
    })
}

export function writeSVG(svg: any, svgFilename = 'classDiagram.svn') {

    debug(`About to write SVN file to ${svgFilename}`)

    writeFile(svgFilename, svg, err => {
        if (err) {
            throw new VError(err, `Failed to write SVG file to ${svgFilename}`)
        } else {
            debug(`Generated SVG file ${svgFilename}`)
        }
    })
}

export function writePng(svg: any, pngFilename = 'classDiagram.png', outputFormats: OutputFormats = 'png') {

    // TODO need to get correct svn file name
    const svgFilename = pngFilename + ".svg"

    debug(`About to convert svg file ${svgFilename} to png file ${pngFilename}`)

    const svgInput = path.resolve(path.join( process.cwd(), svgFilename ))

    svg_to_png.convert([svgInput], process.cwd())
        .then(() => {
            debug(`Generated PNG file ${pngFilename}`)
        })
        .catch((err: Error) => {
            throw new VError(err, `Failed to convert SVG file ${svgInput} to PNG file ${pngFilename}`)
        })

    if (outputFormats === 'png') {
        // TODO delete the svg file
    }
}
