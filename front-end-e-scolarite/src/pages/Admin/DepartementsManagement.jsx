import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { Plus, Loader2, X, CheckCircle, FolderPlus, ShieldAlert, User } from 'lucide-react';

const DepartementsManagement = () => {
  const [departements, setDepartements] = useState([]);
  const [availableChefs, setAvailableChefs] = useState([]); // Utilisateurs éligibles à devenir chef
  const [isLoading, setIsLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    chef: '' // ID de l'utilisateur choisi comme Chef_Dep
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Récupération simultanée des départements et des utilisateurs pour l'assignation du rôle de chef
      const [depRes, usersRes] = await Promise.all([
        apiClient.get('departements/'),
        apiClient.get('users/') 
      ]);
      setDepartements(depRes.data);
      // Filtrer les utilisateurs (optionnel : afficher tous pour pouvoir leur affecter le rôle de chef)
      setAvailableChefs(usersRes.data);
    } catch (error) {
      console.error("Erreur lors du chargement des structures", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Création du département
      await apiClient.post('departements/', {
        nom: formData.nom,
        code: formData.code,
        chef: formData.chef || null
      });

      // 2. Si un chef a été sélectionné, modifier également son rôle en 'CHEF_DEP'
      if (formData.chef) {
        await apiClient.patch(`users/${formData.chef}/`, {
          role: 'CHEF_DEP'
        });
      }

      setNotification({ type: 'success', message: `Le département ${formData.nom} a été créé avec succès.` });
      setFormData({ nom: '', code: '', chef: '' });
      setIsPanelOpen(false);
      fetchData(); // Rafraîchir la liste académique
    } catch (error) {
      setNotification({ type: 'error', message: "Erreur lors de la création. Le nom ou le code existe déjà." });
    } finally {
      setIsSubmitting(false);
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
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 bg-[#111c30] ${
          notification.type === 'success' ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'
        }`}>
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderPlus className="h-6 w-6 text-indigo-400" /> Structures & Départements
          </h1>
          <p className="text-sm text-slate-400">Créez les pôles d'enseignements de l'établissement et nommez leurs directeurs.</p>
        </div>
        <button
          onClick={() => setIsPanelOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2 shadow-lg shadow-indigo-600/15 cursor-pointer transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouveau Département
        </button>
      </div>

      {/* Cartes d'affichage des Départements existants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departements.length === 0 ? (
          <div className="col-span-full bg-[#111c30] p-8 rounded-2xl border border-slate-800 text-center text-slate-500">
            Aucun département n'est enregistré pour le moment.
          </div>
        ) : (
          departements.map((dep) => (
            <div key={dep.id} className="bg-[#111c30] p-6 rounded-2xl border border-slate-800/60 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-bold text-white line-clamp-1">{dep.nom}</h3>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md uppercase tracking-wide">
                    {dep.code}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800/60 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" />
                    <span className="font-medium text-slate-300">
                      Chef : {dep.chef_details ? `${dep.chef_details.first_name} ${dep.chef_details.last_name}` : "Aucun responsable assigné"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PANNEAU COULISSANT : Formulaire de création */}
      {isPanelOpen && (
        <>
          <div onClick={() => setIsPanelOpen(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40" />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#111c30] border-l border-slate-800 shadow-2xl z-50 flex flex-col justify-between">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><FolderPlus className="h-5 w-5 text-indigo-400" /> Ajouter un pôle</h3>
              <button onClick={() => setIsPanelOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-800 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Nom du Département</label>
                <input type="text" name="nom" required value={formData.nom} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-white" placeholder="Génie Informatique et Télécoms" />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Code Identifiant (Trigger)</label>
                <input type="text" name="code" required value={formData.code} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-white uppercase" placeholder="GIT" />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Assigner un Directeur (Optionnel)</label>
                <select name="chef" value={formData.chef} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-white bg-[#111c30]">
                  <option value="">Laisser vacant (Sélectionner plus tard)</option>
                  {availableChefs.map(user => (
                    <option key={user.id} value={user.id}>{user.first_name} {user.last_name} (@{user.username})</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3 text-amber-500" /> L'utilisateur sélectionné recevra automatiquement le rôle de Chef.
                </p>
              </div>

              <div className="pt-6">
                <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Initialiser le Département'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default DepartementsManagement;