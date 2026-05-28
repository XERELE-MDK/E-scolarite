import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../context/authStore';
import apiClient from '../../api/client';
import { Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);

  // États du formulaire
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Appel à notre API Django sécurisée
      const response = await apiClient.post('auth/login/', {
        username,
        password,
      });

      // Extraction conforme à la réponse SimpleJWT (access, refresh, user)
      const { access, user } = response.data;

      // Injection immédiate dans les en-têtes d'Axios pour devancer les appels du layout
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      // 👑 UNIQUE POINT DE VÉRITÉ : Initialisation du store Zustand persistant
      loginStore(user, access);

      // Redirection fluide selon le rôle configuré en base de données
      switch (user.role) {
        case 'ADMIN':
          navigate('/admin/dashboard');
          break;
        case 'CHEF_DEP':
          navigate('/chef-departement/dashboard');
          break;
        case 'ENSEIGNANT':
          navigate('/enseignant/dashboard');
          break;
        case 'ETUDIANT':
          navigate('/etudiant/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Identifiants de connexion invalides.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1424] p-4 font-sans text-slate-200">
      
      {/* Conteneur Principal (Card) */}
      <div className="w-full max-w-md bg-[#162238] rounded-2xl p-8 shadow-2xl border border-slate-800/60 space-y-7">
        
        {/* En-tête de la Card */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white tracking-wide">Connexion</h2>
          <p className="text-sm text-slate-400 font-medium tracking-wide">Polytechnique</p>
        </div>

        {/* Gestion des Retours d'Erreur */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 text-center">
            {error}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Champ : Utilisateur */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 block" htmlFor="username">
              Utilisateur / Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="h-4 w-4" />
              </div>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#0d1424] border border-slate-800/80 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors duration-200"
                placeholder="Votre username ou email"
              />
            </div>
          </div>

          {/* Champ : Mot de passe */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 block" htmlFor="password">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-[#0d1424] border border-slate-800/80 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors duration-200"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-400 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Bouton de Connexion */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#16a34a] hover:bg-[#15803d] disabled:bg-emerald-800/50 text-white font-medium rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              "Se connecter"
            )}
          </button>

        </form>

        {/* Pied de la Card */}
        <div className="text-center text-xs text-slate-400 pt-2">
          Pas encore de compte ? <span className="text-[#16a34a] hover:underline cursor-pointer font-medium">Créer un compte</span>
        </div>

      </div>
    </div>
  );
};

export default Login;