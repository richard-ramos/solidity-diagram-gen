const fs = require("fs")
const klaw = require('klaw')
const path = require('path')
const SolidityParser = require("solidity-parser-antlr")
const Viz = require('viz.js')
const svg_to_png = require('svg-to-png')
const VError = require('verror')
const debug = require('debug')('solidity-diagram-gen')

let contracts = []
let importedContracts = []
let structures = []
let idMapping = {}
let idCnt = 0

const processSolFiles = (fileArray, output) => {

    fileArray.forEach(function(f){
        try {
            const solidityCode = fs.readFileSync(f, 'utf8')
            const parseResult = SolidityParser.parse(solidityCode)

            if(parseResult.type === "SourceUnit"){

                parseResult.children.forEach(contract => {
                    if(contract.type === "ContractDefinition") {

                        debug(`Adding contract ${contract.name}`)

                        addContract(contract)
                    }
                    else if (contract.type === "ImportDirective") {
                        importedContracts.push(contract)
                    }
                })
            }
        } catch (err) {
            debug(`Failed to parse solidity file ${f}. ${err.message}`)
        }
    })

    analyzeComposition(contracts, structures)

    const dot = constructDot()

    outputDiagram(dot, output)
}

function constructDot() {
    let contractString = ""
    let relationshipString = ""
    let structString = ""
    let compositionString = ""
    let associationString = ""

    contracts.forEach(function (contract) {
        let contractLabel = ""

        if (contract.isInterface) {
            contractLabel += "«interface»\\n"
        }

        if (contract.isLibrary) {
            contractLabel += "«library»\\n"
        }

        if (contract.isAbstract) {
            contractLabel += "«abstract»\\n"
        }

        contractLabel += `${contract.name}`

        if (contract.attributes.length > 0) {
            contractLabel += "|"
            contract.attributes.forEach(function (a) {
                contractLabel += a + '\\l'
            })

        }

        if (contract.methods.length > 0) {
            contractLabel += "|"
            contract.methods.forEach(function (a) {
                contractLabel += a + '\\l'
            })

        }

        contractString += `${contract.id}[label = "{${contractLabel}}"]`
        contractString += "\n"

        if (contract.is.length > 0) {
            contract.is.forEach(function (i) {
                relationshipString += `${idMapping[i]}->${contract.id}`
                relationshipString += "\n"
            })
        }

        if (contract.compositions.length > 0) {
            contract.compositions.forEach(function (i) {
                compositionString += `${contract.id}->${idMapping[i]}[constraint=true, arrowtail=diamond]`
                compositionString += "\n"
            })
        }

        if (contract.associations.length > 0) {
            contract.associations.forEach(function (i) {
                associationString += `${idMapping[i]}->${contract.id}[constraint=true, arrowtail=open]`
                associationString += "\n"
            })
        }
    })

    structures.forEach(function (s) {
        let label = `«struct»\\n${s.name}`

        if (s.attributes.length > 0) {
            label += "|"
            s.attributes.forEach(function (a) {
                label += a + '\\l'
            })
        }

        structString += `${s.id}[fillcolor = "#cfcfcf", label = "{${label}}"]`
        structString += "\n"

        relationshipString += `${s.parentContractId}->${s.id}[constraint=true, arrowtail=diamond]`
        relationshipString += "\n"

        if (s.compositions.length > 0) {
            s.compositions.forEach(function (i) {
                compositionString += `${s.id}->${idMapping[i]}[constraint=true, arrowtail=diamond]`
                compositionString += "\n"
            })
        }

        if (s.associations.length > 0) {
            s.associations.forEach(function (i) {
                associationString += `${idMapping[i]}->${s.id}[constraint=true, arrowtail=open]`
                associationString += "\n"
            })
        }
    })

    const dot = `
    digraph hierarchy {
        node[shape=record,style=filled,fillcolor=gray95]
        edge[dir=back, arrowtail=empty]
    
    ${contractString}
    
    ${structString}
    
    ${relationshipString}
    
    ${compositionString}
    
    ${associationString}
    
    }`

    debug(dot)

    return dot
}

