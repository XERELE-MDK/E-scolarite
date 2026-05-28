import React, { useState } from 'react';
import apiClient from '../../api/client';
import { X, Home, BookOpen, Layers, ShieldCheck, Phone, MapPin, Mail, User, Trash2, Loader2 } from 'lucide-react';

const UserDetailModal = ({ user, onClose, onDeleteSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user) return null;

  // Option de suppression rapide depuis la vue détaillée
  const handleModalDelete = async () => {
    if (!window.confirm(`Confirmez-vous la suppression immédiate et définitive de @${user.username} ?`)) return;
    
    try {
      setIsDeleting(true);
      await apiClient.delete(`users/${user.id}/`);
      onClose();
      if (onDeleteSuccess) onDeleteSuccess();
    } catch (err) {
      alert(err.response?.data?.detail || "Action refusée : Permissions insuffisantes.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Arrière-plan flouté */}
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50" />
      
      {/* Panneau latéral coulissant de détails */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#111c30] border-l border-slate-800 shadow-2xl z-50 flex flex-col justify-between animate-slide-left font-sans text-slate-200">
        
        {/* En-tête */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-[#0d1424]/40">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-400" /> Profil Utilisateur
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenu des détails */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          {/* Identité principale */}
          <div className="text-center space-y-2 pb-4 border-b border-slate-800/60">
            <div className="h-16 w-16 mx-auto rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold uppercase text-2xl">
              {user.first_name ? user.first_name[0] : user.username[0]}
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">{user.first_name} {user.last_name}</h4>
              <p className="text-xs text-indigo-400 font-mono">@{user.username}</p>
            </div>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              user.role === 'ADMIN' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
              user.role === 'CHEF_DEP' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
              user.role === 'ENSEIGNANT' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
              'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {user.role}
            </span>
          </div>

          {/* Coordonnées de base */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Coordonnées</h5>
            <div className="bg-[#0d1424]/40 rounded-xl p-3 border border-slate-800/40 space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5 text-slate-300">
                <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <Phone className="h-4 w-4 text-slate-500 shrink-0" />
                <span>{user.telephone || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                <span>{user.adresse || 'Aucune adresse enregistrée'}</span>
              </div>
            </div>
          </div>

          {/* Informations spécifiques Étudiant */}
          {user.role === 'ETUDIANT' && (
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Statut Académique & Logement</h5>
              <div className="bg-[#0d1424]/80 rounded-xl p-4 border border-slate-800 space-y-3.5 text-sm">
                
                <div className="flex items-start gap-3">
                  <Layers className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Numéro de Matricule</p>
                    <p className="text-slate-200 font-mono font-semibold">{user.student_profile?.matricule || "POLY-En attente"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BookOpen className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Département d'Origine</p>
                    <p className="text-slate-200 font-medium">
                      {user.departement_details?.nom ? `${user.departement_details.nom} (${user.departement_details.code})` : 'Non assigné'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-slate-800/80 pt-3">
                  <Home className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Hébergement Campus</p>
                    <p className="text-emerald-400 font-semibold">
                      {user.student_profile?.logement || 'Non logé (Pas de chambre)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Inscription Administrative</p>
                    <p className="text-slate-300 text-xs font-medium">
                      {user.student_profile?.statut_inscription || 'Aucune inscription active'}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Pied de page + Bouton de suppression rapide */}
        <div className="p-4 border-t border-slate-800 bg-[#0a111f] space-y-3">
          <button 
            onClick={handleModalDelete}
            disabled={isDeleting}
            className="w-full py-2 bg-rose-600/10 hover:bg-rose-600 border border-rose-500/20 text-rose-400 hover:text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Supprimer définitivement ce compte
          </button>
          <p className="text-[10px] text-slate-600 text-center">Espace Numérique de Travail • Polytechnique</p>
        </div>
      </div>
    </>
  );
};

export default UserDetailModal;