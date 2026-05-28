import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { Calendar, Clock, MapPin, Loader2, BookOpen } from 'lucide-react';

const JOURS_ORDER = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];

const JOURS_LABELS = {
  LUNDI: 'Lundi',
  MARDI: 'Mardi',
  MERCREDI: 'Mercredi',
  JEUDI: 'Jeudi',
  VENDREDI: 'Vendredi',
  SAMEDI: 'Samedi',
};

const TeacherSchedule = () => {
  const [mySchedule, setMySchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await apiClient.get('planning/');
        setMySchedule(response.data || []);
      } catch (e) { 
        console.error("Erreur lors de la récupération du planning de l'enseignant:", e); 
        setMySchedule([]);
      } finally { 
        setIsLoading(false); 
      }
    };
    fetchSchedule();
  }, []);

  const parseSalleAndType = (salleString) => {
    if (!salleString) return { type: 'COURS', salle: 'Non spécifiée', intitule: '' };
    if (salleString.startsWith('[')) {
      const closingBracketIndex = salleString.indexOf(']');
      if (closingBracketIndex !== -1) {
        const type = salleString.slice(1, closingBracketIndex);
        const reste = salleString.slice(closingBracketIndex + 1).trim();

        if (type === 'AUTRE' && reste.includes('|')) {
          const parts = reste.split('|');
          return { type, intitule: parts[0].trim(), salle: parts[1].trim() };
        }
        return { type, salle: reste, intitule: '' };
      }
    }
    return { type: 'COURS', salle: salleString, intitule: '' };
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-xs text-slate-500 font-medium font-mono">Chargement de vos séances...</p>
      </div>
    );
  }

  const schedulesGroupedByDay = JOURS_ORDER.reduce((acc, jour) => {
    acc[jour] = mySchedule
      .filter(s => s.jour === jour)
      .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));
    return acc;
  }, {});

  return (
    <div className="space-y-6 font-sans antialiased text-slate-200">
      
      {/* En-tête de l'espace horaire */}
      <div className="border-b border-slate-800/60 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Calendar className="h-6 w-6 text-blue-500" /> Votre Emploi du Temps Individuel
        </h1>
        <p className="text-xs text-slate-400 mt-1">Consultez vos horaires de cours, évaluations et affectations de salles pour la semaine.</p>
      </div>

      {mySchedule.length === 0 ? (
        <div className="bg-[#111c30]/20 p-16 text-center text-slate-500 border border-slate-800/40 rounded-2xl text-xs">
          <Calendar className="h-8 w-8 text-slate-700 mx-auto mb-3" />
          Aucune séance ou activité ne vous a été attribuée pour le moment.
        </div>
      ) : (
        <div className="space-y-4">
          {JOURS_ORDER.map((jour) => {
            const coursDuJour = schedulesGroupedByDay[jour];
            if (coursDuJour.length === 0) return null;

            return (
              <div key={jour} className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-[#111c30]/10 border border-slate-800/40 p-4 rounded-2xl items-stretch">
                
                {/* Section Gauche : Intitulé du Jour */}
                <div className="lg:col-span-2 flex lg:flex-col items-center lg:items-start justify-between lg:justify-center border-b lg:border-b-0 lg:border-r border-slate-800/60 pb-2 lg:pb-0 lg:pr-4">
                  <span className="text-sm font-bold text-white uppercase tracking-wider">{JOURS_LABELS[jour]}</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-[#0d1424] px-2 py-0.5 rounded-md border border-slate-800/60 lg:mt-1">
                    {coursDuJour.length} séance(s)
                  </span>
                </div>

                {/* Section Droite : CONTENEUR FLEX ADAPTATIF OPTIMISÉ 👑 */}
                <div className="lg:col-span-10 flex flex-wrap gap-4 w-full">
                  {coursDuJour.map((sc) => {
                    const { type, salle, intitule } = parseSalleAndType(sc.salle);

                    const cardTheme = type === 'DEVOIR' 
                      ? { bg: 'bg-rose-500/5', border: 'border-rose-500/15', line: 'bg-rose-500', badge: 'bg-rose-500/10 text-rose-400' }
                      : type === 'AUTRE'
                        ? { bg: 'bg-amber-500/5', border: 'border-amber-500/15', line: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-400' }
                        : { bg: 'bg-blue-500/5', border: 'border-blue-500/15', line: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-400' };

                    return (
                      <div 
                        key={sc.id} 
                        /* 👑 CORRECTION ICI : flex-1 permet de s'étirer équitablement, min-w-[280px] empêche l'écrasement, max-w s'adapte au nombre de cartes sur la ligne pour un rendu parfait */
                        className={`relative border ${cardTheme.bg} ${cardTheme.border} rounded-xl p-4 flex flex-col justify-between gap-4 transition-all shadow-sm hover:border-slate-700/80 overflow-hidden bg-[#111c30]/30 flex-1 min-w-[280px] max-w-full ${
                          coursDuJour.length === 1 ? 'max-w-full' : coursDuJour.length === 2 ? 'max-w-[calc(50%-8px)]' : 'max-w-[calc(33.33%-11px)]'
                        }`}
                      >
                        {/* Barre d'accent supérieure */}
                        <div className={`absolute top-0 inset-x-0 h-[1.5px] ${cardTheme.line}`} />

                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-bold font-mono text-slate-400 uppercase">
                            <span>{sc.heure_debut?.slice(0, 5) || '--:--'} - {sc.heure_fin?.slice(0, 5) || '--:--'}</span>
                            <span className={`px-1.5 py-0.5 rounded font-sans font-bold text-[8px] tracking-wide uppercase ${cardTheme.badge}`}>
                              {type}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-sm font-bold text-white truncate max-w-full">
                              {type === 'AUTRE' ? (intitule || "Événement externe") : (sc.matiere_details?.nom || "Module inconnu")}
                            </h3>
                            
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1 truncate">
                              <BookOpen className="h-3 w-3 text-slate-600 shrink-0" />
                              {type === 'AUTRE' ? "Activité générale" : `Public : ${sc.matiere_details?.classe || "Classe Générale"}`}
                            </p>
                          </div>
                        </div>

                        {/* Pied de la carte */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/40 text-xs text-slate-400">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                            {type === 'AUTRE' ? 'ESP' : (sc.matiere_details?.code || 'UE')}
                          </span>
                          
                          <span className="flex items-center gap-1.5 font-semibold text-slate-200 shrink-0 bg-[#0d1424] px-2 py-0.5 rounded border border-slate-800/60">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            {salle}
                          </span>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherSchedule;