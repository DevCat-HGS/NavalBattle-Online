require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

// Rutas
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');

// Inicialización
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket'],
  upgrade: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// Middleware
app.use(cors());
app.use(express.json());

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Gestión de salas y juegos
const rooms = {};
const users = {};

// Socket.IO
io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);
  
  // Registro de usuario en el sistema de sockets
  socket.on('register', (userData) => {
    users[socket.id] = {
      id: socket.id,
      username: userData.username,
      roomId: null
    };
    console.log(`Usuario registrado: ${userData.username}`);
  });

  // Crear una sala
  socket.on('createRoom', ({ roomName, isPrivate, password }) => {
    const roomId = generateRoomId();
    const user = users[socket.id];
    
    if (!user) return;
    
    rooms[roomId] = {
      id: roomId,
      name: roomName,
      isPrivate,
      password: isPrivate ? password : null,
      players: [user],
      status: 'waiting', // waiting, playing, finished
      createdAt: new Date(),
      gameState: null
    };
    
    user.roomId = roomId;
    socket.join(roomId);
    
    socket.emit('roomCreated', { roomId, room: getRoomInfo(rooms[roomId]) });
    
    // Asegurar que todos los clientes reciban la actualización de salas
    const publicRooms = getPublicRooms();
    io.emit('roomsUpdated', publicRooms);
    
    console.log(`Sala creada: ${roomId} por ${user.username}`);
    console.log('Emitiendo actualización de salas:', publicRooms);
  });

  // Unirse a una sala
  socket.on('joinRoom', ({ roomId, password }) => {
    const room = rooms[roomId];
    const user = users[socket.id];
    
    if (!room || !user) {
      socket.emit('joinError', { message: 'Sala no encontrada' });
      return;
    }
    
    if (room.players.length >= 2) {
      socket.emit('joinError', { message: 'Sala llena' });
      return;
    }
    
    if (room.isPrivate && room.password !== password) {
      socket.emit('joinError', { message: 'Contraseña incorrecta' });
      return;
    }
    
    room.players.push(user);
    user.roomId = roomId;
    socket.join(roomId);
    
    socket.emit('roomJoined', { roomId, room: getRoomInfo(room) });
    socket.to(roomId).emit('playerJoined', { player: { username: user.username } });
    
    // Si ya hay dos jugadores, iniciar el juego
    if (room.players.length === 2) {
      room.status = 'playing';
      room.gameState = initializeGame(room.players);
      io.to(roomId).emit('gameStarted', { gameState: getPublicGameState(room.gameState) });
    }
    
    io.emit('roomsUpdated', getPublicRooms());
    console.log(`Usuario ${user.username} se unió a la sala ${roomId}`);
  });

  // Colocar barcos
  socket.on('placeShips', ({ ships }) => {
    const user = users[socket.id];
    if (!user || !user.roomId || !rooms[user.roomId]) return;
    
    const room = rooms[user.roomId];
    const gameState = room.gameState;
    
    if (!gameState || room.status !== 'playing') return;
    
    const playerIndex = gameState.players.findIndex(p => p.id === socket.id);
    if (playerIndex === -1) return;
    
    gameState.players[playerIndex].ships = ships;
    gameState.players[playerIndex].ready = true;
    
    socket.emit('shipsPlaced');
    
    // Verificar si ambos jugadores están listos
    if (gameState.players.every(p => p.ready)) {
      gameState.currentTurn = Math.floor(Math.random() * 2); // Turno aleatorio
      io.to(user.roomId).emit('allPlayersReady', {
        gameState: getPublicGameState(gameState),
        currentTurn: gameState.players[gameState.currentTurn].id
      });
    }
  });

  // Realizar un disparo
  socket.on('fireShot', ({ x, y }) => {
    const user = users[socket.id];
    if (!user || !user.roomId || !rooms[user.roomId]) return;
    
    const room = rooms[user.roomId];
    const gameState = room.gameState;
    
    if (!gameState || room.status !== 'playing') return;
    
    const currentPlayerIndex = gameState.currentTurn;
    const targetPlayerIndex = (currentPlayerIndex + 1) % 2;
    
    if (gameState.players[currentPlayerIndex].id !== socket.id) {
      socket.emit('error', { message: 'No es tu turno' });
      return;
    }
    
    const result = processShot(gameState, targetPlayerIndex, x, y);
    
    if (result.invalid) {
      socket.emit('error', { message: 'Disparo inválido' });
      return;
    }
    
    // Enviar resultado del disparo a ambos jugadores
    io.to(user.roomId).emit('shotResult', {
      x, y,
      hit: result.hit,
      sunk: result.sunk,
      shipType: result.shipType,
      player: socket.id
    });
    
    // Verificar si el juego ha terminado
    if (result.gameOver) {
      room.status = 'finished';
      io.to(user.roomId).emit('gameOver', { winner: socket.id });
    } else {
      // Cambiar turno
      gameState.currentTurn = targetPlayerIndex;
      io.to(user.roomId).emit('turnChanged', { currentTurn: gameState.players[gameState.currentTurn].id });
    }
  });

  // Salir de una sala
  socket.on('leaveRoom', () => {
    leaveRoom(socket);
  });

  // Desconexión
  socket.on('disconnect', () => {
    console.log(`Usuario desconectado: ${socket.id}`);
    leaveRoom(socket);
    delete users[socket.id];
  });
});

