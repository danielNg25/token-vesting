import * as hre from "hardhat";
import { expect } from "chai";
import { ethers } from "hardhat";

import {
    TokenVesting__factory,
    TokenVesting,
    Token__factory,
    Token,
    TokenVestingBase,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { parseEther, solidityPackedKeccak256 } from "ethers";

const CONFIG = {
    TOTAL_SUPPLY: 1_000_000_000,
    VESTING_AMOUNT: 975_000_000,
    START_TIME: 1702659600, // 2023-12-15T00:00:00+00:00
    MONTH: 30 * 24 * 60 * 60,
    LIQUIDITY: {
        NAME: "Liquidity",
        AMOUNT: 150_000_000,
        CLIFF: 0, // months
        SLICES: 3, // months
    },
    CORE_CONTRIBUTOR: {
        NAME: "Core Contributors",
        AMOUNT: 150_000_000,
        CLIFF: 6, // months
        SLICES: 12, // months
    },
    TREASURY: {
        NAME: "Treasury",
        AMOUNT: 300_000_000,
        CLIFF: 6, // months
        SLICES: 12, // months
    },
    PROTOCOL_REWARDS: {
        NAME: "Protocol Rewards",
        AMOUNT: 200_000_000,
        CLIFF: 12, // months
        SLICES: 24, // months
    },
    TEAM: {
        NAME: "Team",
        AMOUNT: 175_000_000,
        CLIFF: 6, // months
        SLICES: 24, // months
    },
};

describe("Greater", () => {
    let owner: SignerWithAddress;
    let user: SignerWithAddress;
    let liquidityBeneficiary: SignerWithAddress;
    let coreContributorsBeneficiary: SignerWithAddress;
    let treasuryBeneficiary: SignerWithAddress;
    let protocolRewardsBeneficiary: SignerWithAddress;
    let teamBeneficiary: SignerWithAddress;

    let tokenVesting: TokenVesting;
    let token: Token;

    beforeEach(async () => {
        const accounts: SignerWithAddress[] = await ethers.getSigners();
        [
            owner,
            user,
            liquidityBeneficiary,
            coreContributorsBeneficiary,
            treasuryBeneficiary,
            protocolRewardsBeneficiary,
            teamBeneficiary,
        ] = accounts;

        const Token: Token__factory = await ethers.getContractFactory("Token");
        token = await Token.deploy("Token", "TKN");

        const TokenVesting: TokenVesting__factory =
            await ethers.getContractFactory("TokenVesting");
        tokenVesting = await TokenVesting.deploy(await token.getAddress());

        hre.tracer.nameTags[await tokenVesting.getAddress()] = "Token Vesting";
    });

    describe("Deployment", () => {
        it("Should deploy successfully", async () => {
            expect(await tokenVesting.getToken()).to.equal(
                await token.getAddress(),
            );
            expect(await token.balanceOf(owner.address)).to.equal(
                parseEther(CONFIG.TOTAL_SUPPLY.toString()),
            );
        });

        it("Should deploy failed - token address is zero", async () => {
            const TokenVesting: TokenVesting__factory =
                await ethers.getContractFactory("TokenVesting");
            await expect(TokenVesting.deploy(ethers.ZeroAddress)).to.be
                .reverted;
        });
    });

    describe("Initialize", () => {
        it("Should initialize failed - not owner", async () => {
            await expect(
                tokenVesting
                    .connect(user)
                    .initialize(
                        liquidityBeneficiary.address,
                        coreContributorsBeneficiary.address,
                        treasuryBeneficiary.address,
                        protocolRewardsBeneficiary.address,
                        teamBeneficiary.address,
                    ),
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should initialize failed - insufficient balance", async () => {
            await expect(
                tokenVesting
                    .connect(owner)
                    .initialize(
                        liquidityBeneficiary.address,
                        coreContributorsBeneficiary.address,
                        treasuryBeneficiary.address,
                        protocolRewardsBeneficiary.address,
                        teamBeneficiary.address,
                    ),
            ).to.be.revertedWithCustomError(tokenVesting, "InsufficientToken");
        });

        it("Should initialize successfully", async () => {
            await token.transfer(
                await tokenVesting.getAddress(),
                parseEther(CONFIG.VESTING_AMOUNT.toString()),
            );

            await expect(
                tokenVesting
                    .connect(owner)
                    .initialize(
                        liquidityBeneficiary.address,
                        coreContributorsBeneficiary.address,
                        treasuryBeneficiary.address,
                        protocolRewardsBeneficiary.address,
                        teamBeneficiary.address,
                    ),
            )
                .to.emit(tokenVesting, "Initialized")
                .to.emit(tokenVesting, "VestingScheduleCreated");

            const vestingScheduleCount =
                await tokenVesting.getVestingSchedulesCount();
            expect(vestingScheduleCount).to.equal(5);

            expect(
                await tokenVesting.getVestingSchedulesTotalAmount(),
            ).to.equal(parseEther(CONFIG.VESTING_AMOUNT.toString()));

            const liquiditySchedule = await tokenVesting.getVestingSchedule(
                await tokenVesting.getVestingIdAtIndex(0),
            );
            compareVestingSchedule(
                liquiditySchedule,
                CONFIG.LIQUIDITY,
                liquidityBeneficiary,
            );

            const coreContributorsSchedule =
                await tokenVesting.getVestingSchedule(
                    await tokenVesting.getVestingIdAtIndex(1),
                );
            compareVestingSchedule(
                coreContributorsSchedule,
                CONFIG.CORE_CONTRIBUTOR,
                coreContributorsBeneficiary,
            );

            const treasurySchedule = await tokenVesting.getVestingSchedule(
                await tokenVesting.getVestingIdAtIndex(2),
            );
            compareVestingSchedule(
                treasurySchedule,
                CONFIG.TREASURY,
                treasuryBeneficiary,
            );

            const protocolRewardsSchedule =
                await tokenVesting.getVestingSchedule(
                    await tokenVesting.getVestingIdAtIndex(3),
                );
            compareVestingSchedule(
                protocolRewardsSchedule,
                CONFIG.PROTOCOL_REWARDS,
                protocolRewardsBeneficiary,
            );

            const teamSchedule = await tokenVesting.getVestingSchedule(
                await tokenVesting.getVestingIdAtIndex(4),
            );
            compareVestingSchedule(teamSchedule, CONFIG.TEAM, teamBeneficiary);

            expect(
                await tokenVesting.getVestingSchedulesCountByBeneficiary(
                    liquidityBeneficiary.address,
                ),
            ).to.equal(1);

            compareVestingSchedule(
                await tokenVesting.getVestingScheduleByAddressAndIndex(
                    liquidityBeneficiary.address,
                    0,
                ),
                CONFIG.LIQUIDITY,
                liquidityBeneficiary,
            );
            compareVestingSchedule(
                await tokenVesting.getLastVestingScheduleForHolder(
                    liquidityBeneficiary.address,
                ),
                CONFIG.LIQUIDITY,
                liquidityBeneficiary,
            );

            expect(
                await tokenVesting.computeNextVestingScheduleIdForHolder(
                    liquidityBeneficiary.address,
                ),
            ).to.equal(
                solidityPackedKeccak256(
                    ["address", "uint256"],
                    [liquidityBeneficiary.address, 1],
                ),
            );
        });

        it("Should initialize failed - already initialized", async () => {
            await token.transfer(
                await tokenVesting.getAddress(),
                parseEther(CONFIG.VESTING_AMOUNT.toString()),
            );

            await tokenVesting
                .connect(owner)
                .initialize(
                    liquidityBeneficiary.address,
                    coreContributorsBeneficiary.address,
                    treasuryBeneficiary.address,
                    protocolRewardsBeneficiary.address,
                    teamBeneficiary.address,
                );

            await expect(
                tokenVesting
                    .connect(owner)
                    .initialize(
                        liquidityBeneficiary.address,
                        coreContributorsBeneficiary.address,
                        treasuryBeneficiary.address,
                        protocolRewardsBeneficiary.address,
                        teamBeneficiary.address,
                    ),
            ).to.be.revertedWith(
                "Initializable: contract is already initialized",
            );
        });
    });

    describe("Withdraw mistaken transfer tokens", () => {
        let tokenMistake: Token;
        beforeEach(async () => {
            tokenMistake = await (
                await ethers.getContractFactory("Token")
            ).deploy("Token", "TKN");

            await tokenMistake.transfer(
                await tokenVesting.getAddress(),
                parseEther(CONFIG.VESTING_AMOUNT.toString()),
            );
        });

        it("Should withdraw failed - Not owner", async () => {
            await expect(
                tokenVesting
                    .connect(user)
                    .withdrawMistakenTransferedToken(
                        await token.getAddress(),
                        parseEther("1"),
                    ),
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should withdraw failed - Vesting token", async () => {
            await expect(
                tokenVesting
                    .connect(owner)
                    .withdrawMistakenTransferedToken(
                        await token.getAddress(),
                        parseEther("1"),
                    ),
            ).to.be.reverted;
        });

        it("Should withdraw successfully", async () => {
            const tokenAddress = await tokenMistake.getAddress();
            await expect(() =>
                tokenVesting
                    .connect(owner)
                    .withdrawMistakenTransferedToken(
                        tokenAddress,
                        parseEther("1"),
                    ),
            ).to.changeTokenBalances(
                tokenMistake,
                [owner, tokenVesting],
                [parseEther("1"), parseEther("-1")],
            );
        });
    });
});

const compareVestingSchedule = (
    vestingSchedule: TokenVestingBase.VestingScheduleStructOutput,
    expected: {
        NAME: string;
        AMOUNT: number;
        CLIFF: number;
        SLICES: number;
    },
    beneficiary: SignerWithAddress,
) => {
    expect(vestingSchedule.beneficiary).to.equal(beneficiary.address);
    expect(vestingSchedule.name).to.equal(expected.NAME);
    expect(vestingSchedule.start).to.equal(CONFIG.START_TIME);
    expect(vestingSchedule.amountTotal).to.equal(
        parseEther(expected.AMOUNT.toString()),
    );
    expect(vestingSchedule.cliff).to.equal(
        CONFIG.START_TIME + expected.CLIFF * CONFIG.MONTH,
    );
    expect(vestingSchedule.numberOfSlice).to.equal(expected.SLICES);
    expect(vestingSchedule.slicePeriodSeconds).to.equal(CONFIG.MONTH);
    expect(vestingSchedule.released).to.equal(0);
    expect(vestingSchedule.revoked).to.equal(false);
    expect(vestingSchedule.revocable).to.equal(true);
};