function outputDiagram(dot, output = 'both') {

    debug(`Generating output file(s) for option: ${output}`)

    const svg = Viz(dot)
    const diagramName = 'diagram' /*+ "-" + (new Date()).YYYYMMDDHHMMSS()*/
    const svgFilename = diagramName + ".svg"
    const pngFilename = diagramName + ".png"

    debug(`Writing SVG diagram to ${svgFilename}`)

    fs.writeFile(svgFilename, svg, function (err) {
        if (err) {
            throw VError(err, `Failed to write SVG file to ${svgFilename}`)
        } else {
            console.log(`SVG diagram generated: ${svgFilename}`)
        }
    })

    if (output === 'both' || output === 'png') {

        debug(`Converting svg diagram ${svgFilename} to png diagram ${pngFilename}`)

        const svgInput = path.resolve(path.join( process.cwd(), svgFilename ))
        svg_to_png.convert([svgInput], process.cwd())
          .then(() => {
              console.log(`PNG diagram generated: ${pngFilename}`)
          })
          .catch(() => {
              throw VError(err, `Failed to convert SVG diagram ${svgImput} to PNG diagram ${pngFilename}`)
          })
    }
    else {
        // TODO delete the svg file
    }
}

const getMethod = function(contract, node){
    let mtString = ""
    let isAbstract = false

    if(node.type === "FunctionDefinition"){

        let hasReturnValue = true

        switch(node.visibility){
            case 'internal':
                mtString += "# "
                break
            case 'private':
                mtString += "- "
                break
            case null:
            case undefined:
            case 'public':
            case 'default':
            case 'external':
                mtString += "+ "
                break
        }

        let methodName = node.name

        if(node.isConstructor){
            methodName = 'constructor'
            hasReturnValue = false
        }

        const parameters = formatParameters(node.parameters)

        let returnValues = ""
        if(node.returnParameters != null){
            returnValues = formatParameters(node.returnParameters)
        } else {
            hasReturnValue = false
        }

        // is fallback method?
        if(methodName === '')
            methodName = "«fallback»"

        if (node.body === null) {
            isAbstract = true
        }

        mtString += methodName + "(" + parameters + ")" + (hasReturnValue ? " : (" + returnValues + ")" : "")
    }

    if(node.type === "EventDefinition" || node.type === "ModifierDefinition"){

        mtString += (node.type === "EventDefinition" ? "«event» " : "«modifier» ") + node.name + "(" + formatParameters(node.parameters) + ")"
    }

    contract.methods.push(mtString)

    return isAbstract
}

function formatParameters(params) {

    if (!params.parameters || params.parameters === 0) {
        return ''
    }

    let p = []
    for (const param of params.parameters) {

        let formattedParam = formatType(param.typeName)

        // return parameters do not have to be named
        if (param.name) {
            formattedParam += ' ' + param.name
        }

        p.push(formattedParam)
    }

    return p.join(', ')
}

function formatType(typeName) {

    if (typeName.type === 'UserDefinedTypeName') {

        return typeName.namePath
    }

    if (typeName.type === 'ElementaryTypeName') {

        return typeName.name
    }

    if (typeName.type === 'ArrayTypeName') {

        return formatType(typeName.baseTypeName) + '[]'
    }

    if (typeName.type === 'Mapping') {

        return `mapping(${formatType(typeName.keyType)} : ${formatType(typeName.valueType)} )`
    }

    throw Error(`Could not format type ${typeName.type}`)
}

const getAttribute = function(contract, variable){
    let attString = ""

    switch(variable.visibility){
        case null:
        case 'default':
        case 'internal':
            attString += "# "
            break
        case 'private':
            attString += "- "
            break
        case 'public':
            attString += "+ "
            break
    }

    try {
        attString += variable.name + " : " + formatType(variable.typeName, contract.name)
    }
    catch (err) {
        throw VError(err, `Could not format attribute ${contract.name}.${variable.name}`)
    }

    // add to contract compositions
    if (variable.typeName.type === 'UserDefinedTypeName') {
        contract.compositions.push(variable.typeName.namePath)
    }

    contract.attributes.push(attString)
}

