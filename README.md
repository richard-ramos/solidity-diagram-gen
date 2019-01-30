# solidity-diagram-gen
UML class diagram generator for solidity contracts.

## Usage

To run locally
```Bash
git clone https://github.com/naddison36/solidity-diagram-gen.git

npm i

npm run sdg path/to/contracts/root/folder
```

To run globally
```Bash
npm -g install git+https://github.com/naddison36/solidity-diagram-gen.git

solidity-diagram-gen path/to/contracts/root/folder
```

Either method will output a `diagram.svg` file in the working folder.

## About

This is a fork of the Richard Ramos's [solidity-diagram-gen](https://github.com/richard-ramos/solidity-diagram-gen) tool which no longer works as it uses the Solidity parser [solidity-parser](https://www.npmjs.com/package/solidity-parser/v/0.4.0). This parser can not handle newer Solidity syntax like `constructor`.

This version uses the [solidity-parser-antlr](https://github.com/federicobond/solidity-parser-antlr) Solidity parser which is built on top of [ANTLR4 grammar](https://github.com/solidityj/solidity-antlr4).