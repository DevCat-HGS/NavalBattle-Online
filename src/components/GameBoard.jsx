import React from 'react'
import { useEffect, useState } from 'react'
import { Grid, GridItem, VStack, HStack, Text, Button, useToast } from '@chakra-ui/react'
import { io } from 'socket.io-client'

const BOARD_SIZE = 10
const SHIPS = [
  { name: 'Portaaviones', size: 5 },
  { name: 'Acorazado', size: 4 },
  { name: 'Crucero', size: 3 },
  { name: 'Submarino', size: 3 },
  { name: 'Destructor', size: 2 }
]

function GameBoard({ playerName }) {
  const [playerBoard, setPlayerBoard] = useState(Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null)))
  const [enemyBoard, setEnemyBoard] = useState(Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null)))
  const [currentShip, setCurrentShip] = useState(0)
  const [isPlacingShips, setIsPlacingShips] = useState(true)
  const [isVertical, setIsVertical] = useState(false)
  const toast = useToast()

  const handleCellClick = (board, row, col) => {
    if (isPlacingShips && board === 'player') {
      placeShip(row, col)
    } else if (!isPlacingShips && board === 'enemy') {
      attackCell(row, col)
    }
  }

  const placeShip = (row, col) => {
    if (currentShip >= SHIPS.length) return

    const ship = SHIPS[currentShip]
    const newBoard = [...playerBoard]
    let canPlace = true

    // Verificar si el barco cabe en la posición seleccionada
    for (let i = 0; i < ship.size; i++) {
      const newRow = isVertical ? row + i : row
      const newCol = isVertical ? col : col + i

      if (newRow >= BOARD_SIZE || newCol >= BOARD_SIZE || newBoard[newRow][newCol] !== null) {
        canPlace = false
        break
      }
    }

    if (canPlace) {
      for (let i = 0; i < ship.size; i++) {
        const newRow = isVertical ? row + i : row
        const newCol = isVertical ? col : col + i
        newBoard[newRow][newCol] = currentShip
      }
      setPlayerBoard(newBoard)
      setCurrentShip(currentShip + 1)

      if (currentShip + 1 >= SHIPS.length) {
        setIsPlacingShips(false)
        toast({
          title: '¡Barcos colocados!',
          description: 'Ahora puedes comenzar a atacar al enemigo',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }
    } else {
      toast({
        title: 'Posición inválida',
        description: 'No puedes colocar el barco en esta posición',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const attackCell = (row, col) => {
    if (enemyBoard[row][col] === 'hit' || enemyBoard[row][col] === 'miss') return

    const newBoard = [...enemyBoard]
    // Aquí se implementará la lógica de ataque cuando se agregue el backend
    newBoard[row][col] = Math.random() < 0.5 ? 'hit' : 'miss'
    setEnemyBoard(newBoard)
  }

  const getCellColor = (value, isEnemy) => {
    if (value === null) return 'gray.700'
    if (value === 'hit') return 'red.500'
    if (value === 'miss') return 'blue.500'
    return isEnemy ? 'gray.700' : 'green.500'
  }

  return (
    <VStack spacing={8}>
      <Text fontSize="2xl">{isPlacingShips ? `Coloca tu ${SHIPS[currentShip]?.name}` : 'Batalla Naval'}</Text>
      
      {isPlacingShips && (
        <Button onClick={() => setIsVertical(!isVertical)}>
          Rotar Barco ({isVertical ? 'Vertical' : 'Horizontal'})
        </Button>
      )}

      <HStack spacing={12} align="start">
        <VStack>
          <Text>Tu Tablero</Text>
          <Grid templateColumns={`repeat(${BOARD_SIZE}, 1fr)`} gap={1}>
            {playerBoard.map((row, i) =>
              row.map((cell, j) => (
                <GridItem
                  key={`player-${i}-${j}`}
                  w="30px"
                  h="30px"
                  bg={getCellColor(cell, false)}
                  border="1px"
                  borderColor="gray.500"
                  onClick={() => handleCellClick('player', i, j)}
                  cursor={isPlacingShips ? 'pointer' : 'default'}
                />
              ))
            )}
          </Grid>
        </VStack>

        <VStack>
          <Text>Tablero Enemigo</Text>
          <Grid templateColumns={`repeat(${BOARD_SIZE}, 1fr)`} gap={1}>
            {enemyBoard.map((row, i) =>
              row.map((cell, j) => (
                <GridItem
                  key={`enemy-${i}-${j}`}
                  w="30px"
                  h="30px"
                  bg={getCellColor(cell, true)}
                  border="1px"
                  borderColor="gray.500"
                  onClick={() => handleCellClick('enemy', i, j)}
                  cursor={!isPlacingShips ? 'pointer' : 'default'}
                />
              ))
            )}
          </Grid>
        </VStack>
      </HStack>
    </VStack>
  )
}

export default GameBoard