import React, { useEffect, useState } from 'react';
import apiClient from '../../../api/client';
import { FileText, Send, Download, Loader2, HelpCircle, FileCheck } from 'lucide-react';

const DocumentRequest = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [motif, setMotif] = useState('');
  const [typeAppui, setTypeAppui] = useState('STAGE');

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('appuis/mes-demandes/');
      setRequests(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des demandes d'appui", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!motif.trim()) return;
    setIsSubmitting(true);
    try {
      await apiClient.post('appuis/demander/', { type_appui: typeAppui, motif: motif });
      setMotif('');
      fetchRequests();
    } catch (error) {
      alert("Erreur lors de la soumission de la demande.");
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
          <FileText className="h-5 w-5 text-emerald-400" /> Demandes d'Appui Administratif
        </h2>
        <p className="text-xs text-slate-400">Sollicitez des lettres d'appui institutionnelles pour vos démarches externes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Formulaire de demande (1 tiers) */}
        <div className="bg-[#111c30] p-5 rounded-2xl border border-slate-800/60 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white">Nouvelle Demande</h3>
          
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Objectif du document</label>
              <select 
                value={typeAppui} 
                onChange={(e) => setTypeAppui(e.target.value)}
                className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white"
              >
                <option value="STAGE">Appui pour demande de Stage</option>
                <option value="VISA">Lettre d'appui pour Visa Études</option>
                <option value="BOURSE">Demande d'appui pour Bourse</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Détails / Motif explicatif</label>
              <textarea 
                rows="4"
                required
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-600 resize-none"
                placeholder="Ex: Dans le cadre de mon projet de fin d'études, je sollicite un appui pour intégrer l'entreprise X..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-3.5 w-3.5" /> Envoyer la demande</>}
            </button>
          </form>
        </div>

        {/* Historique et téléchargements (2 tiers) */}
        <div className="lg:col-span-2 bg-[#111c30] rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
          <div className="p-4 bg-[#162238]/30 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Suivi de vos demandes</h3>
          </div>

          <div className="divide-y divide-slate-800">
            {requests.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">Aucune demande d'appui effectuée pour le moment.</p>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-800/10 transition-colors">
                  <div className="space-y-1 max-w-[70%]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">Appui {req.type_appui}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        req.statut === 'VALIDE' ? 'bg-emerald-500/10 text-emerald-400' :
                        req.statut === 'REJETE' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {req.statut}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{req.motif}</p>
                    <p className="text-[10px] text-slate-600">Soumis le : {new Date(req.created_at).toLocaleDateString()}</p>
                  </div>

                  {/* Bouton de téléchargement disponible uniquement si validé par l'admin */}
                  {req.statut === 'VALIDE' && req.fichier_appui ? (
                    <a 
                      href={req.fichier_appui} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl transition-all border border-emerald-500/20 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    >
                      <Download className="h-4 w-4" /> Télécharger
                    </a>
                  ) : (
                    <span className="text-xs text-slate-600 font-medium italic flex items-center gap-1">
                      <HelpCircle className="h-3.5 w-3.5" /> En cours d'analyse
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentRequest;