import { UmlClass } from './umlClass';
export declare type OutputFormats = 'svg' | 'png' | 'dot' | 'all';
export declare const convert: (fileOrFolder: string, outputFormat?: OutputFormats, outputFilename?: string, clusterFolders?: boolean) => Promise<void>;
export declare function convertUmlClasses2Dot(umlClasses: UmlClass[], clusterFolders?: boolean): string;
export declare function addAssociationsToDot(umlClasses: UmlClass[]): string;
export declare function convertDot2Svg(dot: string): any;
export declare function writeDot(dot: string, dotFilename?: string): void;
export declare function writeSVG(svg: any, svgFilename?: string, outputFormats?: OutputFormats): void;
export declare function writePng(svg: any, pngFilename?: string): Promise<void>;
