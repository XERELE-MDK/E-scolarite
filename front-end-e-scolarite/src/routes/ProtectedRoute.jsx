import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    // Rediriger vers la page de login si pas connecté
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Si le rôle n'est pas autorisé, on le redirige vers une page non autorisée ou l'accueil
    return <Navigate to="/unauthorized" replace />;
  }

  // Si tout est bon, on affiche les composants enfants (les pages)
  return <Outlet />;
};

export default ProtectedRoute;