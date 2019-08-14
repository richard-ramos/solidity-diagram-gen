// Test not specifying pragma solidity

import "./SomeInterface.sol";
import "./Service.sol";

contract Caller {

    SomeInterface someImpl;

    // This is to test duplicate compositions to SomeInterface from the Caller contract
    SomeInterface secondImpl;

    constructor(SomeInterface _someImpl) public {
        someImpl = _someImpl;
    }

    function call(address serviceAddress) public returns (uint256) {

        Service service = Service(serviceAddress);
        return service.increment(true);
    }

}