import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  Button,
  useToast,
  Skeleton
} from '@chakra-ui/react';
import { NFTCard } from '../components/NFTCard';
import BinTrackRewards from '../artifacts/contracts/BinTrackRewards.json';

const RewardsPage = () => {
  const [account, setAccount] = useState('');
  const [coupons, setCoupons] = useState([]);
  const [badges, setBadges] = useState([]);
  const [binCount, setBinCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      connectWallet();
    }
  }, []);

  const connectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      setAccount(accounts[0]);
      loadNFTs(accounts[0]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to connect wallet',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const loadNFTs = async (address) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        BinTrackRewards.abi,
        provider
      );

      const userBinCount = await contract.userBinCount(address);
      setBinCount(userBinCount.toNumber());

      const balance = await contract.balanceOf(address);
      const newCoupons = [];
      const newBadges = [];

      for (let i = 0; i < balance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(address, i);
        const uri = await contract.tokenURI(tokenId);
        const response = await fetch(uri.replace('ipfs://', 'https://ipfs.io/ipfs/'));
        const metadata = await response.json();
        
        if (tokenId < 10000) {
          newCoupons.push(metadata);
        } else {
          newBadges.push(metadata);
        }
      }

      setCoupons(newCoupons);
      setBadges(newBadges);
      setLoading(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load NFTs',
        status: 'error',
        duration: 5000,
      });
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={6}>Your Rewards Dashboard</Heading>
      
      {!account ? (
        <Button onClick={connectWallet} colorScheme="blue" size="lg">
          Connect Wallet
        </Button>
      ) : (
        <>
          <Text fontSize="xl" mb={6}>
            Bins Found: {binCount}
          </Text>

          <Heading size="lg" mb={4}>Your Coupons</Heading>
          <SimpleGrid columns={[1, 2, 3]} spacing={6} mb={8}>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} height="200px" />
              ))
            ) : (
              coupons.map((coupon, index) => (
                <NFTCard key={index} nft={coupon} type="coupon" />
              ))
            )}
          </SimpleGrid>

          <Heading size="lg" mb={4}>Your Badges</Heading>
          <SimpleGrid columns={[1, 2, 3]} spacing={6}>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} height="200px" />
              ))
            ) : (
              badges.map((badge, index) => (
                <NFTCard key={index} nft={badge} type="badge" />
              ))
            )}
          </SimpleGrid>
        </>
      )}
    </Container>
  );
};

export default RewardsPage;