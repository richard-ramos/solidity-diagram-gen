import request from 'request'
import { ASTNode, parse } from 'solidity-parser-antlr'
import { VError} from 'verror'

import { convertNodeToUmlClass } from './parser'
import { UmlClass } from './umlClass'

const networks = <const> ['mainnet', 'ropsten', 'kovan', 'rinkeby', 'goerli']
type Network = typeof networks[number]

export class EtherscanParser {

    readonly url: string

    constructor(protected apikey: string, public network: Network = 'mainnet') {
        if (!networks.includes(network)) {
            throw new Error(`Invalid network "${network}". Must be one of ${networks}`)
        }
        else if (network === 'mainnet') {
            this.url = 'https://api.etherscan.io/api'
        }
        else {
            this.url = `https://api-${network}.etherscan.io/api`
        }
    }

    /**
     * Parses the verified source code files from Etherscan
     * @param contractAddress Ethereum contract address with a 0x prefix
     * @return Promise with an array of UmlClass objects
     */
    async getUmlClasses(contractAddress: string): Promise<UmlClass[]> {

        const sourceFiles = await this.getSourceCode(contractAddress)

        let umlClasses: UmlClass[] = []

        for (const sourceFile of sourceFiles) {
            const node = await this.parseSourceCode(sourceFile)
            const umlClass = convertNodeToUmlClass(node, contractAddress)
            umlClasses = umlClasses.concat(umlClass)
        }

        return umlClasses
    }

    /**
     * Parses Solidity source code into an ASTNode object
     * @param sourceCode Solidity source code
     * @return Promise with an ASTNode object from solidity-parser-antlr
     */
    async parseSourceCode(sourceCode: string): Promise<ASTNode> {
        try {
            const node = parse(sourceCode, {})

            return node
        }
        catch(err) {
            throw new VError(err, `Failed to parse solidity code from source code:\n${sourceCode}`)
        }
    }

    /**
     * Calls Etherscan to get the verified source code for the specified contract address
     * @param contractAddress Ethereum contract address with a 0x prefix
     */
    getSourceCode(contractAddress: string): Promise<string[]> {

        const description =  `get verified source code for address ${contractAddress} from Etherscan API.`

        return new Promise<string[]>((resolve, reject) => {
            request.get(this.url, {
                qs: {
                    module: 'contract',
                    action: 'getsourcecode',
                    address: contractAddress,
                    apikey: this.apikey
                },
                json: true,
            }, (err, res, body) => {
                if (err) {
                    if (res) {
                        return reject(new VError(err, `Failed to ${description}. HTTP code ${res.statusCode} and message: ${res.statusMessage}`))
                    }
                    return reject(new VError(err, `Failed to ${description}.`))
                }

                if (!body) {
                    return reject(new Error(`Failed to ${description}. Empty body in HTTP response.`))
                }
                if (!body.result || !Array.isArray(body.result)) {
                    return reject(new Error(`Failed to ${description}. No result array in HTTP body returned. Body returned: ${JSON.stringify(body)}`))
                }

                const sourceCodes = body.result.map((sc: any) => {
                    if (!sc.SourceCode) {
                        reject(new Error(`Failed to ${description}. Most likely the contract has not been verified on Etherscan.`))
                    }
                    return sc.SourceCode
                })

                resolve(sourceCodes)
            })
        })
    }
}
