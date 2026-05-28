import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { useAuthStore } from '../../context/authStore';
import { generateLettreAppuiStage, generateAttestationStage } from '../../utils/pdfGenerator';
import { Briefcase, FileCheck, Loader2, CheckCircle, XCircle, Clock, Printer } from 'lucide-react';

const statusConfig = {
  VALIDE:    { label: 'Validé',     cls: 'bg-emerald-500/10 text-emerald-400', icon: CheckCircle },
  REJETE:    { label: 'Rejeté',     cls: 'bg-rose-500/10 text-rose-400',       icon: XCircle },
  BROUILLON: { label: 'En attente', cls: 'bg-amber-500/10 text-amber-400',     icon: Clock },
};

const TABS = [
  { id: 'stages',  label: 'Demandes de Stage',         icon: Briefcase },
  { id: 'appuis',  label: "Demandes d'Appui de Stage", icon: FileCheck },
];

const StageManagement = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('stages');
  const [stages, setStages] = useState([]);
  const [appuis, setAppuis] = useState([]);
  const [deptName, setDeptName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const chefName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username : '';

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      const [stagesRes, appuisRes, statsRes] = await Promise.all([
        apiClient.get('stages/toutes-les-demandes/'),
        apiClient.get('appuis-stage/toutes-les-demandes/'),
        apiClient.get('chef-departement/stats/'),
      ]);
      setStages(stagesRes.data);
      setAppuis(appuisRes.data);
      setDeptName(statsRes.data.departement_nom || '');
    } catch (err) {
      console.error('Erreur chargement données stages', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const decideStage = async (id, statut) => {
    setProcessingId(id);
    try {
      await apiClient.post(`stages/${id}/decider/`, { statut });
      setStages((prev) => prev.map((s) => s.id === id ? { ...s, statut } : s));
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors de la décision.');
    } finally {
      setProcessingId(null);
    }
  };

  const decideAppui = async (id, statut) => {
    setProcessingId(id);
    try {
      await apiClient.post(`appuis-stage/${id}/decider/`, { statut });
      setAppuis((prev) => prev.map((a) => a.id === id ? { ...a, statut } : a));
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors de la décision.');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-200">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-purple-400" /> Gestion des Stages
        </h2>
        <p className="text-xs text-slate-400">Validez les demandes et générez les lettres officielles du département.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111c30] p-1 rounded-xl border border-slate-800/60 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Demandes de Stage */}
      {activeTab === 'stages' && (
        <div className="bg-[#111c30] rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
          <div className="p-4 bg-[#162238]/30 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Conventions de Stage ({stages.length})</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {stages.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">Aucune demande de stage reçue.</p>
            ) : (
              stages.map((d) => {
                const s = statusConfig[d.statut] || statusConfig.BROUILLON;
                const StatusIcon = s.icon;
                const isProcessing = processingId === d.id;
                return (
                  <div key={d.id} className="p-4 hover:bg-slate-800/10 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white">
                            {d.etudiant_details?.prenom} {d.etudiant_details?.nom}
                          </span>
                          <span className="text-[10px] text-slate-500">#{d.etudiant_details?.matricule}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${s.cls}`}>
                            <StatusIcon className="h-3 w-3" /> {s.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          <span className="text-slate-500">Entreprise :</span> {d.entreprise}
                          <span className="mx-2 text-slate-700">|</span>
                          <span className="text-slate-500">Poste :</span> {d.poste}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(d.date_debut).toLocaleDateString('fr-FR')} → {new Date(d.date_fin).toLocaleDateString('fr-FR')}
                        </p>
                        {d.description && (
                          <p className="text-[10px] text-slate-500 italic line-clamp-1">{d.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        {d.statut === 'BROUILLON' && (
                          <>
                            <button
                              onClick={() => decideStage(d.id, 'VALIDE')} disabled={isProcessing}
                              className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-xs font-medium transition-all border border-emerald-500/20 flex items-center gap-1 cursor-pointer"
                            >
                              {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />} Valider
                            </button>
                            <button
                              onClick={() => decideStage(d.id, 'REJETE')} disabled={isProcessing}
                              className="px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-xs font-medium transition-all border border-rose-500/20 flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="h-3 w-3" /> Rejeter
                            </button>
                          </>
                        )}
                        {d.statut === 'VALIDE' && (
                          <button
                            onClick={() => generateAttestationStage({ demande: d, chefName, deptName })}
                            className="px-3 py-1.5 bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white rounded-lg text-xs font-medium transition-all border border-purple-500/20 flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="h-3 w-3" /> Attestation PDF
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Demandes d'Appui de Stage */}
      {activeTab === 'appuis' && (
        <div className="bg-[#111c30] rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
          <div className="p-4 bg-[#162238]/30 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Lettres d'Appui pour Stage ({appuis.length})</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {appuis.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">Aucune demande d'appui reçue.</p>
            ) : (
              appuis.map((d) => {
                const s = statusConfig[d.statut] || statusConfig.BROUILLON;
                const StatusIcon = s.icon;
                const isProcessing = processingId === d.id;
                return (
                  <div key={d.id} className="p-4 hover:bg-slate-800/10 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white">
                            {d.etudiant_details?.prenom} {d.etudiant_details?.nom}
                          </span>
                          <span className="text-[10px] text-slate-500">#{d.etudiant_details?.matricule}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${s.cls}`}>
                            <StatusIcon className="h-3 w-3" /> {s.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">{d.motif}</p>
                        <p className="text-[10px] text-slate-600">Soumis le {new Date(d.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        {d.statut === 'BROUILLON' && (
                          <>
                            <button
                              onClick={() => decideAppui(d.id, 'VALIDE')} disabled={isProcessing}
                              className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-xs font-medium transition-all border border-emerald-500/20 flex items-center gap-1 cursor-pointer"
                            >
                              {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />} Valider
                            </button>
                            <button
                              onClick={() => decideAppui(d.id, 'REJETE')} disabled={isProcessing}
                              className="px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-xs font-medium transition-all border border-rose-500/20 flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="h-3 w-3" /> Rejeter
                            </button>
                          </>
                        )}
                        {d.statut === 'VALIDE' && (
                          <button
                            onClick={() => generateLettreAppuiStage({ demande: d, chefName, deptName })}
                            className="px-3 py-1.5 bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white rounded-lg text-xs font-medium transition-all border border-purple-500/20 flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="h-3 w-3" /> Lettre PDF
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StageManagement;
