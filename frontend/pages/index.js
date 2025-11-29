import { useWalletKit } from '../utils/WalletConnectConfig';
import { ethers } from 'ethers';

// Contract Addresses (Use your deployed Burn Manager Address here)
const FOF_NFT_ADDRESS = '0x049ee6d2249c242611e1b704f0babaa8157d69eb';
const BURN_MANAGER_ADDRESS = 'YOUR_BURN_MANAGER_CONTRACT_ADDRESS'; // Replace with deployed address
const BURN_MANAGER_ABI = [
    // Minimal ABI for burnAndRedeem and setApprovalForAll
    "function burnAndRedeem(uint256 _tokenId, string _rarity)",
    "function isApprovedForAll(address owner, address operator) view returns (bool)",
    "function setApprovalForAll(address operator, bool approved)"
];
const FOF_NFT_ABI = [
    // Minimal ABI for setApprovalForAll
    "function setApprovalForAll(address operator, bool approved)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function ownerOf(uint256 tokenId) view returns (address)"
];


export default function BurnDashboard() {
  const { isConnected, provider, connect, account } = useWalletKit();
  
  // Example State for input
  const [tokenIdInput, setTokenIdInput] = React.useState('');
  const [rarityInput, setRarityInput] = React.useState('');
  const [message, setMessage] = React.useState('');
  
  const handleBurn = async () => {
    if (!isConnected || !provider || !tokenIdInput || !rarityInput) {
      setMessage("Please connect wallet and fill all fields.");
      return;
    }

    try {
      // 1. Setup Ethers signer and contracts
      const signer = new ethers.providers.Web3Provider(provider).getSigner();
      const nftContract = new ethers.Contract(FOF_NFT_ADDRESS, FOF_NFT_ABI, signer);
      const burnManagerContract = new ethers.Contract(BURN_MANAGER_ADDRESS, BURN_MANAGER_ABI, signer);

      // --- 2. Check and Set Approval ---
      const isApproved = await nftContract.isApprovedForAll(account, BURN_MANAGER_ADDRESS);

      if (!isApproved) {
        setMessage("Approving NFT contract... Please confirm the transaction.");
        const approvalTx = await nftContract.setApprovalForAll(BURN_MANAGER_ADDRESS, true);
        await approvalTx.wait();
        setMessage("Approval successful. Moving to burn...");
      }

      // --- 3. Execute Burn and Redeem ---
      setMessage(`Burning Token ID ${tokenIdInput} (${rarityInput}). Please confirm the transaction.`);
      const burnTx = await burnManagerContract.burnAndRedeem(
        tokenIdInput, 
        rarityInput
      );
      
      const receipt = await burnTx.wait();
      setMessage(`Burn successful! You have received your 80% ETH reward and triggered a donation. Transaction Hash: ${receipt.hash}. Your merchandise claim is now pending.`);
      
    } catch (error) {
      console.error("Burn Error:", error);
      setMessage(`Transaction failed: ${error.message || error.reason}`);
    }
  };

  return (
    <div>
      <header>
        <h1>FOF For Africa Burn Portal</h1>
        <button onClick={connect}>
          {isConnected ? `Connected: ${account.substring(0, 6)}...` : 'Connect Wallet'}
        </button>
      </header>
      
      {/* --- NFT Display and Input ---
       * NOTE: You would implement logic here to fetch the user's FOF NFTs, 
       * read their metadata to determine the rarity, and populate the inputs automatically. 
       * For this example, we use manual input.
      */}
      {isConnected && (
        <section>
          <h2>Burn Your FOF NFT</h2>
          <p>Burn mechanism: 80% ETH to you, 20% ETH to charity (for Elite, Epic, Legend).</p>
          
          <input
            type="number"
            placeholder="NFT Token ID"
            value={tokenIdInput}
            onChange={(e) => setTokenIdInput(e.target.value)}
          />
          <select 
            value={rarityInput} 
            onChange={(e) => setRarityInput(e.target.value)}
          >
            <option value="">Select Rarity</option>
            <option value="Uncommon">Uncommon</option>
            <option value="Elite">Elite</option>
            <option value="Epic">Epic</option>
            <option value="Legend">Legend</option>
          </select>
          
          <button onClick={handleBurn}>BURN & REDEEM</button>
          <p>{message}</p>
        </section>
      )}
    </div>
  );
}
