const fs = require("fs")
const klaw = require('klaw')
const path = require('path')
const SolidityParser = require("solidity-parser-antlr")
const Viz = require('viz.js')
const svg_to_png = require('svg-to-png')
const VError = require('verror')
const debug = require('debug')('sol2uml')

let umlClasses = []
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

                        addUmlClass(contract)
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

    analyzeComposition(umlClasses, structures)

    const dot = constructDot()

    outputDiagram(dot, output)
}

function constructDot() {
    let contractString = ""
    let relationshipString = ""
    let structString = ""
    let compositionString = ""
    let associationString = ""

    umlClasses.forEach(function (umlClass) {
        let classLabel = ""

        if (umlClass.isInterface) {
            classLabel += "«Interface»\\n"
        }

        if (umlClass.isLibrary) {
            classLabel += "«Library»\\n"
        }

        if (umlClass.isAbstract) {
            classLabel += "«Abstract»\\n"
        }

        classLabel += `${umlClass.name}`

        if (umlClass.attributes.length > 0) {
            classLabel += "|"
            umlClass.attributes.forEach(function (a) {
                classLabel += a + '\\l'
            })

        }

        if (umlClass.operations.length > 0) {
            classLabel += "|"
            umlClass.operations.forEach(function (a) {
                classLabel += a + '\\l'
            })

        }

        contractString += `${umlClass.id}[label = "{${classLabel}}"]`
        contractString += "\n"

        if (umlClass.generalisations.length > 0) {
            umlClass.generalisations.forEach(function (i) {
                relationshipString += `${idMapping[i]}->${umlClass.id}`
                relationshipString += "\n"
            })
        }

        if (umlClass.compositions.length > 0) {
            umlClass.compositions.forEach(function (i) {
                compositionString += `${umlClass.id}->${idMapping[i]}[constraint=true, arrowtail=diamond]`
                compositionString += "\n"
            })
        }

        if (umlClass.associations.length > 0) {
            umlClass.associations.forEach(function (i) {
                associationString += `${idMapping[i]}->${umlClass.id}[constraint=true, arrowtail=open]`
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

function addOperation(umlClass, node){
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

    umlClass.operations.push(mtString)

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

function addAttribute(umlClass, variable){
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
        attString += variable.name + " : " + formatType(variable.typeName, umlClass.name)
    }
    catch (err) {
        throw VError(err, `Could not format attribute ${umlClass.name}.${variable.name}`)
    }

    // add to class compositions
    if (variable.typeName.type === 'UserDefinedTypeName') {
        addAssociation(umlClass, variable.typeName.namePath)
    }

    umlClass.attributes.push(attString)
}

// only adds a class to the associations if its not already in the list
function addAssociation(umlClass, targetClassName) {
    // if already in the associations list
    // TODO change to associations
    umlClass.compositions.push(targetClassName)
}

// function getDependencies(body) {
//
//     // for each statement
//     body.statements.forEach( statement => {
//         if (statement.type === 'VariableDeclarationStatement') {
//             statement.variables.forEach( variable => {
//                 if (variable.typeName.type === 'UserDefinedTypeName') {
//                     contract.associations.push(variable.typeName.namePath)
//                 }
//             })
//         }
//     })
// }

function addUmlClass(node){

    const baseContractNames = node.baseContracts.map(contract => contract.baseName.namePath)

    const umlClass = {
        id: ++idCnt,
        name: node.name,
        isInterface: node.kind === "interface",
        isLibrary: node.kind === "library",
        isStruct: node.type === "StructDefinition",
        isAbstract: false,
        attributes: [],
        operations: [],
        // relationships
        generalisations: baseContractNames,  // generalisations
        compositions: [],       // to be removed
        associations: [],       // storage variable
        dependencies: [],       // memory variables
    }

    node.subNodes.forEach(function(subNode){
        switch(subNode.type){
            case "StateVariableDeclaration":
                subNode.variables.forEach(variable => {
                    addAttribute(umlClass, variable)
                })
                break
            case "StructDefinition":
                addStructure(umlClass, subNode)
                break
            case "ModifierDefinition":
            case "EventDefinition":
            case "FunctionDefinition":
                // get contract method and check that it's not abstract
                const isMethodAbstract = addOperation(umlClass, subNode)

                // mark contract as abstract if function not implemented
                // and contract is not already abstract and not an interface
                if (isMethodAbstract &&
                  umlClass.isAbstract === false &&
                  !umlClass.isInterface) {
                    umlClass.isAbstract = true
                }

                if (subNode.body != null) {
                    // getDependencies(subNode.body)
                }

                break
            case "UsingForDeclaration":
                // register composition relationship
                umlClass.compositions.push(subNode.libraryName)
                break
        }
    })

    idMapping[node.name] = umlClass.id

    umlClasses.push(umlClass)
}

function addStructure(parentUmlClass, node) {
    const umlClass = {
        id: ++idCnt,
        name: node.name,
        attributes: [],
        parentContractId: parentUmlClass.id,
        compositions: [],
        associations: []
    }

    // add the Struct attributes
    node.members.forEach(member => {
        if(member.type === "VariableDeclaration"){
            addAttribute(umlClass, member)
        }

        // TODO add associations with other stucts, interface or contracts
    })

    idMapping[node.name] = umlClass.id

    structures.push(umlClass)
}

function analyzeComposition(contracts, structs){

    function func(contract){
        const currentComposition = contract.compositions.filter((item, pos, self) => {
            return self.indexOf(item) === pos
        })

        currentComposition.forEach( comp => {
            if(!(comp in idMapping)){
                contract.compositions = contract.compositions.filter(item => item !== comp)
            }
        })
    }

    contracts.forEach(func)
    structs.forEach(func)

    function compFunction(contract){
        const currentComposition = contract.compositions

        for(let i = 0; i < currentComposition.length; i++) {

            if(structs.filter(x => x.name === currentComposition[i]).length > 0) {
                // Structs cannot exist without their contract
                contract.compositions = contract.compositions.filter(item => item !== currentComposition[i])
            }
        }
    }

    contracts.forEach(compFunction)

    // Structs are associated between them
    structs.forEach(function(contract){
        const currentComposition = contract.compositions

        for(let i = 0; i < currentComposition.length; i++){
            if(structs.filter(x => x.name === currentComposition[i]).length > 0){
                contract.associations.push(currentComposition[i])
                contract.compositions = contract.compositions.filter(item => item !== currentComposition[i])
            }
        }
    })

    function assocFunc(contract){
        const currentComposition = contract.compositions

        for(let i = 0; i < currentComposition.length; i++){
            if(contracts.filter(x => x.name === currentComposition[i]).length > 0){
                contract.compositions = contract.compositions.filter(item => item !== currentComposition[i])
                contract.associations.push(currentComposition[i])
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
