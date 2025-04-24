import { Box, Flex, Button, Text, useColorModeValue } from '@chakra-ui/react'
import { useEffect, useState } from 'react'

export default function NavBar() {
  const [account, setAccount] = useState('')

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        })
        setAccount(accounts[0])
      } catch (error) {
        console.error('Error connecting wallet:', error)
      }
    }
  }

  return (
    <Box bg={useColorModeValue('white', 'gray.800')} px={4} shadow="sm">
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <Text fontSize="xl" fontWeight="bold">BinTrack</Text>
        <Button onClick={connectWallet}>
          {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
        </Button>
      </Flex>
    </Box>
  )
}