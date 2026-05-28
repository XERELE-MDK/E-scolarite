# E-Scolarité — École Nationale Polytechnique

Plateforme numérique de gestion académique et de services étudiants développée pour l'École Nationale Polytechnique. Elle couvre la gestion des inscriptions, des notes, des absences, des emplois du temps, du logement et des services liés aux stages.

---

## Architecture globale

```
GL_project/
├── back-end-e-scolarite/   → API REST (Django)
└── front-end-e-scolarite/  → Interface web (React + Vite)
```

---

## Back-end

### Stack technique

| Élément            | Technologie                          |
|--------------------|--------------------------------------|
| Framework          | Django 6.0.5                         |
| API                | Django REST Framework 3.17.1         |
| Authentification   | JWT via djangorestframework-simplejwt 5.3.1 |
| Base de données    | MySQL (mysqlclient 2.2.4)            |
| CORS               | django-cors-headers 4.3.1            |
| Filtres            | django-filter 24.1                   |
| Images / Fichiers  | Pillow 12.2.0                        |
| Config d'env       | python-decouple 3.8                  |

### Modèles principaux

**Utilisateurs & rôles**
- `User` — modèle personnalisé (`AbstractUser`) avec rôles : `ADMIN`, `CHEF_DEP`, `ENSEIGNANT`, `ETUDIANT`

**Structure académique**
- `Departement` → `Filiere` → `Classe` → `Matiere`

**Étudiants & finance**
- `EtudiantProfil` — profil lié à un `User`, génère automatiquement un matricule
- `Inscription` — inscription d'un étudiant à une classe avec statut et montant
- `Paiement` — versements associés à une inscription

**Évaluation**
- `Examen` — examen lié à une matière avec publication optionnelle
- `Note` — note d'un étudiant à un examen (0–20), validée par l'enseignant
- `Absence` — absence à une matière, justifiée ou non

**Logement**
- `Chambre` — chambre de résidence avec code, pavillon et nombre d'occupants
- `DemandeLogement` — demande d'attribution de chambre

**Emploi du temps**
- `EmploiDuTemps` — créneaux (matière, enseignant, jour, heure, salle)

**Services Étudiant — Stages** *(nouveauté)*
- `DemandeStage` — demande de convention de stage (entreprise, poste, dates, description, statut)
- `DemandeAppuiStage` — demande de lettre d'appui institutionnelle pour stage

**Appui administratif**
- `DemandeAppui` — demande d'appui générique (STAGE / VISA / BOURSE)

### Endpoints API principaux

Base URL : `http://127.0.0.1:8000/api/`

| Ressource              | URL                          | Rôles concernés               |
|------------------------|------------------------------|-------------------------------|
| Authentification       | `auth/login/`, `auth/logout/`| Tous                          |
| Utilisateurs           | `users/`                     | ADMIN                         |
| Départements           | `departements/`              | ADMIN, CHEF_DEP               |
| Filières               | `filieres/`                  | ADMIN, CHEF_DEP               |
| Classes                | `classes/`                   | ADMIN, CHEF_DEP               |
| Matières               | `matieres/`                  | ADMIN, CHEF_DEP, ENSEIGNANT   |
| Étudiants              | `etudiants/`                 | ADMIN, CHEF_DEP               |
| Inscriptions           | `inscriptions/`              | ADMIN                         |
| Paiements              | `paiements/`                 | ADMIN                         |
| Examens                | `examens/`                   | ENSEIGNANT                    |
| Notes                  | `notes/`                     | ENSEIGNANT                    |
| Absences               | `absences/`                  | ENSEIGNANT                    |
| Planning               | `planning/`                  | ADMIN, CHEF_DEP               |
| Chambres               | `chambres/`                  | ADMIN                         |
| Logements              | `logements/`                 | ADMIN, ETUDIANT               |
| Appui administratif    | `appuis/`                    | ADMIN, ETUDIANT               |
| **Demandes de stage**  | `stages/`                    | CHEF_DEP, ETUDIANT            |
| **Appui de stage**     | `appuis-stage/`              | CHEF_DEP, ETUDIANT            |
| Stats Chef Dépt        | `chef-departement/stats/`    | CHEF_DEP                      |

Actions personnalisées sur `stages/` et `appuis-stage/` :

| Action                         | Méthode | URL                             | Rôle        |
|-------------------------------|---------|----------------------------------|-------------|
| Soumettre une demande          | POST    | `stages/demander/`              | ETUDIANT    |
| Mes demandes                   | GET     | `stages/mes-demandes/`          | ETUDIANT    |
| Toutes les demandes            | GET     | `stages/toutes-les-demandes/`   | CHEF_DEP    |
| Valider / Rejeter              | POST    | `stages/{id}/decider/`          | CHEF_DEP    |

---

## Front-end

### Stack technique

| Élément            | Technologie                    |
|--------------------|-------------------------------|
| Framework          | React 19 + Vite 8             |
| Styles             | Tailwind CSS v4               |
| Routing            | React Router DOM v7           |
| État global        | Zustand 5 (persisté localStorage) |
| Requêtes HTTP      | Axios 1.x (intercepteur JWT)  |
| Icônes             | Lucide React                  |

