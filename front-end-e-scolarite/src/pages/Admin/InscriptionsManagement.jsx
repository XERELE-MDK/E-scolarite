import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { UserCheck, Search, Check, X, Loader2, AlertCircle, Eye, ShieldCheck, CheckCircle } from 'lucide-react';

const InscriptionsManagement = () => {
  const [inscriptions, setInscriptions] = useState([]);
  const [filteredInscriptions, setFilteredInscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Gestion des filtres et recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('BROUILLON'); // Focus automatique sur ce qu'il faut traiter
  const [notification, setNotification] = useState(null);

  // Charger les données depuis Django
  const fetchInscriptions = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('inscriptions/');
      setInscriptions(response.data);
      // Appliquer le filtre par défaut directement après la récupération
      setFilteredInscriptions(response.data.filter(i => i.statut === 'BROUILLON'));
    } catch (error) {
      console.error("Erreur lors de la récupération des inscriptions", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInscriptions();
  }, []);

  // Filtrage et recherche en temps réel (sans rechargement)
  useEffect(() => {
    let result = inscriptions;

    if (statusFilter !== 'ALL') {
      result = result.filter(i => i.statut === statusFilter);
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(i => {
        const student = i.etudiant_details?.user_details || {};
        const fullName = `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase();
        const className = (i.classe_details?.nom || '').toLowerCase();
        
        return fullName.includes(query) || className.includes(query);
      });
    }

    setFilteredInscriptions(result);
  }, [searchQuery, statusFilter, inscriptions]);

  // Déclencher la validation et la génération du matricule côté Django
  const handleApprove = async (id, studentName) => {
    if (!window.confirm(`Confirmer l'inscription de ${studentName} et générer son matricule permanent ?`)) return;
    
    setActionLoading(id);
    try {
      await apiClient.post(`inscriptions/${id}/valider/`);
      setNotification({ type: 'success', message: `Dossier de ${studentName} validé avec succès ! Matricule généré.` });
      fetchInscriptions(); // Rafraîchir la liste complète depuis le serveur
    } catch (error) {
      console.error(error);
      setNotification({ type: 'error', message: "Impossible de valider le dossier. Vérifiez l'état du serveur." });
    } finally {
      setActionLoading(null);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-200 relative">
      
      {/* Toast Notification Banner */}
      {notification && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-slide-in bg-[#111c30] ${
          notification.type === 'success' ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <AlertCircle className="h-5 w-5 text-rose-500" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* En-tête de la page */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UserCheck className="h-7 w-7 text-emerald-400" /> Validation des Inscriptions
        </h1>
        <p className="text-sm text-slate-400">Passez en revue les dossiers soumis et attribuez officiellement les matricules de l'école.</p>
      </div>

      {/* Barre de Recherche et Sélecteur de Statuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#111c30] p-4 rounded-2xl border border-slate-800/60 shadow-xl">
        <div className="relative sm:col-span-2">
          <Search className="absolute inset-y-0 left-3 h-full w-4 text-slate-500 flex items-center animate-none" />
          <input
            type="text"
            placeholder="Rechercher par nom d'étudiant ou classe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0d1424] border border-slate-800 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#0d1424] border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none"
          >
            <option value="BROUILLON">📥 En attente (Brouillon)</option>
            <option value="VALIDE">✅ Inscriptions Validées</option>
            <option value="REJETE">❌ Dossiers Rejetés</option>
            <option value="ALL">📋 Voir tout le registre</option>
          </select>
        </div>
      </div>

      {/* Liste Tabulaire des dossiers d'inscriptions */}
      <div className="bg-[#111c30] rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0d1424] text-slate-400 font-semibold text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="p-4">Candidat / Futur Étudiant</th>
                <th className="p-4">Classe visée</th>
                <th className="p-4">Frais de Scolarité</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Décision Administrative</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-800 text-slate-300">
              {filteredInscriptions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500 bg-[#111c30]">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2 text-slate-600" />
                    Aucun dossier d'inscription ne correspond à ce filtre actuellement.
                  </td>
                </tr>
              ) : (
                filteredInscriptions.map((ins) => {
                  const studentName = `${ins.etudiant_details?.user_details?.first_name || ''} ${ins.etudiant_details?.user_details?.last_name || ''}`;
                  return (
                    <tr key={ins.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-white">{studentName || "Profil Étudiant Inconnu"}</div>
                        <div className="text-xs text-indigo-400 font-medium tracking-wide">
                          {ins.etudiant_details?.matricule || "⚠️ En attente de matricule"}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-slate-300 font-medium">{ins.classe_details?.nom || `Classe ID: ${ins.classe}`}</span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-emerald-400">{parseFloat(ins.montant_total).toLocaleString()} MRU</div>
                        <div className="text-[10px] text-slate-500">Droits d'inscription inclus</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          ins.statut === 'VALIDE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          ins.statut === 'REJETE' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                          'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                        }`}>
                          {ins.statut}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer" title="Consulter les justificatifs originaux">
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {ins.statut === 'BROUILLON' && (
                          <button
                            onClick={() => handleApprove(ins.id, studentName)}
                            disabled={actionLoading === ins.id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-medium rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-lg shadow-emerald-950/15"
                          >
                            {actionLoading === ins.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-4 w-4" />
                            )}
                            Approuver & Matriculer
                          </button>
                        )}
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

export default InscriptionsManagement;