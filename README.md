# Solidity 2 UML
[Unified Modeling Language (UML)](https://en.wikipedia.org/wiki/Unified_Modeling_Language) [class diagram](https://en.wikipedia.org/wiki/Class_diagram) generator for [Solidity](https://solidity.readthedocs.io/) contracts.

## Install

The following installation assumes [Node.js](https://nodejs.org/en/download/) has already been installed which comes with [Node Package Manager (NPM)](https://www.npmjs.com/).

To install globally so you can run `sol2uml` from anywhere
```bash
npm link sol2uml --only=production
```

## Usage

To see the usage options
```Bash
$ sol2uml -h

Usage: sol2uml [options] <file or root folder>

Generates UML diagrams from Solidity source code

Options:
  -v, --verbose                 With debugging statements
  -f, --outputFormat [value]    Output file format: svg, png, dot or all (default: "svg")
  -n, --outputFileName [value]  Output file name
  -c, --clusterFolders          Cluster contracts into source folders
  -h, --help                    output usage information
```

To generate the test contracts in this repo
```Bash
$ sol2uml ./contracts
```

To generate a SVG diagram of all Solidity files under some root folder and output the svg file to a specific location
```Bash
$ sol2uml path/to/contracts/root/folder -n ./outputFile.svg
```

To generate a diagram of all contracts in a single Solidity file, the output file in png format to output file `./someFile.png`
```Bash
$ sol2uml path/to/contracts/root/folder/solidity/file.sol -f png -n ./someFile.png
```

To generate SVG and PNG diagrams of all Solidity files under some root folder.  The output will be `diagram.svg` and `diagram.png` files in the working folder.
```Bash
$ sol2uml ./contracts -f all -v
```

## Example from Open Zeppelin

Open Zeppelin's ERC20 token contracts
![Open Zeppelin ERC20](./examples/OpenZeppelinERC20.svg)
[Generated from version 2.3.0](https://github.com/OpenZeppelin/openzeppelin-solidity/tree/v2.3.0/contracts/token/ERC20)

See [examples](./examples/README.md) for more diagrams.

## UML Syntax

Good online resources for learning UML
* [UML 2 Class Diagramming Guidelines](http://www.agilemodeling.com/style/classDiagram.htm)
* [Creating class diagrams with UML](https://www.ionos.com/digitalguide/websites/web-development/class-diagrams-with-uml/)

### Terminology differences

A Solidity variable becomes an attribute in UML and a Solidity function becomes an operation in UML.

### Stereotypes

#### Class stereotypes

* Interface
* Abstract - if any of the contract's functions are abstract, the class will have an Abstract stereotype. Child contracts of abstract contracts that do not implement all the abstract functions are currently not marked as Abstract.
* Library

#### Operator stereotypes

* event
* modifier
* abstract - is there is no function body on a contract, the operator is marked as abstract. Operators on an Interface do not have an abstract stereotype as all operators are abstract.
* fallback - abstract fallback functions will just have an abstract stereotype.
* payable - payable fallback functions will just have a fallback stereotype.

### UML Associations

Lines:
- Solid lines are used to link the contract types of storage (state) variables. This can be linked to contracts, interfaces or libraries.
- Solid lines are also used for generalisations of contracts and abstract contracts.
- Solid lines are also used for aggregated structs and enums
- Dashed lines are used or generalisations of interfaces.
- Dash lines are also used for types of memory variables.

Heads/Tails:
- An empty triangle head is used for generalisations of contracts, interfaces and abstract contracts.
- An open arrow head is used for storage or memory variable dependencies
- A diamond tail is used for aggregations of structs and enums

## About

This is a rewrite of the Richard Ramos's [solidity-diagram-gen](https://github.com/richard-ramos/solidity-diagram-gen) tool which no longer works as it uses [solidity-parser](https://www.npmjs.com/package/solidity-parser/v/0.4.0) which cannot handle newer Solidity syntax like `constructor`.

This version uses the [solidity-parser-antlr](https://github.com/federicobond/solidity-parser-antlr) Solidity parser which is built on top of [ANTLR4 grammar](https://github.com/solidityj/solidity-antlr4). The logic to generate the dot syntax has been rewritten and different UML syntax is now used.

The diagrams are generated using [viz.js](https://github.com/mdaines/viz.js/) which uses [Graphviz](http://www.graphviz.org/) to render a [Scalable Vector Graphics (SVG)](https://en.wikipedia.org/wiki/Scalable_Vector_Graphics) file. [Graphviz Online](https://dreampuf.github.io/GraphvizOnline/) allows dot files to be edited and rendered into a SVN dynamically.

## TODO

* Document UML syntax
* Option to specify a list of contracts to generate along with their dependencies. This was not all contracts in dependent libraries like Open Zeppelin need to be generated.
* Portrait output mode
* Add indicator for state mutability. eg view and pure functions

