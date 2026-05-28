import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Calendar, Plus, Clock, MapPin, Loader2, X, AlertTriangle, BookOpen, Edit, Trash2 } from 'lucide-react';

const JOURS_ORDER = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];

const JOURS_LABELS = {
  LUNDI: 'Lundi',
  MARDI: 'Mardi',
  MERCREDI: 'Mercredi',
  JEUDI: 'Jeudi',
  VENDREDI: 'Vendredi',
  SAMEDI: 'Samedi',
};

const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [activityType, setActivityType] = useState('COURS');
  const [intituleAutre, setIntituleAutre] = useState('');

  // 👑 NOUVEAU : État pour savoir si on modifie un créneau existant
  const [editingScheduleId, setEditingScheduleId] = useState(null);

  const [formData, setFormData] = useState({ 
    matiere: '', 
    enseignant: '', 
    jour: 'LUNDI', 
    heure_debut: '', 
    heure_fin: '', 
    salle: '' 
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [matRes, schedRes] = await Promise.all([
        apiClient.get('matieres/'),
        apiClient.get('planning/')
      ]);
      
      setMatieres(matRes.data || []);
      setSchedules(schedRes.data || []);
    } catch (e) { 
      console.error("Erreur générale dans fetchData:", e); 
    } finally {
      setIsLoading(false); 
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const handleMatiereChange = (matiereId) => {
    if (!matiereId) {
      setFormData(prev => ({ ...prev, matiere: '', enseignant: '' }));
      return;
    }
    
    const selectedMatiere = matieres.find(m => m.id === parseInt(matiereId));
    if (selectedMatiere) {
      setFormData(prev => ({
        ...prev,
        matiere: matiereId,
        enseignant: selectedMatiere.enseignant || ''
      }));
    }
  };

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

  // 👑 NOUVEAU : Ouvrir le formulaire en mode édition et pré-remplir les champs
  const handleEditClick = (sched) => {
    setErrorMessage(null);
    const { type, salle, intitule } = parseSalleAndType(sched.salle);
    
    setEditingScheduleId(sched.id);
    setActivityType(type);
    setIntituleAutre(intitule);
    
    setFormData({
      matiere: sched.matiere || '',
      enseignant: sched.enseignant || '',
      jour: sched.jour,
      heure_debut: sched.heure_debut.slice(0, 5),
      heure_fin: sched.heure_fin.slice(0, 5),
      salle: salle
    });
    setIsOpen(true);
  };

  // 👑 NOUVEAU : Supprimer un créneau
  const handleDeleteClick = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce créneau de l'emploi du temps ?")) return;
    try {
      await apiClient.delete(`planning/${id}/`);
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression du créneau.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    let finalSalleString = '';
    let payload = { ...formData };

    if (activityType === 'AUTRE') {
      finalSalleString = `[AUTRE] ${intituleAutre.trim()} | ${formData.salle.trim()}`;
      payload.matiere = formData.matiere || (matieres[0]?.id || '');
      payload.enseignant = formData.enseignant || (matieres[0]?.enseignant || '');
    } else {
      finalSalleString = `[${activityType}] ${formData.salle.trim()}`;
    }

    payload.salle = finalSalleString;

    try {
      if (editingScheduleId) {
        // Mode Édition : Requête PUT
        await apiClient.put(`planning/${editingScheduleId}/`, payload);
      } else {
        // Mode Création : Requête POST
        await apiClient.post('planning/', payload);
      }
      
      setIsOpen(false);
      setFormData({ matiere: '', enseignant: '', jour: 'LUNDI', heure_debut: '', heure_fin: '', salle: '' });
      setActivityType('COURS');
      setIntituleAutre('');
      setEditingScheduleId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.non_field_errors?.[0] || err.response?.data?.error || "Erreur lors de l'enregistrement.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-xs text-slate-500 font-medium font-mono">Synchronisation des calendriers...</p>
      </div>
    );
  }

  const schedulesGroupedByDay = JOURS_ORDER.reduce((acc, jour) => {
    acc[jour] = schedules
      .filter(s => s.jour === jour)
      .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));
    return acc;
  }, {});

  return (
    <div className="space-y-6 font-sans antialiased text-slate-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Calendar className="h-6 w-6 text-purple-500" />
            Gestion des Emplois du Temps
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Planifiez, modifiez ou supprimez les créneaux par journée d'étude.
          </p>
        </div>

        <button 
          onClick={() => {
            setEditingScheduleId(null);
            setFormData({ matiere: '', enseignant: '', jour: 'LUNDI', heure_debut: '', heure_fin: '', salle: '' });
            setActivityType('COURS');
            setIntituleAutre('');
            setIsOpen(true);
          }}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Planifier un créneau
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-500/5 border border-rose-500/20 text-rose-400 rounded-xl flex items-start gap-3 text-xs font-medium animate-fadeIn">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <div><span className="font-bold block mb-1">Alerte</span>{errorMessage}</div>
        </div>
      )}

      {/* Grille principale */}
      {schedules.length === 0 ? (
        <div className="text-center py-16 bg-[#111c30]/20 border border-slate-800/40 rounded-2xl text-slate-500 text-xs">
          Aucun créneau horaire n'est défini.
        </div>
      ) : (
        <div className="space-y-4">
          {JOURS_ORDER.map((jour) => {
            const coursDuJour = schedulesGroupedByDay[jour];
            if (coursDuJour.length === 0) return null;

            return (
              <div key={jour} className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-[#111c30]/10 border border-slate-800/40 p-4 rounded-2xl items-center">
                
                <div className="lg:col-span-2 flex lg:flex-col items-center lg:items-start justify-between lg:justify-center border-b lg:border-b-0 lg:border-r border-slate-800/60 pb-2 lg:pb-0 lg:pr-4">
                  <span className="text-sm font-bold text-white uppercase tracking-wider">{JOURS_LABELS[jour]}</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-[#0d1424] px-2 py-0.5 rounded-md border border-slate-800/60 lg:mt-1">
                    {coursDuJour.length} séance(s)
                  </span>
                </div>

                <div className="lg:col-span-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {coursDuJour.map((sched) => {
                    const { type, salle, intitule } = parseSalleAndType(sched.salle);

                    const cardTheme = type === 'DEVOIR' 
                      ? { bg: 'bg-rose-500/5', border: 'border-rose-500/15', line: 'bg-rose-500', badge: 'bg-rose-500/10 text-rose-400' }
                      : type === 'AUTRE'
                        ? { bg: 'bg-amber-500/5', border: 'border-amber-500/15', line: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-400' }
                        : { bg: 'bg-purple-500/5', border: 'border-purple-500/15', line: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-400' };

                    return (
                      <div key={sched.id} className="group relative border border-slate-800/60 hover:border-slate-700/80 bg-[#111c30]/30 rounded-xl p-3.5 flex flex-col justify-between gap-3 shadow-sm transition-all overflow-hidden">
                        <div className={`absolute top-0 inset-x-0 h-[1.5px] ${cardTheme.line}`} />

                        {/* 👑 NOUVEAU : Barre de boutons d'action invisible par défaut, s'affiche au survol */}
                        <div className="absolute top-2 right-2 flex gap-1 bg-[#0a101f]/90 px-1.5 py-1 rounded-lg border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button onClick={() => handleEditClick(sched)} className="text-slate-400 hover:text-purple-400 p-0.5 transition-colors cursor-pointer" title="Modifier">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeleteClick(sched.id)} className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors cursor-pointer" title="Supprimer">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[9px] font-bold font-mono text-slate-400 uppercase pr-12">
                            <span>{sched.heure_debut.slice(0, 5)} - {sched.heure_fin.slice(0, 5)}</span>
                            <span className={`px-1.5 py-0.5 rounded font-sans font-bold text-[8px] tracking-wide ${cardTheme.badge}`}>{type}</span>
                          </div>

                          <div>
                            <h3 className="text-xs font-bold text-white truncate max-w-[150px]">
                              {type === 'AUTRE' ? (intitule || "Événement spécial") : (sched.matiere_details?.nom || "Module")}
                            </h3>
                            <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5 truncate">
                              <BookOpen className="h-2.5 w-2.5 text-slate-600 shrink-0" />
                              {type === 'AUTRE' ? "Activité générale" : `Classe : ${sched.matiere_details?.classe || "Générale"}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/40 text-[10px] text-slate-400">
                          <span className="truncate max-w-[90px]">
                            👤 {type === 'AUTRE' ? "Direction" : (sched.enseignant_details ? sched.enseignant_details.last_name : "Professeur")}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-slate-200 shrink-0 bg-[#0d1424] px-1.5 py-0.5 rounded border border-slate-800/60">
                            <MapPin className="h-2.5 w-2.5 text-slate-500" />
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

      {/* DRAWER LATÉRAL */}
      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn" />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#111c30] border-l border-slate-800 flex flex-col justify-between shadow-2xl z-50 animate-slide-left">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#0d1424]/60">
              <div>
                <h2 className="text-base font-bold text-white text-xs uppercase tracking-wide">
                  {editingScheduleId ? "Modifier le créneau" : "Planifier un Créneau"}
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Ajustement de l'organisation temporelle.</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
              
              {/* Type d'activité */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Nature de l'activité</label>
                <div className="grid grid-cols-3 gap-2 bg-[#0d1424] p-1 rounded-xl border border-slate-800">
                  {['COURS', 'DEVOIR', 'AUTRE'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setActivityType(t); setFormData({ ...formData, matiere: '', enseignant: '' }); }}
                      className={`py-2 rounded-lg font-bold text-center text-[10px] tracking-wide transition-all cursor-pointer ${
                        activityType === t
                          ? t === 'DEVOIR' ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-sm'
                          : t === 'AUTRE' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-sm'
                          : 'bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-sm'
                          : 'text-slate-400 border border-transparent hover:text-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {activityType === 'AUTRE' ? (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Intitulé de l'événement libre</label>
                  <input type="text" required value={intituleAutre} placeholder="Ex: Conférence, Réunion..." onChange={e => setIntituleAutre(e.target.value)} className="w-full px-3 py-2.5 bg-[#0d1424] border border-slate-800 rounded-xl text-xs text-white focus:outline-none" />
                </div>
              ) : (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Module / Unité d'Enseignement</label>
                  <select required value={formData.matiere} onChange={e => handleMatiereChange(e.target.value)} className="w-full px-3 py-2.5 bg-[#0d1424] border border-slate-800 rounded-xl text-xs text-white bg-[#111c30]">
                    <option value="">Sélectionner une matière...</option>
                    {matieres.map(m => (
                      <option key={m.id} value={m.id}>{m.nom} ({m.classe_details?.nom || 'Générale'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Jour de la semaine</label>
                <select required value={formData.jour} onChange={e => setFormData({...formData, jour: e.target.value})} className="w-full px-3 py-2.5 bg-[#0d1424] border border-slate-800 rounded-xl text-xs text-white bg-[#111c30]">
                  <option value="LUNDI">Lundi</option>
                  <option value="MARDI">Mardi</option>
                  <option value="MERCREDI">Mercredi</option>
                  <option value="JEUDI">Jeudi</option>
                  <option value="VENDREDI">Vendredi</option>
                  <option value="SAMEDI">Samedi</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Heure Début</label>
                  <input type="time" required value={formData.heure_debut} onChange={e => setFormData({...formData, heure_debut: e.target.value})} className="w-full px-3 py-2.5 bg-[#0d1424] border border-slate-800 rounded-xl text-xs text-white font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Heure Fin</label>
                  <input type="time" required value={formData.heure_fin} onChange={e => setFormData({...formData, heure_fin: e.target.value})} className="w-full px-3 py-2.5 bg-[#0d1424] border border-slate-800 rounded-xl text-xs text-white font-mono" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Lieu / Salle d'accueil</label>
                <input type="text" required value={formData.salle} placeholder="Ex: Salle 104, Amphi B..." onChange={e => setFormData({...formData, salle: e.target.value})} className="w-full px-3 py-2.5 bg-[#0d1424] border border-slate-800 rounded-xl text-xs text-white focus:outline-none" />
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs cursor-pointer shadow-lg shadow-purple-900/20 active:scale-[0.99]">
                  {editingScheduleId ? "Sauvegarder les modifications" : "Inscrire au calendrier"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ScheduleManagement;