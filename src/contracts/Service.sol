pragma solidity ^0.5.10;

contract Service {

    uint256 counter = 1;

    function increment(bool option) public returns (uint256) {
        if (option == true) {
            counter++;
        }

        return counter;
    }
}
