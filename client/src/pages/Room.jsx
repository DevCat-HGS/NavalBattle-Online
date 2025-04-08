import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import styled from 'styled-components';

const RoomContainer = styled.div`
  min-height: 100vh;
  background-color: var(--background);
  padding: 20px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid var(--primary-light);
`;

const Logo = styled.h1`
  color: var(--primary);
  font-size: 2rem;
  display: flex;
  align-items: center;
  
  &::before {
    content: '🛳️';
    margin-right: 10px;
  }
`;

const BackButton = styled.button`
  background-color: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  
  &::before {
    content: '←';
    margin-right: 5px;
  }
  
  &:hover {
    background-color: var(--primary);
    color: white;
  }
`;

const RoomCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
  max-width: 800px;
  margin: 0 auto;
`;

const RoomHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
`;

const RoomTitle = styled.h2`
  color: var(--primary);
  font-size: 1.8rem;
  display: flex;
  align-items: center;
`;

const RoomInfo = styled.div`
  display: flex;
  gap: 15px;
`;

const RoomType = styled.span`
  background-color: ${props => props.isPrivate ? 'var(--accent)' : 'var(--secondary)'};
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  
  &::before {
    content: '${props => props.isPrivate ? '🔒' : '🔓'}';
    margin-right: 5px;
  }
`;

const RoomId = styled.span`
  background-color: #f0f0f0;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #666;
`;

const PlayersSection = styled.div`
  margin-top: 30px;
`;

const SectionTitle = styled.h3`
  color: var(--primary);
  margin-bottom: 15px;
  font-size: 1.3rem;
`;

const PlayersList = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  
  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const PlayerCard = styled.div`
  flex: 1;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  border: 2px solid ${props => props.isCurrentUser ? 'var(--primary)' : 'transparent'};
`;

const PlayerAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: var(--primary-light);
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 15px;
  color: white;
  font-size: 2rem;
  font-weight: bold;
`;

const PlayerStatus = styled.div`
  margin-top: 10px;
  font-size: 0.9rem;
  color: ${props => props.isReady ? 'var(--success)' : '#666'};
  display: flex;
  justify-content: center;
  align-items: center;
  
  &::before {
    content: '${props => props.isReady ? '✅' : '⏳'}';
    margin-right: 5px;
  }
`;

const EmptySlot = styled.div`
  flex: 1;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #999;
  font-style: italic;
`;

const ActionButton = styled.button`
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  display: block;
  
  &:hover {
    background-color: var(--primary-dark);
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ShareSection = styled.div`
  margin-top: 30px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
`;

const ShareInfo = styled.div`
  margin-bottom: 15px;
  font-size: 0.9rem;
  color: #666;
`;

const ShareCode = styled.div`
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 1.2rem;
  margin-bottom: 15px;
  display: inline-block;
`;

const CopyButton = styled.button`
  background-color: var(--secondary);
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: var(--secondary-dark);
  }
`;

const Room = () => {
  const { roomId } = useParams();
  const { currentUser } = useAuth();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (socket && connected) {
      // Escuchar eventos de la sala
      socket.on('playerJoined', ({ player }) => {
        setRoom(prevRoom => ({
          ...prevRoom,
          players: [...prevRoom.players, player]
        }));
      });
      
      socket.on('playerLeft', ({ username }) => {
        setRoom(prevRoom => ({
          ...prevRoom,
          players: prevRoom.players.filter(p => p.username !== username)
        }));
      });
      
      socket.on('gameStarted', () => {
        navigate(`/game/${roomId}`);
      });
      
      // Obtener información de la sala
      const fetchRoomInfo = async () => {
        try {
          setLoading(true);
          // En una implementación real, haríamos una petición al servidor
          // Por ahora, usamos el socket para obtener la información
          
          // Simulamos la obtención de datos de la sala
          const roomData = {
            id: roomId,
            name: `Sala ${roomId}`,
            isPrivate: false,
            players: [
              { username: currentUser.username }
            ],
            status: 'waiting'
          };
          
          setRoom(roomData);
        } catch (err) {
          setError('Error al cargar la información de la sala');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchRoomInfo();
    }
    
    return () => {
      if (socket) {
        socket.off('playerJoined');
        socket.off('playerLeft');
        socket.off('gameStarted');
      }
    };
  }, [socket, connected, roomId, currentUser, navigate]);
  
  const handleStartGame = () => {
    if (room.players.length < 2) {
      alert('Se necesitan 2 jugadores para iniciar el juego');
      return;
    }
    
    navigate(`/game/${roomId}`);
  };
  
  const handleLeaveRoom = () => {
    if (socket && connected) {
      socket.emit('leaveRoom');
    }
    navigate('/dashboard');
  };
  
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Función para obtener la primera letra del nombre de usuario para el avatar
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };
  
  if (loading) {
    return (
      <RoomContainer>
        <div className="container flex justify-center align-center" style={{ height: '80vh' }}>
          <h2>Cargando sala...</h2>
        </div>
      </RoomContainer>
    );
  }
  
  if (error) {
    return (
      <RoomContainer>
        <div className="container flex justify-center align-center" style={{ height: '80vh' }}>
          <h2>{error}</h2>
          <button className="btn-primary mt-3" onClick={() => navigate('/dashboard')}>
            Volver al Dashboard
          </button>
        </div>
      </RoomContainer>
    );
  }
  
  return (
    <RoomContainer>
      <Header>
        <Logo>Batalla Naval</Logo>
        <BackButton onClick={handleLeaveRoom}>Volver al Dashboard</BackButton>
      </Header>
      
      {room && (
        <RoomCard>
          <RoomHeader>
            <RoomTitle>{room.name}</RoomTitle>
            <RoomInfo>
              <RoomType isPrivate={room.isPrivate}>
                {room.isPrivate ? 'Privada' : 'Pública'}
              </RoomType>
              <RoomId>ID: {roomId}</RoomId>
            </RoomInfo>
          </RoomHeader>
          
          <PlayersSection>
            <SectionTitle>Jugadores ({room.players.length}/2)</SectionTitle>
            <PlayersList>
              {room.players.map((player, index) => (
                <PlayerCard 
                  key={index} 
                  isCurrentUser={player.username === currentUser.username}
                >
                  <PlayerAvatar>{getInitial(player.username)}</PlayerAvatar>
                  <h4>{player.username}</h4>
                  <PlayerStatus isReady={true}>Listo</PlayerStatus>
                </PlayerCard>
              ))}
              
              {room.players.length < 2 && (
                <EmptySlot>
                  <span>⏳</span>
                  <p>Esperando otro jugador...</p>
                </EmptySlot>
              )}
            </PlayersList>
          </PlayersSection>
          
          <ActionButton 
            onClick={handleStartGame} 
            disabled={room.players.length < 2}
          >
            {room.players.length < 2 ? 'Esperando jugadores...' : 'Iniciar Juego'}
          </ActionButton>
          
          {room.isPrivate && (
            <ShareSection>
              <SectionTitle>Invitar a un amigo</SectionTitle>
              <ShareInfo>Comparte este código para que tu amigo pueda unirse a la sala:</ShareInfo>
              <ShareCode>{roomId}</ShareCode>
              <CopyButton onClick={copyRoomId}>
                {copied ? '¡Copiado!' : 'Copiar Código'}
              </CopyButton>
            </ShareSection>
          )}
        </RoomCard>
      )}
    </RoomContainer>
  );
};

export default Room;