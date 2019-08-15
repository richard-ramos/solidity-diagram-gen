import { lstatSync, readFileSync } from 'fs'
import {dirname, extname, relative} from 'path'
import klaw from 'klaw'
import { ASTNode, parse } from 'solidity-parser-antlr'
import { VError } from 'verror'

import { convertNodeToUmlClass } from './parser'
import { UmlClass} from './umlClass'

const debug = require('debug')('sol2uml')

export const parseUmlClassesFromFiles = async(fileOrFolders: string[]): Promise<UmlClass[]> => {

    const files = await getSolidityFilesFromFolderOrFiles( fileOrFolders )

    let umlClasses: UmlClass[] = []

    for (const file of files) {
        const node = await parseSolidityFile(file)

        const sourceFolder = dirname(file)
        const relativeSourceFolder = relative(process.cwd(), sourceFolder)

        const umlClass = convertNodeToUmlClass(node, relativeSourceFolder)
        umlClasses = umlClasses.concat(umlClass)
    }

    return umlClasses
}

export async function getSolidityFilesFromFolderOrFiles(folderOrFilePaths: string[]): Promise<string[]> {

    let files: string[] = []

    for (const folderOrFilePath of folderOrFilePaths) {
        const result = await getSolidityFilesFromFolderOrFile(folderOrFilePath)
        files = files.concat(result)
    }

    return files
}

export function getSolidityFilesFromFolderOrFile(folderOrFilePath: string): Promise<string[]> {

    debug(`About to get Solidity files under ${folderOrFilePath}`)

    return new Promise<string[]>((resolve, reject) => {
        try {
            const folderOrFile = lstatSync(folderOrFilePath)

            if(folderOrFile.isDirectory() ) {

                const files: string[] = []

                klaw(folderOrFilePath)
                    .on('data', file => {
                        if (extname(file.path) === '.sol')
                            files.push(file.path)
                    })
                    .on('end', () => {
                        debug(`Got Solidity files to be parsed: ${files}`)
                        resolve(files)
                    })
            }
            else if (folderOrFile.isFile() ) {

                if (extname(folderOrFilePath) === '.sol') {
                    debug(`Got Solidity file to be parsed: ${folderOrFilePath}`)
                    resolve([folderOrFilePath])
                }
                else {
                    reject(Error(`File ${folderOrFilePath} does not have a .sol extension.`))
                }
            } else {
                reject(Error(`Could not find directory or file ${folderOrFilePath}`))
            }
        } catch(err) {
            let error: Error
            if (err && err.code === 'ENOENT') {
                error = Error(`No such file or folder ${folderOrFilePath}. Make sure you pass in the root directory of the contracts`)
            }
            else {
                error = new VError(err, `Failed to get Solidity files under folder or file ${folderOrFilePath}`)
            }

            console.error(error.stack)
            reject(error)
        }
    })
}

export function parseSolidityFile(fileName: string): ASTNode {

    try {
        const solidityCode = readFileSync(fileName, 'utf8')
        return parse(solidityCode, {})

    } catch (err) {
        throw new VError(err, `Failed to parse solidity file ${fileName}.`)
    }
}
