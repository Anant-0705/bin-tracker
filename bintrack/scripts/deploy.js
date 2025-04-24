const hre = require("hardhat");

async function main() {
  const BinTrackRewards = await hre.ethers.getContractFactory("BinTrackRewards");
  const binTrackRewards = await BinTrackRewards.deploy();

  await binTrackRewards.waitForDeployment();
  
  const address = await binTrackRewards.getAddress();
  console.log("BinTrackRewards deployed to:", address);

  // Set base URIs using the IPFS CIDs
  const couponBaseURI = "ipfs://QmXxQdhvX6zqi4imaCdgGi5c1DueWjmc9HSp7Xp8kFkiX2/";
  const badgeBaseURI = "ipfs://QmNaWy6SLDvfsjd59dGW6iAaK7PGaT4VBycRLHUj1Fq6uM/";
  
  await binTrackRewards.setCouponBaseURI(couponBaseURI);
  await binTrackRewards.setBadgeBaseURI(badgeBaseURI);

  console.log("Base URIs set successfully");
  console.log("Coupon Base URI:", couponBaseURI);
  console.log("Badge Base URI:", badgeBaseURI);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});