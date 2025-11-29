// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title FOFBurnManager
 * @dev Manages the burning of FOF NFTs, distributing ETH rewards, and collecting charity funds.
 */
contract FOFBurnManager is Ownable {
    // FOF NFT contract address (User-provided address)
    IERC721 public immutable FOF_NFT_CONTRACT;
    
    // Wallet controlled by FOF For Africa to accumulate 20% charity funds
    address public FOF_FOR_AFRICA_WALLET;

    // Mapping to store the burn value (in Wei/ETH) for each rarity tier
    mapping(string => uint256) public rarityValues; 

    // Events
    event NFTBurned(
        address indexed user,
        uint256 indexed tokenId,
        string rarity,
        uint256 userRewardWei,
        uint256 charityAmountWei
    );
    
    // The FOF_FOR_AFRICA_WALLET must be set upon deployment
    constructor(address _fofNftAddress, address _charityWallet) {
        FOF_NFT_CONTRACT = IERC721(_fofNftAddress);
        FOF_FOR_AFRICA_WALLET = _charityWallet;
    }
    
    // --- ADMIN FUNCTIONS ---
    
    /**
     * @dev Sets or updates the burn value for a specific rarity tier (in Wei).
     * @param _rarity The rarity string (e.g., "Elite", "Epic").
     * @param _weiValue The new value in Wei/ETH.
     */
    function setRarityValue(string calldata _rarity, uint256 _weiValue) public onlyOwner {
        require(_weiValue > 0, "Value must be greater than zero");
        rarityValues[_rarity] = _weiValue;
    }

    /**
     * @dev Allows the owner to change the charity wallet address.
     */
    function setCharityWallet(address _newWallet) public onlyOwner {
        require(_newWallet != address(0), "Invalid address");
        FOF_FOR_AFRICA_WALLET = _newWallet;
    }

    // --- CORE FUNCTIONALITY ---

    /**
     * @dev Executes the NFT burn, distributes 80% to the user and 20% to charity.
     * @param _tokenId The ID of the NFT to be burned.
     * @param _rarity The rarity string of the NFT (e.g., "Elite").
     * * NOTE: The user must first call approve() on the FOF NFT contract 
     * to allow this BurnManager contract to transfer the token.
     */
    function burnAndRedeem(uint256 _tokenId, string calldata _rarity) public {
        uint256 totalValue = rarityValues[_rarity];
        require(totalValue > 0, "Invalid or unassigned rarity value");

        // 1. Calculate Shares
        // Note: For Elite, Epic, Legend, 20% is donated. For Uncommon, 0% is donated, 100% is user reward (as per project structure).
        
        uint256 userShare;
        uint256 charityShare;

        if (keccak256(abi.encodePacked(_rarity)) == keccak256(abi.encodePacked("Uncommon"))) {
            // Uncommon: 100% user reward, 0% charity
            userShare = totalValue;
            charityShare = 0;
        } else {
            // Elite, Epic, Legend: 80% user reward, 20% charity
            userShare = totalValue * 8 / 10; 
            charityShare = totalValue * 2 / 10; 
        }

        // 2. Transfer & Burn NFT (ERC-721 must support safeTransferFrom to zero address for burning)
        // We use the standard ERC721 burn mechanism: transfer to the zero address (0x0).
        // This requires the contract to first pull the NFT from the user.
        FOF_NFT_CONTRACT.safeTransferFrom(msg.sender, address(this), _tokenId);

        // Actual Burn: The most robust way is to transfer from this contract to address(0)
        // which triggers the internal _burn logic in most standard ERC721 implementations.
        // NOTE: Standard ERC721 does not have a public burn function. 
        // We rely on OpenZeppelin's standard which has: _transfer(from, to, tokenId) where to = 0x0. 
        // We must assume FOF NFT Contract implements ERC721 correctly.
        FOF_NFT_CONTRACT.safeTransferFrom(address(this), address(0), _tokenId);
        
        // 3. Transfer Funds
        
        // Transfer 80% to User (msg.sender)
        (bool successUser, ) = payable(msg.sender).call{value: userShare}("");
        require(successUser, "ETH transfer to user failed");

        // Transfer 20% to FOF Charity Wallet
        if (charityShare > 0) {
            (bool successCharity, ) = payable(FOF_FOR_AFRICA_WALLET).call{value: charityShare}("");
            require(successCharity, "ETH transfer to charity failed");
        }

        // 4. Emit Event for Off-Chain Backend (Merchandise)
        emit NFTBurned(msg.sender, _tokenId, _rarity, userShare, charityShare);
    }

    // Fallback function to allow the contract to receive ETH for distribution.
    receive() external payable {}
}
