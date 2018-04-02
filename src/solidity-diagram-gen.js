const fs = require("fs");
const klaw = require('klaw');
const path = require('path');
const SolidityParser = require("solidity-parser");
const Viz = require('viz.js');


let contracts = [];
let structures = [];
let idMapping = {};
let relationShips = [];
let idCnt = 0;

const processSolFiles = (fileArray) => {
    contractString = "";
    relationshipString = "";
    structString = "";
    compositionString = "";
    associationString = "";

    fileArray.forEach(function(f){
        let parseResult = SolidityParser.parseFile(f);
        if(parseResult.type == "Program"){
            parseResult.body.forEach(function(c){
                if(c.type == "ContractStatement" || c.type =="InterfaceStatement"){
                    addContract(c);
                }
            });  
        }
    });

    analyzeComposition(contracts, structures);

    contracts.forEach(function(c){
        let contractLabel = "";
        
        if(c.isInterface){
            contractLabel += "«interface»\\n";
        }

        contractLabel += `${c.name}`

        if(c.attributes.length > 0){
            contractLabel += "|";
            c.attributes.forEach(function(a){
                contractLabel += a + '\\l';
            })
            
        } 

        if(c.methods.length > 0){
            contractLabel += "|";
            c.methods.forEach(function(a){
                contractLabel += a + '\\l';
            })
            
        } 

        contractString += `${c.id}[label = "{${contractLabel}}"]`
        contractString += "\n";

        if(c.is.length > 0){
            c.is.forEach(function(i){
                relationshipString += `${idMapping[i]}->${c.id}`
                relationshipString += "\n";
            });
        }

        if(c.compositions.length > 0){
            c.compositions.forEach(function(i){
                compositionString += `${c.id}->${idMapping[i]}[constraint=true, arrowtail=diamond]`
                compositionString += "\n";
            })
        }

        if(c.associations.length > 0){
            c.associations.forEach(function(i){
                associationString += `${idMapping[i]}->${c.id}[constraint=true, arrowtail=open]`
                associationString += "\n";
            })
        }
    });


    structures.forEach(function(s){
        let label = `«struct»\\n${s.name}`

        if(s.attributes.length > 0){
            label += "|";
            s.attributes.forEach(function(a){
                label += a + '\\l';
            })
        }

        structString += `${s.id}[fillcolor = "#cfcfcf", label = "{${label}}"]`
        structString += "\n";

        relationshipString += `${s.parentContractId}->${s.id}[constraint=true, arrowtail=diamond]`
        relationshipString += "\n";


        if(s.compositions.length > 0){
            s.compositions.forEach(function(i){
                compositionString += `${s.id}->${idMapping[i]}[constraint=true, arrowtail=diamond]`
                compositionString += "\n";
            })
        }

        if(s.associations.length > 0){
            s.associations.forEach(function(i){
                associationString += `${idMapping[i]}->${s.id}[constraint=true, arrowtail=open]`
                associationString += "\n";
            })
        }
    });

    



    let dot = `
digraph hierarchy {
    node[shape=record,style=filled,fillcolor=gray95]
    edge[dir=back, arrowtail=empty]

${contractString}

${structString}

${relationshipString}

${compositionString}

${associationString}

}`;

    let svg = Viz(dot);
    let filename = "diagram" /*+ "-" + (new Date()).YYYYMMDDHHMMSS()*/ + ".svg";

    fs.writeFile(filename, svg, function(err) {
        if(err) {
            return console.log(err);
        } else {
            console.log("Diagram generated: " + filename);
        }
    }); 
}

const getMethod = function(obj, b){
    let mtString = "";

    if(b.type == "FunctionDeclaration"){

        let hasReturnValue = true;

        
        let visibility = "public";
        
        if(b.modifiers != undefined && b.modifiers.length > 0){
            visibility = b.modifiers.find(x => ["public", "private", "internal", "external"].includes(x.name));
            
            if(visibility != null) 
                visibility = visibility.name;
        }

        switch(visibility){
            case 'internal':
                mtString += "# "
                break;
            case 'private':
                mtString += "- ";
                break;
            case null:
            case undefined:
            case 'public':
            case 'external':
                mtString += "+ ";
                break;
        }

        if(b.name == obj.name){
            mtString += "«constructor» ";
            hasReturnValue = false;
        }
        
        // TODO
        let parameters = "";
        if(b.params != null){
            let p = [];
            for(let i = 0; i < b.params.length; i++){
                p.push(b.params[i].literal.literal + ' ' + b.params[i].id);
            }
            parameters = p.join(', ');
        } 

        let returnValues = "";
        if(b.returnParams != null){
            let p = [];
            for(let i = 0; i < b.returnParams.length; i++){
                p.push(b.returnParams[i].literal.literal + (b.returnParams[i].id != null ? " " + b.returnParams[i].id : ""));
            }
            returnValues = p.join(', ');
        } else {
            hasReturnValue = false;
        }


        let name = b.name ;
        if(name == null)
            name = "«fallback»";

        mtString += name + "(" + parameters + ")" + (hasReturnValue ? " : (" + returnValues + ")" : "");
    }

    if(b.type == "EventDeclaration" || b.type == "ModifierDeclaration"){
        let parameters = "";
        if(b.params != null){
            let p = [];
            for(let i = 0; i < b.params.length; i++){
                p.push(b.params[i].literal.literal + ' ' + b.params[i].id);
            }
            parameters = p.join(', ');
        } 

        mtString += (b.type == "EventDeclaration" ? "«event» " : "«modifier» ") + b.name + "(" + parameters + ")";
    }

    obj.methods.push(mtString);
}

