pragma solidity ^0.5.10;

import "./SomeInterface.sol";
import "./DependentInterface.sol";
//import "./DependentInterface2.sol";

contract SomeImpl is SomeInterface {

    enum SomeEnum { Yes, No, Maybe }
    enum lowerCaseEnum { What, The }

    SomeEnum someEnum = SomeEnum.Yes;

    uint256 public somePublicNumber;
    bool public somePublicBool;
    string public somePublicString;
    uint256[] public somePublicIntArray;

    uint256 private somePrivateNumber;
    bool private somePrivateBool;
    string private somePrivateString;

    uint256 internal someInternalNumber;
    bool internal someInternalBool;
    string internal someInternalString;

    uint256[] private somePrivateIntArray;
    uint256[][] public somePublicMultiArray;

    DependentInterface public interfaceDependency;

    // SomeInterface has a Storage reference type and a realization
    SomeInterface public someInterface;

    SomeStruct someStruct;
    SomeStruct[] someStructs;

    mapping (address => uint256) public balances;
    mapping (address => bool) private whitelist;
    mapping (address => mapping (address => string)) private nestedMapping;
    mapping (address => SomeStruct) private mappingWithStruct;

    struct SomeStruct {
        bool valid;
        uint256 count;
        mapping (address => string) names;
        mapping (address => AnotherStruct) balances;
    }

    struct AnotherStruct {
        bool active;
        uint256 balance;
        YetAnotherStruct yos;
    }

    struct YetAnotherStruct {
        bool active;
        uint256[] balances;
    }

    event Add(uint256 beforeValue, uint256 afterValue);

    modifier someModifier(bool someParam) {
        require(somePublicNumber > 0, 'Can not be zero');
        require(someParam, 'Invalid param');
        _;
    }

    modifier modifierMultiParams(bool someParam, uint256 someInt) {
            require(somePublicNumber > 0, 'Can not be zero');
            require(someParam, 'Invalid someParam');
            require(someInt != 0, 'Invalid someInt');
            _;
        }

    function add(uint256 someNumber) public returns (uint256) {
        somePublicNumber = somePublicNumber + someNumber;
        return somePublicNumber;
    }

    function returnsTuple() public pure returns (bool, string memory) {
        return (false, "testing");
    }

    function privatePure() private pure returns (bool success) {
        return true;
    }

    function publicPure() public pure returns (bool success) {
        return true;
    }

    function increment() public returns (uint256) {
        return somePublicNumber++;
    }

    function privateReset() private {
        somePublicNumber = 0;
    }

    function internalReset() internal {
        somePublicNumber = 0;
    }

    function externalReset() external {
        somePublicNumber = 0;
    }

    function publicPayable() public payable {
    }

    function externalPayable() public payable {
    }

    function twoStructs(SomeStruct memory struct1, SomeStruct memory struct2) internal pure
    returns (bool) {
        return struct1.count == struct2.count;
    }

    // fallback function
    function() external {}
}
