const { ethers } = require("hardhat");

// Configuration
const FOF_NFT_ADDRESS = "0x049ee6d2249c242611e1b704f0babaa8157d69eb";
// Replace with the address you control (for the 20% charity fund collection)
const FOF_FOR_AFRICA_WALLET = "0xYourMultiSigOrEOAWalletAddress"; 

// Initial Rarity Values in ETH (Example values, please adjust based on your floor price)
const INITIAL_RARITY_VALUES = {
    "Uncommon": ethers.utils.parseEther("0.05"), // 100% to user
    "Elite": ethers.utils.parseEther("0.10"),    // 80% user, 20% charity
    "Epic": ethers.utils.parseEther("0.17"),     // 80% user, 20% charity
    "Legend": ethers.utils.parseEther("0.30"),   // 80% user, 20% charity
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy the FOFBurnManager Contract
  const FOFBurnManagerFactory = await ethers.getContractFactory("FOFBurnManager");
  const burnManager = await FOFBurnManagerFactory.deploy(
    FOF_NFT_ADDRESS,
    FOF_FOR_AFRICA_WALLET
  );
  await burnManager.deployed();

  console.log("FOFBurnManager deployed to:", burnManager.address);

  // 2. Initialize Rarity Values
  console.log("\nSetting initial rarity values...");
  
  for (const [rarity, value] of Object.entries(INITIAL_RARITY_VALUES)) {
    console.log(`Setting ${rarity} value to ${ethers.utils.formatEther(value)} ETH...`);
    const tx = await burnManager.setRarityValue(rarity, value);
    await tx.wait();
  }

  console.log("Initialization complete!");
  
  // Optional: Save the contract address for frontend configuration
  // fs.writeFileSync('artifacts/contractAddress.json', JSON.stringify({ BurnManager: burnManager.address }));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
