const fs = require("fs");
const klaw = require('klaw');
const path = require('path');
const SolidityParser = require("solidity-parser");
const Viz = require('viz.js');


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


const processSolFiles = (fileArray) => {

    contracts = [];
    idMapping = {};
    idCnt = 0;

    contractString = "";
    relationshipString = "";

    fileArray.forEach(function(f){
        let parseResult = SolidityParser.parseFile(f);
        if(parseResult.type == "Program"){
            parseResult.body.forEach(function(c){
                if(c.type == "ContractStatement" || c.type =="InterfaceStatement"){

                    let isArr = [];
                    let attArr = [];

                    if(c.body && c.body.length > 0)
                        c.body.forEach(function(b){
                            if(b.type == "StateVariableDeclaration"){
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
                                        attString += "mapping"
                                    } else {
                                        console.log(b);
                                    }
                                    
                                }

                                attArr.push(attString);
                            }
                        })

                    if(c.is.length > 0){
                        c.is.forEach(function(i){
                            isArr.push(i.name);
                        })
                    }

                    contractObj = {
                        id: ++idCnt,
                        name: c.name,
                        is: isArr,
                        attributes: attArr
                    };

                    contracts.push(contractObj);
                    idMapping[c.name] = contractObj.id;
                } else {
                    // TODO work with interfaces
                   // console.log(c);
                }
                
            });
        }
        
    });


    contracts.forEach(function(c){
        let contractLabel = `${c.name}`

        if(c.attributes.length > 0){
            contractLabel += "|";
            c.attributes.forEach(function(a){
                contractLabel += a + '\\l';
            })
            contractLabel += "|...";
        }

        contractString += `${c.id}[label = "{${contractLabel}}"]`
        contractString += "\n";

        if(c.is.length > 0){
            c.is.forEach(function(i){
                relationshipString += `${idMapping[i]}->${c.id}`
                relationshipString += "\n";
            });
        }

    });

    



    let dot = `
digraph hierarchy {
    node[shape=record,style=filled,fillcolor=gray95]
    edge[dir=back, arrowtail=empty]

${contractString}

${relationshipString}

}`;

console.log(dot);
/*

2[label = "{AbstractSuffixTree|+ text\n+ root|...}"]
3[label = "{SimpleSuffixTree|...| + constructTree()\l...}"]
4[label = "{CompactSuffixTree|...| + compactNodes()\l...}"]
5[label = "{SuffixTreeNode|...|+ addSuffix(...)\l...}"]
6[label = "{SuffixTreeEdge|...|+ compactLabel(...)\l...}"]


2->3
2->4
5->5[constraint=false, arrowtail=odiamond]
5->4[constraint=false, arrowtail=none]

*/
    let svg = Viz(dot);
    let filename = "diagram-" /*+ (new Date()).YYYYMMDDHHMMSS()*/ + ".svg";

    fs.writeFile(filename, svg, function(err) {
        if(err) {
            return console.log(err);
        } else {
            console.log("Diagram generated: " + filename);
        }
    }); 
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

exports.generateDiagram = generateDiagram;