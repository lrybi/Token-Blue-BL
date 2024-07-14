import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DeployFunction } from "hardhat-deploy/types";

import { networkConfig, developmentChains } from "../helper-hardhat-config";

import verify from "../utils/verify";

import "dotenv/config";


const deployTokenV2: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts(); 
    
    log("----------------------------------------------------");
    const args: any[] = [];
    const tokenV2 = await deploy("BEP20TokenV2", {
        contract: "BEP20TokenV2",
        from: deployer,
        args: args, 
        log: true, 
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    }); 
    log('');
    log('TokenV2 Deployed!');

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) { 
        log("Verifying...");
        await verify(await tokenV2.address, args); 
    }
    log("------------------------------------------");
}
 
export default deployTokenV2;

deployTokenV2.tags = ["all", "tokenV2"];


