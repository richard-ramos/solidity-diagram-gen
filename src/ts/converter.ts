
const debug = require('debug')('sol2uml')

import { lstatSync, writeFile } from 'fs'
import { Association, ClassStereotype, ReferenceType, UmlClass} from './umlClass'
import { VError } from 'verror'

const path = require('path')
const Viz = require('viz.js')
const svg_to_png = require('svg-to-png')

export type OutputFormats = 'svg' | 'png' | 'dot' | 'all'

export const convertUmlClasses = async(
    umlClasses: UmlClass[],
    outputBaseName: string,
    outputFormat: OutputFormats = 'svg',
    outputFilename?: string,
    clusterFolders: boolean = false): Promise<void> => {

    const dot = convertUmlClasses2Dot(umlClasses, clusterFolders)

    if (outputFormat === 'dot' || outputFormat === 'all') {
        writeDot(dot, outputFilename)

        // No need to continue if only generating a dot file
        if (outputFormat === 'dot') { return }
    }

    if (!outputFilename) {
        // If all output then extension is svg
        const outputExt = outputFormat === 'all' ? 'svg' : outputFormat

        // if outputBaseName is a folder
        try {
            const folderOrFile = lstatSync(outputBaseName)
            if(folderOrFile.isDirectory() ) {
                const parsedDir = path.parse(process.cwd())
                outputBaseName = path.join(process.cwd(), parsedDir.name)
            }
        }
        catch (err) {}  // we can ignore errors as it just means outputBaseName is not a folder

        outputFilename = outputBaseName + '.' + outputExt
    }

    const svg = convertDot2Svg(dot)

    // write svg file even if only wanting png file as we convertUmlClasses svg files to png
    await writeSVG(svg, outputFilename, outputFormat)

    if (outputFormat === 'png' || outputFormat === 'all') {
        await writePng(svg, outputFilename)
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
        if (sourceFolder !== umlClass.codeSource) {
            // Need to close off the last subgraph if not the first
            if (sourceFolder != '') {
                dotString += '\n}'
            }

            dotString += `
subgraph ${getSubGraphName(clusterFolders)} {
label="${umlClass.codeSource}"`

            sourceFolder = umlClass.codeSource
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
        if (a.codeSource < b.codeSource) {
            return -1
        }
        if (a.codeSource > b.codeSource) {
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
            console.log(`Dot file written to ${dotFilename}`)
        }
    })
}

export function writeSVG(svg: any, svgFilename = 'classDiagram.svg', outputFormats: OutputFormats = 'png'): Promise<void> {

    debug(`About to write SVN file to ${svgFilename}`)

    if (outputFormats === 'png') {
        const parsedFile = path.parse(svgFilename)
        if (!parsedFile.dir) {
            svgFilename = process.cwd() + '/' + parsedFile.name + '.svg'
        }
        else {
            svgFilename = parsedFile.dir + '/' + parsedFile.name + '.svg'
        }
    }

    return new Promise<void>((resolve, reject) => {
        writeFile(svgFilename, svg, err => {
            if (err) {
                reject(new VError(err, `Failed to write SVG file to ${svgFilename}`))
            } else {
                console.log(`Generated svg file ${svgFilename}`)
                resolve()
            }
        })
    })
}

export async function writePng(svg: any, filename: string): Promise<void> {

    // get svg file name from png file name
    const parsedPngFile = path.parse(filename)
    const pngDir = (parsedPngFile.dir === "")? '.' : path.resolve(parsedPngFile.dir)
    const svgFilename = pngDir + '/' + parsedPngFile.name + '.svg'
    const pngFilename = pngDir + '/' + parsedPngFile.name + '.png'


    debug(`About to convert svg file ${svgFilename} to png file ${pngFilename}`)

    try {
        await svg_to_png.convert(path.resolve(svgFilename), pngDir)
    }
    catch (err) {
        throw new VError(err, `Failed to convert SVG file ${svgFilename} to PNG file ${pngFilename}`)
    }

    console.log(`Generated png file ${pngFilename}`)
}
