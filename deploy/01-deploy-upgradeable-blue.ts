import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DeployFunction } from "hardhat-deploy/types";

import { networkConfig, developmentChains } from "../helper-hardhat-config";

import verify from "../utils/verify";

import "dotenv/config";


const deployBEP20Token: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts(); 
    
    log("----------------------------------------------------");
    const args: any[] = [];
    const tokenBlue = await deploy("BEP20Token", {
        contract: "BEP20Token",
        from: deployer,
        args: args, 
        log: true, 
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
        proxy: {
            proxyContract: "BEP20UpgradeableProxy",
            viaAdminContract: {
                name: "BEP20TokenProxyAdmin",
                artifact: "BEP20TokenProxyAdmin",
            },
            execute: {
                init: {
                    methodName: "initialize",
                    args: ["Blue Token", "BL", 18, ethers.parseEther("1000000"), true, deployer],
                },
            },
        },
    }); 
    log('');
    log('Upgradeable token Blue Deployed!');

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) { 
        log("Verifying...");
        await verify(await tokenBlue.address, args); 
    }
    log("------------------------------------------");
}
 
export default deployBEP20Token;

deployBEP20Token.tags = ["all", "blue"];
