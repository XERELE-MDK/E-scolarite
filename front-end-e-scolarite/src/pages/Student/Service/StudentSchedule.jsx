import React, { useEffect, useState } from 'react';
import apiClient from '../../../api/client';
import { Calendar, Clock, BookOpen, MapPin, User, Loader2, AlertCircle } from 'lucide-react';

const JOURS_ORDER = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];

const JOURS_LABELS = {
  LUNDI: 'Lundi',
  MARDI: 'Mardi',
  MERCREDI: 'Mercredi',
  JEUDI: 'Jeudi',
  VENDREDI: 'Vendredi',
  SAMEDI: 'Samedi',
};

// Système de couleurs ultra-clean (Arrière-plans subtils, bordures et accents contrastés)
const COLORS = [
  { bg: 'bg-indigo-500/5', border: 'border-indigo-500/20', text: 'text-indigo-400', badge: 'bg-indigo-500/10 text-indigo-300' },
  { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-300' },
  { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-300' },
  { bg: 'bg-purple-500/5', border: 'border-purple-500/20', text: 'text-purple-400', badge: 'bg-purple-500/10 text-purple-300' },
  { bg: 'bg-sky-500/5', border: 'border-sky-500/20', text: 'text-sky-400', badge: 'bg-sky-500/10 text-sky-300' },
  { bg: 'bg-rose-500/5', border: 'border-rose-500/20', text: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-300' },
];

const StudentSchedule = () => {
  const [planning, setPlanning] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jourActif, setJourActif] = useState(null);

  const matiereColorMap = {};
  let colorIndex = 0;

  const getColorForMatiere = (matiereNom) => {
    if (!matiereColorMap[matiereNom]) {
      matiereColorMap[matiereNom] = COLORS[colorIndex % COLORS.length];
      colorIndex++;
    }
    return matiereColorMap[matiereNom];
  };

  useEffect(() => {
    const fetchPlanning = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.get('planning/');
        setPlanning(res.data || []);

        const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toUpperCase();
        const todayKey = Object.keys(JOURS_LABELS).find(k => JOURS_LABELS[k].toUpperCase() === today);
        const joursDisponibles = JOURS_ORDER.filter(j =>
          (res.data || []).some(c => c.jour === j)
        );
        
        if (todayKey && joursDisponibles.includes(todayKey)) {
          setJourActif(todayKey);
        } else if (joursDisponibles.length > 0) {
          setJourActif(joursDisponibles[0]);
        }
      } catch (err) {
        setError("Impossible de charger votre emploi du temps. Vérifiez que vous êtes bien affecté à une classe.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlanning();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-[#111c30]/40 rounded-2xl border border-slate-800/60">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-xs text-slate-400 mt-3 font-medium">Calcul de votre grille horaire...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-5 rounded-2xl text-xs font-medium flex items-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0" />
        {error}
      </div>
    );
  }

  const planningParJour = JOURS_ORDER.reduce((acc, jour) => {
    acc[jour] = planning
      .filter(c => c.jour === jour)
      .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));
    return acc;
  }, {});

  const joursDisponibles = JOURS_ORDER.filter(j => planningParJour[j].length > 0);
  const creneauxDuJour = jourActif ? planningParJour[jourActif] : [];

  return (
    <div className="space-y-6 font-sans antialiased text-slate-200">

      {/* En-tête de Section épuré */}
      <div className="border-b border-slate-800/60 pb-5">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Calendar className="h-6 w-6 text-indigo-500" />
          Mon Emploi du Temps
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Planification hebdomadaire de vos séances de cours, TD et TP mis à jour par la direction.
        </p>
      </div>

      {joursDisponibles.length === 0 ? (
        <div className="bg-[#111c30]/50 border border-slate-800/60 rounded-2xl p-16 text-center shadow-xl">
          <Calendar className="h-10 w-10 text-slate-600 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-white">Aucun cours au calendrier</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Aucune session d'enseignement n'a été programmée pour votre classe pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Menu sélecteur & Résumé de la semaine à gauche */}
          <div className="lg:col-span-1 bg-[#111c30] border border-slate-800/60 rounded-2xl p-4 shadow-xl space-y-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Jours de cours</span>
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-1 gap-2">
              {JOURS_ORDER.map(jour => {
                const count = planningParJour[jour].length;
                const isDisabled = count === 0;
                const isActive = jourActif === jour;

                return (
                  <button
                    key={jour}
                    disabled={isDisabled}
                    onClick={() => setJourActif(jour)}
                    className={`text-left p-2.5 lg:px-4 lg:py-3 rounded-xl transition-all border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1 cursor-pointer select-none ${
                      isDisabled 
                        ? 'opacity-25 border-transparent pointer-events-none' 
                        : isActive
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/15'
                          : 'bg-[#0d1424]/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <p className="text-[10px] uppercase font-bold lg:hidden">{JOURS_LABELS[jour].slice(0,3)}</p>
                      <p className="text-xs font-semibold hidden lg:block">{JOURS_LABELS[jour]}</p>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#0d1424] text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grille Principale : Timeline chronologique à droite */}
          <div className="lg:col-span-3 space-y-5">
            <div className="flex items-center justify-between bg-[#111c30]/40 border border-slate-800/40 px-4 py-3 rounded-xl">
              <span className="text-xs text-slate-400 font-medium">Planning détaillé du <span className="text-white font-bold">{JOURS_LABELS[jourActif]}</span></span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/10 px-2 py-0.5 rounded-md font-mono uppercase">Journée d'étude</span>
            </div>

            {/* L'Arbre de la Timeline */}
            <div className="relative border-l border-slate-800 ml-4 md:ml-28 space-y-5 py-1">
              {creneauxDuJour.map((creneau) => {
                const color = getColorForMatiere(creneau.matiere_details?.nom || creneau.matiere);
                return (
                  <div key={creneau.id} className="relative pl-6 md:pl-8 group animate-fadeIn">
                    
                    {/* Bloc Horaires (Masqué sur mobile, structuré à gauche de la ligne temporelle sur PC) */}
                    <div className="absolute hidden md:flex flex-col text-right -left-32 top-1.5 w-24 pr-4">
                      <span className="text-sm font-bold text-white tracking-tight">{creneau.heure_debut?.slice(0, 5)}</span>
                      <span className="text-[10px] text-slate-500 font-medium font-mono mt-0.5">{creneau.heure_fin?.slice(0, 5)}</span>
                    </div>

                    {/* Puce d'ancrage temporelle */}
                    <div className="absolute -left-[6px] top-2.5 h-3 w-3 rounded-full bg-[#0d1424] border-2 border-indigo-500 group-hover:bg-indigo-400 transition-colors shadow-sm" />

                    {/* Carte Premium de la Session */}
                    <div className={`border ${color.bg} ${color.border} rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:translate-x-0.5`}>
                      
                      <div className="space-y-2">
                        {/* Horaires complémentaires pour l'affichage Mobile */}
                        <div className="md:hidden inline-flex items-center gap-1.5 bg-[#0d1424] px-2.5 py-1 rounded-lg border border-slate-800/80 text-[10px] font-mono text-slate-400">
                          <Clock className="h-3 w-3 text-indigo-400" />
                          {creneau.heure_debut?.slice(0, 5)} — {creneau.heure_fin?.slice(0, 5)}
                        </div>

                        {/* Titre du Module */}
                        <h3 className="text-base font-bold text-white tracking-tight">
                          {creneau.matiere_details?.nom || creneau.matiere}
                        </h3>

                        {/* Informations complémentaires croisées (Classe + Enseignant Titulaire) */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400 font-medium pt-0.5">
                          {creneau.matiere_details?.classe && (
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                              {creneau.matiere_details.classe}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <User className="h-3.5 w-3.5 text-slate-500" />
                            {creneau.enseignant_details ? (
                              <span>Prof : {creneau.enseignant_details}</span>
                            ) : (
                              <span className="italic text-slate-500">Enseignant désigné</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Badge Localisation (Salle) */}
                      {creneau.salle && (
                        <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 border-slate-800/30 pt-2.5 md:pt-0">
                          <div className="flex items-center gap-1.5 bg-[#0d1424]/60 border border-slate-800/80 px-3 py-1.5 rounded-xl shadow-inner text-xs font-semibold text-slate-200">
                            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                            {creneau.salle}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default StudentSchedule;