
export interface networkConfigItem { 
    blockConfirmations?: number
}

export interface networkConfigInfo { 
    [key: string]: networkConfigItem
}

export const networkConfig: networkConfigInfo = {
    localhost: {},
    hardhat: {},
    sepolia: {
        blockConfirmations: 6,
    },
    bscTestnet: {
        blockConfirmations: 6,
    },
}

export const developmentChains = ["hardhat", "localhost"]