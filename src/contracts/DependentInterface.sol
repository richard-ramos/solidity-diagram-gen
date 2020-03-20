pragma solidity ^0.5.10;

interface DependentInterface {
    function decrement() external returns (uint256);
    function sub(uint256 someNumber) external returns (uint256);
}
