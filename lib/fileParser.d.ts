import { ASTNode } from 'solidity-parser-antlr';
import { UmlClass } from './umlClass';
export declare const parseUmlClassesFromFiles: (fileOrFolders: string[], depthLimit?: number) => Promise<UmlClass[]>;
export declare function getSolidityFilesFromFolderOrFiles(folderOrFilePaths: string[], depthLimit?: number): Promise<string[]>;
export declare function getSolidityFilesFromFolderOrFile(folderOrFilePath: string, depthLimit?: number): Promise<string[]>;
export declare function parseSolidityFile(fileName: string): ASTNode;
