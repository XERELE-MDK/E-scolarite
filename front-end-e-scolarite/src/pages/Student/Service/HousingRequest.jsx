import React, { useEffect, useState } from 'react';
import apiClient from '../../../api/client';
import { Home, Users, CheckCircle, Loader2, AlertTriangle, HelpCircle } from 'lucide-react';

const HousingRequest = () => {
  const [chambres, setChambres] = useState([]);
  const [myRequest, setMyRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Récupérer les chambres et l'état de la demande de l'étudiant connecté
      const [chambresRes, myReqRes] = await Promise.all([
        apiClient.get('chambres/'),
        apiClient.get('logements/mes-demandes/')
      ]);
      setChambres(chambresRes.data);
      if (myReqRes.data.length > 0) {
        setMyRequest(myReqRes.data[0]); // On prend la demande la plus récente
      }
    } catch (error) {
      console.error("Erreur de chargement du module logement", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyHousing = async (chambreId) => {
    if (!window.confirm("Confirmer votre demande d'affectation pour cette chambre ?")) return;
    setIsSubmitting(true);
    try {
      await apiClient.post('logements/demander/', { chambre: chambreId });
      setMessage({ type: 'success', text: 'Votre demande de logement a été soumise avec succès !' });
      fetchData(); // Rafraîchir les données
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || "Erreur lors de la soumission." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-200">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Home className="h-5 w-5 text-emerald-400" /> Service de Logement Universitaire
        </h2>
        <p className="text-xs text-slate-400">Demandez une attribution de chambre sur le campus Polytechnique (Max 4 personnes par chambre).</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm border ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* État actuel du logement de l'étudiant */}
      {myRequest ? (
        <div className="bg-[#111c30] p-5 rounded-2xl border border-slate-800/80 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Votre Statut Logement</span>
            <p className="text-base font-semibold text-white">Chambre demandée : <span className="text-emerald-400">{myRequest.chambre_details?.code || `ID ${myRequest.chambre}`}</span></p>
            <p className="text-xs text-slate-400">Pavillon : {myRequest.chambre_details?.pavillon || 'Principal'}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
            myRequest.statut === 'VALIDE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            myRequest.statut === 'REJETE' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
            'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
          }`}>
            {myRequest.statut === 'VALIDE' ? 'Logement Attribué' : myRequest.statut === 'REJETE' ? 'Demande Refusée' : 'En attente de validation'}
          </span>
        </div>
      ) : (
        /* Grille des chambres disponibles si l'étudiant n'a pas encore de demande */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chambres.map((ch) => {
            const isFull = ch.nb_occupants >= 4;
            return (
              <div key={ch.id} className={`p-5 rounded-2xl border bg-[#111c30] shadow-xl flex flex-col justify-between space-y-4 ${isFull ? 'border-slate-800 opacity-60' : 'border-slate-800/60 hover:border-slate-700/80 transition-all'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-white">Chambre {ch.code}</h3>
                    <p className="text-xs text-slate-500">Pavillon {ch.pavillon || 'A'}</p>
                  </div>
                  <div className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 ${isFull ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-300'}`}>
                    <Users className="h-3.5 w-3.5" />
                    {ch.nb_occupants} / 4
                  </div>
                </div>

                <button
                  onClick={() => handleApplyHousing(ch.id)}
                  disabled={isFull || isSubmitting}
                  className={`w-full py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isFull 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-950/20'
                  }`}
                >
                  {isFull ? 'Chambre Complète' : 'Demander cette chambre'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HousingRequest;