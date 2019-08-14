import { UmlClass } from './umlClass';
export declare const getSolidityFilesFromFolderOrFiles: (folderOrFilePaths: string[]) => string[];
export declare const getSolidityFilesFromFolderOrFile: (folderOrFilePath: string) => Promise<string[]>;
export declare const parseSolidityFile: (fileName: string) => UmlClass[];
