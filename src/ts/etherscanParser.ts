import request from 'request'
import { ASTNode, parse } from 'solidity-parser-antlr'
import { VError} from 'verror'

import { convertNodeToUmlClass } from './parser'
import { UmlClass } from './umlClass'

export default class EtherscanParser {

    constructor(protected apikey: string, public network: string = 'mainnet') {}

    url = 'https://api.etherscan.io/api'

    async getUmlClasses(contractAddress: string): Promise<UmlClass[]> {

        const sourceFiles = await this.getSourceCode(contractAddress)

        let umlClasses: UmlClass[] = []

        for (const sourceFile of sourceFiles) {
            const node = await this.parseSourceFile(sourceFile)
            const umlClass = convertNodeToUmlClass(node, contractAddress)
            umlClasses = umlClasses.concat(umlClass)
        }

        return umlClasses
    }

    async parseSourceFile(sourceCode: string): Promise<ASTNode> {
        try {
            const node = parse(sourceCode, {})

            return node
        }
        catch(err) {
            throw new VError(err, `Failed to parse solidity code from source code:\n${sourceCode}`)
        }
    }

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
                    const error = new VError(err, `Failed to ${description}. HTTP code ${res.statusCode} and message: ${res.statusMessage}`)
                    return reject(error)
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
