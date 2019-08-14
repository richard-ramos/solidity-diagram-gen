pragma solidity ^0.5.10;

import "./BigInt.sol";
import "./Set.sol";

contract LibraryTest {

    Set.Data someLibrary;

    using BigInt for BigInt.bigint;

    function someBigIntFunction() public pure {
        BigInt.bigint memory x = BigInt.fromUint(7);
        BigInt.bigint memory y = BigInt.fromUint(uint(-1));
        BigInt.bigint memory z = x.add(y);
        assert(z.limb(1) > 0);
    }
}
