"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = __importDefault(require("request"));
const verror_1 = require("verror");
class Etherscan {
    constructor(apikey, network = 'mainnet') {
        this.apikey = apikey;
        this.network = network;
        this.url = 'https://api.etherscan.io/api';
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
                        reject(new Error(`Failed to ${description}. No SourceCode in returned result array. Result: ${body.result}`));
                    }
                    return sc.SourceCode;
                });
                resolve(sourceCodes);
            });
        });
    }
}
exports.default = Etherscan;
//# sourceMappingURL=etherscan.js.map