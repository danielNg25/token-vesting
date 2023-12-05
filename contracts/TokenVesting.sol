// contracts/TokenVesting.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "./TokenVestingBase.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract TokenVesting is TokenVestingBase, Initializable {
    uint256 public constant MONTH = 30 days;
    uint256 public constant START = 1702659600; // 2023-12-15T00:00:00+00:00

    uint256 public constant LIQUIDITY_AMOUNT = 150_000_000 ether;
    uint256 public constant CORE_CONTRIBUTORS_AMOUNT = 150_000_000 ether;
    uint256 public constant TREASURY_AMOUNT = 300_000_000 ether;
    uint256 public constant PROTOCOL_AMOUNT = 200_000_000 ether;
    uint256 public constant TEAM_AMOUNT = 175_000_000 ether;

    constructor(address _token) TokenVestingBase(_token) {}

    function initialize(
        address liquidityBeneficiary,
        address coreContributorsBeneficiary,
        address treasuryBeneficiary,
        address protocolBeneficiary,
        address teamBeneficiary
    ) external onlyOwner initializer {
        // Create liquidity schedule
        createVestingSchedule(
            "Liquidity",
            liquidityBeneficiary,
            START,
            0,
            3 * MONTH,
            MONTH,
            true,
            LIQUIDITY_AMOUNT
        );

        // Create core contributors schedule
        createVestingSchedule(
            "Core Contributors",
            coreContributorsBeneficiary,
            START,
            6 * MONTH,
            12 * MONTH,
            MONTH,
            true,
            CORE_CONTRIBUTORS_AMOUNT
        );

        // Create treasury schedule
        createVestingSchedule(
            "Treasury",
            treasuryBeneficiary,
            START,
            6 * MONTH,
            12 * MONTH,
            MONTH,
            true,
            TREASURY_AMOUNT
        );

        // Create protocol schedule
        createVestingSchedule(
            "Protocol",
            protocolBeneficiary,
            START,
            24 * MONTH,
            12 * MONTH,
            MONTH,
            true,
            PROTOCOL_AMOUNT
        );

        // Create team schedule
        createVestingSchedule(
            "Team",
            teamBeneficiary,
            START,
            24 * MONTH,
            6 * MONTH,
            MONTH,
            true,
            TEAM_AMOUNT
        );
    }
}
