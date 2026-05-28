import React, { useEffect, useState } from 'react';
import apiClient from '../../../api/client';
import { FileCheck, Send, Download, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

const statusConfig = {
  VALIDE:    { label: 'Validé',     cls: 'bg-emerald-500/10 text-emerald-400', icon: CheckCircle },
  REJETE:    { label: 'Rejeté',     cls: 'bg-rose-500/10 text-rose-400',       icon: XCircle },
  BROUILLON: { label: 'En attente', cls: 'bg-amber-500/10 text-amber-400',     icon: Clock },
};

const AppuiStageRequest = () => {
  const [demandes, setDemandes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [motif, setMotif] = useState('');
  const [error, setError] = useState('');

  const fetchDemandes = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('appuis-stage/mes-demandes/');
      setDemandes(res.data);
    } catch {
      console.error("Erreur chargement demandes d'appui stage");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDemandes(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!motif.trim()) return;
    setIsSubmitting(true);
    try {
      await apiClient.post('appuis-stage/demander/', { motif });
      setMotif('');
      fetchDemandes();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la soumission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-200">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-emerald-400" /> Lettre d'Appui pour Stage
        </h2>
        <p className="text-xs text-slate-400">
          Demandez une lettre d'appui institutionnelle signée par le Chef de Département pour soutenir votre recherche de stage.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Formulaire */}
        <div className="bg-[#111c30] p-5 rounded-2xl border border-slate-800/60 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white">Nouvelle Demande</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-xs text-rose-400 bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Motif de la demande</label>
              <textarea
                required rows="5" value={motif} onChange={(e) => setMotif(e.target.value)}
                placeholder="Ex: Je sollicite une lettre d'appui du département pour appuyer ma candidature auprès de l'entreprise Total Energies en vue d'un stage de fin d'études en génie pétrolier."
                className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-600 resize-none"
              />
            </div>

            <p className="text-[10px] text-slate-500 italic">
              Votre demande sera examinée par le Chef de Département qui rédigera et signera la lettre d'appui.
            </p>

            <button
              type="submit" disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-3.5 w-3.5" /> Envoyer la demande</>}
            </button>
          </form>
        </div>

        {/* Liste */}
        <div className="lg:col-span-2 bg-[#111c30] rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
          <div className="p-4 bg-[#162238]/30 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Suivi de vos demandes d'appui</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {demandes.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">Aucune demande d'appui soumise.</p>
            ) : (
              demandes.map((d) => {
                const s = statusConfig[d.statut] || statusConfig.BROUILLON;
                const StatusIcon = s.icon;
                return (
                  <div key={d.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-800/10 transition-colors">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white">Lettre d'appui – Stage</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${s.cls}`}>
                          <StatusIcon className="h-3 w-3" /> {s.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{d.motif}</p>
                      <p className="text-[10px] text-slate-600">Soumis le {new Date(d.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>

                    {d.statut === 'VALIDE' && d.fichier_appui ? (
                      <a
                        href={d.fichier_appui} target="_blank" rel="noreferrer"
                        className="shrink-0 p-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl transition-all border border-emerald-500/20 flex items-center gap-1.5 text-xs font-semibold"
                      >
                        <Download className="h-4 w-4" /> Télécharger
                      </a>
                    ) : d.statut === 'VALIDE' ? (
                      <span className="shrink-0 text-xs text-emerald-400 italic">Lettre disponible bientôt</span>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppuiStageRequest;
