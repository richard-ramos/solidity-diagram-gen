import { dirname, relative } from 'path'

export enum Visibility {
    None,
    Public,
    External,
    Internal,
    Private,
}

export enum ClassStereotype {
    None,
    Library,
    Interface,
    Abstract,
    Contract,
}

export enum OperatorStereotype {
    None,
    Modifier,
    Event,
    Payable,
    Fallback,
    Abstract,
}

export interface Parameter {
    // name is not required in return parameters
    // but is required in operator parameters
    name?: string,
    type: string,
}

export interface Attribute {
    visibility?: Visibility,
    name: string,
    type?: string,
}

export interface Operator extends Attribute {
    stereotype?: OperatorStereotype,
    parameters?: Required<Parameter>[],
    returnParameters?: Parameter[],
}

export enum ReferenceType {
    Memory,
    Storage,
}

export interface Association {
    referenceType: ReferenceType,
    targetUmlClassName: string,
    targetUmlClassStereotype?: ClassStereotype,
    realization?: boolean,
}

export interface ClassProperties {
    name: string
    sourceFile: string
    stereotype?: ClassStereotype
    enums?: {[name: string]: string[]}
    attributes?: Attribute[]
    operators?: Operator[]
    associations?: {[name: string]: Association}
}

export class UmlClass implements ClassProperties {

    static idCounter = 1

    id: number
    name: string
    sourceFile: string
    stereotype?: ClassStereotype

    attributes: Attribute[] = []
    operators: Operator[] = []

    enums: {[name: string]: string[]} = {}
    structs: {[name: string]: Parameter[]} = {}
    associations: {[name: string]: Association} = {}

    constructor(properties: ClassProperties) {
        if (!properties || !properties.name) {
            throw TypeError(`Failed to instantiate UML Class with no name property`)
        }

        Object.assign(this, properties);

        // Generate a unique identifier for this UML Class
        this.id = UmlClass.idCounter++
    }

    addAssociation(association: Association) {
        if (!association || !association.targetUmlClassName) {
            throw TypeError(`Failed to add association. targetUmlClassName was missing`)
        }

        // Will not duplicate lines to the same class and stereotype
        // const targetUmlClass = `${association.targetUmlClassName}#${association.targetUmlClassStereotype}`
        const targetUmlClass = association.targetUmlClassName

        // If association doesn't already exist
        if (!this.associations[targetUmlClass]) {
            this.associations[targetUmlClass] = association
        }
        // associate already exists
        else {
            // If new attribute reference type is Storage
            if (association.referenceType === ReferenceType.Storage) {
                this.associations[targetUmlClass].referenceType = ReferenceType.Storage
            }
        }
    }

    // Returns a string of the UML Class in Graphviz's dot format
    dotUmlClass(): string {

        let dotString = `\n${this.id} [label="{${this.dotClassTitle()}`

        // Add attributes
        dotString += this.dotAttributeVisibilities()

        // Add operators
        dotString += this.dotOperatoreVisibilities()

        dotString += '}"]'

        // Output structs and enums
        dotString += this.dotStructs()
        dotString += this.dotEnums()

        return dotString
    }

    dotClassTitle(): string {

        let stereoName: string = ''
        switch (this.stereotype) {
            case ClassStereotype.Abstract:
                stereoName = 'Abstract'
                break
            case ClassStereotype.Interface:
                stereoName = 'Interface'
                break
            case ClassStereotype.Library:
                stereoName = 'Library'
                break
            default:
                // Contract or undefined stereotype will just return the UmlClass name
                return this.name
        }

        return `\\<\\<${stereoName}\\>\\>\\n${this.name}`
    }

    dotAttributeVisibilities(): string {
        let dotString = '| '

        // For each visibility group
        for (const vizGroup of ['Private', 'Internal', 'External', 'Public']) {

            const attributes: Attribute[] = []

            // For each attribute of te UML Class
            for (const attribute of this.attributes)
            {
                if (vizGroup === 'Private' &&
                    attribute.visibility === Visibility.Private)
                {
                    attributes.push(attribute)
                }
                else if (vizGroup === 'Internal' &&
                    attribute.visibility === Visibility.Internal)
                {
                    attributes.push(attribute)
                }
                else if (vizGroup === 'External' &&
                    attribute.visibility === Visibility.External)
                {
                    attributes.push(attribute)
                }
                // Rest are Public, None or undefined visibilities
                else if (vizGroup === 'Public' && (
                        attribute.visibility === Visibility.Public ||
                        attribute.visibility === Visibility.None ||
                        !attribute.visibility)
                ) {
                    attributes.push(attribute)
                }
            }

            dotString += UmlClass.dotAttributes(vizGroup, attributes)
        }

        return dotString
    }

    static dotAttributes(vizGroup: string, attributes: Attribute[]): string {

        if (!attributes || attributes.length === 0) {
            return ''
        }

        let dotString = vizGroup + ':\\l'

        // for each attribute
        attributes.forEach(attribute => {
            dotString += `\\ \\ \\ ${attribute.name}: ${attribute.type}\\l`
        })

        return dotString
    }


