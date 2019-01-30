
import "./SomeInterface.sol";

contract Caller {

    SomeInterface someImpl;

    constructor(SomeInterface _someImpl) public {
        someImpl = _someImpl;
    }

}