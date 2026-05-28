import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '../api/client';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null, // Contient : id, username, role, first_name, last_name, etc.
      isAuthenticated: false,

      // Action pour se connecter avec persistance immédiate
      login: (userData, accessToken) => {
        set({
          token: accessToken,
          user: userData,
          isAuthenticated: true,
        });

        // 👑 SÉCURITÉ : On s'assure qu'Axios injecte immédiatement le header Bearer dès la connexion
        if (apiClient) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        }
      },

      // Action pour se déconnecter et vider proprement le cache
      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
        
        // Nettoyage complet des résidus de stockage
        localStorage.removeItem('polytechnique-auth'); 
        if (apiClient) {
          delete apiClient.defaults.headers.common['Authorization'];
        }
      },
    }),
    {
      name: 'polytechnique-auth', // Clé de stockage unique dans le localStorage
      storage: createJSONStorage(() => localStorage), // Gère la sérialisation JSON propre sous Vite
    }
  )
);