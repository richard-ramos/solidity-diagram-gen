"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const solidity_parser_antlr_1 = require("solidity-parser-antlr");
const verror_1 = require("verror");
const parser_1 = require("./parser");
const networks = ['mainnet', 'ropsten', 'kovan', 'rinkeby', 'goerli'];
class EtherscanParser {
    constructor(apikey = 'ZAD4UI2RCXCQTP38EXS3UY2MPHFU5H9KB1', network = 'mainnet') {
        this.apikey = apikey;
        this.network = network;
        if (!networks.includes(network)) {
            throw new Error(`Invalid network "${network}". Must be one of ${networks}`);
        }
        else if (network === 'mainnet') {
            this.url = 'https://api.etherscan.io/api';
        }
        else {
            this.url = `https://api-${network}.etherscan.io/api`;
        }
    }
    /**
     * Parses the verified source code files from Etherscan
     * @param contractAddress Ethereum contract address with a 0x prefix
     * @return Promise with an array of UmlClass objects
     */
    async getUmlClasses(contractAddress) {
        const sourceFiles = await this.getSourceCode(contractAddress);
        let umlClasses = [];
        for (const sourceFile of sourceFiles) {
            const node = await this.parseSourceCode(sourceFile);
            const umlClass = parser_1.convertNodeToUmlClass(node, contractAddress);
            umlClasses = umlClasses.concat(umlClass);
        }
        return umlClasses;
    }
    /**
     * Parses Solidity source code into an ASTNode object
     * @param sourceCode Solidity source code
     * @return Promise with an ASTNode object from solidity-parser-antlr
     */
    async parseSourceCode(sourceCode) {
        try {
            const node = solidity_parser_antlr_1.parse(sourceCode, {});
            return node;
        }
        catch (err) {
            throw new verror_1.VError(err, `Failed to parse solidity code from source code:\n${sourceCode}`);
        }
    }
    /**
     * Calls Etherscan to get the verified source code for the specified contract address
     * @param contractAddress Ethereum contract address with a 0x prefix
     */
    async getSourceCode(contractAddress) {
        var _a, _b, _c;
        const description = `get verified source code for address ${contractAddress} from Etherscan API.`;
        try {
            const response = await axios_1.default.get(this.url, {
                params: {
                    module: 'contract',
                    action: 'getsourcecode',
                    address: contractAddress,
                    apikey: this.apikey,
                },
            });
            if (!Array.isArray((_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.result)) {
                throw new Error(`Failed to ${description}. No result array in HTTP data: ${JSON.stringify(response === null || response === void 0 ? void 0 : response.data)}`);
            }
            return response.data.result.map((sc) => {
                if (!sc.SourceCode) {
                    throw new Error(`Failed to ${description}. Most likely the contract has not been verified on Etherscan.`);
                }
                return sc.SourceCode;
            });
        }
        catch (err) {
            if (!err.response) {
                throw new Error(`Failed to ${description}. No HTTP response.`);
            }
            throw new verror_1.VError(`Failed to ${description}. HTTP status code ${(_b = err.response) === null || _b === void 0 ? void 0 : _b.status}, status text: ${(_c = err.response) === null || _c === void 0 ? void 0 : _c.statusText}`);
        }
    }
}
exports.EtherscanParser = EtherscanParser;
//# sourceMappingURL=etherscanParser.js.map