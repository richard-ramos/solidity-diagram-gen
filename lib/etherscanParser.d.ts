import { ASTNode } from 'solidity-parser-antlr';
import { UmlClass } from './umlClass';
export default class EtherscanParser {
    protected apikey: string;
    network: string;
    constructor(apikey: string, network?: string);
    url: string;
    getUmlClasses(contractAddress: string): Promise<UmlClass[]>;
    parseSourceFile(sourceCode: string): Promise<ASTNode>;
    getSourceCode(contractAddress: string): Promise<string[]>;
}
