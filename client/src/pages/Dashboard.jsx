import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import styled from 'styled-components';
import { roomsService } from '../services/api';

// Componentes estilizados
const DashboardContainer = styled.div`
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

const UserInfo = styled.div`
  display: flex;
  align-items: center;
`;

const Username = styled.span`
  font-weight: 500;
  margin-right: 15px;
`;

const LogoutButton = styled.button`
  background-color: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background-color: var(--primary);
    color: white;
  }
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 3fr;
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  height: fit-content;
`;

const CardTitle = styled.h2`
  color: var(--primary);
  font-size: 1.5rem;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
`;

const ProfileCard = styled(Card)`
  text-align: center;
`;

const Avatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: var(--primary-light);
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 15px;
  color: white;
  font-size: 2.5rem;
  font-weight: bold;
`;

const Stats = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary);
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
`;

const RoomsContainer = styled(Card)`
  flex: 1;
`;

const RoomsList = styled.div`
  margin-top: 20px;
  max-height: 300px;
  overflow-y: auto;
`;

const RoomItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
  background-color: #f5f5f5;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const RoomName = styled.div`
  font-weight: 500;
`;

const RoomPlayers = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const JoinButton = styled.button`
  background-color: var(--secondary);
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: var(--secondary-dark);
  }
`;

const CreateRoomSection = styled.div`
  margin-top: 30px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-weight: 500;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SubmitButton = styled.button`
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: var(--primary-dark);
  }
`;

const OtherFeatures = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-top: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled(Card)`
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const FeatureIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 10px;
`;

const JoinRoomModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
`;

const ModalTitle = styled.h2`
  margin-bottom: 20px;
  color: var(--primary);
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const CancelButton = styled.button`
  background-color: #e0e0e0;
  color: #333;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: #d0d0d0;
  }
`;

