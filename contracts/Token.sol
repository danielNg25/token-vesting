// contracts/Token.sol
// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.18;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 ether;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, TOTAL_SUPPLY);
    }
}
