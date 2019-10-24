"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Visibility;
(function (Visibility) {
    Visibility[Visibility["None"] = 0] = "None";
    Visibility[Visibility["Public"] = 1] = "Public";
    Visibility[Visibility["External"] = 2] = "External";
    Visibility[Visibility["Internal"] = 3] = "Internal";
    Visibility[Visibility["Private"] = 4] = "Private";
})(Visibility = exports.Visibility || (exports.Visibility = {}));
var ClassStereotype;
(function (ClassStereotype) {
    ClassStereotype[ClassStereotype["None"] = 0] = "None";
    ClassStereotype[ClassStereotype["Library"] = 1] = "Library";
    ClassStereotype[ClassStereotype["Interface"] = 2] = "Interface";
    ClassStereotype[ClassStereotype["Abstract"] = 3] = "Abstract";
    ClassStereotype[ClassStereotype["Contract"] = 4] = "Contract";
})(ClassStereotype = exports.ClassStereotype || (exports.ClassStereotype = {}));
var OperatorStereotype;
(function (OperatorStereotype) {
    OperatorStereotype[OperatorStereotype["None"] = 0] = "None";
    OperatorStereotype[OperatorStereotype["Modifier"] = 1] = "Modifier";
    OperatorStereotype[OperatorStereotype["Event"] = 2] = "Event";
    OperatorStereotype[OperatorStereotype["Payable"] = 3] = "Payable";
    OperatorStereotype[OperatorStereotype["Fallback"] = 4] = "Fallback";
    OperatorStereotype[OperatorStereotype["Abstract"] = 5] = "Abstract";
})(OperatorStereotype = exports.OperatorStereotype || (exports.OperatorStereotype = {}));
var ReferenceType;
(function (ReferenceType) {
    ReferenceType[ReferenceType["Memory"] = 0] = "Memory";
    ReferenceType[ReferenceType["Storage"] = 1] = "Storage";
})(ReferenceType = exports.ReferenceType || (exports.ReferenceType = {}));
class UmlClass {
    constructor(properties) {
        this.attributes = [];
        this.operators = [];
        this.enums = {};
        this.structs = {};
        this.associations = {};
        if (!properties || !properties.name) {
            throw TypeError(`Failed to instantiate UML Class with no name property`);
        }
        Object.assign(this, properties);
        // Generate a unique identifier for this UML Class
        this.id = UmlClass.idCounter++;
    }
    addAssociation(association) {
        if (!association || !association.targetUmlClassName) {
            throw TypeError(`Failed to add association. targetUmlClassName was missing`);
        }
        // Will not duplicate lines to the same class and stereotype
        // const targetUmlClass = `${association.targetUmlClassName}#${association.targetUmlClassStereotype}`
        const targetUmlClass = association.targetUmlClassName;
        // If association doesn't already exist
        if (!this.associations[targetUmlClass]) {
            this.associations[targetUmlClass] = association;
        }
        // associate already exists
        else {
            // If new attribute reference type is Storage
            if (association.referenceType === ReferenceType.Storage) {
                this.associations[targetUmlClass].referenceType = ReferenceType.Storage;
            }
        }
    }
    // Returns a string of the UML Class in Graphviz's dot format
    dotUmlClass() {
        let dotString = `\n${this.id} [label="{${this.dotClassTitle()}`;
        // Add attributes
        dotString += this.dotAttributeVisibilities();
        // Add operators
        dotString += this.dotOperatoreVisibilities();
        dotString += '}"]';
        // Output structs and enums
        dotString += this.dotStructs();
        dotString += this.dotEnums();
        return dotString;
    }
    dotClassTitle() {
        let stereoName = '';
        switch (this.stereotype) {
            case ClassStereotype.Abstract:
                stereoName = 'Abstract';
                break;
            case ClassStereotype.Interface:
                stereoName = 'Interface';
                break;
            case ClassStereotype.Library:
                stereoName = 'Library';
                break;
            default:
                // Contract or undefined stereotype will just return the UmlClass name
                return this.name;
        }
        return `\\<\\<${stereoName}\\>\\>\\n${this.name}`;
    }
    dotAttributeVisibilities() {
        let dotString = '| ';
        // For each visibility group
        for (const vizGroup of ['Private', 'Internal', 'External', 'Public']) {
            const attributes = [];
            // For each attribute of te UML Class
            for (const attribute of this.attributes) {
                if (vizGroup === 'Private' &&
                    attribute.visibility === Visibility.Private) {
                    attributes.push(attribute);
                }
                else if (vizGroup === 'Internal' &&
                    attribute.visibility === Visibility.Internal) {
                    attributes.push(attribute);
                }
                else if (vizGroup === 'External' &&
                    attribute.visibility === Visibility.External) {
                    attributes.push(attribute);
                }
                // Rest are Public, None or undefined visibilities
                else if (vizGroup === 'Public' && (attribute.visibility === Visibility.Public ||
                    attribute.visibility === Visibility.None ||
                    !attribute.visibility)) {
                    attributes.push(attribute);
                }
            }
            dotString += UmlClass.dotAttributes(vizGroup, attributes);
        }
        return dotString;
    }
    static dotAttributes(vizGroup, attributes) {
        if (!attributes || attributes.length === 0) {
            return '';
        }
        let dotString = vizGroup + ':\\l';
        // for each attribute
        attributes.forEach(attribute => {
            dotString += `\\ \\ \\ ${attribute.name}: ${attribute.type}\\l`;
        });
        return dotString;
    }
    dotOperatoreVisibilities() {
        let dotString = '| ';
        // For each visibility group
        for (const vizGroup of ['Private', 'Internal', 'External', 'Public']) {
            const operators = [];
            // For each attribute of te UML Class
            for (const operator of this.operators) {
                if (vizGroup === 'Private' &&
                    operator.visibility === Visibility.Private) {
                    operators.push(operator);
                }
                else if (vizGroup === 'Internal' &&
                    operator.visibility === Visibility.Internal) {
                    operators.push(operator);
                }
                else if (vizGroup === 'External' &&
                    operator.visibility === Visibility.External) {
                    operators.push(operator);
                }
                // Rest are Public, None or undefined visibilities
                else if (vizGroup === 'Public' && (operator.visibility === Visibility.Public ||
                    operator.visibility === Visibility.None ||
                    !operator.visibility)) {
                    operators.push(operator);
                }
            }
            dotString += this.dotOperators(vizGroup, operators);
        }
        return dotString;
    }
    dotOperators(vizGroup, operators) {
        // Skip if there are no operators
        if (!operators || operators.length === 0) {
            return '';
        }
        let dotString = vizGroup + ':\\l';
        // Sort the operators by stereotypes
        const operatorsSortedByStereotype = operators.sort((a, b) => {
            return b.stereotype - a.stereotype;
        });
        for (const operator of operatorsSortedByStereotype) {
            dotString += '\\ \\ \\ \\ ';
            if (operator.stereotype > 0) {
                dotString += this.dotOperatorStereotype(operator.stereotype);
            }
            dotString += operator.name;
            dotString += UmlClass.dotParameters(operator.parameters);
            if (operator.returnParameters && operator.returnParameters.length > 0) {
                dotString += ': ' + UmlClass.dotParameters(operator.returnParameters, true);
            }
            dotString += '\\l';
        }
        return dotString;
    }
    dotOperatorStereotype(operatorStereotype) {
        let dotString = '';
        switch (operatorStereotype) {
            case OperatorStereotype.Event:
                dotString += '\\<\\<event\\>\\>';
                break;
            case OperatorStereotype.Fallback:
                dotString += '\\<\\<fallback\\>\\>';
                break;
            case OperatorStereotype.Modifier:
                dotString += '\\<\\<modifier\\>\\>';
                break;
            case OperatorStereotype.Abstract:
                if (this.stereotype === ClassStereotype.Abstract) {
                    dotString += '\\<\\<abstract\\>\\>';
                }
                break;
            case OperatorStereotype.Payable:
                dotString += '\\<\\<payable\\>\\>';
                break;
            default:
                break;
        }
        return dotString + ' ';
    }
    static dotParameters(parameters, returnParams = false) {
        if (parameters.length == 1 &&
            !parameters[0].name) {
            if (returnParams) {
                return parameters[0].type;
            }
            else {
                return `(${parameters[0].type})`;
            }
        }
        let dotString = '(';
        let paramCount = 0;
        for (const parameter of parameters) {
            // The parameter name can be null in return parameters
            if (parameter.name === null) {
                dotString += parameter.type;
            }
            else {
                dotString += parameter.name + ': ' + parameter.type;
            }
            // If not the last parameter
            if (++paramCount < parameters.length) {
                dotString += ', ';
            }
        }
        return dotString + ')';
    }
    dotStructs() {
        let dotString = '';
        let structCount = 0;
        // for each struct declared in the contract
        for (const structKey of Object.keys(this.structs)) {
            const structId = this.id + 'struct' + structCount++;
            dotString += `\n"${structId}" [label="{\\<\\<struct\\>\\>\\n${structKey}|`;
            // output each attribute of the struct
            for (const attribute of this.structs[structKey]) {
                dotString += attribute.name + ': ' + attribute.type + '\\l';
            }
            dotString += '}"]';
            // Add the association to the contract the struct was declared in
            dotString += `\n"${structId}" -> ${this.id} [arrowhead=diamond, weight=3]`;
        }
        return dotString;
    }
    dotEnums() {
        let dotString = '';
        let enumCount = 0;
        // for each enum declared in the contract
        for (const enumKey of Object.keys(this.enums)) {
            const enumId = this.id + 'enum' + enumCount++;
            dotString += `\n"${enumId}" [label="{\\<\\<enum\\>\\>\\n${enumKey}|`;
            // output each enum value
            for (const value of this.enums[enumKey]) {
                dotString += value + '\\l';
            }
            dotString += '}"]';
            // Add the association to the contract the enum was declared in
            dotString += `\n"${enumId}" -> ${this.id} [arrowhead=diamond, weight=3]`;
        }
        return dotString;
    }
}
exports.UmlClass = UmlClass;
UmlClass.idCounter = 0;
//# sourceMappingURL=umlClass.js.map