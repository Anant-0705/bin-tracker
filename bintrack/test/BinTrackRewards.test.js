const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BinTrackRewards", function () {
  let binTrackRewards;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const BinTrackRewards = await ethers.getContractFactory("BinTrackRewards");
    binTrackRewards = await BinTrackRewards.deploy();
    await binTrackRewards.waitForDeployment();
  });

  describe("Minting", function () {
    it("Should mint a coupon when a user finds a bin", async function () {
      await binTrackRewards.updateBinCount(user1.address, 1);
      expect(await binTrackRewards.ownerOf(1)).to.equal(user1.address);
    });

    it("Should mint a badge when user finds 10 bins", async function () {
      await binTrackRewards.updateBinCount(user1.address, 10);
      expect(await binTrackRewards.ownerOf(10001)).to.equal(user1.address);
    });
  });

  describe("URI Management", function () {
    it("Should set and return correct base URIs", async function () {
      const couponURI = "ipfs://couponCID/";
      const badgeURI = "ipfs://badgeCID/";
      
      await binTrackRewards.setCouponBaseURI(couponURI);
      await binTrackRewards.setBadgeBaseURI(badgeURI);
      
      await binTrackRewards.mintCoupon(user1.address);
      await binTrackRewards.mintBadge(user1.address);
      
      expect(await binTrackRewards.tokenURI(1)).to.equal(couponURI + "1.json");
      expect(await binTrackRewards.tokenURI(10001)).to.equal(badgeURI + "10001.json");
    });
  });
});