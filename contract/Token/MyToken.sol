// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyToken {
    // Public variables for name, symbol, decimals, and total supply
    string public name = "MyToken";
    string public symbol = "MTK";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    address public admin;
    // Mapping to track address balances
     mapping(address => uint256) public balanceOf;

    // Events for transfer and approval operations
    event Transfer(address indexed from, address indexed to, uint256 value);
  
    // Constructor initializes the supply and assigns all tokens to the deployer
   
    constructor(uint256 initialSupply) {
        admin = msg.sender;
        totalSupply = initialSupply * (10 ** uint256(decimals));  // Adjust the supply with decimals
        balanceOf[msg.sender] = totalSupply;  // Assign the entire supply to the deployer's balance
        emit Transfer(address(0), msg.sender, totalSupply);  // Emit the transfer event
     }

    // Restringe alcune azioni solo all'admin
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    // Function to transfer tokens to another address
    function transfer(address from, address to, uint256 value) public onlyAdmin returns (bool success) {
        require(balanceOf[from] >= value, "Insufficient balance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }

}
