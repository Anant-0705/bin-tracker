require('dotenv').config();
const pinataSDK = require('@pinata/sdk');
const path = require('path');
const fs = require('fs');

const pinata = new pinataSDK(
    process.env.PINATA_API_KEY,
    process.env.PINATA_SECRET_KEY
);

async function uploadToIPFS() {
    try {
        // Upload images first
        console.log('Uploading images...');
        const imagesPath = path.join(__dirname, '../assets/images');
        const imageUploadResponse = await pinata.pinFromFS(imagesPath);
        console.log('Images uploaded with CID:', imageUploadResponse.IpfsHash);

        // Update metadata files with image CIDs
        const metadataTypes = ['coupons', 'badges'];
        const results = {};

        for (const type of metadataTypes) {
            console.log(`Processing ${type} metadata...`);
            const metadataPath = path.join(__dirname, `../metadata/${type}`);
            
            // Update image URIs in metadata
            const files = fs.readdirSync(metadataPath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(metadataPath, file);
                    const metadata = JSON.parse(fs.readFileSync(filePath));
                    metadata.image = `ipfs://${imageUploadResponse.IpfsHash}/${metadata.image}`;
                    fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
                }
            }

            // Upload metadata
            const metadataUploadResponse = await pinata.pinFromFS(metadataPath);
            console.log(`${type} metadata uploaded with CID:`, metadataUploadResponse.IpfsHash);
            results[type] = metadataUploadResponse.IpfsHash;
        }

        return {
            images: imageUploadResponse.IpfsHash,
            coupons: results.coupons,
            badges: results.badges
        };

    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        throw error;
    }
}

// Execute if running directly
if (require.main === module) {
    uploadToIPFS()
        .then(results => {
            console.log('\nFinal Results:');
            console.log('Images CID:', results.images);
            console.log('Coupons Metadata CID:', results.coupons);
            console.log('Badges Metadata CID:', results.badges);
        })
        .catch(console.error);
}

module.exports = { uploadToIPFS };