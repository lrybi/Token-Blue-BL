
import { ethers, deployments, network, getNamedAccounts } from "hardhat";


async function main() {

    const { deployer, user } = await getNamedAccounts();
    const signer = await ethers.getSigner(deployer);
    console.log("deployer:", signer.address);

    const _BEP20TokenProxyAdmin = await deployments.get("BEP20TokenProxyAdmin");
    const blueProxyAdmin = await ethers.getContractAt("BEP20TokenProxyAdmin", _BEP20TokenProxyAdmin.address, signer)
    const _transparentProxy = await deployments.get("BEP20Token_Proxy");

    const currentImplementation = await blueProxyAdmin.getProxyImplementation(_transparentProxy.address);
    console.log("currentImplementation address:", currentImplementation.toString());

    const _BEP20TokenV2 = await deployments.get("BEP20TokenV2");
    console.log("BEP20TokenV2 (BlueV2) address:", _BEP20TokenV2.address);
    console.log("Upgrading...");
    const upgradeTx = await blueProxyAdmin.upgrade(_transparentProxy.address, _BEP20TokenV2.address);
    await upgradeTx.wait(1);
    console.log("Blue upgraded suscessfully!");

    const newImplementation = await blueProxyAdmin.getProxyImplementation(_transparentProxy.address);
    console.log("newImplementation address:", newImplementation.toString());

}

main() 
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
