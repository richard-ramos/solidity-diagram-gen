pragma solidity ^0.5.10;

import "./libraries/BigInt.sol";
import "./libraries/Set.sol";

interface ConstructorParamInterface {
    function someFunction() external  returns (bool);
}

contract ConstructorParamAbstract {
    string test = 'Abstract contract referenced by constructor parameter';
    function abstractFunction() public  returns (bool);
    function concreteFunction() public returns (string memory) {
        return test;
    }
}

contract ConstructorParamAssoc {
    string public test = 'Concrete contract referenced by constructor parameter';
    string constructorAssoc;
}

interface FunctionParamInterface {
    function someFunction() external returns (bool);
}

contract FunctionParamAbstract {
    string public test = 'Abstract contract referenced by function parameter';
    function abstractFunction() public  returns (bool);
    function concreteFunction() public returns (string memory) {
        return test;
    }
}

contract FunctionParamAssoc {
    string public test = 'Concrete contract referenced by function parameter';
}

contract FunctionReturnParamAssoc {
    string public test = 'Concrete contract referenced by function return parameter';
}

interface ContractInterface {
    function someFunction() external returns (bool);
}

contract ContractAbstract {
    string public test = 'Abstract contract referenced by contract';
    function abstractFunction() public  returns (bool);
    function concreteFunction() public view returns (string memory) {
        return test;
    }
}

contract MappingConcrete {
    string test = 'Concrete contract referenced by mapping';
}

interface MappingInterface {
    function someFunction() external returns (string memory);
}

contract MappingAbstract {
    string public test = 'Abstract contract referenced by mapping';
    function abstractFunction() public  returns (bool);
    function concreteFunction() public view returns (string memory) {
        return test;
    }
}

contract StructConcrete {
    string test = 'Concrete contract referenced by struct';
}

interface StructInterface {
    function someFunction() external returns (string memory);
}

contract StructAbstract {
    string public test = 'Abstract contract referenced by struct';
    function abstractFunction() public  returns (bool);
    function concreteFunction() public view returns (string memory) {
        return test;
    }
}

contract MappingInStructConcrete {
    string test = 'Concrete contract referenced by mapping inside a struct';
}

contract ContractConcrete {
    string whatIsThis = 'Concrete contract';
}

contract ForLoopConcrete {
    uint256 public someNumber = 33;
}

contract WhileConcrete {
    uint256 public someNumber = 36;
}

contract DoWhileConcrete {
    uint256 public someNumber = 40;
}

contract IfTrueConcrete {
    uint256 public someNumber = 44;
}

contract IfFalseConcrete {
    uint256 public someNumber = 55;
}

contract BodyConcrete {
    uint256 public someNumber = 56;
}

contract Associations is ContractInterface, ContractAbstract, ContractConcrete {

    uint256 public someInt;

    Set.Data someLibrary;
    SomeStruct someStruct;
    uint256[] someIntArray;

    mapping(address => MappingConcrete) public mappingConcreateReference;
    mapping(address => MappingInterface) public mappingInterfaceReference;
    mapping(address => MappingAbstract) public mappingAbstractReference;

    struct SomeStruct {
        StructConcrete structConcrete;
        StructInterface structInterface;
        StructAbstract structAbstract;
        mapping (address => MappingInStructConcrete) mappingInStructConcrete;
        StructInStruct structInStruct;
        uint256 count;
        mapping (address => string) names;
        mapping (address => StructInStructMapping) balances;
    }

    struct StructInStructMapping {
        bool active;
    }

    struct StructInStruct {
        bool active;
    }

    constructor (
        ConstructorParamAssoc constructorAssoc,
        ConstructorParamAbstract constructorAbstract,
        ConstructorParamInterface constructorInterface) public {
            someInt = 11;
    }

    function someFunction(
        FunctionParamAssoc paramAssoc,
        FunctionParamAbstract paramAbstract,
        FunctionParamInterface paramInterface,
        address bodyConcreteAddress) public
        returns (FunctionReturnParamAssoc returnParamAssoc) {
            someInt = 22;

            uint256 counter = 0;
            for (uint i = 0; i < someIntArray.length; i++) {
                ForLoopConcrete forLoopConcrete = new ForLoopConcrete();
                counter += someIntArray[i] + forLoopConcrete.someNumber();
            }

            if (counter > 5) {
                IfTrueConcrete ifTrueConcrete = new IfTrueConcrete();
                counter += ifTrueConcrete.someNumber();
            }
            else {
                IfFalseConcrete ifFalseConcrete = new IfFalseConcrete();
                counter += ifFalseConcrete.someNumber();

                while(counter < 100) {
                    WhileConcrete whileConcrete = new WhileConcrete();
                    counter += whileConcrete.someNumber();
                }

                do {
                    DoWhileConcrete doWhileConcrete = new DoWhileConcrete();
                    counter += doWhileConcrete.someNumber();
                }
                while(counter < 200);
            }

            BodyConcrete(bodyConcreteAddress);
    }

    using BigInt for BigInt.bigint;

    function someBigIntFunction() public pure {
        BigInt.bigint memory x = BigInt.fromUint(7);
        BigInt.bigint memory y = BigInt.fromUint(uint(-1));
        BigInt.bigint memory z = x.add(y);
        assert(z.limb(1) > 0);
    }
}
