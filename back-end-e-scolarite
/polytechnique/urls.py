from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ChefDepartementStatsView, UserViewSet, DepartementViewSet, FiliereViewSet, ClasseViewSet,
    MatiereViewSet, EtudiantProfilViewSet, InscriptionViewSet,
    PaiementViewSet, ExamenViewSet, NoteViewSet, AbsenceViewSet,
    LoginAPIView, LogoutAPIView,
    ChambreViewSet, LogementViewSet, AppuiAdministratifViewSet, PlanningViewSet,
    DemandeStageViewSet, DemandeAppuiStageViewSet
)



# Création du routeur DRF
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'departements', DepartementViewSet, basename='departement')
router.register(r'filieres', FiliereViewSet, basename='filiere')
router.register(r'classes', ClasseViewSet, basename='classe')
router.register(r'matieres', MatiereViewSet, basename='matiere')
router.register(r'etudiants', EtudiantProfilViewSet, basename='etudiant')
router.register(r'inscriptions', InscriptionViewSet, basename='inscription')
router.register(r'paiements', PaiementViewSet, basename='paiement')
router.register(r'examens', ExamenViewSet, basename='examen')
router.register(r'notes', NoteViewSet, basename='note')
router.register(r'absences', AbsenceViewSet, basename='absence')

router.register(r'planning', PlanningViewSet, basename='planning')


router.register(r'chambres', ChambreViewSet, basename='chambres')
router.register(r'logements', LogementViewSet, basename='logements')
router.register(r'appuis', AppuiAdministratifViewSet, basename='appuis')
router.register(r'stages', DemandeStageViewSet, basename='stages')
router.register(r'appuis-stage', DemandeAppuiStageViewSet, basename='appuis-stage')

# Les URLs de l'application sont simplement basées sur le routeur
urlpatterns = [
    path('', include(router.urls)),
    
    path('chef-departement/stats/', ChefDepartementStatsView.as_view(), name='chef-dept-stats'),
    # Endpoints pour l'authentification
    path('auth/login/', LoginAPIView.as_view(), name='login'),
    path('auth/logout/', LogoutAPIView.as_view(), name='logout'),
]