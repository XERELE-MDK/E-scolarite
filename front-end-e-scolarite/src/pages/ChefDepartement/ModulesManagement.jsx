import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { BookOpen, Plus, Search, Loader2, CheckCircle, X } from 'lucide-react';

const ModulesManagement = () => {
  const [matieres, setMatieres] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // États des formulaires et affichages
  const [showMatiereForm, setShowMatiereForm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [matiereFormData, setMatiereFormData] = useState({
    nom: '',
    code: '',
    coefficient: 1,
    classe: '',
    enseignant: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Récupération globale des données requises
      const [matieresRes, usersRes, classesRes] = await Promise.all([
        apiClient.get('matieres/'),
        apiClient.get('users/'), 
        apiClient.get('classes/')
      ]);
      
      setMatieres(matieresRes.data);
      // Cumul des rôles : Un enseignant OU un chef de département peut tenir un module
      setEnseignants(usersRes.data.filter(u => u.role === 'ENSEIGNANT' || u.role === 'CHEF_DEP'));
      setClasses(classesRes.data);
    } catch (error) {
      console.error("Erreur lors du chargement des structures académiques", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMatiereSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('matieres/', matiereFormData);
      setNotification({ type: 'success', message: `Le module ${matiereFormData.nom} a été configuré !` });
      setShowMatiereForm(false);
      setMatiereFormData({ nom: '', code: '', coefficient: 1, classe: '', enseignant: '' });
      fetchData();
    } catch (error) {
      setNotification({ type: 'error', message: "Erreur lors de la création du module." });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const filteredMatieres = matieres.filter(m => 
    m.nom.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
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
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-purple-400" /> Saisie & Gestion des Modules
          </h1>
          <p className="text-sm text-slate-400">Structurez les enseignements et affectez le corps professoral de votre département.</p>
        </div>
        <button
          onClick={() => setShowMatiereForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2 shadow-lg shadow-purple-600/15 cursor-pointer transition-colors"
        >
          <Plus className="h-4 w-4" />
          Créer une matière
        </button>
      </div>

      {/* Barre de Recherche */}
      <div className="relative bg-[#111c30] p-4 rounded-2xl border border-slate-800/60 shadow-xl">
        <Search className="absolute inset-y-0 left-7 h-full w-4 text-slate-500 flex items-center" />
        <input
          type="text"
          placeholder="Rechercher un module par nom ou code d'Unité d'Enseignement..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#0d1424] border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>

      {/* Grille des modules existants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMatieres.map((mat) => (
          <div key={mat.id} className="bg-[#111c30] p-5 rounded-2xl border border-slate-800/60 shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {mat.code}
                </span>
                <span className="text-xs text-slate-500 font-semibold">Coef : {mat.coefficient}</span>
              </div>
              <h3 className="text-base font-bold text-white pt-1">{mat.nom}</h3>
              <p className="text-xs text-slate-400 font-medium">Classe : {mat.classe_details?.nom || `ID ${mat.classe}`}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div className="overflow-hidden pr-2">
                <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Enseignant Titulaire</p>
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {mat.enseignant_details ? `${mat.enseignant_details.first_name} ${mat.enseignant_details.last_name}` : "⚠️ Aucun enseignant assigné"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FORMULAIRE COULISSANT : Créer un Module */}
      {showMatiereForm && (
        <>
          <div onClick={() => setShowMatiereForm(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40" />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#111c30] border-l border-slate-800 shadow-2xl z-50 flex flex-col justify-between animate-slide-left">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><BookOpen className="h-5 w-5 text-purple-400" /> Ajouter une matière</h3>
              <button onClick={() => setShowMatiereForm(false)} className="p-1.5 text-slate-400 hover:bg-slate-800 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleMatiereSubmit} className="p-6 flex-1 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Nom de la matière</label>
                <input type="text" required value={matiereFormData.nom} onChange={(e) => setMatiereFormData({...matiereFormData, nom: e.target.value})} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 text-white" placeholder="Ex: Algorithmique Avancée" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Code UE</label>
                  <input type="text" required value={matiereFormData.code} onChange={(e) => setMatiereFormData({...matiereFormData, code: e.target.value})} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 text-white font-mono" placeholder="Ex: INF-301" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Coefficient</label>
                  <input type="number" min="1" max="10" required value={matiereFormData.coefficient} onChange={(e) => setMatiereFormData({...matiereFormData, coefficient: parseInt(e.target.value)})} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Classe de destination</label>
                <select required value={matiereFormData.classe} onChange={(e) => setMatiereFormData({...matiereFormData, classe: e.target.value})} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 text-white bg-[#111c30]">
                  <option value="">Sélectionner une classe</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.annee_universitaire})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Enseignant Responsable</label>
                <select required value={matiereFormData.enseignant} onChange={(e) => setMatiereFormData({...matiereFormData, enseignant: e.target.value})} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 text-white bg-[#111c30]">
                  <option value="">Affecter un professeur ou un chef</option>
                  {enseignants.map(ens => (
                    <option key={ens.id} value={ens.id}>
                      {ens.first_name} {ens.last_name} ({ens.role === 'CHEF_DEP' ? 'Chef de Dép.' : 'Enseignant'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer et Affecter'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ModulesManagement;