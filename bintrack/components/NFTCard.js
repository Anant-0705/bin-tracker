import { Box, Image, Text, Badge, useColorModeValue } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

export const NFTCard = ({ nft, type }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <MotionBox
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={bgColor}
      borderColor={borderColor}
      shadow="md"
    >
      <Image
        src={nft.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
        alt={nft.name}
        width="100%"
        height="200px"
        objectFit="cover"
      />
      <Box p={4}>
        <Badge colorScheme={type === 'coupon' ? 'green' : 'purple'} mb={2}>
          {type.toUpperCase()}
        </Badge>
        <Text fontWeight="bold" fontSize="xl" mb={2}>
          {nft.name}
        </Text>
        <Text color="gray.600" fontSize="sm">
          {nft.description}
        </Text>
      </Box>
    </MotionBox>
  );
};