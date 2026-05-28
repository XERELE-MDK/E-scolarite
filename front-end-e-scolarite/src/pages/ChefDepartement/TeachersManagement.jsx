import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { UserPlus, Search, Loader2, X, CheckCircle, Mail, Phone, MapPin, Award, Building2, Trash2, Shield, ArrowUpDown } from 'lucide-react';

const TeachersManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'ENSEIGNANT', 
    telephone: '',
    adresse: ''
  });

  const fetchTeachers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('users/?role=ENSEIGNANT');
      setTeachers(response.data || []);
      setFilteredTeachers(response.data || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des enseignants", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    const filtered = teachers.filter(t => 
      `${t.first_name} ${t.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTeachers(filtered);
  }, [searchQuery, teachers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDeleteTeacher = async (id, name) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir retirer M. ${name} du corps enseignant ?`)) return;
    
    try {
      await apiClient.delete(`users/${id}/`);
      setNotification({ type: 'success', message: `L'enseignant M. ${name} a été révoqué avec succès.` });
      setTeachers(teachers.filter(t => t.id !== id));
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.error || "Impossible de supprimer cet enseignant.";
      setNotification({ type: 'error', message: errMsg });
    } finally {
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null);

    try {
      const payload = { ...formData, role: 'ENSEIGNANT' };
      const response = await apiClient.post('users/', payload);

      if (response.status === 201 || response.status === 200) {
        setNotification({ 
          type: 'success', 
          message: `L'enseignant M. ${formData.last_name} a été enregistré et rattaché au pôle.` 
        });
        
        setFormData({
          username: '', email: '', first_name: '', last_name: '', password: '',
          role: 'ENSEIGNANT', telephone: '', adresse: ''
        });

        setIsPanelOpen(false);
        fetchTeachers(); 
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (error) {
      console.error(error);
      const serverMessage = error.response?.data?.detail || "Erreur lors de l'enregistrement de l'enseignant.";
      setNotification({ type: 'error', message: serverMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans antialiased text-slate-200">
      {/* Toast Notification Premium */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl border backdrop-blur-md flex items-center gap-3 animate-slide-in ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-950/90 border-rose-500/30 text-rose-400'
        }`}>
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      )}

      {/* Header Minimaliste Pro */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Corps Enseignant
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registre officiel et affectations des enseignants du département.
          </p>
        </div>

        <button
          onClick={() => setIsPanelOpen(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98] cursor-pointer"
        >
          <UserPlus className="h-4 w-4" /> Recruter un Enseignant
        </button>
      </div>

      {/* Barre de Filtres de Recherche Épurée */}
      <div className="flex items-center justify-between gap-4 bg-[#111c30]/40 p-3 rounded-xl border border-slate-800/40">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Filtrer par nom, email ou identifiant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#0d1424] border border-slate-800/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-600 transition-colors"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium font-mono">
          Total : {filteredTeachers.length} Enseignant(s)
        </div>
      </div>

      {/* Conteneur de Liste Professionnelle */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 bg-[#111c30]/20 rounded-2xl border border-slate-800/40">
          <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
          <span className="text-xs text-slate-500">Synchronisation du registre...</span>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="bg-[#111c30]/20 p-16 text-center rounded-2xl border border-slate-800/40">
          <Award className="h-8 w-8 text-slate-700 mx-auto mb-3" />
          <p className="text-xs text-slate-500">Aucun enseignant actif ne correspond à cette recherche.</p>
        </div>
      ) : (
        <div className="bg-[#111c30] rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0d1424]/80 text-slate-400 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <th className="p-4">Membre de la Faculté</th>
                  <th className="p-4">Identifiant</th>
                  <th className="p-4">Coordonnées</th>
                  <th className="p-4">Localisation</th>
                  <th className="p-4 text-center">Statut RH</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-800/60 text-slate-300">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-800/15 transition-colors group">
                    {/* Colonne Identité */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-purple-600/20 to-indigo-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs uppercase tracking-wide">
                          {teacher.first_name?.[0]}{teacher.last_name?.[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm">{teacher.first_name} {teacher.last_name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Shield className="h-3 w-3 text-purple-500/70" /> Enseignant Titulaire
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Colonne Username */}
                    <td className="p-4 font-mono text-slate-400 text-[11px]">
                      @{teacher.username}
                    </td>

                    {/* Colonne Contacts */}
                    <td className="p-4 space-y-0.5">
                      <div className="text-slate-300 font-medium flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-slate-600" /> {teacher.email || '—'}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-slate-600" /> {teacher.telephone || 'Aucun téléphone'}
                      </div>
                    </td>

                    {/* Colonne Localisation */}
                    <td className="p-4 text-slate-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-slate-600" />
                        <span className="truncate max-w-[140px]">{teacher.adresse || 'Non spécifiée'}</span>
                      </div>
                    </td>

                    {/* Colonne Statut */}
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-400 rounded-full font-semibold border border-purple-500/10 tracking-wide text-[10px]">
                        Rattaché
                      </span>
                    </td>

                    {/* Colonne Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDeleteTeacher(teacher.id, teacher.last_name)}
                          className="p-1.5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="Révoquer l'enseignant"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PANNEAU LATÉRAL PREMIUM : Formulaire de Recrutement */}
      {isPanelOpen && (
        <>
          <div onClick={() => setIsPanelOpen(false)} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fadeIn" />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#111c30] border-l border-slate-800 shadow-2xl z-50 flex flex-col justify-between animate-slide-left">
            
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#0d1424]/60">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-purple-400" /> Profil Académique
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Enrôlement d'un nouveau professeur dans le pôle scolarité.</p>
              </div>
              <button onClick={() => setIsPanelOpen(false)} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Prénom</label>
                  <input required type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-purple-600 text-white transition-colors" placeholder="Ex: Ibrahima" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Nom</label>
                  <input required type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-purple-600 text-white transition-colors" placeholder="Ex: Diallo" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Identifiant de connexion (Username)</label>
                <input required type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-purple-600 text-white transition-colors font-mono" placeholder="ex: idiallo" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Adresse Email Officielle</label>
                <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-purple-600 text-white transition-colors" placeholder="ex: i.diallo@polytechnique.edu" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Mot de passe temporaire</label>
                <input required type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-purple-600 text-white transition-colors" placeholder="••••••••" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Contact Téléphonique</label>
                <input type="text" name="telephone" value={formData.telephone} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-purple-600 text-white transition-colors" placeholder="+221 77..." />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Adresse Domiciliaire</label>
                <input type="text" name="adresse" value={formData.adresse} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-purple-600 text-white transition-colors" placeholder="Dakar, Sénégal" />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-purple-900/20"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer le profil'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default TeachersManagement;