### Rôles et espaces

| Rôle       | Espace                         | URL de base              |
|------------|-------------------------------|--------------------------|
| ADMIN      | Gestion globale                | `/admin/`                |
| CHEF_DEP   | Gestion du département         | `/chef-departement/`     |
| ENSEIGNANT | Cours, notes, absences         | `/enseignant/`           |
| ETUDIANT   | Services & suivi personnel     | `/etudiant/`             |

### Pages par rôle

**ADMIN**
- Tableau de bord, Gestion utilisateurs, Départements, Inscriptions, Attribution logement, Planning

**CHEF DE DÉPARTEMENT**
- Tableau de bord (stats), Gestion étudiants, Affectation enseignants, Emploi du temps, Filières & Classes
- **Gestion des Stages** *(nouveau)* — validation/rejet des demandes de stage et d'appui, génération de lettres PDF

**ENSEIGNANT**
- Tableau de bord, Emploi du temps

**ÉTUDIANT**
- Tableau de bord, Demande logement, Emploi du temps, Appui administratif
- **Demande de Stage** *(nouveau)* — formulaire de convention de stage
- **Appui pour Stage** *(nouveau)* — demande de lettre d'appui institutionnelle

### Génération PDF

Les lettres officielles sont générées côté navigateur sans dépendance externe :

- **Lettre d'appui de stage** — lettre formelle signée par le Chef de Département
- **Attestation de stage** — attestation avec entreprise, poste et dates

Le fichier `src/utils/pdfGenerator.js` ouvre une nouvelle fenêtre HTML formatée et appelle `window.print()`. L'utilisateur enregistre en PDF via la boîte de dialogue d'impression du navigateur.

---

## Installation & lancement

### Prérequis
- Python 3.12+, pip
- Node.js 20+, npm
- MySQL (base de données configurée)

### Back-end

```bash
cd back-end-e-scolarite
pip install -r requirements.txt
# Créer un fichier .env avec SECRET_KEY et paramètres DB
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Front-end

```bash
cd front-end-e-scolarite
npm install
npm run dev
```

L'interface est accessible sur `http://localhost:5173` et se connecte à l'API sur `http://127.0.0.1:8000/api/`.

---

## Derniers changements (session Claude)

### Corrections backend

| Problème                              | Correction apportée                                                  |
|---------------------------------------|----------------------------------------------------------------------|
| `requirements.txt` incomplet          | Ajout de `simplejwt`, `django-cors-headers`, `django-filter`, `mysqlclient` |
| `CorsMiddleware` mal positionné       | Déplacé en 2e position dans `MIDDLEWARE` (avant `CommonMiddleware`) |
| `MEDIA_URL` / `MEDIA_ROOT` absents   | Ajoutés dans `settings.py`                                           |
| `SECRET_KEY` codée en dur             | Externalisée via `python-decouple`                                   |
| `import uuid` inutilisé              | Supprimé de `EtudiantProfil.save()`                                  |
| `serializers.py` : imports dupliqués  | Fichier réécrit — bloc d'import unique et propre                     |
| Import circulaire dans serializers    | `from .serializers import EtudiantProfilSerializer` supprimé         |
| `PlanningViewSet` dupliqué 6 fois     | `views.py` entièrement réécrit (~700 lignes propres)                 |

### Nouveaux modèles

```
polytechnique/migrations/0006_demandeappuistage_demandestage.py
```

- `DemandeStage` — convention de stage avec entreprise, poste, dates, validation `full_clean()`
- `DemandeAppuiStage` — demande de lettre d'appui avec motif et fichier généré

### Nouveaux fichiers frontend

| Fichier                                                  | Rôle                                            |
|----------------------------------------------------------|-------------------------------------------------|
| `src/utils/pdfGenerator.js`                              | Génération PDF via impression navigateur        |
| `src/pages/Student/Service/StageRequest.jsx`             | Formulaire + suivi des demandes de stage        |
| `src/pages/Student/Service/AppuiStageRequest.jsx`        | Demande de lettre d'appui + téléchargement      |
| `src/pages/ChefDepartement/StageManagement.jsx`          | Interface chef : validation + génération PDF    |

### Fichiers frontend modifiés

| Fichier                              | Modification                                                        |
|--------------------------------------|---------------------------------------------------------------------|
| `src/App.jsx`                        | 3 nouvelles routes (stage, appui-stage, gestion stages)             |
| `src/layouts/DashboardLayout.jsx`    | 2 entrées sidebar étudiant + 1 entrée sidebar chef de département   |

---

## Règles métier importantes

- Seul le **Chef de Département** peut valider/rejeter les demandes de stage et générer les lettres officielles.
- Les lettres d'appui sont générées à la demande depuis l'interface du chef (pas stockées côté serveur dans cette version).
- Le matricule étudiant est généré automatiquement à la création du profil et est en lecture seule.
- Une note doit être comprise entre 0 et 20.
- La date de fin de stage doit être strictement postérieure à la date de début (validation côté modèle et sérialiseur).