const getAttribute = function(obj, b){
    let attString = "";

    switch(b.visibility){
        case null: 
        case 'internal':
            attString += "# "
            break;
        case 'private':
            attString += "- ";
            break;
        case 'public':
            attString += "+ ";
            break;
    }

    attString += b.name + " : ";

    if(typeof b.literal.literal === 'string'){
        attString += b.literal.literal;
        obj.compositions.push(b.literal.literal);
    } else {
        if(b.literal.literal.type == 'MappingExpression'){
            attString += "mapping";
            // TODO extract mapping variables
        } else {
            // TODO what's this?
            console.log(b);
        }
        
    }

    obj.attributes.push(attString);
}



const addContract = function(c){
    let isArr = [];
    
    if(c.is != undefined && c.is.length > 0){
        c.is.forEach(function(i){
            isArr.push(i.name);
        })
    }

    contractObj = {
        id: ++idCnt,
        name: c.name,
        isInterface: c.type == "InterfaceStatement",
        is: isArr,
        attributes: [],
        methods: [],
        compositions: [],
        associations: [],
    };

    if(c.body && c.body.length > 0){
        c.body.forEach(function(b){
            switch(b.type){
                case "StateVariableDeclaration": 
                    getAttribute(contractObj, b);
                    break;
                case "ModifierDeclaration":
                case "EventDeclaration":
                case "FunctionDeclaration":
                    getMethod(contractObj, b);
                    break;
            }
        });
    }

    idMapping[c.name] = contractObj.id;

    if(c.body && c.body.length > 0)
        c.body.forEach(function(b){
            if(b.type == "StructDeclaration")
                addStructure(b, contractObj);
        });

    contracts.push(contractObj);
}

const addStructure = function(c, parentContract){
    structObj = {
        id: ++idCnt,
        name: c.name,
        attributes: [],
        parentContractId: parentContract.id,
        compositions: [],
        associations: []
    };

    if(c.body && c.body.length > 0)
        c.body.forEach(function(b){
            if(b.type == "DeclarativeExpression"){
                getAttribute(structObj, b);
            }
        });

    idMapping[c.name] = structObj.id;

    structures.push(structObj);
}


const analyzeComposition = function(contracts, structs){
    let func = function(c){
        let currentComposition = c.compositions.filter(function(item, pos, self) {
            return self.indexOf(item) == pos;
        });

        currentComposition.forEach(function(comp){
            if(!(comp in idMapping)){
                c.compositions = c.compositions.filter(item => item !== comp);
            }
        })
    };
    
    contracts.forEach(func);
    structs.forEach(func);
    
    let compFunction = function(c){
        let currentComposition = c.compositions;
        for(let i = 0; i < currentComposition.length; i++){
            if(structs.filter(x => x.name == currentComposition[i]).length > 0){
                // Structs cannot exist without their contract
                c.compositions = c.compositions.filter(item => item !== currentComposition[i]);
            }
        }
    }

    contracts.forEach(compFunction);

    // Structs are associated between them
    structs.forEach(function(c){
        let currentComposition = c.compositions;
        for(let i = 0; i < currentComposition.length; i++){
            if(structs.filter(x => x.name == currentComposition[i]).length > 0){
                c.associations.push(currentComposition[i]);
                c.compositions = c.compositions.filter(item => item !== currentComposition[i]);
            }
        }
    })
  
    assocFunc = function(c){
        let currentComposition = c.compositions;
        for(let i = 0; i < currentComposition.length; i++){
            if(contracts.filter(x => x.name == currentComposition[i]).length > 0){
                c.compositions = c.compositions.filter(item => item !== currentComposition[i]);
                c.associations.push(currentComposition[i]);
            }
        }
    };

    contracts.forEach(assocFunc);
    structs.forEach(assocFunc);

}





const generateDiagram = function(filepath){
    console.log("Generating diagram...");
    
    try {
        if(fs.lstatSync(filepath).isDirectory()){
            const items = [];
            klaw(filepath)
            .on('data', item => {
                if (path.extname(item.path) === '.sol')
                    items.push(item.path) 
                })
            .on('end', () => processSolFiles(items));
        } else {
            console.error("Error: Path must be a valid directory");
        }
    } catch(e) {
        if(e.code == 'ENOENT'){
            console.error("Error: No such file or directory");
        }else {
            console.error("Error: Unhandled exception", e);
        }
    }
}




exports.generateDiagram = generateDiagram;