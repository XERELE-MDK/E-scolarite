import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { Home, Check, X, Loader2, AlertCircle, Users, ShieldCheck } from 'lucide-react';

const HousingValidation = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      // Endpoint qui liste toutes les demandes de logement de l'école
      const response = await apiClient.get('logements/demandes-globales/');
      setRequests(response.data);
    } catch (error) {
      console.error("Erreur de récupération des demandes de logement", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

const handleDecision = async (id, decision, chambreCode, occupantsActuels) => {
    if (decision === 'VALIDE' && occupantsActuels >= 4) {
      setNotification({ 
        type: 'error', 
        message: `Action refusée : La chambre ${chambreCode} est complète !` 
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    if (!window.confirm(`Confirmer cette décision (${decision === 'VALIDE' ? 'Approuver' : 'Rejeter'}) ?`)) return;

    setActionLoading(id);
    try {
      // Forcer l'envoi du statut attendu par les STATUS_CHOICES du modèle Django
      const response = await apiClient.post(`logements/${id}/decider/`, { statut: decision });
      
      setNotification({ 
        type: 'success', 
        message: decision === 'VALIDE' ? 'Logement attribué avec succès !' : 'Demande refusée.' 
      });
      
      // Rafraîchir immédiatement le tableau local
      fetchRequests();
    } catch (error) {
      console.error("Détails de l'erreur:", error.response?.data);
      setNotification({ 
        type: 'error', 
        message: error.response?.data?.error || "Erreur lors du traitement de la demande." 
      });
    } finally {
      setActionLoading(null);
      setTimeout(() => setNotification(null), 4000);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-200 relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 bg-[#111c30] animate-slide-in ${
          notification.type === 'success' ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'
        }`}>
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Home className="h-6 w-6 text-rose-500" /> Attribution des Chambres (Campus)
        </h1>
        <p className="text-sm text-slate-400">Autorité exclusive du Super Admin. Examinez les demandes et validez les lits disponibles.</p>
      </div>

      {/* Tableau des demandes de dortoir */}
      <div className="bg-[#111c30] rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
        <div className="p-4 bg-[#162238]/30 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">Demandes d'attribution en attente</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0d1424] text-slate-400 font-semibold text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="p-4">Étudiant demandeur</th>
                <th className="p-4">Chambre ciblée</th>
                <th className="p-4">Remplissage actuel</th>
                <th className="p-4">Statut Demande</th>
                <th className="p-4 text-right">Actions Super Admin</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-800 text-slate-300">
              {requests.filter(r => r.statut === 'BROUILLON').length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500">
                    Aucune demande de chambre en attente de validation.
                  </td>
                </tr>
              ) : (
                requests.filter(r => r.statut === 'BROUILLON').map((req) => {
                  const occupants = req.chambre_details?.nb_occupants || 0;
                  const isFull = occupants >= 4;

                  return (
                    <tr key={req.id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="p-4 font-semibold text-white">
                        {req.etudiant_details?.user_details?.first_name} {req.etudiant_details?.user_details?.last_name}
                        <span className="block text-xs text-slate-500 font-normal">{req.etudiant_details?.matricule}</span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-200">Chambre {req.chambre_details?.code}</div>
                        <div className="text-xs text-slate-500">Pavillon {req.chambre_details?.pavillon}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                            <div 
                              className={`h-full rounded-full ${isFull ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${(occupants / 4) * 100}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold ${isFull ? 'text-rose-400' : 'text-slate-400'}`}>
                            {occupants} / 4 places
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                          En attente
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleDecision(req.id, 'REJETE', req.chambre_details?.code, occupants)}
                          disabled={actionLoading === req.id}
                          className="p-2 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl transition-all border border-rose-500/20 cursor-pointer"
                          title="Refuser la demande"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDecision(req.id, 'VALIDE', req.chambre_details?.code, occupants)}
                          disabled={actionLoading === req.id || isFull}
                          className={`p-2 rounded-xl transition-all border flex-inline items-center justify-center cursor-pointer ${
                            isFull 
                              ? 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed' 
                              : 'bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border-emerald-500/20 shadow-lg shadow-emerald-950/10'
                          }`}
                          title={isFull ? "Chambre saturée" : "Approuver le logement"}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HousingValidation;