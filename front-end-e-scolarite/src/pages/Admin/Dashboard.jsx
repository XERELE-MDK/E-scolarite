import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { Users, UserCheck, CreditCard, AlertTriangle, Check, Loader2 } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ etudiants: 0, enseignants: 0, inscriptionsAttente: 0, totalPaiements: 0 });
  const [recentInscriptions, setRecentInscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Charger les données depuis le backend Django
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // Récupération simultanée des données essentielles via notre API globale
      const [usersRes, inscriptionsRes, paiementsRes] = await Promise.all([
        apiClient.get('users/'),
        apiClient.get('inscriptions/'),
        apiClient.get('paiements/')
      ]);

      const allUsers = usersRes.data;
      const allInscriptions = inscriptionsRes.data;
      const allPaiements = paiementsRes.data;

      // Calcul des statistiques rapides basées sur la structure des données Django
      const etudiantsCount = allUsers.filter(u => u.role === 'ETUDIANT').length;
      const enseignantsCount = allUsers.filter(u => u.role === 'ENSEIGNANT').length;
      const attenteCount = allInscriptions.filter(i => i.statut === 'BROUILLON').length;
      const financeSum = allPaiements.reduce((sum, p) => sum + parseFloat(p.montant), 0);

      setStats({
        etudiants: etudiantsCount,
        enseignants: enseignantsCount,
        inscriptionsAttente: attenteCount,
        totalPaiements: financeSum
      });

      // Garder les 5 dernières inscriptions pour l'affichage de la table de pilotage
      setRecentInscriptions(allInscriptions.slice(0, 5));

    } catch (error) {
      console.error("Erreur lors du chargement des statistiques du tableau de bord", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Cas d'utilisation métier : Valider l'inscription d'un étudiant (Déclenche le matricule côté Django)
  const handleValidate = async (id) => {
    if (!window.confirm("Voulez-vous valider cette inscription et assigner un matricule officiel ?")) return;
    
    setActionLoading(id);
    try {
      await apiClient.post(`inscriptions/${id}/valider/`);
      // Recharger les données rafraîchies pour mettre à jour les compteurs globaux
      await fetchDashboardData();
    } catch (error) {
      console.error("Erreur lors de la validation de l'inscription", error);
      alert("Erreur lors de la validation de l'inscription");
    } finally {
      setActionLoading(null);
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
    <div className="space-y-8 font-sans text-slate-200">
      <div>
        <h1 className="text-2xl font-bold text-white">Vue d'ensemble Institutionnelle</h1>
        <p className="text-sm text-slate-400">Pilotez l'activité académique et administrative de Polytechnique.</p>
      </div>

      {/* Cartes KPI Sombres et Réactives */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Carte Étudiants */}
        <div className="bg-[#111c30] p-6 rounded-2xl border border-slate-800/60 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Étudiants Actifs</span>
            <p className="text-3xl font-bold text-white">{stats.etudiants}</p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/10">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Carte Enseignants */}
        <div className="bg-[#111c30] p-6 rounded-2xl border border-slate-800/60 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Corps Enseignant</span>
            <p className="text-3xl font-bold text-white">{stats.enseignants}</p>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/10">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>

        {/* Carte Inscriptions en Attente */}
        <div className="bg-[#111c30] p-6 rounded-2xl border border-slate-800/60 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dossiers à Valider</span>
            <p className="text-3xl font-bold text-amber-500">{stats.inscriptionsAttente}</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/10">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        {/* Carte Finances (Frais Perçus) */}
        <div className="bg-[#111c30] p-6 rounded-2xl border border-slate-800/60 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Frais Perçus</span>
            <p className="text-3xl font-bold text-emerald-500">{stats.totalPaiements.toLocaleString()} MRU</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/10">
            <CreditCard className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Registre des Inscriptions Récentes */}
      <div className="bg-[#111c30] rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 bg-[#162238]/40">
          <h3 className="font-bold text-white text-base">Inscriptions Récentes & Validations</h3>
          <p className="text-xs text-slate-400">Liste des demandes d'admission nécessitant une attribution de matricule.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0d1424] text-slate-400 font-semibold text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="p-4">Étudiant</th>
                <th className="p-4">Classe demandée</th>
                <th className="p-4">Frais</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-800 text-slate-300">
              {recentInscriptions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500 bg-[#111c30]">Aucune demande d'inscription dans le registre.</td>
                </tr>
              ) : (
                recentInscriptions.map((ins) => (
                  <tr key={ins.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-medium text-white">
                      {ins.etudiant_details?.user_details?.first_name} {ins.etudiant_details?.user_details?.last_name}
                      <span className="block text-xs text-slate-500 font-normal">{ins.etudiant_details?.matricule || "Matricule en attente"}</span>
                    </td>
                    <td className="p-4 text-slate-400">{ins.classe_details?.nom || `Classe ID: ${ins.classe}`}</td>
                    <td className="p-4 font-semibold text-emerald-400">{parseFloat(ins.montant_total).toLocaleString()} MRU</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        ins.statut === 'VALIDE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {ins.statut}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {ins.statut === 'BROUILLON' && (
                        <button
                          onClick={() => handleValidate(ins.id)}
                          disabled={actionLoading === ins.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-lg shadow-emerald-950/20"
                        >
                          {actionLoading === ins.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          Valider
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;