import React, { useEffect, useState } from 'react';
import apiClient from '../../../api/client';
import { Briefcase, Send, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

const statusConfig = {
  VALIDE:    { label: 'Validé',      cls: 'bg-emerald-500/10 text-emerald-400', icon: CheckCircle },
  REJETE:    { label: 'Rejeté',      cls: 'bg-rose-500/10 text-rose-400',       icon: XCircle },
  BROUILLON: { label: 'En attente', cls: 'bg-amber-500/10 text-amber-400',     icon: Clock },
};

const EMPTY_FORM = { entreprise: '', poste: '', date_debut: '', date_fin: '', description: '' };

const StageRequest = () => {
  const [demandes, setDemandes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const fetchDemandes = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('stages/mes-demandes/');
      setDemandes(res.data);
    } catch {
      console.error('Erreur chargement demandes de stage');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDemandes(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (new Date(form.date_debut) >= new Date(form.date_fin)) {
      setError('La date de fin doit être après la date de début.');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post('stages/demander/', form);
      setForm(EMPTY_FORM);
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
          <Briefcase className="h-5 w-5 text-emerald-400" /> Demande de Stage
        </h2>
        <p className="text-xs text-slate-400">Soumettez votre demande de convention de stage pour validation par le Chef de Département.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Formulaire */}
        <div className="bg-[#111c30] p-5 rounded-2xl border border-slate-800/60 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white">Nouvelle Demande</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <p className="text-xs text-rose-400 bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Entreprise / Structure d'accueil</label>
              <input
                required name="entreprise" value={form.entreprise} onChange={handleChange}
                placeholder="Ex: Total Energies Cameroun"
                className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Poste / Mission</label>
              <input
                required name="poste" value={form.poste} onChange={handleChange}
                placeholder="Ex: Stagiaire en Génie Civil"
                className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Date de début</label>
                <input
                  required type="date" name="date_debut" value={form.date_debut} onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Date de fin</label>
                <input
                  required type="date" name="date_fin" value={form.date_fin} onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Description (optionnel)</label>
              <textarea
                name="description" value={form.description} onChange={handleChange} rows="3"
                placeholder="Décrivez brièvement les activités prévues..."
                className="w-full px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-600 resize-none"
              />
            </div>

            <button
              type="submit" disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-3.5 w-3.5" /> Soumettre la demande</>}
            </button>
          </form>
        </div>

        {/* Liste des demandes */}
        <div className="lg:col-span-2 bg-[#111c30] rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
          <div className="p-4 bg-[#162238]/30 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Suivi de vos demandes</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {demandes.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">Aucune demande de stage soumise.</p>
            ) : (
              demandes.map((d) => {
                const s = statusConfig[d.statut] || statusConfig.BROUILLON;
                const StatusIcon = s.icon;
                return (
                  <div key={d.id} className="p-4 hover:bg-slate-800/10 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white">{d.entreprise}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${s.cls}`}>
                            <StatusIcon className="h-3 w-3" /> {s.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{d.poste}</p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(d.date_debut).toLocaleDateString('fr-FR')} → {new Date(d.date_fin).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-[10px] text-slate-600">Soumis le {new Date(d.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
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

export default StageRequest;