// Función para salir de una sala
function leaveRoom(socket) {
  const user = users[socket.id];
  if (!user || !user.roomId) return;
  
  const roomId = user.roomId;
  const room = rooms[roomId];
  
  if (room) {
    room.players = room.players.filter(p => p.id !== socket.id);
    
    if (room.players.length === 0) {
      delete rooms[roomId];
    } else {
      socket.to(roomId).emit('playerLeft', { username: user.username });
      
      // Si el juego estaba en curso, terminar
      if (room.status === 'playing') {
        room.status = 'finished';
        socket.to(roomId).emit('gameOver', { winner: room.players[0].id, reason: 'opponent_left' });
      }
    }
    
    socket.leave(roomId);
    io.emit('roomsUpdated', getPublicRooms());
    console.log(`Usuario ${user.username} salió de la sala ${roomId}`);
  }
  
  user.roomId = null;
}

// Funciones auxiliares
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRoomInfo(room) {
  return {
    id: room.id,
    name: room.name,
    isPrivate: room.isPrivate,
    players: room.players.map(p => ({ username: p.username })),
    status: room.status
  };
}

function getPublicRooms() {
  const publicRooms = Object.values(rooms)
    .filter(room => !room.isPrivate && room.status === 'waiting' && room.players.length < 2)
    .map(room => ({
      id: room.id,
      name: room.name,
      players: room.players.length
    }));
  console.log('Salas públicas disponibles:', publicRooms);
  return publicRooms;
}

function initializeGame(players) {
  return {
    players: players.map(player => ({
      id: player.id,
      username: player.username,
      ships: [],
      shots: [],
      ready: false
    })),
    currentTurn: null
  };
}

function getPublicGameState(gameState) {
  return {
    players: gameState.players.map(player => ({
      id: player.id,
      username: player.username,
      ready: player.ready,
      shots: player.shots
    })),
    currentTurn: gameState.currentTurn
  };
}

function processShot(gameState, targetPlayerIndex, x, y) {
  const targetPlayer = gameState.players[targetPlayerIndex];
  
  // Verificar si el disparo ya fue realizado
  if (targetPlayer.shots.some(shot => shot.x === x && shot.y === y)) {
    return { invalid: true };
  }
  
  // Registrar el disparo
  targetPlayer.shots.push({ x, y });
  
  // Verificar si hay impacto
  const hitShip = targetPlayer.ships.find(ship => {
    return ship.positions.some(pos => pos.x === x && pos.y === y);
  });
  
  if (!hitShip) {
    return { hit: false };
  }
  
  // Marcar la posición como impactada
  const hitPosition = hitShip.positions.find(pos => pos.x === x && pos.y === y);
  hitPosition.hit = true;
  
  // Verificar si el barco se hundió
  const sunk = hitShip.positions.every(pos => pos.hit);
  
  // Verificar si todos los barcos están hundidos
  const gameOver = sunk && targetPlayer.ships.every(ship => {
    return ship.positions.every(pos => pos.hit);
  });
  
  return {
    hit: true,
    sunk,
    shipType: hitShip.type,
    gameOver
  };
}

// Puerto y arranque del servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});