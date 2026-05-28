import axios from 'axios';
import { useAuthStore } from '../context/authStore';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/', // URL de votre backend Django sous Linux
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour injecter automatiquement le Token dans les requêtes
apiClient.interceptors.request.use(
  (config) => {
    // 1. Récupérer le token depuis le store Zustand en mémoire vive
    let token = useAuthStore.getState().token;
    
    // 2. Sécurité de secours : si Zustand est en train de réhydrater, lire sa clé de persistance brute
    if (!token) {
      try {
        const persistData = localStorage.getItem('polytechnique-auth');
        if (persistData) {
          const parsed = JSON.parse(persistData);
          token = parsed?.state?.token;
        }
      } catch (e) {
        console.error("Erreur de lecture de la persistance auth", e);
      }
    }
    
    if (token) {
      // Utilisation impérative de 'Bearer' pour SimpleJWT
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour attraper les erreurs globales (ex: Token expiré ou invalide)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // On ne déconnecte QUE si le serveur renvoie explicitement un 401 (Session invalide au niveau du Back)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('polytechnique-auth');
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;