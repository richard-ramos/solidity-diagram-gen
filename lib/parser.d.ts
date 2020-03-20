import { ASTNode } from 'solidity-parser-antlr';
import { UmlClass } from './umlClass';
export declare function convertNodeToUmlClass(node: ASTNode, codeSource: string): UmlClass[];
