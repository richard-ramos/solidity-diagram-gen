pragma solidity ^0.5.10;

contract BaseAbstract {
    string public test = 'top level abstract contract';
    function whatIsThis() public returns (string memory);
}

contract SecondAbstract is BaseAbstract {
    string public test = 'second level abstract contract';
}

contract ThirdAbstract is SecondAbstract {
    string public test = 'third level abstract contract';
}

contract Concreate is ThirdAbstract {
    function whatIsThis() public returns (string memory) {
        return test;
    }
}
