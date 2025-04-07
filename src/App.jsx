import React from 'react'
import { Box, Button, Container, Heading, Stack, Text, useToast } from '@chakra-ui/react'
import { useState } from 'react'
import GameBoard from './components/GameBoard'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const toast = useToast()

  const handleStartGame = () => {
    if (!playerName) {
      toast({
        title: 'Nombre requerido',
        description: 'Por favor ingresa tu nombre para comenzar',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    setGameStarted(true)
  }

  return (
    <Container maxW="container.xl" py={8}>
      {!gameStarted ? (
        <Stack spacing={8} align="center">
          <Heading size="2xl" textAlign="center">
            Batalla Naval Online
          </Heading>
          <Text fontSize="xl">
            ¡Bienvenido al clásico juego de estrategia naval!
          </Text>
          <Box w="100%" maxW="md">
            <input
              type="text"
              placeholder="Ingresa tu nombre"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '16px',
                borderRadius: '4px',
                border: '1px solid gray'
              }}
            />
            <Button
              colorScheme="blue"
              size="lg"
              width="100%"
              onClick={handleStartGame}
            >
              Comenzar Juego
            </Button>
          </Box>
        </Stack>
      ) : (
        <GameBoard playerName={playerName} />
      )}
    </Container>
  )
}

export default App