import { ASTNode } from 'solidity-parser-antlr';
export declare function getSolidityFilesFromFolderOrFiles(folderOrFilePaths: string[]): Promise<string[]>;
export declare function getSolidityFilesFromFolderOrFile(folderOrFilePath: string): Promise<string[]>;
export declare function parseSolidityFile(fileName: string): ASTNode;