    dotOperatoreVisibilities(): string {
        let dotString = '| '

        // For each visibility group
        for (const vizGroup of ['Private', 'Internal', 'External', 'Public']) {

            const operators: Operator[] = []

            // For each attribute of te UML Class
            for (const operator of this.operators)
            {
                if (vizGroup === 'Private' &&
                    operator.visibility === Visibility.Private)
                {
                    operators.push(operator)
                }
                else if (vizGroup === 'Internal' &&
                    operator.visibility === Visibility.Internal)
                {
                    operators.push(operator)
                }
                else if (vizGroup === 'External' &&
                    operator.visibility === Visibility.External)
                {
                    operators.push(operator)
                }
                // Rest are Public, None or undefined visibilities
                else if (vizGroup === 'Public' && (
                    operator.visibility === Visibility.Public ||
                    operator.visibility === Visibility.None ||
                    !operator.visibility)
                ) {
                    operators.push(operator)
                }
            }

            dotString += this.dotOperators(vizGroup, operators)
        }

        return dotString
    }

    dotOperators(vizGroup: string, operators: Operator[]): string {

        // Skip if there are no operators
        if (!operators || operators.length === 0) {
            return ''
        }

        let dotString = vizGroup + ':\\l'

        // Sort the operators by stereotypes
        const operatorsSortedByStereotype = operators.sort((a, b) => {
            return b.stereotype - a.stereotype
        })

        for (const operator of operatorsSortedByStereotype) {

            dotString += '\\ \\ \\ \\ '

            if (operator.stereotype > 0) {
                dotString += this.dotOperatorStereotype(operator.stereotype)
            }

            dotString += operator.name

            dotString += UmlClass.dotParameters(operator.parameters)

            if (operator.returnParameters) {
                dotString += ': ' + UmlClass.dotParameters(operator.returnParameters)
            }

            dotString += '\\l'
        }

        return dotString
    }

    dotOperatorStereotype(operatorStereotype: OperatorStereotype): string {

        let dotString = ''

        switch (operatorStereotype) {
            case OperatorStereotype.Event:
                dotString += '\\<\\<event\\>\\>'
                break
            case OperatorStereotype.Fallback:
                dotString += '\\<\\<fallback\\>\\>'
                break
            case OperatorStereotype.Modifier:
                dotString += '\\<\\<modifier\\>\\>'
                break
            case OperatorStereotype.Abstract:
                if (this.stereotype === ClassStereotype.Abstract) {
                    dotString += '\\<\\<abstract\\>\\>'
                }
                break
            case OperatorStereotype.Payable:
                dotString += '\\<\\<payable\\>\\>'
                break
            default:
                break
        }

        return dotString + ' '
    }

    static dotParameters(parameters: Parameter[]): string {

        if (parameters.length == 1 &&
            !parameters[0].name) {
            return parameters[0].type
        }

        let dotString = '('
        let paramCount = 0

        for (const parameter of parameters) {
            // If not the last parameter
            if (++paramCount < parameters.length) {
                dotString += parameter.name + ': ' + parameter.type + ', '
            }
            else {
                // last parameter
                dotString += parameter.name + ': ' + parameter.type
            }
        }

        return dotString + ')'
    }

    dotStructs(): string {
        let dotString = ''
        let structCount = 0

        // for each struct declared in the contract
        for (const structKey of Object.keys(this.structs)) {
            const structId = this.id + 'struct' + structCount++
            dotString += `\n"${structId}" [label="{\\<\\<struct\\>\\>\\n${structKey}|`

            // output each attribute of the struct
            for (const attribute of this.structs[structKey]) {
                dotString += attribute.name + ': ' + attribute.type + '\\l'
            }

            dotString += '}"]'

            // Add the association to the contract the struct was declared in
            dotString += `\n"${structId}" -> ${this.id} [arrowhead=diamond, weight=3]`
        }

        return dotString
    }

    dotEnums(): string {
        let dotString = ''
        let enumCount = 0

        // for each enum declared in the contract
        for (const enumKey of Object.keys(this.enums)) {
            const enumId = this.id + 'enum' + enumCount++
            dotString += `\n"${enumId}" [label="{\\<\\<enum\\>\\>\\n${enumKey}|`

            // output each enum value
            for (const value of this.enums[enumKey]) {
                dotString += value + '\\l'
            }

            dotString += '}"]'

            // Add the association to the contract the enum was declared in
            dotString += `\n"${enumId}" -> ${this.id} [arrowhead=diamond, weight=3]`
        }

        return dotString
    }

    get sourceFileFolder(): string {
        if (!this.sourceFile) {
            return ''
        }

        const sourceFolder = dirname(this.sourceFile)
        const relativeSourceFolder = relative(process.cwd(), sourceFolder)

        return relativeSourceFolder
    }
}
