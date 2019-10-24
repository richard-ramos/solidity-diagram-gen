export declare enum Visibility {
    None = 0,
    Public = 1,
    External = 2,
    Internal = 3,
    Private = 4
}
export declare enum ClassStereotype {
    None = 0,
    Library = 1,
    Interface = 2,
    Abstract = 3,
    Contract = 4
}
export declare enum OperatorStereotype {
    None = 0,
    Modifier = 1,
    Event = 2,
    Payable = 3,
    Fallback = 4,
    Abstract = 5
}
export interface Parameter {
    name?: string;
    type: string;
}
export interface Attribute {
    visibility?: Visibility;
    name: string;
    type?: string;
}
export interface Operator extends Attribute {
    stereotype?: OperatorStereotype;
    parameters?: Parameter[];
    returnParameters?: Parameter[];
    isPayable?: boolean;
}
export declare enum ReferenceType {
    Memory = 0,
    Storage = 1
}
export interface Association {
    referenceType: ReferenceType;
    targetUmlClassName: string;
    targetUmlClassStereotype?: ClassStereotype;
    realization?: boolean;
}
export interface ClassProperties {
    name: string;
    codeSource: string;
    stereotype?: ClassStereotype;
    enums?: {
        [name: string]: string[];
    };
    attributes?: Attribute[];
    operators?: Operator[];
    associations?: {
        [name: string]: Association;
    };
}
export declare class UmlClass implements ClassProperties {
    static idCounter: number;
    id: number;
    name: string;
    codeSource: string;
    stereotype?: ClassStereotype;
    attributes: Attribute[];
    operators: Operator[];
    enums: {
        [name: string]: string[];
    };
    structs: {
        [name: string]: Parameter[];
    };
    associations: {
        [name: string]: Association;
    };
    constructor(properties: ClassProperties);
    addAssociation(association: Association): void;
    dotUmlClass(): string;
    dotClassTitle(): string;
    dotAttributeVisibilities(): string;
    static dotAttributes(vizGroup: string, attributes: Attribute[]): string;
    dotOperatoreVisibilities(): string;
    dotOperators(vizGroup: string, operators: Operator[]): string;
    dotOperatorStereotype(operatorStereotype: OperatorStereotype): string;
    static dotParameters(parameters: Parameter[], returnParams?: boolean): string;
    dotStructs(): string;
    dotEnums(): string;
}
