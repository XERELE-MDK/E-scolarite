import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Layers, GraduationCap, Users, BookOpen, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../context/authStore';

const ChefDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('chef-departement/stats/');
        setStats(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Configuration des cartes de statistiques
  const cards = [
    {
      label: 'Classes & Groupes',
      value: stats?.classes_count || 0,
      icon: Layers,
      color: 'from-blue-600/20 to-blue-500/5',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/20',
    },
    {
      label: 'Étudiants Inscrits',
      value: stats?.etudiants_count || 0,
      icon: GraduationCap,
      color: 'from-purple-600/20 to-purple-500/5',
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/20',
    },
    {
      label: 'Corps Enseignant',
      value: stats?.enseignants_count || 0,
      icon: Users,
      color: 'from-emerald-600/20 to-emerald-500/5',
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
    },
    {
      label: 'Matières / Modules',
      value: stats?.matieres_count || 0,
      icon: BookOpen,
      color: 'from-amber-600/20 to-amber-500/5',
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête de bienvenue */}
      <div className="bg-[#111c30] p-6 rounded-2xl border border-slate-800/60 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-purple-500/5 to-transparent pointer-events-none" />
        <h1 className="text-xl font-bold text-white mb-1">
          Bienvenue, M. {user?.last_name} 👋
        </h1>
        <p className="text-slate-400 text-xs font-medium">
          Gestion et supervision globale du département : <span className="text-purple-400 font-semibold">{stats?.departement_nom}</span>
        </p>
      </div>

      {/* Grille des indicateurs statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className={`bg-gradient-to-br ${card.color} p-5 rounded-2xl border ${card.borderColor} flex items-center justify-between shadow-lg transition-transform duration-200 hover:-translate-y-0.5`}
            >
              <div className="space-y-2">
                <span className="text-slate-400 text-xs font-medium block">
                  {card.label}
                </span>
                <span className="text-3xl font-bold text-white font-mono block">
                  {card.value}
                </span>
              </div>
              <div className={`h-12 w-12 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-center ${card.iconColor}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Reste de la page : Liens rapides ou alertes */}
      <div className="bg-[#111c30] p-5 rounded-2xl border border-slate-800/60">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Raccourcis de gestion
        </h3>
        <p className="text-slate-500 text-xs">
          Utilisez le menu latéral pour modifier l'emploi du temps, affecter des enseignants ou suivre les modules de cours.
        </p>
      </div>
    </div>
  );
};

export default ChefDashboard;