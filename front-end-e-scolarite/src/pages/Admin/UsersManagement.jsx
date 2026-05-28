import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import UserDetailModal from '../Admin/UserDetailModal';
import { useAuthStore } from '../../context/authStore';
import { Users, UserPlus, Search, Filter, Trash2, Edit, Eye, Loader2, X, CheckCircle } from 'lucide-react';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [departements, setDepartements] = useState([]); 
  const [classes, setClasses] = useState([]); 
  const [filteredClassesForAdmin, setFilteredClassesForAdmin] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const isChefDep = currentUser?.role === 'CHEF_DEP';

  // États pour la recherche et le filtrage globale
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState(isChefDep ? 'ETUDIANT' : 'ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL'); 

  // États pour le contrôle des panneaux et fenêtres modales
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedUserForView, setSelectedUserForView] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'ETUDIANT',
    departement: isChefDep ? currentUser?.departement : '', 
    classe: '', 
    telephone: '',
    adresse: ''
  });

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        departement: currentUser.role === 'CHEF_DEP' ? currentUser.departement : '',
        role: currentUser.role === 'CHEF_DEP' ? 'ETUDIANT' : 'ETUDIANT',
        classe: ''
      }));
      setSelectedRole(currentUser.role === 'CHEF_DEP' ? 'ETUDIANT' : 'ALL');
    }
  }, [currentUser]);

  // Charger les utilisateurs, départements et classes
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, deptsRes, classesRes] = await Promise.all([
        apiClient.get('users/'),
        apiClient.get('departements/'),
        apiClient.get('classes/') 
      ]);
      
      setUsers(usersRes.data || []);
      setFilteredUsers(usersRes.data || []);
      setDepartements(deptsRes.data || []);
      setClasses(classesRes.data || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des données", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated || localStorage.getItem('polytechnique-auth')) {
      fetchData();
    }
  }, [isAuthenticated]);

  // Filtrage des classes en cascade pour le Super Admin
  // On compare l'ID du département de la filière de la classe avec le département sélectionné
  useEffect(() => {
    if (!isChefDep && formData.departement) {
      const filtered = classes.filter(c => 
        c.filiere_details?.departement_details?.id?.toString() === formData.departement.toString()
      );
      setFilteredClassesForAdmin(filtered);
    } else {
      setFilteredClassesForAdmin([]);
    }
  }, [formData.departement, classes, isChefDep]);

  // Filtrage du tableau de bord
  useEffect(() => {
    let result = users;

    if (!isChefDep && selectedRole !== 'ALL') {
      result = result.filter(u => u.role === selectedRole);
    }

    if (!isChefDep && selectedDeptFilter !== 'ALL') {
      result = result.filter(u => {
        const deptId = selectedDeptFilter.toString();
        const appartientDept = u.departement?.toString() || u.departement_details?.id?.toString();
        const dirigeDept = u.departement_dirige_details?.id?.toString();
        return appartientDept === deptId || dirigeDept === deptId;
      });
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.username.toLowerCase().includes(query) ||
        (u.first_name && u.first_name.toLowerCase().includes(query)) ||
        (u.last_name && u.last_name.toLowerCase().includes(query)) ||
        u.email.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(result);
  }, [searchQuery, selectedRole, selectedDeptFilter, users, isChefDep]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // CORRECTION : était 'department' (sans 'e') → maintenant 'departement' (nom correct)
  // On réinitialise aussi 'classe' lors du changement de département pour éviter
  // qu'une classe d'un ancien département reste sélectionnée.
  const handleAdminDepartmentChange = (e) => {
    setFormData({ ...formData, departement: e.target.value, classe: '' });
  };

  const handleDeleteUser = async (userId, username, userRole) => {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer définitivement @${username} ?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setIsLoading(true);
      await apiClient.delete(`users/${userId}/`);
      setNotification({ type: 'success', message: `L'utilisateur @${username} a été supprimé.` });
      await fetchData();
    } catch (error) {
      setNotification({ type: 'error', message: "Erreur lors de la suppression." });
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Construction du payload propre envoyé à l'API
      const backendPayload = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        role: formData.role,
        telephone: formData.telephone,
        adresse: formData.adresse,
      };

      if (isChefDep) {
        // Le Chef de Département :
        // - 'departement' est injecté côté backend (views.py), on n'a pas besoin de l'envoyer
        // - 'classe' est envoyé séparément pour les étudiants
        if (formData.role === 'ETUDIANT') {
          backendPayload.classe = formData.classe || null;
        }
        // Pour un ENSEIGNANT, pas de classe — le backend injecte juste le département
      } else {
        // Super Admin :
        // - Pour un étudiant : 'departement' = département sélectionné, 'classe' = classe choisie
        // - Pour les autres rôles : 'departement' = département d'affectation
        backendPayload.departement = formData.departement || null;
        if (formData.role === 'ETUDIANT') {
          backendPayload.classe = formData.classe || null;
        }
      }

      await apiClient.post('users/', backendPayload);
      setNotification({ type: 'success', message: `Compte @${formData.username} créé avec le rôle ${formData.role} !` });
      
      // Réinitialisation du formulaire
      setFormData({
        username: '', email: '', first_name: '', last_name: '', password: '',
        role: 'ETUDIANT',
        departement: isChefDep ? currentUser?.departement : '',
        classe: '',
        telephone: '',
        adresse: ''
      });
      setIsPanelOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      setNotification({ 
        type: 'error', 
        message: error.response?.data?.error || "Erreur lors du traitement du dossier." 
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="space-y-6 font-sans text-slate-200 relative min-h-[calc(100vh-theme(spacing.16))]">
      
      {notification && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isChefDep ? "Registre du Personnel et des Étudiants" : "Gestion des Utilisateurs Global"}
          </h1>
          <p className="text-sm text-slate-400">
            {isChefDep ? "Gérez l'ensemble des fiches étudiants et enseignants associés à votre pôle." : "Administrez l'ensemble des comptes de l'établissement Polytechnique."}
          </p>
        </div>
        <button
          onClick={() => setIsPanelOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2 shadow-lg shadow-indigo-600/15 cursor-pointer transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Créer un compte
        </button>
      </div>

      {/* Barre de Recherche & Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#111c30] p-4 rounded-2xl border border-slate-800/60 shadow-xl">
        <div className={`${isChefDep ? 'md:col-span-4' : 'md:col-span-2'} relative flex items-center`}>
          <Search className="absolute left-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher un membre par nom, prénom, identifiant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0d1424] border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        
        {!isChefDep && (
          <>
            <div className="relative">
              <Filter className="absolute inset-y-0 left-3 h-full w-4 text-slate-500 flex items-center" />
              <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-[#0d1424] border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer bg-[#111c30]">
                <option value="ALL">Tous les rôles</option>
                <option value="ADMIN">Administrateurs</option>
                <option value="CHEF_DEP">Chefs de Département</option>
                <option value="ENSEIGNANT">Enseignants</option>
                <option value="ETUDIANT">Étudiants</option>
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute inset-y-0 left-3 h-full w-4 text-slate-500 flex items-center" />
              <select value={selectedDeptFilter} onChange={(e) => setSelectedDeptFilter(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-[#0d1424] border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer bg-[#111c30]">
                <option value="ALL">Tous les départements</option>
                {departements.map((d) => (
                  <option key={d.id} value={d.id}>{d.nom} ({d.code})</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Tableau */}
      <div className="bg-[#111c30] rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0d1424] text-slate-400 font-semibold text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="p-4">Utilisateur / Étudiant</th>
                <th className="p-4">Email</th>
                <th className="p-4">Rôle</th>
                <th className="p-4">Département / Affectation</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-800 text-slate-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500 bg-[#111c30]">Aucun dossier trouvé.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-white">{u.first_name} {u.last_name}</div>
                      <div className="text-xs text-slate-500 font-mono">@{u.username}</div>
                    </td>
                    <td className="p-4 text-slate-400">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        u.role === 'ADMIN' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        u.role === 'CHEF_DEP' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        u.role === 'ENSEIGNANT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>{u.role}</span>
                    </td>
                    <td className="p-4 text-slate-400">
                      {u.role === 'CHEF_DEP' && u.departement_dirige_details ? (
                        <div className="flex flex-col">
                          <span className="text-purple-400 font-semibold text-xs">👑 Dirige :</span>
                          <span className="text-slate-200 text-xs">{u.departement_dirige_details.nom}</span>
                        </div>
                      ) : u.departement_details ? (
                        <span className="text-slate-200">{u.departement_details.nom}</span>
                      ) : <span className="text-slate-600 italic text-xs">Aucun rattachement</span>}
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <button onClick={() => setSelectedUserForView(u)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"><Eye className="h-4 w-4" /></button>
                      <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteUser(u.id, u.username, u.role)} className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUserForView && (
        <UserDetailModal user={selectedUserForView} onClose={() => setSelectedUserForView(null)} onDeleteSuccess={fetchData} />
      )}

      {/* PANNEAU DE CRÉATION MULTI-RÔLE */}
      {isPanelOpen && (
        <>
          <div onClick={() => setIsPanelOpen(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40" />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#111c30] border-l border-slate-800 shadow-2xl z-50 flex flex-col justify-between animate-slide-left">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-400" /> Ajouter un profil
              </h3>
              <button onClick={() => setIsPanelOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-800 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-4">

              {/* SÉLECTEUR DE RÔLE */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">Type de compte à créer</label>
                <select 
                  name="role" 
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value, classe: '', departement: isChefDep ? currentUser?.departement : ''})} 
                  className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm text-white bg-[#111c30] focus:outline-none focus:border-indigo-500"
                >
                  {isChefDep ? (
                    <>
                      <option value="ETUDIANT">Étudiant (Élève du pôle)</option>
                      <option value="ENSEIGNANT">Enseignant (Professeur)</option>
                    </>
                  ) : (
                    <>
                      <option value="ADMIN">ADMIN</option>
                      <option value="CHEF_DEP">CHEF_DEP</option>
                      <option value="ENSEIGNANT">ENSEIGNANT</option>
                      <option value="ETUDIANT">ETUDIANT</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Prénom</label>
                  <input type="text" name="first_name" required value={formData.first_name} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm text-white focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Nom</label>
                  <input type="text" name="last_name" required value={formData.last_name} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm text-white focus:outline-none" />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Nom d'utilisateur</label>
                <input type="text" name="username" required value={formData.username} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm text-white focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Email Académique</label>
                <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm text-white focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Mot de passe provisoire</label>
                <input type="password" name="password" required value={formData.password} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm text-white focus:outline-none" />
              </div>

              {/* DÉPARTEMENT pour le Super Admin (rôles non-Étudiant) */}
              {!isChefDep && formData.role !== 'ETUDIANT' && formData.role !== 'ADMIN' && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Département d'Affectation</label>
                  <select
                    required
                    name="departement"
                    value={formData.departement}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm text-white bg-[#111c30]"
                  >
                    <option value="">Sélectionner un pôle...</option>
                    {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                  </select>
                </div>
              )}

              {/* CASCADE ADAPTATIVE POUR LES ÉTUDIANTS */}
              {formData.role === 'ETUDIANT' && (
                <>
                  {/* Étape 1 : Choix de département (Seulement pour le Super Admin) */}
                  {!isChefDep && (
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-medium">1. Département d'origine de la filière</label>
                      <select
                        required
                        value={formData.departement}
                        onChange={handleAdminDepartmentChange}  // ← CORRECTION : utilise la bonne fonction
                        className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm text-white bg-[#111c30]"
                      >
                        <option value="">Choisir un département...</option>
                        {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Étape 2 : Choix de la Classe */}
                  {(isChefDep || formData.departement) && (
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-bold text-indigo-400">
                        {isChefDep ? "Classe d'Affectation (IRT3, IRT4...)" : "2. Division / Classe de destination"}
                      </label>
                      <select 
                        required 
                        name="classe" 
                        value={formData.classe} 
                        onChange={handleInputChange} 
                        className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm text-white bg-[#111c30] focus:border-indigo-500"
                      >
                        <option value="">Sélectionner la classe...</option>
                        {isChefDep ? (
                          classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)
                        ) : (
                          filteredClassesForAdmin.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)
                        )}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Téléphone</label>
                <input type="text" name="telephone" value={formData.telephone} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Adresse</label>
                <input type="text" name="adresse" value={formData.adresse} onChange={handleInputChange} className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm text-white" />
              </div>
              <div className="pt-4">
                <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
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

export default UsersManagement;