import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Skeleton,
  Button,
  VStack,
  HStack,
  Image,
  useColorModeValue,
  Center,
  Badge
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import * as THREE from 'three';
import NavBar from '../components/NavBar';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';
import { COUPON_METADATA, BADGE_METADATA } from '../config/metadata';

export default function Home() {
  const [account, setAccount] = useState('');
  const [binCount, setBinCount] = useState(0);
  const [coupons, setCoupons] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nftReward, setNftReward] = useState(null);
  const [loadingNFTs, setLoadingNFTs] = useState(false);
  const [animatingNFT, setAnimatingNFT] = useState(false);
  const toast = useToast();
  const threeContainerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const nftModelRef = useRef(null);
  
  // Theme colors
  const bgColor = useColorModeValue('#f0fff4', '#1a202c'); // light green bg in light mode
  const cardBg = useColorModeValue('white', '#2D3748');
  const borderColor = useColorModeValue('#38A169', '#2F855A'); // green border
  const primaryColor = '#38A169'; // primary green
  const secondaryColor = '#9AE6B4'; // lighter green
  
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      connectWallet();
    }
    
    // Initialize Three.js scene
    initThreeJs();
    
    // Clean up Three.js on unmount
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (sceneRef.current) {
          disposeScene(sceneRef.current);
        }
      }
    };
  }, []);
  
  const disposeScene = (scene) => {
    scene.children.forEach(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  };
  
  const initThreeJs = () => {
    if (!threeContainerRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      threeContainerRef.current.clientWidth / threeContainerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(threeContainerRef.current.clientWidth, threeContainerRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0); // transparent background
    threeContainerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);
    
    // Create NFT model (simple spinning cube with texture for now)
    createNftModel();
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (nftModelRef.current) {
        nftModelRef.current.rotation.x += 0.01;
        nftModelRef.current.rotation.y += 0.01;
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!threeContainerRef.current) return;
      
      camera.aspect = threeContainerRef.current.clientWidth / threeContainerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(threeContainerRef.current.clientWidth, threeContainerRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
  };
  
  const createNftModel = () => {
    if (!sceneRef.current) return;
    
    // Create a simple cube with NFT texture
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    
    // Create a canvas texture with "BinTrack NFT" text
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    context.fillStyle = '#38A169'; // green background
    context.fillRect(0, 0, 256, 256);
    context.fillStyle = 'white';
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('BinTrack', 128, 108);
    context.fillText('NFT', 128, 148);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshStandardMaterial({ map: texture });
    
    const cube = new THREE.Mesh(geometry, material);
    cube.visible = false; // Hide initially
    sceneRef.current.add(cube);
    nftModelRef.current = cube;
  };
  
  const animateNftToWallet = () => {
    if (!nftModelRef.current || !sceneRef.current) return;
    
    setAnimatingNFT(true);
    
    // Make NFT visible
    nftModelRef.current.visible = true;
    nftModelRef.current.position.set(0, 0, 0);
    
    // Animation parameters
    const startPosition = new THREE.Vector3(0, 0, 0);
    const endPosition = new THREE.Vector3(3, 3, 0); // Position representing wallet
    const duration = 2000; // 2 seconds
    const startTime = Date.now();
    
    // Animation function
    const animateNft = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth movement
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
      
      // Update position
      nftModelRef.current.position.lerpVectors(
        startPosition,
        endPosition,
        easeProgress
      );
      
      // Scale effect
      const scale = 1 + Math.sin(progress * Math.PI) * 0.5;
      nftModelRef.current.scale.set(scale, scale, scale);
      
      if (progress < 1) {
        requestAnimationFrame(animateNft);
      } else {
        // Animation complete
        setTimeout(() => {
          nftModelRef.current.visible = false;
          setAnimatingNFT(false);
        }, 500);
      }
    };
    
    // Start animation
    animateNft();
  };

  const connectWallet = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      
      // Load initial bin count and NFTs
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );
      const count = await contract.userBinCount(accounts[0]);
      setBinCount(count.toNumber());
      await loadNFTs(contract, accounts[0]);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect wallet',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadNFTs = async (contract, address) => {
    setLoadingNFTs(true);
    try {
      const balance = await contract.balanceOf(address);
      const newCoupons = [];
      const newBadges = [];

      // For coupons
      for (const [id, metadata] of Object.entries(COUPON_METADATA)) {
        try {
          const owner = await contract.ownerOf(Number(id));
          if (owner.toLowerCase() === address.toLowerCase()) {
            newCoupons.push({
              ...metadata,
              tokenId: Number(id)
            });
          }
        } catch (error) {
          continue;
        }
      }

      // For badges
      for (const [id, metadata] of Object.entries(BADGE_METADATA)) {
        try {
          const owner = await contract.ownerOf(Number(id));
          if (owner.toLowerCase() === address.toLowerCase()) {
            newBadges.push({
              ...metadata,
              tokenId: Number(id)
            });
          }
        } catch (error) {
          continue;
        }
      }

      setCoupons(newCoupons);
      setBadges(newBadges);
    } catch (error) {
      console.error('Error loading NFTs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load NFTs',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoadingNFTs(false);
    }
  };

  const testIncrementBinCount = async () => {
    if (!account) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        status: 'error',
        duration: 5000,
      });
      return;
    }
  
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );
  
      setLoading(true);
  
      // Get current bin count first
      const currentCount = await contract.userBinCount(account);
      const newCount = currentCount.toNumber() + 1;
  
      // Send transaction with fixed gas limit
      const tx = await contract.updateBinCount(account, newCount, {
        gasLimit: 100000,
        from: account
      });
      
      await tx.wait();
  
      // Refresh data
      const updatedCount = await contract.userBinCount(account);
      setBinCount(updatedCount.toNumber());
      
      // Trigger NFT animation
      animateNftToWallet();
      
      await loadNFTs(contract, account);
  
      toast({
        title: 'Success!',
        description: `Bin count increased to ${updatedCount.toNumber()}`,
        status: 'success',
        duration: 5000,
        position: 'bottom-right',
        isClosable: true,
        variant: 'solid',
        containerStyle: {
          background: primaryColor,
          borderRadius: '8px',
        }
      });
  
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Transaction failed. Make sure you have enough ETH for gas fees.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box bg={bgColor} minH="100vh">
      <NavBar />
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* 3D Animation Container */}
          <Box 
            position="fixed"
            top="20%"
            right="5%"
            width="300px"
            height="300px"
            zIndex="10"
            ref={threeContainerRef}
          />
          
          <Box 
            bg="white" 
            p={6} 
            borderRadius="lg" 
            boxShadow="xl"
            borderLeft="5px solid"
            borderColor={primaryColor}
          >
            <HStack justify="space-between" wrap="wrap">
              <VStack align="flex-start" spacing={1}>
                <Heading color={primaryColor}>BinTrack Dashboard</Heading>
                <Text fontSize="sm" color="gray.500">Tracking recycling for a greener future</Text>
              </VStack>
              
              <Button
                onClick={testIncrementBinCount}
                bg={primaryColor}
                color="white"
                size="lg"
                isLoading={loading}
                loadingText="Processing..."
                disabled={!account || animatingNFT}
                _hover={{ bg: '#2F855A' }}
                leftIcon={
                  <Box as="span" fontSize="1.5em">
                    🗑️
                  </Box>
                }
                boxShadow="md"
              >
                Find a Bin
              </Button>
            </HStack>
          </Box>

          {/* User Stats */}
          <SimpleGrid 
            columns={[1, 2, 3]} 
            spacing={6}
            mt={4}
          >
            <Stat 
              p={6} 
              bg={cardBg} 
              borderRadius="lg" 
              boxShadow="md"
              border="1px" 
              borderColor={borderColor}
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                width: '100%',
                height: '4px',
                top: 0,
                left: 0,
                bg: primaryColor
              }}
            >
              <StatLabel fontSize="lg" color={primaryColor}>Bins Found</StatLabel>
              <StatNumber fontSize="4xl" fontWeight="bold">
                {loading ? <Skeleton height="40px" /> : binCount}
              </StatNumber>
              <StatHelpText>Total contributions</StatHelpText>
              <Box 
                position="absolute" 
                right="6" 
                bottom="6" 
                opacity="0.2" 
                fontSize="4xl"
              >
                🗑️
              </Box>
            </Stat>
            
            <Stat 
              p={6} 
              bg={cardBg} 
              borderRadius="lg" 
              boxShadow="md"
              border="1px" 
              borderColor={borderColor}
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                width: '100%',
                height: '4px',
                top: 0,
                left: 0,
                bg: secondaryColor
              }}
            >
              <StatLabel fontSize="lg" color={primaryColor}>Coupons Earned</StatLabel>
              <StatNumber fontSize="4xl" fontWeight="bold">
                {loadingNFTs ? <Skeleton height="40px" /> : coupons.length}
              </StatNumber>
              <StatHelpText>Available rewards</StatHelpText>
              <Box 
                position="absolute" 
                right="6" 
                bottom="6" 
                opacity="0.2" 
                fontSize="4xl"
              >
                🎫
              </Box>
            </Stat>
            
            <Stat 
              p={6} 
              bg={cardBg} 
              borderRadius="lg" 
              boxShadow="md"
              border="1px" 
              borderColor={borderColor}
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                width: '100%',
                height: '4px',
                top: 0,
                left: 0,
                bg: secondaryColor
              }}
            >
              <StatLabel fontSize="lg" color={primaryColor}>Badges Earned</StatLabel>
              <StatNumber fontSize="4xl" fontWeight="bold">
                {loadingNFTs ? <Skeleton height="40px" /> : badges.length}
              </StatNumber>
              <StatHelpText>Achievements unlocked</StatHelpText>
              <Box 
                position="absolute" 
                right="6" 
                bottom="6" 
                opacity="0.2" 
                fontSize="4xl"
              >
                🏆
              </Box>
            </Stat>
          </SimpleGrid>

          {nftReward && (
            <Box 
              p={5} 
              bg={cardBg}
              borderRadius="lg"
              boxShadow="md"
              border="1px"
              borderColor={borderColor}
              mb={4}
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                width: '4px',
                height: '100%',
                bg: 'linear-gradient(to bottom, #38A169, #9AE6B4)'
              }}
            >
              <Badge 
                px={3} 
                py={1} 
                bg={primaryColor} 
                color="white" 
                borderRadius="full"
                mb={2}
              >
                NEW REWARD
              </Badge>
              <Heading size="md" mb={2}>{nftReward.name}</Heading>
              <Text>{nftReward.description}</Text>
            </Box>
          )}

          {/* Coupons Section */}
          <Box 
            bg={cardBg} 
            p={6} 
            borderRadius="lg" 
            boxShadow="md"
            border="1px"
            borderColor={borderColor}
            mb={8}
          >
            <Heading size="md" color={primaryColor} mb={4}>Your Coupons</Heading>
            {loadingNFTs ? (
              <SimpleGrid columns={[1, 2, 3]} spacing={6}>
                {Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} height="200px" borderRadius="lg" />
                ))}
              </SimpleGrid>
            ) : coupons.length > 0 ? (
              <SimpleGrid columns={[1, 2, 3]} spacing={6}>
                {coupons.map((coupon, index) => (
                  <Box 
                    key={index} 
                    p={5} 
                    bg="white" 
                    borderRadius="lg" 
                    boxShadow="md"
                    border="1px"
                    borderColor="gray.200"
                    transition="transform 0.3s, box-shadow 0.3s"
                    _hover={{
                      transform: 'translateY(-5px)',
                      boxShadow: 'lg'
                    }}
                  >
                    <Box 
                      position="relative" 
                      height="180px" 
                      overflow="hidden" 
                      borderRadius="md"
                      mb={3}
                    >
                      <Image
                        src={coupon.image}
                        alt={coupon.name}
                        objectFit="cover"
                        w="100%"
                        h="100%"
                        fallback={<Skeleton height="180px" />}
                      />
                      <Box
                        position="absolute"
                        top="10px"
                        right="10px"
                        bg={primaryColor}
                        color="white"
                        px={2}
                        py={1}
                        borderRadius="md"
                        fontSize="xs"
                        fontWeight="bold"
                      >
                        COUPON
                      </Box>
                    </Box>
                    <Text fontWeight="bold" color={primaryColor}>{coupon.name}</Text>
                    <Text mt={2} fontSize="sm" color="gray.600" noOfLines={2}>{coupon.description}</Text>
                    {coupon.attributes?.map((attr, i) => (
                      <Badge 
                        key={i} 
                        mt={2} 
                        mr={2} 
                        colorScheme="green" 
                        variant="subtle"
                      >
                        {attr.trait_type}: {attr.value}
                      </Badge>
                    ))}
                  </Box>
                ))}
              </SimpleGrid>
            ) : (
              <Center p={10} bg="gray.50" borderRadius="md">
                <VStack spacing={3}>
                  <Box fontSize="3xl">🎫</Box>
                  <Text>No coupons earned yet</Text>
                  <Text fontSize="sm" color="gray.500">Find more bins to earn coupons!</Text>
                </VStack>
              </Center>
            )}
          </Box>

          {/* Badges Section */}
          <Box 
            bg={cardBg}
            p={6} 
            borderRadius="lg" 
            boxShadow="md"
            border="1px"
            borderColor={borderColor}
          >
            <Heading size="md" color={primaryColor} mb={4}>Your Badges</Heading>
            {loadingNFTs ? (
              <SimpleGrid columns={[1, 2, 3]} spacing={6}>
                {Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} height="200px" borderRadius="lg" />
                ))}
              </SimpleGrid>
            ) : badges.length > 0 ? (
              <SimpleGrid columns={[1, 2, 3]} spacing={6}>
                {badges.map((badge, index) => (
                  <Box 
                    key={index} 
                    p={5} 
                    bg="white"
                    borderRadius="lg" 
                    boxShadow="md"
                    border="1px"
                    borderColor="gray.200"
                    transition="transform 0.3s, box-shadow 0.3s"
                    _hover={{
                      transform: 'translateY(-5px)',
                      boxShadow: 'lg'
                    }}
                  >
                    <Box 
                      position="relative" 
                      height="180px" 
                      overflow="hidden" 
                      borderRadius="md"
                      mb={3}
                    >
                      <Image
                        src={badge.image}
                        alt={badge.name}
                        objectFit="cover"
                        w="100%"
                        h="100%"
                        fallback={<Skeleton height="180px" />}
                      />
                      <Box
                        position="absolute"
                        top="10px"
                        right="10px"
                        bg="#805AD5"
                        color="white"
                        px={2}
                        py={1}
                        borderRadius="md"
                        fontSize="xs"
                        fontWeight="bold"
                      >
                        BADGE
                      </Box>
                    </Box>
                    <Text fontWeight="bold" color="#805AD5">{badge.name}</Text>
                    <Text mt={2} fontSize="sm" color="gray.600" noOfLines={2}>{badge.description}</Text>
                    {badge.attributes?.map((attr, i) => (
                      <Badge 
                        key={i} 
                        mt={2} 
                        mr={2} 
                        colorScheme="purple" 
                        variant="subtle"
                      >
                        {attr.trait_type}: {attr.value}
                      </Badge>
                    ))}
                  </Box>
                ))}
              </SimpleGrid>
            ) : (
              <Center p={10} bg="gray.50" borderRadius="md">
                <VStack spacing={3}>
                  <Box fontSize="3xl">🏆</Box>
                  <Text>No badges earned yet</Text>
                  <Text fontSize="sm" color="gray.500">Keep recycling to unlock achievements!</Text>
                </VStack>
              </Center>
            )}
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
