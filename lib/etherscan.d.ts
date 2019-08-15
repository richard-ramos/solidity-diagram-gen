export default class Etherscan {
    protected apikey: string;
    network: string;
    constructor(apikey: string, network?: string);
    url: string;
    getSourceCode(contractAddress: string): Promise<string[]>;
}
