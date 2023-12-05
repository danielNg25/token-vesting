// contracts/TokenVesting.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

// schedule revoked
error ScheduleRevoked();

// cannot create vesting schedule because not sufficient tokens
error InsufficientToken();

// number of slice must be > 0
error NumberOfSliceGtZero();

// amount must be > 0
error AmountGtZero();

// slice period second must be > 0
error SlicePeriodSecondsGtZero();

// vesting not revocable
error VestingNotRevocable();

// not enough withdrawable funds
error NotEnoughFunds();

// only beneficiary and owner
error OnlyBeneficiaryAndOwner();

// index out of bounds
error IndexOutOfBounds();
