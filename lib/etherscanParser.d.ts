import { ASTNode } from 'solidity-parser-antlr';
import { UmlClass } from './umlClass';
declare const networks: readonly ["mainnet", "ropsten", "kovan", "rinkeby", "goerli"];
declare type Network = typeof networks[number];
export declare class EtherscanParser {
    protected apikey: string;
    network: Network;
    readonly url: string;
    constructor(apikey?: string, network?: Network);
    /**
     * Parses the verified source code files from Etherscan
     * @param contractAddress Ethereum contract address with a 0x prefix
     * @return Promise with an array of UmlClass objects
     */
    getUmlClasses(contractAddress: string): Promise<UmlClass[]>;
    /**
     * Parses Solidity source code into an ASTNode object
     * @param sourceCode Solidity source code
     * @return Promise with an ASTNode object from solidity-parser-antlr
     */
    parseSourceCode(sourceCode: string): Promise<ASTNode>;
    /**
     * Calls Etherscan to get the verified source code for the specified contract address
     * @param contractAddress Ethereum contract address with a 0x prefix
     */
    getSourceCode(contractAddress: string): Promise<string[]>;
}
export {};
