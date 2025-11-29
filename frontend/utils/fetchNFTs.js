// Install library: npm install axios
import axios from 'axios';

// Configuration (Updated with the provided Alchemy API Key)
const ALCHEMY_API_KEY = "5AqQDQHd0tHjbT88prZ_2"; 
const CHAIN_ID = 1; // 1 for Ethereum Mainnet (Asumsi proyek FOF berada di Mainnet)
const FOF_NFT_ADDRESS = '0x049ee6d2249c242611e1b704f0babaa8157d69eb';

/**
 * @typedef {Object} FofNft
 * @property {string} tokenId
 * @property {string} imageUrl
 * @property {string} rarity - Extracted rarity attribute (e.g., "Elite")
 */

/**
 * Fetches all FOF NFTs owned by a specific address using Alchemy's Asset API.
 * @param {string} ownerAddress The wallet address of the user.
 * @returns {Promise<FofNft[]>} Array of FOF NFT objects.
 */
export async function fetchFofNfts(ownerAddress) {
    if (!ownerAddress) return [];

    // Alchemy API endpoint for getNFTs (Using eth-mainnet based on standard practices for major projects)
    const url = `https://eth-mainnet.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getNFTs`;

    try {
        const response = await axios.get(url, {
            params: {
                owner: ownerAddress,
                contractAddresses: [FOF_NFT_ADDRESS],
                withMetadata: true,
            },
        });

        const nfts = response.data.ownedNfts;

        return nfts
            .map(nft => {
                // Safely extract Rarity from metadata attributes
                // We check for both 'Rarity' and 'rarity' for robustness.
                const rarityAttribute = nft.metadata?.attributes?.find(attr => attr.trait_type === 'Rarity' || attr.trait_type === 'rarity');
                
                return {
                    tokenId: nft.id.tokenId,
                    imageUrl: nft.media?.[0]?.gateway || nft.media?.[0]?.thumbnail,
                    rarity: rarityAttribute ? rarityAttribute.value : 'Uncommon', // Default to Uncommon if not explicitly set
                };
            })
            .filter(nft => nft.rarity); // Filter out NFTs without a determinable rarity
            
    } catch (error) {
        console.error("Error fetching FOF NFTs:", error);
        return [];
    }
}