const ErrorMessage = styled.p`
  color: var(--error);
  margin-top: 10px;
  font-size: 14px;
`;

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  
  const [publicRooms, setPublicRooms] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [joinError, setJoinError] = useState('');

  // Datos simulados para el perfil
  const profileData = {
    wins: 12,
    losses: 5,
    ratio: '70%'
  };

  useEffect(() => {
    // Cargar salas públicas al inicio
    const fetchPublicRooms = async () => {
      try {
        const res = await roomsService.getPublicRooms();
        console.log('Respuesta de salas públicas:', res);
        setPublicRooms(res.data || []);
      } catch (err) {
        console.error('Error al cargar salas:', err);
      }
    };

    fetchPublicRooms();

    // Configurar eventos de socket si está conectado
    if (socket && connected) {
      // Actualización de la lista de salas
      socket.on('roomsUpdated', (rooms) => {
        setPublicRooms(rooms);
      });

      // Evento cuando se crea una sala
      socket.on('roomCreated', ({ roomId }) => {
        navigate(`/room/${roomId}`);
      });

      // Evento cuando se une a una sala
      socket.on('roomJoined', ({ roomId }) => {
        navigate(`/room/${roomId}`);
      });

      // Evento de error al unirse
      socket.on('joinError', ({ message }) => {
        setJoinError(message);
      });
    }

    return () => {
      if (socket) {
        socket.off('roomsUpdated');
        socket.off('roomCreated');
        socket.off('roomJoined');
        socket.off('joinError');
      }
    };
  }, [socket, connected, navigate]);

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
    }
    logout();
    navigate('/');
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    setError('');

    if (!roomName) {
      setError('Por favor ingresa un nombre para la sala');
      return;
    }

    if (isPrivate && !password) {
      setError('Las salas privadas requieren una contraseña');
      return;
    }

    if (socket && connected) {
      setLoading(true);
      socket.emit('createRoom', {
        roomName,
        isPrivate,
        password: isPrivate ? password : null
      });
      setLoading(false);
    } else {
      setError('No hay conexión con el servidor');
    }
  };

  const handleJoinRoom = (room) => {
    setSelectedRoom(room);
    setJoinPassword('');
    setJoinError('');
    setShowJoinModal(true);
  };

  const confirmJoinRoom = () => {
    if (socket && connected) {
      socket.emit('joinRoom', {
        roomId: selectedRoom.id,
        password: joinPassword
      });
    } else {
      setJoinError('No hay conexión con el servidor');
    }
  };

  const closeJoinModal = () => {
    setShowJoinModal(false);
    setSelectedRoom(null);
    setJoinPassword('');
    setJoinError('');
  };

  // Función para obtener la primera letra del nombre de usuario para el avatar
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <DashboardContainer>
      <Header>
        <Logo>Batalla Naval</Logo>
        <UserInfo>
          <Username>👤 {currentUser?.username}</Username>
          <LogoutButton onClick={handleLogout}>Cerrar Sesión</LogoutButton>
        </UserInfo>
      </Header>

      <MainContent>
        <Sidebar>
          <ProfileCard>
            <CardTitle>Mi Perfil</CardTitle>
            <Avatar>{getInitial(currentUser?.username)}</Avatar>
            <h3>{currentUser?.username}</h3>
            <Stats>
              <StatItem>
                <StatValue>{profileData.wins}</StatValue>
                <StatLabel>Victorias</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{profileData.losses}</StatValue>
                <StatLabel>Derrotas</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{profileData.ratio}</StatValue>
                <StatLabel>Ratio</StatLabel>
              </StatItem>
            </Stats>
          </ProfileCard>

          <Card>
            <CardTitle>Crear Sala</CardTitle>
            <Form onSubmit={handleCreateRoom}>
              <FormGroup>
                <Label htmlFor="roomName">Nombre de la Sala</Label>
                <Input
                  id="roomName"
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Ingresa un nombre para la sala"
                  disabled={loading}
                />
              </FormGroup>

              <Checkbox>
                <input
                  id="isPrivate"
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  disabled={loading}
                />
                <Label htmlFor="isPrivate">Sala Privada</Label>
              </Checkbox>

              {isPrivate && (
                <FormGroup>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa una contraseña"
                    disabled={loading}
                  />
                </FormGroup>
              )}

              {error && <ErrorMessage>{error}</ErrorMessage>}

              <SubmitButton type="submit" disabled={loading}>
                {loading ? 'Creando...' : 'Crear Sala'}
              </SubmitButton>
            </Form>
          </Card>
        </Sidebar>

        <div>
          <RoomsContainer>
            <CardTitle>Salas Disponibles</CardTitle>
            <p>Únete a una partida existente o crea tu propia sala para jugar.</p>

            <RoomsList>
              {publicRooms.length > 0 ? (
                publicRooms.map((room) => (
                  <RoomItem key={room.id}>
                    <div>
                      <RoomName>{room.name}</RoomName>
                      <RoomPlayers>Jugadores: {Array.isArray(room.players) ? room.players.length : room.players}/2</RoomPlayers>
                    </div>
                    <JoinButton onClick={() => handleJoinRoom(room)}>
                      Unirse
                    </JoinButton>
                  </RoomItem>
                ))
              ) : (
                <p>No hay salas públicas disponibles. ¡Crea una nueva!</p>
              )}
            </RoomsList>
          </RoomsContainer>

          <OtherFeatures>
            <FeatureCard>
              <FeatureIcon>🏪</FeatureIcon>
              <CardTitle>Tienda</CardTitle>
              <p>Próximamente: Personaliza tu experiencia con nuevos temas y avatares.</p>
            </FeatureCard>

            <FeatureCard>
              <FeatureIcon>🎲</FeatureIcon>
              <CardTitle>Más Juegos</CardTitle>
              <p>Próximamente: Descubre otros juegos clásicos en nuestra plataforma.</p>
            </FeatureCard>

            <FeatureCard>
              <FeatureIcon>🧾</FeatureIcon>
              <CardTitle>Créditos</CardTitle>
              <p>Desarrollado como parte del proyecto Batalla Naval Online.</p>
            </FeatureCard>
          </OtherFeatures>
        </div>
      </MainContent>

      {showJoinModal && (
        <JoinRoomModal>
          <ModalContent>
            <ModalTitle>Unirse a {selectedRoom.name}</ModalTitle>
            
            {selectedRoom.isPrivate && (
              <FormGroup>
                <Label htmlFor="joinPassword">Contraseña</Label>
                <Input
                  id="joinPassword"
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Ingresa la contraseña de la sala"
                />
              </FormGroup>
            )}
            
            {joinError && <ErrorMessage>{joinError}</ErrorMessage>}
            
            <ModalButtons>
              <CancelButton onClick={closeJoinModal}>Cancelar</CancelButton>
              <SubmitButton onClick={confirmJoinRoom}>Unirse</SubmitButton>
            </ModalButtons>
          </ModalContent>
        </JoinRoomModal>
      )}
    </DashboardContainer>
  );
};

export default Dashboard;