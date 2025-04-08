import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Mostrar algún indicador de carga mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="container flex justify-center align-center" style={{ height: '100vh' }}>
        <h2>Cargando...</h2>
      </div>
    );
  }

  // Redirigir al login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  // Renderizar los componentes hijos si está autenticado
  return children;
};

export default ProtectedRoute;