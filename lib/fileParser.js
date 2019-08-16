"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const klaw_1 = __importDefault(require("klaw"));
const solidity_parser_antlr_1 = require("solidity-parser-antlr");
const verror_1 = require("verror");
const parser_1 = require("./parser");
const debug = require('debug')('sol2uml');
exports.parseUmlClassesFromFiles = async (fileOrFolders, depthLimit = -1) => {
    const files = await getSolidityFilesFromFolderOrFiles(fileOrFolders, depthLimit);
    let umlClasses = [];
    for (const file of files) {
        const node = await parseSolidityFile(file);
        const sourceFolder = path_1.dirname(file);
        const relativeSourceFolder = path_1.relative(process.cwd(), sourceFolder);
        const umlClass = parser_1.convertNodeToUmlClass(node, relativeSourceFolder);
        umlClasses = umlClasses.concat(umlClass);
    }
    return umlClasses;
};
async function getSolidityFilesFromFolderOrFiles(folderOrFilePaths, depthLimit = -1) {
    let files = [];
    for (const folderOrFilePath of folderOrFilePaths) {
        const result = await getSolidityFilesFromFolderOrFile(folderOrFilePath, depthLimit);
        files = files.concat(result);
    }
    return files;
}
exports.getSolidityFilesFromFolderOrFiles = getSolidityFilesFromFolderOrFiles;
function getSolidityFilesFromFolderOrFile(folderOrFilePath, depthLimit = -1) {
    debug(`About to get Solidity files under ${folderOrFilePath}`);
    return new Promise((resolve, reject) => {
        try {
            const folderOrFile = fs_1.lstatSync(folderOrFilePath);
            if (folderOrFile.isDirectory()) {
                const files = [];
                klaw_1.default(folderOrFilePath, {
                    depthLimit,
                })
                    .on('data', file => {
                    if (path_1.extname(file.path) === '.sol')
                        files.push(file.path);
                })
                    .on('end', () => {
                    debug(`Got Solidity files to be parsed: ${files}`);
                    resolve(files);
                });
            }
            else if (folderOrFile.isFile()) {
                if (path_1.extname(folderOrFilePath) === '.sol') {
                    debug(`Got Solidity file to be parsed: ${folderOrFilePath}`);
                    resolve([folderOrFilePath]);
                }
                else {
                    reject(Error(`File ${folderOrFilePath} does not have a .sol extension.`));
                }
            }
            else {
                reject(Error(`Could not find directory or file ${folderOrFilePath}`));
            }
        }
        catch (err) {
            let error;
            if (err && err.code === 'ENOENT') {
                error = Error(`No such file or folder ${folderOrFilePath}. Make sure you pass in the root directory of the contracts`);
            }
            else {
                error = new verror_1.VError(err, `Failed to get Solidity files under folder or file ${folderOrFilePath}`);
            }
            console.error(error.stack);
            reject(error);
        }
    });
}
exports.getSolidityFilesFromFolderOrFile = getSolidityFilesFromFolderOrFile;
function parseSolidityFile(fileName) {
    try {
        const solidityCode = fs_1.readFileSync(fileName, 'utf8');
        return solidity_parser_antlr_1.parse(solidityCode, {});
    }
    catch (err) {
        throw new verror_1.VError(err, `Failed to parse solidity file ${fileName}.`);
    }
}
exports.parseSolidityFile = parseSolidityFile;
//# sourceMappingURL=fileParser.js.map