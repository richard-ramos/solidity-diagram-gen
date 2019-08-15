import { ASTNode } from 'solidity-parser-antlr';
import { UmlClass } from './umlClass';
export declare const parseUmlClassesFromFiles: (fileOrFolders: string[]) => Promise<UmlClass[]>;
export declare function getSolidityFilesFromFolderOrFiles(folderOrFilePaths: string[]): Promise<string[]>;
export declare function getSolidityFilesFromFolderOrFile(folderOrFilePath: string): Promise<string[]>;
export declare function parseSolidityFile(fileName: string): ASTNode;
