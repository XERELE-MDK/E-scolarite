import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import UsersManagement from './pages/Admin/UsersManagement';
import AdminDashboard from './pages/Admin/Dashboard';
import InscriptionsManagement from './pages/Admin/InscriptionsManagement';
import HousingRequest from './pages/Student/Service/HousingRequest';
import DocumentRequest from './pages/Student/Service/DocumentRequest';
import HousingValidation from './pages/Admin/HousingValidation';
import DepartementsManagement from './pages/Admin/DepartementsManagement';
import StructuresManagement from './pages/ChefDepartement/StructuresManagement';
import ModulesManagement from './pages/ChefDepartement/ModulesManagement';
import TeachersManagement from './pages/ChefDepartement/TeachersManagement';
import StudentSchedule from './pages/Student/Service/StudentSchedule';
import ScheduleManagement from './pages/ChefDepartement/ScheduleManagement';
import TeacherSchedule from './pages/Teacher/TeacherSchedule';
import ChefDashboard from './pages/ChefDepartement/ChefDashboard';
import StageRequest from './pages/Student/Service/StageRequest';
import AppuiStageRequest from './pages/Student/Service/AppuiStageRequest';
import StageManagement from './pages/ChefDepartement/StageManagement';

const TeacherDashboard = () => (
  <div className="bg-[#111c30] p-6 rounded-2xl border border-slate-800/60 shadow-xl">
    <h1 className="text-xl font-bold text-white mb-2">Espace Enseignant</h1>
    <p className="text-slate-400 text-sm">Bienvenue sur votre espace de gestion des cours.</p>
  </div>
);

const StudentDashboard = () => (
  <div className="bg-[#111c30] p-6 rounded-2xl border border-slate-800/60 shadow-xl">
    <h1 className="text-xl font-bold text-white mb-2">Espace Étudiant</h1>
    <p className="text-slate-400 text-sm">Bienvenue sur votre espace numérique de travail.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Route Publique */}
        <Route path="/login" element={<Login />} />

        {/* 1. Routes réservées à l'ADMINISTRATEUR */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UsersManagement />} />
            <Route path="/admin/departements" element={<DepartementsManagement />} />
            <Route path="/admin/inscriptions" element={<InscriptionsManagement />} />
            <Route path="/admin/logements" element={<HousingValidation />} />
            <Route path="/admin/paiements" element={<div className="text-white">Paiements & Reçus</div>} />
            <Route path="/admin/schedules" element={<ScheduleManagement />} />
          </Route>
        </Route>

        {/* 2. Routes réservées au CHEF DE DÉPARTEMENT (Nettoyées et Fixées) */}
        <Route element={<ProtectedRoute allowedRoles={['CHEF_DEP']} />}>
          <Route element={<DashboardLayout />}>
            {/* 📊 LA PAGE PAR DÉFAUT EST BIEN LE DASHBOARD DE STATS MAINTENANT */}
            <Route path="/chef-departement/dashboard" element={<ChefDashboard />} />
            <Route path="/chef-departement/students" element={<UsersManagement />} /> 
            <Route path="/chef-departement/teachers" element={<TeachersManagement />} />
            <Route path="/chef-departement/matieres" element={<ModulesManagement />} />
            <Route path="/chef-departement/schedules" element={<ScheduleManagement />} />
            <Route path="/chef-departement/structures" element={<StructuresManagement />} />
            <Route path="/chef-departement/stages" element={<StageManagement />} />
          </Route>
        </Route>

        {/* 3. Routes réservées aux ENSEIGNANTS */}
        <Route element={<ProtectedRoute allowedRoles={['ENSEIGNANT']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/enseignant/dashboard" element={<TeacherDashboard />} />
            <Route path="/enseignant/emploi-du-temps" element={<TeacherSchedule />} />
              <Route path="/enseignant/planning" element={<TeacherSchedule />} />  
          </Route>
        </Route>

        {/* 4. Routes réservées aux ÉTUDIANTS */}
        <Route element={<ProtectedRoute allowedRoles={['ETUDIANT']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/etudiant/dashboard" element={<StudentDashboard />} />
            <Route path="/etudiant/services/logement" element={<HousingRequest />} />
            <Route path="/etudiant/services/appui" element={<DocumentRequest />} />
            <Route path="/etudiant/services/stage" element={<StageRequest />} />
            <Route path="/etudiant/services/appui-stage" element={<AppuiStageRequest />} />
            <Route path="/etudiant/emploi-du-temps" element={<StudentSchedule />} />
          </Route>
        </Route>

        {/* Redirection sécurité */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;