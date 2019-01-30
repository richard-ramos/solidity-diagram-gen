pragma solidity ^0.4.25;

import "./SomeInterface.sol";

contract SomeImpl is SomeInterface {

    uint256 public somePublicNumber;
    bool public somePublicBool;
    string public somePublicString;
    uint256[] public somePublicIntArray;

    uint256 private somePrivateNumber;
    bool private somePrivateBool;
    string private somePrivateString;

    uint256[] private somePrivateIntArray;
    uint256[][] public somePublicMultArray;

    SomeStruct someStruct;
    SomeStruct[] someStructs;

    mapping (address => uint256) public balances;
    mapping (address => bool) private whitelist;

    struct SomeStruct {
        bool valid;
        uint256 count;
        mapping (address => string) names;
    }

    event Add(uint256 beforeValue, uint256 afterValue);

    modifier someModifier(bool someParam) {
        require(somePublicNumber > 0);
        require(someParam);
        _;
    }

    function add(uint256 someNumber) public returns (uint256) {
        somePublicNumber = somePublicNumber + someNumber;
        return somePublicNumber;
    }

    function returnsTuple() public returns (bool success, string result) {
        return (false, "testing");
    }

    function privatePure() private pure returns (bool success) {
        return true;
    }

    function publicPure() public pure returns (bool success) {
        return true;
    }

    function defaultPure() pure returns (bool success) {
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


    function defaultReset() {
        somePublicNumber = 0;
    }

    // fallback function
    function() public {

    }
}
