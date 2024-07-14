
// Unit tests are done locally

import { network, deployments, getNamedAccounts, ethers } from "hardhat";

import { assert, expect } from "chai";

import { developmentChains, networkConfig } from "../../helper-hardhat-config"

import { BEP20UpgradeableProxy, BEP20TokenProxyAdmin, BEP20Token, BEP20TokenV2 } from "../../typechain-types";


!developmentChains.includes(network.name)
    ? describe.skip               
    : describe("UpgradeableBlue Unit Tests", function () {
        let blueProxy: BEP20Token, blueProxyAdmin: BEP20TokenProxyAdmin, transparentProxy: BEP20UpgradeableProxy;
        let contracts: any;

        beforeEach(async () => {
            const { deployer } = await getNamedAccounts();
            const signerDeploy = await ethers.getSigner(deployer);
            contracts = await deployments.fixture(["all"]);
            blueProxy = await ethers.getContractAt("BEP20Token", contracts["BEP20Token_Proxy"].address, signerDeploy);
            blueProxyAdmin = await ethers.getContractAt("BEP20TokenProxyAdmin", contracts["BEP20TokenProxyAdmin"].address, signerDeploy)
        });

        describe("Deployment ", function () {
            it("Should set the right owner", async function () {
                const { deployer } = await getNamedAccounts();
                const signerDeploy = await ethers.getSigner(deployer);
                console.log("            deployer address:", signerDeploy.address);
                const actualBlueOwner = await blueProxy.getOwner();
                console.log("            actualTokenBlueOwner address:", actualBlueOwner.toString());
                                
                assert.equal(actualBlueOwner.toString(), signerDeploy.address);
            });
            it("Should have correct name", async () => {
                const actualName = await blueProxy.name();
                assert.equal(actualName.toString(), "Blue Token");
            });
            it("Should have correct symbol", async () => {
                const actualSymbol = await blueProxy.symbol();
                assert.equal(actualSymbol.toString(), "BL");
            });
            it("Should have correct initial supply", async () => {
                const actualTotalSupply = await blueProxy.totalSupply();
                assert.equal(actualTotalSupply.toString(), "1000000000000000000000000");
            });
            it("Should have 18 decimals", async () => {
                const actualDecimals = await blueProxy.decimals();
                assert.equal(actualDecimals.toString(), "18");
            });
            it("Should assign the total supply of tokens to the owner", async () => {
                const { deployer } = await getNamedAccounts();
                const signerDeploy = await ethers.getSigner(deployer);
                
                const actualTotalSupply = await blueProxy.totalSupply();
                const ownerBalance = await blueProxy.balanceOf(signerDeploy.address);
                console.log("            ownerBalance:", ownerBalance.toString());
                assert.equal(actualTotalSupply.toString(), ownerBalance.toString());
            });
        });

        describe("Transactions", function () {
            
            it("Should transfer tokens between accounts", async function () {
                const { deployer, user, anotherUser } = await getNamedAccounts();
                const signerDeploy = await ethers.getSigner(deployer);
                const signerUser = await ethers.getSigner(user);
                const signerAnotherUser = await ethers.getSigner(anotherUser);

                console.log("            Transfer 50 tokens from owner to user!");
                await expect(
                    blueProxy.transfer(signerUser.address, 50)
                ).to.changeTokenBalances(blueProxy, [signerDeploy.address, signerUser.address], [-50, 50]);

                console.log("            Transfer 50 tokens from user to anotherUser!");
                await blueProxy.connect(signerUser).transfer(signerAnotherUser.address, 50);
                expect(await blueProxy.balanceOf(signerAnotherUser.address)).to.equal(50);
                console.log("            Successfully Transfered!");
            });

            it("Should emit Transfer events", async function () {
                const { deployer, user, anotherUser } = await getNamedAccounts();
                const signerDeploy = await ethers.getSigner(deployer);
                const signerUser = await ethers.getSigner(user);
                const signerAnotherUser = await ethers.getSigner(anotherUser);
    
                // Transfer 50 tokens from owner to user
                await expect(blueProxy.transfer(signerUser.address, 50))
                    .to.emit(blueProxy, "Transfer")
                    .withArgs(signerDeploy.address, signerUser.address, 50);
    
                // Transfer 50 tokens from user to anotherUser
                await expect(blueProxy.connect(signerUser).transfer(signerAnotherUser.address, 50))
                    .to.emit(blueProxy, "Transfer")
                    .withArgs(signerUser.address, signerAnotherUser.address, 50);
            });

            it("Should fail if sender doesn't have enough tokens", async function () {
                const { deployer, user } = await getNamedAccounts();
                const signerDeploy = await ethers.getSigner(deployer);
                const signerUser = await ethers.getSigner(user);
                
                const initialOwnerBalance = await blueProxy.balanceOf(signerDeploy.address);
    
                // Try to send 1 token from user (0 tokens) to owner.
                await expect(
                    blueProxy.connect(signerUser).transfer(signerDeploy.address, 1)
                ).to.be.revertedWith("BEP20: transfer amount exceeds balance");
    
                // Owner balance shouldn't have changed.
                expect(await blueProxy.balanceOf(signerDeploy.address)).to.equal(
                    initialOwnerBalance
                );
            });

        });        

        describe("Mint more", function () {
            
            it("Should fail if other users mint the token", async () => {
                const { user } = await getNamedAccounts();
                const signerUser = await ethers.getSigner(user);

                await expect(
                    blueProxy.connect(signerUser).mint('100000000000000000000')
                ).to.be.revertedWith("Ownable: caller is not the owner");
            });

            it("Should owner could mint more the token", async () => {
                const { deployer } = await getNamedAccounts();
                const signerDeploy = await ethers.getSigner(deployer);

                const initialTotalSupply = await blueProxy.totalSupply();

                await blueProxy.mint('100000000000000000000');

                const newTotalSupply = BigInt(initialTotalSupply) + BigInt("100000000000000000000");
                console.log("            newTotalSupply:", newTotalSupply);
                const actualNewTotalSupply = await blueProxy.totalSupply();
                console.log("            actualNewTotalSupply:", actualNewTotalSupply);

                assert.equal(actualNewTotalSupply.toString(), newTotalSupply.toString());

                expect(await blueProxy.balanceOf(signerDeploy.address)).to.equal(newTotalSupply);
            });
        });

        describe("Initializable", function () {
            it("Should fail if call `initialize` again", async () => {
                const { deployer } = await getNamedAccounts();

                await expect(
                    blueProxy.initialize("ABC Token", "ABC", 18, ethers.parseEther("200000000"), true, deployer)
                ).to.be.revertedWith("Initializable: contract is already initialized");
            });
        });

        describe("BlueV2", function () {
            it("Can upgrade to BlueV2", async () => {

                const currentImplementation = await blueProxyAdmin.getProxyImplementation(contracts["BEP20Token_Proxy"].address);
                console.log("            currentImplementation address:", currentImplementation.toString());
                console.log("            Upgrading...");
                const upgradeTx = await blueProxyAdmin.upgrade(contracts["BEP20Token_Proxy"].address, contracts["BEP20TokenV2"].address);
                await upgradeTx.wait(1);
                console.log("            Blue upgraded suscessfully!");

                console.log("            BEP20TokenV2 (BlueV2) address:", contracts["BEP20TokenV2"].address);
                const newImplementation = await blueProxyAdmin.getProxyImplementation(contracts["BEP20Token_Proxy"].address);
                console.log("            newImplementation address:", newImplementation.toString());
                                
                assert.equal(newImplementation.toString(), contracts["BEP20TokenV2"].address);
            });

            it("Should still have correct info (variables still hold correct value)", async () => {
                const upgradeTx = await blueProxyAdmin.upgrade(contracts["BEP20Token_Proxy"].address, contracts["BEP20TokenV2"].address);
                await upgradeTx.wait(1);

                const { deployer } = await getNamedAccounts();
                const signerDeploy = await ethers.getSigner(deployer);

                let blueProxy: BEP20TokenV2;
                blueProxy = await ethers.getContractAt("BEP20TokenV2", contracts["BEP20Token_Proxy"].address, signerDeploy);

                expect(await blueProxy.getOwner()).to.equal(signerDeploy.address);
                expect(await blueProxy.name()).to.equal("Blue Token");
                expect(await blueProxy.symbol()).to.equal("BL");
                expect(await blueProxy.decimals()).to.equal(18);
                expect(await blueProxy.totalSupply()).to.equal(ethers.parseEther("1000000"));
            });

            it("Should still fail if call `initialize` again", async () => {
                const upgradeTx = await blueProxyAdmin.upgrade(contracts["BEP20Token_Proxy"].address, contracts["BEP20TokenV2"].address);
                await upgradeTx.wait(1);

                const { deployer } = await getNamedAccounts();
                const signerDeploy = await ethers.getSigner(deployer);

                let blueProxy: BEP20TokenV2;
                blueProxy = await ethers.getContractAt("BEP20TokenV2", contracts["BEP20Token_Proxy"].address, signerDeploy);

                await expect(
                    blueProxy.initialize("ABC Token", "ABC", 18, ethers.parseEther("200000000"), true, deployer)
                ).to.be.revertedWith("Initializable: contract is already initialized");
            });

            it("Should able to use new functions of BlueV2", async () => {
                const upgradeTx = await blueProxyAdmin.upgrade(contracts["BEP20Token_Proxy"].address, contracts["BEP20TokenV2"].address);
                await upgradeTx.wait(1);

                const { deployer, user } = await getNamedAccounts();
                const signerDeploy = await ethers.getSigner(deployer);
                const signerUser = await ethers.getSigner(user);

                let blueProxy: BEP20TokenV2;
                blueProxy = await ethers.getContractAt("BEP20TokenV2", contracts["BEP20Token_Proxy"].address, signerDeploy);
         
                let txResponse
                // Transfer 50 tokens from owner to user
                txResponse = await blueProxy.transfer(user, "50");
                await txResponse.wait(1);
                
                // block this user
                txResponse = await blueProxy.blackList([user]);
                await txResponse.wait(1);

                await expect(
                    blueProxy.connect(signerUser).transfer(deployer, '20')
                ).to.be.revertedWith("Sender is backlisted");
            });
        });

    })
    

