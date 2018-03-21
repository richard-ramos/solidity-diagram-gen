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
            
        } else {
            contractLabel += "|..."
        }

        contractLabel += "|TODO: parse methods";

        contractString += `${c.id}[label = "{${contractLabel}}"]`
        contractString += "\n";

        if(c.is.length > 0){
            c.is.forEach(function(i){
                relationshipString += `${idMapping[i]}->${c.id}`
                relationshipString += "\n";
            });
        }
    });


    structures.forEach(function(s){
        let label = `«struct»\\n${s.name}`

        if(s.attributes.length > 0){
            label += "|";
            s.attributes.forEach(function(a){
                label += a + '\\l';
            })
            label += "|...";
        }

        structString += `${s.id}[fillcolor = "#cfcfcf", label = "{${label}}"]`
        structString += "\n";

        relationshipString += `${s.parentContractId}->${s.id}[constraint=true, arrowtail=diamond]`
        relationshipString += "\n";
    });

    



    let dot = `
digraph hierarchy {
    node[shape=record,style=filled,fillcolor=gray95]
    edge[dir=back, arrowtail=empty]

${contractString}

${structString}

${relationshipString}

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


const getAttribute = function(b){
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
    } else {
        if(b.literal.literal.type == 'MappingExpression'){
            attString += "mapping";
            // TODO extract mapping variables
        } else {
            // TODO what's this?
            console.log(b);
        }
        
    }

    return attString;
}






const addContract = function(c){
    let isArr = [];
    let attArr = [];

    if(c.body && c.body.length > 0)
        c.body.forEach(function(b){
            if(b.type == "StateVariableDeclaration"){
                attArr.push(getAttribute(b));
            }
        });

    if(c.is != undefined && c.is.length > 0){
        c.is.forEach(function(i){
            isArr.push(i.name);
        })
    }

    contractObj = {
        id: ++idCnt,
        name: c.name,
        isInterface: c.type =="InterfaceStatement",
        is: isArr,
        attributes: attArr,
        structs: []
    };

    idMapping[c.name] = contractObj.id;

    if(c.body && c.body.length > 0)
        c.body.forEach(function(b){
            if(b.type == "StructDeclaration")
                addStructure(b, contractObj);
        });

    contracts.push(contractObj);
}


const addStructure = function(c, parentContract){
    let isArr = [];
    let attArr = [];

    if(c.body && c.body.length > 0)
        c.body.forEach(function(b){
            if(b.type == "DeclarativeExpression"){
                attArr.push(getAttribute(b));
            }
        });

    if(c.is != undefined && c.is.length > 0){
        c.is.forEach(function(i){
            isArr.push(i.name);
        })
    }

    structObj = {
        id: ++idCnt,
        name: c.name,
        attributes: attArr,
        parentContractId: parentContract.id
    };

    idMapping[c.name] = structObj.id;

    structures.push(structObj);
}







Object.defineProperty(Date.prototype, 'YYYYMMDDHHMMSS', {
    value: function() {
        function pad2(n) {  // always returns a string
            return (n < 10 ? '0' : '') + n;
        }

        return this.getFullYear() +
               pad2(this.getMonth() + 1) + 
               pad2(this.getDate()) +
               pad2(this.getHours()) +
               pad2(this.getMinutes()) +
               pad2(this.getSeconds());
    }
});



const generateDiagram = function(filepath){
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