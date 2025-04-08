const express = require('express');
const router = express.Router();

// Simulación de base de datos para salas (en una aplicación real, usaríamos una base de datos)
let rooms = [];

// Obtener todas las salas públicas
router.get('/public', (req, res) => {
  try {
    const publicRooms = rooms.filter(room => 
      !room.isPrivate && room.status === 'waiting' && room.players.length < 2
    );
    
    res.json(publicRooms);
  } catch (error) {
    console.error('Error al obtener salas públicas:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Crear una nueva sala
router.post('/', (req, res) => {
  try {
    const { name, isPrivate, password, creatorId, creatorUsername } = req.body;
    
    // Validar datos
    if (!name || isPrivate === undefined || !creatorId || !creatorUsername) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }
    
    // Si es privada, debe tener contraseña
    if (isPrivate && !password) {
      return res.status(400).json({ message: 'Las salas privadas requieren contraseña' });
    }
    
    // Crear sala
    const newRoom = {
      id: generateRoomId(),
      name,
      isPrivate,
      password: isPrivate ? password : null,
      players: [{
        id: creatorId,
        username: creatorUsername
      }],
      status: 'waiting',
      createdAt: new Date()
    };
    
    rooms.push(newRoom);
    
    res.status(201).json({
      id: newRoom.id,
      name: newRoom.name,
      isPrivate: newRoom.isPrivate,
      players: newRoom.players.map(p => ({ id: p.id, username: p.username })),
      status: newRoom.status
    });
  } catch (error) {
    console.error('Error al crear sala:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Unirse a una sala
router.post('/:roomId/join', (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId, playerUsername, password } = req.body;
    
    // Validar datos
    if (!playerId || !playerUsername) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }
    
    // Buscar sala
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      return res.status(404).json({ message: 'Sala no encontrada' });
    }
    
    // Verificar si la sala está llena
    if (room.players.length >= 2) {
      return res.status(400).json({ message: 'Sala llena' });
    }
    
    // Verificar contraseña si es privada
    if (room.isPrivate && room.password !== password) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }
    
    // Agregar jugador a la sala
    room.players.push({
      id: playerId,
      username: playerUsername
    });
    
    res.json({
      id: room.id,
      name: room.name,
      isPrivate: room.isPrivate,
      players: room.players.map(p => ({ id: p.id, username: p.username })),
      status: room.status
    });
  } catch (error) {
    console.error('Error al unirse a sala:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Obtener información de una sala específica
router.get('/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      return res.status(404).json({ message: 'Sala no encontrada' });
    }
    
    res.json({
      id: room.id,
      name: room.name,
      isPrivate: room.isPrivate,
      players: room.players.map(p => ({ id: p.id, username: p.username })),
      status: room.status
    });
  } catch (error) {
    console.error('Error al obtener sala:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Salir de una sala
router.post('/:roomId/leave', (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;
    
    // Validar datos
    if (!playerId) {
      return res.status(400).json({ message: 'ID de jugador requerido' });
    }
    
    // Buscar sala
    const roomIndex = rooms.findIndex(r => r.id === roomId);
    if (roomIndex === -1) {
      return res.status(404).json({ message: 'Sala no encontrada' });
    }
    
    const room = rooms[roomIndex];
    
    // Remover jugador de la sala
    room.players = room.players.filter(p => p.id !== playerId);
    
    // Si no quedan jugadores, eliminar la sala
    if (room.players.length === 0) {
      rooms = rooms.filter(r => r.id !== roomId);
      return res.json({ message: 'Sala eliminada' });
    }
    
    res.json({
      id: room.id,
      name: room.name,
      isPrivate: room.isPrivate,
      players: room.players.map(p => ({ id: p.id, username: p.username })),
      status: room.status
    });
  } catch (error) {
    console.error('Error al salir de sala:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Función auxiliar para generar ID de sala
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

module.exports = router;