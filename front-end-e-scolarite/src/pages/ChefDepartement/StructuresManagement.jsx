import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { BookOpen, Plus, Loader2, X, CheckCircle, GraduationCap } from 'lucide-react';

const StructuresManagement = () => {
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showClasseForm, setShowClasseForm] = useState(false);
  const [notification, setNotification] = useState(null);

  // Un seul champ requis pour configurer une classe : le nom
  const [classeData, setClasseData] = useState({ nom: '', annee_universitaire: '2025-2026' });

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('classes/');
      setClasses(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des classes", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleClasseSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('classes/', {
        nom: classeData.nom,
        annee_universitaire: classeData.annee_universitaire
      });
      
      setNotification({ type: 'success', message: `La classe "${classeData.nom}" a été ouverte avec succès !` });
      setShowClasseForm(false);
      setClasseData({ nom: '', annee_universitaire: '2025-2026' });
      fetchClasses();
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: error.response?.data?.error || "Erreur lors de l'initialisation de la classe." 
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

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
            <BookOpen className="h-6 w-6 text-purple-400" /> Classes de votre Département
          </h1>
          <p className="text-sm text-slate-400">Consultez et initialisez les divisions d'élèves sous votre responsabilité.</p>
        </div>
        <button
          onClick={() => setShowClasseForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-purple-600/15 cursor-pointer transition-colors"
        >
          <Plus className="h-4 w-4" /> Nouvelle Classe
        </button>
      </div>

      {/* Grille des Classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.length === 0 ? (
          <div className="col-span-full bg-[#111c30] p-8 rounded-2xl border border-slate-800 text-center text-slate-500">
            Aucune classe active dans votre département. Cliquez sur "Nouvelle Classe" pour commencer.
          </div>
        ) : (
          classes.map((cls) => (
            <div key={cls.id} className="bg-[#111c30] p-5 rounded-2xl border border-slate-800/60 shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">
                    {cls.filiere_details?.code || "Filière Auto"}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{cls.annee_universitaire}</span>
                </div>
                <h3 className="text-lg font-bold text-white pt-1 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-slate-400" /> {cls.nom}
                </h3>
                <p className="text-xs text-slate-400">Structure parente : {cls.filiere_details?.nom || 'Département Général'}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL ULTRA-SIMPLIFIÉ : Créer une Classe */}
      {showClasseForm && (
        <>
          <div onClick={() => setShowClasseForm(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40" />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#111c30] border-l border-slate-800 p-6 z-50 flex flex-col justify-between animate-slide-left">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white">Créer une Classe</h3>
              <button onClick={() => setShowClasseForm(false)} className="p-1 text-slate-400 hover:bg-slate-800 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleClasseSubmit} className="space-y-5 flex-1 py-6">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Nom de la classe</label>
                <input 
                  type="text" 
                  required 
                  value={classeData.nom} 
                  onChange={e => setClasseData({...classeData, nom: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-[#0d1424] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" 
                  placeholder="Ex: 201, DIC 1, L3 GL..." 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Année Académique</label>
                <input 
                  type="text" 
                  required 
                  value={classeData.annee_universitaire} 
                  onChange={e => setClasseData({...classeData, annee_universitaire: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-[#0d1424] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-colors" 
                />
              </div>

              <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/10 text-[11px] text-purple-300">
                💡 <strong>Rattachement automatique :</strong> Cette classe sera directement liée à la filière portant le nom de votre département.
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-purple-600/25 flex items-center justify-center cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ouvrir la classe'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

    </div>
  );
};

export default StructuresManagement;