const addContract = function(node){

    const baseContractNames = node.baseContracts.map(c => c.baseName.namePath)

    const contract = {
        id: ++idCnt,
        name: node.name,
        isInterface: node.kind === "interface",
        isLibrary: node.kind === "library",
        isAbstract: false,
        is: baseContractNames,
        attributes: [],
        methods: [],
        compositions: [],
        associations: [],
    }

    node.subNodes.forEach(function(subNode){
        switch(subNode.type){
            case "StateVariableDeclaration":
                subNode.variables.forEach(v => getAttribute(contract, v))
                break
            case "ModifierDefinition":
            case "EventDefinition":
            case "FunctionDefinition":
                // get contract method and check that it's not abstract
                const isMethodAbstract = getMethod(contract, subNode)

                // mark contract as abstract if function not implemented
                // and contract is not already abstract and not an interface
                if (isMethodAbstract &&
                  contract.isAbstract === false &&
                  !contract.isInterface) {
                    contract.isAbstract = true
                }
                break
            case "UsingForDeclaration":
                // register composition relationship
                contract.compositions.push(subNode.libraryName)
                break
        }
    })

    idMapping[node.name] = contract.id

    node.subNodes.forEach(node => {
        if(node.type === "StructDefinition")
            addStructure(node, contract)
    })

    contracts.push(contract)
}

const addStructure = function(node, parentContract){
    structObj = {
        id: ++idCnt,
        name: node.name,
        attributes: [],
        parentContractId: parentContract.id,
        compositions: [],
        associations: []
    }

    // add the Struct attributes
    node.members.forEach(member => {
        if(member.type === "VariableDeclaration"){
            getAttribute(structObj, member)
        }
    })

    idMapping[node.name] = structObj.id

    structures.push(structObj)
}

const analyzeComposition = function(contracts, structs){

    const func = function(contract){
        let currentComposition = contract.compositions.filter(function(item, pos, self) {
            return self.indexOf(item) === pos
        })

        currentComposition.forEach(function(comp){
            if(!(comp in idMapping)){
                contract.compositions = contract.compositions.filter(item => item !== comp)
            }
        })
    }

    contracts.forEach(func)
    structs.forEach(func)

    let compFunction = function(c){
        let currentComposition = c.compositions
        for(let i = 0; i < currentComposition.length; i++){
            if(structs.filter(x => x.name === currentComposition[i]).length > 0){
                // Structs cannot exist without their contract
                c.compositions = c.compositions.filter(item => item !== currentComposition[i])
            }
        }
    }

    contracts.forEach(compFunction)

    // Structs are associated between them
    structs.forEach(function(c){
        let currentComposition = c.compositions
        for(let i = 0; i < currentComposition.length; i++){
            if(structs.filter(x => x.name === currentComposition[i]).length > 0){
                c.associations.push(currentComposition[i])
                c.compositions = c.compositions.filter(item => item !== currentComposition[i])
            }
        }
    })

    assocFunc = function(c){
        let currentComposition = c.compositions
        for(let i = 0; i < currentComposition.length; i++){
            if(contracts.filter(x => x.name === currentComposition[i]).length > 0){
                c.compositions = c.compositions.filter(item => item !== currentComposition[i])
                c.associations.push(currentComposition[i])
            }
        }
    }

    contracts.forEach(assocFunc)
    structs.forEach(assocFunc)

}


const generateDiagram = function(filepath, output){

    debug(`Generating diagram for Solidity files under ${filepath}`)

    try {
        const fileOrDir = fs.lstatSync(filepath)

        if(fileOrDir.isDirectory() ) {

            const files = []
            klaw(filepath)
              .on('data', file => {
                  if (path.extname(file.path) === '.sol')
                      files.push(file.path)
              })
              .on('end', () => processSolFiles(files, output) )
        }
        else if (fileOrDir.isFile() ) {

            if (path.extname(filepath) === '.sol') {
                processSolFiles([filepath], output)
            }
            else {
                console.error(`Error: File ${filepath} does not have a .sol extension.`)
            }
        } else {
            console.error(`Error: Could not find directory or file ${filepath}`)
        }
    } catch(err) {
        if(err.code === 'ENOENT'){
            console.error(`Error: No such directory ${filepath}. Make sure you pass in the root directory of the contracts`)
        }else {
            const error = new VError(err, `Failed to generate UML diagram for Solidity files under the ${filepath} folder`)
            console.error(error.stack)
        }
    }
}

exports.generateDiagram = generateDiagram
