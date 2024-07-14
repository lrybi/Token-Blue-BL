// SPDX-License-Identifier: MIT


pragma solidity ^0.6.0;

import "./ProxyAdmin.sol";

contract BEP20TokenProxyAdmin is ProxyAdmin {
    constructor (
        address /* owner */
    ) public ProxyAdmin() {

    }
}


