import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import styled from 'styled-components';

const GameContainer = styled.div`
  min-height: 100vh;
  background-color: var(--background);
  padding: 20px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--primary-light);
`;

const Logo = styled.h1`
  color: var(--primary);
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  
  &::before {
    content: '🛳️';
    margin-right: 10px;
  }
`;

const GameStatus = styled.div`
  background-color: ${props => props.isMyTurn ? 'var(--primary)' : '#666'};
  color: white;
  padding: 8px 15px;
  border-radius: 4px;
  font-weight: 500;
`;

const GameContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const BoardsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const BoardSection = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
`;

const BoardTitle = styled.h2`
  color: var(--primary);
  margin-bottom: 15px;
  text-align: center;
  font-size: 1.5rem;
`;

const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  grid-template-rows: repeat(10, 1fr);
  gap: 2px;
  margin: 0 auto;
  max-width: 400px;
  aspect-ratio: 1 / 1;
`;

const Cell = styled.div`
  background-color: ${props => {
    if (props.isShip && !props.isHidden) return 'var(--primary-light)';
    if (props.isHit && props.isShip) return 'var(--error)';
    if (props.isHit && !props.isShip) return 'var(--secondary-light)';
    return 'var(--secondary)';
  }};
  border-radius: 2px;
  cursor: ${props => props.isSelectable ? 'pointer' : 'default'};
  transition: all 0.2s;
  position: relative;
  
  &:hover {
    opacity: ${props => props.isSelectable ? 0.8 : 1};
    transform: ${props => props.isSelectable ? 'scale(1.05)' : 'none'};
  }
  
  &::after {
    content: ${props => props.isHit ? (props.isShip ? '"💥"' : '"💦"') : '""'};
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.2rem;
  }
`;

const GameControls = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
`;

const ShipsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
`;

const Ship = styled.div`
  background-color: var(--primary-light);
  height: 30px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  width: ${props => props.size * 30}px;
  opacity: ${props => props.isSelected ? 1 : 0.7};
  transform: ${props => props.isSelected ? 'scale(1.05)' : 'none'};
  
  &:hover {
    opacity: 1;
  }
`;

