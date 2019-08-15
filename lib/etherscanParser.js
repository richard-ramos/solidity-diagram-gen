"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = __importDefault(require("request"));
const solidity_parser_antlr_1 = require("solidity-parser-antlr");
const verror_1 = require("verror");
const parser_1 = require("./parser");
class EtherscanParser {
    constructor(apikey, network = 'mainnet') {
        this.apikey = apikey;
        this.network = network;
        this.url = 'https://api.etherscan.io/api';
    }
    async getUmlClasses(contractAddress) {
        const sourceFiles = await this.getSourceCode(contractAddress);
        let umlClasses = [];
        for (const sourceFile of sourceFiles) {
            const node = await this.parseSourceFile(sourceFile);
            const umlClass = parser_1.convertNodeToUmlClass(node, contractAddress);
            umlClasses = umlClasses.concat(umlClass);
        }
        return umlClasses;
    }
    async parseSourceFile(sourceCode) {
        try {
            const node = solidity_parser_antlr_1.parse(sourceCode, {});
            return node;
        }
        catch (err) {
            throw new verror_1.VError(err, `Failed to parse solidity code from source code:\n${sourceCode}`);
        }
    }
    getSourceCode(contractAddress) {
        const description = `get verified source code for address ${contractAddress} from Etherscan API.`;
        return new Promise((resolve, reject) => {
            request_1.default.get(this.url, {
                qs: {
                    module: 'contract',
                    action: 'getsourcecode',
                    address: contractAddress,
                    apikey: this.apikey
                },
                json: true,
            }, (err, res, body) => {
                if (err) {
                    const error = new verror_1.VError(err, `Failed to ${description}. HTTP code ${res.statusCode} and message: ${res.statusMessage}`);
                    return reject(error);
                }
                if (!body) {
                    return reject(new Error(`Failed to ${description}. Empty body in HTTP response.`));
                }
                if (!body.result || !Array.isArray(body.result)) {
                    return reject(new Error(`Failed to ${description}. No result array in HTTP body returned. Body returned: ${JSON.stringify(body)}`));
                }
                const sourceCodes = body.result.map((sc) => {
                    if (!sc.SourceCode) {
                        reject(new Error(`Failed to ${description}. Most likely the contract has not been verified on Etherscan.`));
                    }
                    return sc.SourceCode;
                });
                resolve(sourceCodes);
            });
        });
    }
}
exports.default = EtherscanParser;
//# sourceMappingURL=etherscanParser.js.map