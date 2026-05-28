import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import {
  GraduationCap, LayoutDashboard, Users, UserCheck,
  BookOpen, FileSpreadsheet, Calendar, CalendarX,
  CreditCard, LogOut, Menu, X, ShieldAlert, Award, BookOpenCheck,
  Home, FileText, FolderPlus, Briefcase, FileCheck
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuConfig = {
    ADMIN: [
      { label: 'Tableau de bord', path: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Gestion Utilisateurs', path: '/admin/users', icon: Users },
      { label: 'Départements', path: '/admin/departements', icon: FolderPlus },
      { label: 'Inscriptions', path: '/admin/inscriptions', icon: UserCheck },
      { label: 'Attribution Logement', path: '/admin/logements', icon: Home },
      { label: 'Paiements & Reçus', path: '/admin/paiements', icon: CreditCard },
    ],
    CHEF_DEP: [
      { label: 'Supervision Modules', path: '/chef-departement/dashboard', icon: LayoutDashboard },
      { label: 'Gestion Étudiants', path: '/chef-departement/students', icon: Users },
      { label: 'Affect Enseignants', path: '/chef-departement/matieres', icon: FileSpreadsheet },
      { label: 'Emploi du Temps', path: '/chef-departement/schedules', icon: Calendar },
      { label: 'Filières & Classes', path: '/chef-departement/structures', icon: BookOpen },
      { label: 'Gestion des Stages', path: '/chef-departement/stages', icon: Briefcase },
    ],
    ENSEIGNANT: [
      { label: 'Tableau de bord', path: '/enseignant/dashboard', icon: LayoutDashboard },
     { label: 'Mon Emploi du Temps', path: '/enseignant/emploi-du-temps', icon: Calendar },
      { label: 'Saisie des Notes', path: '/enseignant/notes', icon: Award },
      { label: 'Suivi des Absences', path: '/enseignant/absences', icon: CalendarX },
      
    ],
    ETUDIANT: [
      { label: 'Mon Espace', path: '/etudiant/dashboard', icon: LayoutDashboard },
      { label: 'Demande Logement', path: '/etudiant/services/logement', icon: Home },
      { label: 'Mon Emploi du Temps', path: '/etudiant/emploi-du-temps', icon: Calendar },
      { label: 'Appui Administratif', path: '/etudiant/services/appui', icon: FileText },
      { label: 'Demande de Stage', path: '/etudiant/services/stage', icon: Briefcase },
      { label: 'Appui pour Stage', path: '/etudiant/services/appui-stage', icon: FileCheck },
      { label: 'Dossier Académique', path: '/etudiant/notes', icon: BookOpenCheck },
      { label: 'Suivi des Absences', path: '/etudiant/absences', icon: Calendar },
    ],
  };

  const roleStyles = {
    ADMIN: { bg: 'bg-rose-600', text: 'text-rose-400', badgeBg: 'bg-rose-600/10', badgeBorder: 'border-rose-400/20', label: 'Super Admin', icon: ShieldAlert },
    CHEF_DEP: { bg: 'bg-purple-600', text: 'text-purple-400', badgeBg: 'bg-purple-600/10', badgeBorder: 'border-purple-400/20', label: 'Chef Dépt', icon: Award },
    ENSEIGNANT: { bg: 'bg-blue-600', text: 'text-blue-400', badgeBg: 'bg-blue-500/10', badgeBorder: 'border-blue-500/20', label: 'Enseignant', icon: BookOpen },
    ETUDIANT: { bg: 'bg-emerald-600', text: 'text-emerald-400', badgeBg: 'bg-emerald-500/10', badgeBorder: 'border-emerald-500/20', label: 'Étudiant', icon: GraduationCap },
  };

  const currentRoleStyle = roleStyles[user?.role] || { bg: 'bg-indigo-600', text: 'text-indigo-400', badgeBg: 'bg-indigo-500/10', badgeBorder: 'border-indigo-500/20', label: 'Utilisateur', icon: GraduationCap };
  const RoleIcon = currentRoleStyle.icon;
  const currentMenu = menuConfig[user?.role] || [];

  return (
    <div className="min-h-screen w-full bg-[#0d1424] flex font-sans text-slate-100 overflow-x-hidden">
      
      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-[#111c30] border-r border-slate-800/60 text-slate-300 
        transition-transform duration-300 flex flex-col justify-between
        lg:static lg:translate-x-0 h-screen shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        <div className="p-5 overflow-y-auto flex-1">
          {/* Logo Institutionnel */}
          <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-6">
            <div className={`p-2.5 ${currentRoleStyle.bg} rounded-xl text-white shadow-lg`}>
              <RoleIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-white font-bold tracking-wide uppercase text-sm">Polytechnique</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${currentRoleStyle.badgeBg} ${currentRoleStyle.text} border ${currentRoleStyle.badgeBorder} inline-block mt-0.5`}>
                {currentRoleStyle.label}
              </span>
            </div>
          </div>

          {/* Liens du Menu */}
          <nav className="space-y-1.5">
            {currentMenu.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive 
                      ? `${currentRoleStyle.bg} text-white shadow-lg shadow-black/20` 
                      : 'hover:bg-slate-800/40 hover:text-white text-slate-400'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Section Utilisateur & Déconnexion */}
        <div className="p-4 border-t border-slate-800/80 bg-[#0a111f] shrink-0">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold uppercase text-sm shrink-0">
              {user?.nom_complet ? user.nom_complet[0] : (user?.username ? user.username[0] : 'U')}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.nom_complet || user?.username || 'Utilisateur'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email || 'polytechnique-user'}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-left align-middle"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ZONE DE CONTENU PRINCIPALE */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* TOPBAR */}
        <header className="h-16 bg-[#111c30] border-b border-slate-800/60 px-6 flex items-center justify-between sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg lg:hidden"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="text-slate-400 text-sm font-medium hidden sm:inline-block">
              Espace Numérique de Travail
            </span>
          </div>
          
          <div className="text-xs text-slate-400 bg-[#0d1424] border border-slate-800/80 px-3 py-1.5 rounded-full font-medium">
            Année : 2025-2026
          </div>
        </header>

        {/* CONTENU ASSIGNÉ */}
        <main className="p-6 flex-1 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Overlay Mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-20 lg:hidden"
        />
      )}
    </div>
  );
};

export default DashboardLayout;