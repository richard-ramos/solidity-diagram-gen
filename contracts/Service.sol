
contract Service {

    uint256 counter = 1;

    increment(bool option) public view returns (uint256) {
        return counter++;
    }
}