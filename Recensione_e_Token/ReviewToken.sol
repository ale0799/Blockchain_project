// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ReviewToken
 * @dev ERC20 minimal senza trasferimenti, con mint e burn con codici sconto
 */
contract ReviewToken {
    string public name = "ReviewToken";
    string public symbol = "RVT";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    // Owner del contratto gestione recensioni
    address public gestioneRecensioni;

    mapping(address => uint256) private balances;

    // Mapping indirizzo => array codici sconto riscattati
    mapping(address => string[]) private discountCodes;

    // Eventi ERC20 base
    event Transfer(address indexed from, address indexed to, uint256 value);

    // Modificatore per funzioni solo gestione recensioni
    modifier onlyGestioneRecensioni() {
        require(msg.sender == gestioneRecensioni, "Solo gestione recensioni puo mintare");
        _;
    }

    // Imposta una volta l'indirizzo gestione recensioni
    function setGestioneRecensioni(address _gestioneRecensioni) external {
        require(gestioneRecensioni == address(0), "Indirizzo gia settato");
        gestioneRecensioni = _gestioneRecensioni;
    }

    // Ritorna il saldo token di un indirizzo
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    // Mint token (solo gestione recensioni)
    function mint(address to, uint256 amount) external onlyGestioneRecensioni {
        require(to != address(0), "Mint a zero address non valido");
        totalSupply += amount;
        balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    // Burn token (solo quantità esatta 1 token intero)
    function burn(uint256 amount) external {
        require(amount == 1e18, "Devi bruciare 1 token intero");
        require(balances[msg.sender] >= amount, "Saldo insufficiente per burn");
        balances[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);

        string memory code = generateDiscountCode(msg.sender, discountCodes[msg.sender].length);
        discountCodes[msg.sender].push(code);
    }

    // Ottieni codice sconto all'indice
    function getDiscountCode(address user, uint256 index) external view returns (string memory) {
        require(index < discountCodes[user].length, "Indice fuori range");
        return discountCodes[user][index];
    }

    // Numero codici riscattati
    function getDiscountCount(address user) external view returns (uint256) {
        return discountCodes[user].length;
    }

    // Blocca transfer, approve, transferFrom: token non trasferibile
    function transfer(address, uint256) external pure returns (bool) {
        revert("Transfer disabilitato");
    }

    function approve(address, uint256) external pure returns (bool) {
        revert("Approve disabilitato");
    }

    function transferFrom(address, address, uint256) external pure returns (bool) {
        revert("transferFrom disabilitato");
    }

    // Codice sconto semplice e unico: "SCONTO-" + address + "-" + nonce
    function generateDiscountCode(address user, uint256 nonce) private pure returns (string memory) {
        return string(abi.encodePacked("SCONTO-", toAsciiString(user), "-", uint2str(nonce)));
    }

    // Converti uint in stringa
    function uint2str(uint _i) internal pure returns (string memory str) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = uint8(48 + _i % 10);
            bstr[k] = bytes1(temp);
            _i /= 10;
        }
        str = string(bstr);
    }

    // Converti address in stringa esadecimale (40 caratteri senza 0x)
    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);
        }
        return string(s);
    }

    // Helper per convertire un nibble in char ascii
    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
}