const RotateButton = styled.button`
  background-color: var(--secondary);
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    background-color: var(--secondary-dark);
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ReadyButton = styled.button`
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 10px;
  
  &:hover {
    background-color: var(--primary-dark);
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const GameMessage = styled.div`
  background-color: ${props => {
    if (props.type === 'success') return 'var(--success)';
    if (props.type === 'error') return 'var(--error)';
    return 'var(--primary)';
  }};
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  text-align: center;
  margin: 10px 0;
  font-weight: 500;
`;

const GameOverModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  max-width: 400px;
  width: 90%;
`;

const ModalTitle = styled.h2`
  color: ${props => props.isWinner ? 'var(--success)' : 'var(--error)'};
  font-size: 2rem;
  margin-bottom: 20px;
`;

const ModalButton = styled.button`
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 20px;
  
  &:hover {
    background-color: var(--primary-dark);
  }
`;

// Definición de barcos
const SHIPS = [
  { id: 1, name: 'Portaaviones', size: 5 },
  { id: 2, name: 'Acorazado', size: 4 },
  { id: 3, name: 'Crucero', size: 3 },
  { id: 4, name: 'Submarino', size: 3 },
  { id: 5, name: 'Destructor', size: 2 }
];

const Game = () => {
  const { roomId } = useParams();
  const { currentUser } = useAuth();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  
  // Estado del juego
  const [gameState, setGameState] = useState({
    phase: 'placement', // placement, battle, gameOver
    myTurn: false,
    message: 'Coloca tus barcos en el tablero',
    messageType: 'info'
  });
  
  // Estado de los tableros
  const [myBoard, setMyBoard] = useState(createEmptyBoard());
  const [enemyBoard, setEnemyBoard] = useState(createEmptyBoard());
  
  // Estado de la colocación de barcos
  const [selectedShip, setSelectedShip] = useState(null);
  const [placedShips, setPlacedShips] = useState([]);
  const [orientation, setOrientation] = useState('horizontal');
  const [gameOver, setGameOver] = useState(null);
  
  // Inicializar el juego
  useEffect(() => {
    if (socket && connected) {
      // Escuchar eventos del juego
      socket.on('gameStarted', ({ gameState }) => {
        console.log('Juego iniciado:', gameState);
        // Iniciar fase de colocación de barcos
      });
      
      socket.on('shipsPlaced', () => {
        setGameState(prev => ({
          ...prev,
          message: 'Barcos colocados. Esperando al oponente...',
          messageType: 'success'
        }));
      });
      
      socket.on('allPlayersReady', ({ gameState, currentTurn }) => {
        setGameState(prev => ({
          ...prev,
          phase: 'battle',
          myTurn: currentTurn === socket.id,
          message: currentTurn === socket.id ? 'Tu turno. Realiza un disparo.' : 'Turno del oponente.',
          messageType: 'info'
        }));
      });
      
      socket.on('shotResult', ({ x, y, hit, sunk, shipType, player }) => {
        const isMyShot = player === socket.id;
        
        if (isMyShot) {
          // Actualizar tablero enemigo
          setEnemyBoard(prev => {
            const newBoard = [...prev];
            newBoard[y][x] = { ...newBoard[y][x], isHit: true, isShip: hit };
            return newBoard;
          });
          
          setGameState(prev => ({
            ...prev,
            message: hit ? (sunk ? `¡Hundiste un ${shipType}!` : '¡Impacto!') : 'Agua',
            messageType: hit ? 'success' : 'info'
          }));
        } else {
          // Actualizar mi tablero
          setMyBoard(prev => {
            const newBoard = [...prev];
            newBoard[y][x] = { ...newBoard[y][x], isHit: true };
            return newBoard;
          });
          
          setGameState(prev => ({
            ...prev,
            message: hit ? (sunk ? `¡El enemigo hundió tu ${shipType}!` : '¡El enemigo impactó uno de tus barcos!') : 'El enemigo falló',
            messageType: hit ? 'error' : 'info'
          }));
        }
      });
      
      socket.on('turnChanged', ({ currentTurn }) => {
        setGameState(prev => ({
          ...prev,
          myTurn: currentTurn === socket.id,
          message: currentTurn === socket.id ? 'Tu turno. Realiza un disparo.' : 'Turno del oponente.',
          messageType: 'info'
        }));
      });
      
      socket.on('gameOver', ({ winner, reason }) => {
        const isWinner = winner === socket.id;
        let message = isWinner ? '¡Has ganado la partida!' : '¡Has perdido la partida!';
        
        if (reason === 'opponent_left') {
          message = 'Tu oponente ha abandonado la partida. ¡Victoria!';
        }
        
        setGameOver({
          isWinner,
          message
        });
        
        setGameState(prev => ({
          ...prev,
          phase: 'gameOver',
          message: message,
          messageType: isWinner ? 'success' : 'error'
        }));
      });
    }
    
    return () => {
      if (socket) {
        socket.off('gameStarted');
        socket.off('shipsPlaced');
        socket.off('allPlayersReady');
        socket.off('shotResult');
        socket.off('turnChanged');
        socket.off('gameOver');
      }
    };
  }, [socket, connected]);
  
  // Función para crear un tablero vacío
  function createEmptyBoard() {
    const board = [];
    for (let y = 0; y < 10; y++) {
      const row = [];
      for (let x = 0; x < 10; x++) {
        row.push({
          x,
          y,
          isShip: false,
          isHit: false
        });
      }
      board.push(row);
    }
    return board;
  }
  
  // Función para verificar si un barco puede ser colocado en una posición
  const canPlaceShip = (x, y, ship, orientation) => {
    if (!ship) return false;
    
    const size = ship.size;
    
    // Verificar si el barco cabe en el tablero
    if (orientation === 'horizontal' && x + size > 10) return false;
    if (orientation === 'vertical' && y + size > 10) return false;
    
    // Verificar si hay colisión con otros barcos
    for (let i = 0; i < size; i++) {
      const checkX = orientation === 'horizontal' ? x + i : x;
      const checkY = orientation === 'vertical' ? y + i : y;
      
      if (myBoard[checkY][checkX].isShip) return false;
    }
    
    return true;
  };
  
  // Función para colocar un barco en el tablero
  const placeShip = (x, y) => {
    if (!selectedShip || !canPlaceShip(x, y, selectedShip, orientation)) return;
    
    const newBoard = [...myBoard];
    const shipPositions = [];
    
    for (let i = 0; i < selectedShip.size; i++) {
      const posX = orientation === 'horizontal' ? x + i : x;
      const posY = orientation === 'vertical' ? y + i : y;
      
      newBoard[posY][posX] = { ...newBoard[posY][posX], isShip: true };
      shipPositions.push({ x: posX, y: posY });
    }
    
    setMyBoard(newBoard);
    setPlacedShips([...placedShips, {
      ...selectedShip,
      positions: shipPositions,
      orientation
    }]);
    setSelectedShip(null);
  };
  
  // Función para rotar la orientación del barco
  const rotateShip = () => {
    setOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
  };
  
  // Función para confirmar la colocación de barcos
  const confirmPlacement = () => {
    if (placedShips.length !== SHIPS.length) {
      setGameState(prev => ({
        ...prev,
        message: 'Debes colocar todos los barcos antes de continuar',
        messageType: 'error'
      }));
      return;
    }
    
    if (socket && connected) {
      socket.emit('placeShips', { ships: placedShips });
    }
  };
  
  // Función para realizar un disparo
  const fireShot = (x, y) => {
    if (!gameState.myTurn || gameState.phase !== 'battle') return;
    if (enemyBoard[y][x].isHit) return;
    
    if (socket && connected) {
      socket.emit('fireShot', { x, y });
    }
  };
  
  // Función para volver al dashboard
  const returnToDashboard = () => {
    navigate('/dashboard');
  };
  
  return (
    <GameContainer>
      <Header>
        <Logo>Batalla Naval</Logo>
        <GameStatus isMyTurn={gameState.myTurn}>
          {gameState.phase === 'placement' ? 'Fase de Preparación' : 
           gameState.myTurn ? 'Tu Turno' : 'Turno del Oponente'}
        </GameStatus>
      </Header>
      
      <GameContent>
        {gameState.message && (
          <GameMessage type={gameState.messageType}>
            {gameState.message}
          </GameMessage>
        )}
        
        <BoardsContainer>
          <BoardSection>
            <BoardTitle>Mi Tablero</BoardTitle>
            <Board>
              {myBoard.map((row, y) => 
                row.map((cell, x) => (
                  <Cell 
                    key={`my-${x}-${y}`}
                    isShip={cell.isShip}
                    isHit={cell.isHit}
                    isSelectable={gameState.phase === 'placement' && selectedShip && canPlaceShip(x, y, selectedShip, orientation)}
                    onClick={() => gameState.phase === 'placement' && placeShip(x, y)}
                  />
                ))
              )}
            </Board>
            
            {gameState.phase === 'placement' && (
              <GameControls>
                <ShipsContainer>
                  {SHIPS.map(ship => {
                    const isPlaced = placedShips.some(p => p.id === ship.id);
                    return (
                      <Ship 
                        key={ship.id}
                        size={ship.size}
                        isSelected={selectedShip?.id === ship.id}
                        onClick={() => !isPlaced && setSelectedShip(ship)}
                        style={{ opacity: isPlaced ? 0.3 : 1, cursor: isPlaced ? 'default' : 'pointer' }}
                      >
                        {ship.size}
                      </Ship>
                    );
                  })}
                </ShipsContainer>
                
                <RotateButton onClick={rotateShip} disabled={!selectedShip}>
                  Rotar {orientation === 'horizontal' ? '↕️' : '↔️'}
                </RotateButton>
                
                <ReadyButton onClick={confirmPlacement} disabled={placedShips.length !== SHIPS.length}>
                  Confirmar Posiciones
                </ReadyButton>
              </GameControls>
            )}
          </BoardSection>
          
          <BoardSection>
            <BoardTitle>Tablero Enemigo</BoardTitle>
            <Board>
              {enemyBoard.map((row, y) => 
                row.map((cell, x) => (
                  <Cell 
                    key={`enemy-${x}-${y}`}
                    isShip={cell.isShip}
                    isHit={cell.isHit}
                    isHidden={true}
                    isSelectable={gameState.phase === 'battle' && gameState.myTurn && !cell.isHit}
                    onClick={() => gameState.phase === 'battle' && gameState.myTurn && fireShot(x, y)}
                  />
                ))
              )}
            </Board>
          </BoardSection>
        </BoardsContainer>
      </GameContent>
      
      {gameOver && (
        <GameOverModal>
          <ModalContent>
            <ModalTitle isWinner={gameOver.isWinner}>
              {gameOver.isWinner ? '¡Victoria!' : '¡Derrota!'}
            </ModalTitle>
            <p>{gameOver.message}</p>
            <ModalButton onClick={returnToDashboard}>
              Volver al Dashboard
            </ModalButton>
          </ModalContent>
        </GameOverModal>
      )}
    </GameContainer>
  );
};

export default Game;