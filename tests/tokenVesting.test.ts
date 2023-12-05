import * as hre from "hardhat";
import { expect } from "chai";
import { ethers } from "hardhat";

import {
    TokenVesting__factory,
    TokenVesting,
    Token__factory,
    Token,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { parseEther } from "ethers";

const CONFIG = {
    TOTAL_SUPPLY: 1_000_000_000,
    VESTING_AMOUNT: 975_000_000,
    START_TIME: 1702659600, // 2023-12-15T00:00:00+00:00
    MONTH: 30 * 24 * 60 * 60,
    LIQUIDITY: {
        AMOUNT: 150_000_000,
        CLIFF: 0, // months
        DURATION: 3, // months
    },
    CORE_CONTRIBUTOR: {
        AMOUNT: 150_000_000,
        CLIFF: 6, // months
        DURATION: 12, // months
    },
    TREASURY: {
        AMOUNT: 300_000_000,
        CLIFF: 6, // months
        DURATION: 12, // months
    },
    PROTOCOL_REWARDS: {
        AMOUNT: 200_000_000,
        CLIFF: 6, // months
        DURATION: 12, // months
    },
    TEAM: {
        AMOUNT: 175_000_000,
        CLIFF: 12, // months
        DURATION: 24, // months
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
        });
    });

    describe("Skip times", () => {
        it("Skip times", async () => {
            await time.increase(1000);
        });
    });
});
