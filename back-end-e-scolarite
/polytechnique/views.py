from django.db import transaction
from django.core.exceptions import ValidationError
from django.contrib.auth import authenticate

from rest_framework import viewsets, status, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend

from .permissions import IsAdminUser, IsEnseignant
from .models import (
    User, Departement, Filiere, Classe, Matiere,
    EtudiantProfil, Inscription, Paiement, Examen, Note, Absence,
    EmploiDuTemps, Chambre, DemandeLogement, DemandeAppui,
    DemandeStage, DemandeAppuiStage
)
from .serializers import (
    UserSerializer, DepartementSerializer, FiliereSerializer,
    ClasseSerializer, MatiereSerializer, EtudiantProfilSerializer,
    InscriptionSerializer, PaiementSerializer, ExamenSerializer,
    NoteSerializer, AbsenceSerializer, EmploiDuTempsSerializer,
    ChambreSerializer, DemandeLogementSerializer, DemandeAppuiSerializer,
    DemandeStageSerializer, DemandeAppuiStageSerializer
)

# ==============================================================================
# 1. GESTION DES UTILISATEURS
# ==============================================================================

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['role']
    search_fields = ['username', 'email', 'first_name', 'last_name']

    def get_queryset(self):
        user = self.request.user

        if user.role == 'ADMIN':
            return User.objects.all().order_by('-id')

        elif user.role == 'CHEF_DEP':
            dept_chef = getattr(user, 'departement_dirige', None)
            if dept_chef:
                role_filter = self.request.query_params.get('role', None)
                if role_filter:
                    return User.objects.filter(role=role_filter, departement=dept_chef).order_by('-id')
                return User.objects.filter(departement=dept_chef).exclude(role='ADMIN').order_by('-id')
            return User.objects.none()

        return User.objects.none()

    def create(self, request, *args, **kwargs):
        creator = request.user
        data = request.data.copy()

        if creator.is_authenticated and creator.role == 'CHEF_DEP':
            dept_chef = getattr(creator, 'departement_dirige', None)
            data['departement'] = dept_chef.id if dept_chef else None
            role_cible = data.get('role', 'ETUDIANT')
            if role_cible == 'ENSEIGNANT':
                data['role'] = 'ENSEIGNANT'
                self.classe_id_temp = None
            elif role_cible == 'ETUDIANT':
                data['role'] = 'ETUDIANT'
                self.classe_id_temp = data.get('classe')
            else:
                return Response(
                    {"error": "Un Chef de Département ne peut créer que des Enseignants ou des Étudiants."},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif data.get('role') == 'ETUDIANT':
            self.classe_id_temp = data.get('classe')
        else:
            self.classe_id_temp = None

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        user = serializer.save()
        user.refresh_from_db()
        if user.role == 'ETUDIANT':
            classe_assignee = None
            classe_id = getattr(self, 'classe_id_temp', None)
            if classe_id:
                try:
                    classe_assignee = Classe.objects.get(id=classe_id)
                except (Classe.DoesNotExist, ValueError):
                    pass
            EtudiantProfil.objects.get_or_create(
                user=user,
                defaults={'classe_actuelle': classe_assignee, 'date_naissance': None}
            )

    def destroy(self, request, *args, **kwargs):
        user_to_delete = self.get_object()
        requesting_user = request.user

        if requesting_user.role == 'ADMIN':
            return super().destroy(request, *args, **kwargs)

        elif requesting_user.role == 'CHEF_DEP':
            if user_to_delete.role in ['ADMIN', 'CHEF_DEP']:
                return Response(
                    {"error": "Interdit. Vous ne pouvez pas supprimer un administrateur ou un autre chef."},
                    status=status.HTTP_403_FORBIDDEN
                )
            dept_chef = getattr(requesting_user, 'departement_dirige', None)
            if dept_chef and user_to_delete.departement == dept_chef:
                return super().destroy(request, *args, **kwargs)
            return Response(
                {"error": "Interdit. Cet utilisateur n'appartient pas à votre département."},
                status=status.HTTP_403_FORBIDDEN
            )

        return Response({"error": "Action interdite. Droits insuffisants."}, status=status.HTTP_403_FORBIDDEN)


# ==============================================================================
# 2. STRUCTURE ACADÉMIQUE
# ==============================================================================

class DepartementViewSet(viewsets.ModelViewSet):
    queryset = Departement.objects.all().order_by('nom')
    serializer_class = DepartementSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        chef_id = request.data.get('chef')
        with transaction.atomic():
            if chef_id:
                try:
                    user_to_promote = User.objects.get(id=chef_id)
                    if user_to_promote.role != 'CHEF_DEP':
                        user_to_promote.role = 'CHEF_DEP'
                        user_to_promote.save()
                except User.DoesNotExist:
                    return Response(
                        {"error": "L'utilisateur sélectionné pour être chef n'existe pas."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class FiliereViewSet(viewsets.ModelViewSet):
    serializer_class = FiliereSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['departement']

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == 'CHEF_DEP':
            if hasattr(user, 'departement_dirige') and user.departement_dirige:
                return Filiere.objects.filter(departement=user.departement_dirige).order_by('nom')
            return Filiere.objects.none()
        return Filiere.objects.all().order_by('nom')

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_authenticated and user.role == 'CHEF_DEP':
            if hasattr(user, 'departement_dirige') and user.departement_dirige:
                serializer.save(departement=user.departement_dirige)
            else:
                raise ValidationError("Création refusée : Aucun département n'est rattaché à votre compte.")
        else:
            serializer.save()


class ClasseViewSet(viewsets.ModelViewSet):
    serializer_class = ClasseSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == 'CHEF_DEP':
            if hasattr(user, 'departement_dirige') and user.departement_dirige:
                return Classe.objects.filter(filiere__departement=user.departement_dirige).order_by('nom')
            return Classe.objects.none()
        return Classe.objects.all().order_by('nom')

    def create(self, request, *args, **kwargs):
        user = self.request.user
        if user.is_authenticated and user.role == 'CHEF_DEP':
            dept = getattr(user, 'departement_dirige', None)
            if not dept:
                return Response({"error": "Vous ne dirigez aucun département actif."}, status=status.HTTP_400_BAD_REQUEST)
            filiere_auto, _ = Filiere.objects.get_or_create(
                nom=dept.nom, departement=dept, defaults={'code': dept.code}
            )
            data = request.data.copy()
            data['filiere'] = filiere_auto.id
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return super().create(request, *args, **kwargs)


class MatiereViewSet(viewsets.ModelViewSet):
    serializer_class = MatiereSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Matiere.objects.all().order_by('nom')


# ==============================================================================
# 3. PROFILS ÉTUDIANTS
# ==============================================================================

class EtudiantProfilViewSet(viewsets.ModelViewSet):
    queryset = EtudiantProfil.objects.all()
    serializer_class = EtudiantProfilSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['classe_actuelle']
    search_fields = ['matricule', 'user__last_name', 'user__first_name']

    @action(detail=True, methods=['get'], url_path='dossier-academique')
    def dossier_academique(self, request, pk=None):
        etudiant = self.get_object()
        notes = Note.objects.filter(etudiant=etudiant, valide_par_enseignant=True)

        total_points = 0
        total_coefficients = 0
        notes_detail = []

        for note in notes:
            coef = note.examen.matiere.coefficient
            total_points += float(note.valeur) * coef
            total_coefficients += coef
            notes_detail.append({
                'matiere': note.examen.matiere.nom,
                'examen': note.examen.nom,
                'note': note.valeur,
                'coefficient': coef
            })

        moyenne_generale = (total_points / total_coefficients) if total_coefficients > 0 else 0

        return Response({
            'etudiant': f"{etudiant.user.first_name} {etudiant.user.last_name}",
            'matricule': etudiant.matricule,
            'classe': etudiant.classe_actuelle.nom if etudiant.classe_actuelle else "Aucune",
            'moyenne_generale': round(moyenne_generale, 2),
            'details_evaluations': notes_detail
        }, status=status.HTTP_200_OK)


# ==============================================================================
# 4. INSCRIPTIONS & FINANCES
# ==============================================================================

class InscriptionViewSet(viewsets.ModelViewSet):
    queryset = Inscription.objects.all().order_by('-date_inscription')
    serializer_class = InscriptionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['statut', 'classe']

    @action(detail=True, methods=['post'], url_path='valider')
    def valider_inscription(self, request, pk=None):
        inscription = self.get_object()

        if inscription.statut == 'VALIDE':
            return Response({"error": "Cette inscription a déjà été validée."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                inscription.statut = 'VALIDE'
                inscription.save()
                etudiant = inscription.etudiant
                etudiant.classe_actuelle = inscription.classe
                etudiant.save()
        except Exception as e:
            return Response(
                {"error": f"Une erreur est survenue lors de la validation : {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            'message': 'Inscription validée avec succès.',
            'etudiant': f"{etudiant.user.first_name} {etudiant.user.last_name}",
            'classe_assignee': inscription.classe.nom
        }, status=status.HTTP_200_OK)


class PaiementViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.all()
    serializer_class = PaiementSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]


# ==============================================================================
# 5. EXAMENS & NOTES
# ==============================================================================

class ExamenViewSet(viewsets.ModelViewSet):
    queryset = Examen.objects.all()
    serializer_class = ExamenSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['matiere', 'est_publie']


class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsEnseignant]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['etudiant', 'examen', 'valide_par_enseignant']

    @action(detail=False, methods=['post'], url_path='valider-notes-examen')
    def valider_notes_examen(self, request):
        examen_id = request.data.get('examen_id')
        if not examen_id:
            return Response({'error': 'Le paramètre examen_id est requis.'}, status=status.HTTP_400_BAD_REQUEST)
        notes_modifiees = Note.objects.filter(examen_id=examen_id).update(valide_par_enseignant=True)
        return Response({'message': f'{notes_modifiees} notes ont été validées pour cet examen.'}, status=status.HTTP_200_OK)


# ==============================================================================
# 6. SUIVI DES ABSENCES
# ==============================================================================

class AbsenceViewSet(viewsets.ModelViewSet):
    queryset = Absence.objects.all().order_by('-date_absence')
    serializer_class = AbsenceSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['etudiant', 'matiere', 'est_justifiee']


# ==============================================================================
# 7. AUTHENTIFICATION
# ==============================================================================

class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username_or_email = request.data.get('username')
        password = request.data.get('password')

        if not username_or_email or not password:
            return Response(
                {"error": "L'identifiant et le mot de passe sont obligatoires."},
                status=status.HTTP_400_BAD_REQUEST
            )

        username_to_auth = username_or_email
        if '@' in username_or_email:
            try:
                user_found = User.objects.get(email=username_or_email)
                username_to_auth = user_found.username
            except User.DoesNotExist:
                pass

        user = authenticate(username=username_to_auth, password=password)

        if user is not None:
            if not user.is_active:
                return Response(
                    {"error": "Ce compte est désactivé ou en attente de validation."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.role,
                    'departement': user.departement.id if user.departement else None
                }
            }, status=status.HTTP_200_OK)

        return Response({"error": "Identifiants de connexion invalides."}, status=status.HTTP_400_BAD_REQUEST)


class LogoutAPIView(APIView):
    def post(self, request):
        try:
            request.user.auth_token.delete()
            return Response({'message': 'Déconnexion réussie.'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'error': 'Erreur lors de la déconnexion.'}, status=status.HTTP_400_BAD_REQUEST)


# ==============================================================================
# 8. LOGEMENT & APPUI ADMINISTRATIF
# ==============================================================================

class ChambreViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Chambre.objects.all()
    serializer_class = ChambreSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]


class LogementViewSet(viewsets.ModelViewSet):
    queryset = DemandeLogement.objects.all()
    serializer_class = DemandeLogementSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='mes-demandes')
    def mes_demandes(self, request):
        try:
            if not hasattr(request.user, 'profil_etudiant'):
                return Response([], status=200)
            profil = request.user.profil_etudiant
            demandes = DemandeLogement.objects.filter(etudiant=profil).order_by('-date_demande')
            serializer = self.get_serializer(demandes, many=True)
            return Response(serializer.data, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    @action(detail=False, methods=['post'], url_path='demander')
    def demander_chambre(self, request):
        try:
            if not hasattr(request.user, 'profil_etudiant'):
                return Response({"error": "Profil étudiant introuvable ou rôle incorrect."}, status=403)
            profil = request.user.profil_etudiant
        except Exception:
            return Response({"error": "Seuls les étudiants peuvent demander un logement."}, status=403)

        if DemandeLogement.objects.filter(etudiant=profil, statut__in=['BROUILLON', 'VALIDE']).exists():
            return Response({"error": "Vous avez déjà une demande de logement active."}, status=400)

        chambre_id = request.data.get('chambre')
        try:
            chambre = Chambre.objects.get(id=chambre_id)
        except Chambre.DoesNotExist:
            return Response({"error": "Chambre introuvable."}, status=404)

        if chambre.nb_occupants >= 4:
            return Response({"error": "Cette chambre a atteint sa capacité maximale de 4 personnes."}, status=400)

        demande = DemandeLogement.objects.create(etudiant=profil, chambre=chambre)
        serializer = self.get_serializer(demande)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='demandes-globales')
    def demandes_globales(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Accès réservé à l'administration."}, status=403)
        demandes = DemandeLogement.objects.all().order_by('-date_demande')
        serializer = self.get_serializer(demandes, many=True)
        return Response(serializer.data, status=200)

    @action(detail=True, methods=['post'], url_path='decider')
    def decider_logement(self, request, pk=None):
        if request.user.role != 'ADMIN':
            return Response({"error": "Accès non autorisé."}, status=403)
        demande = self.get_object()
        nouvel_statut = request.data.get('statut')
        if nouvel_statut not in ['VALIDE', 'REJETE']:
            return Response({"error": "Statut de décision invalide."}, status=400)
        if nouvel_statut == 'VALIDE' and demande.chambre.nb_occupants >= 4:
            return Response({"error": "Validation impossible: La chambre est pleine (Max 4)."}, status=400)
        demande.statut = nouvel_statut
        demande.save()
        return Response({"message": f"Demande mise à jour avec le statut: {nouvel_statut}"}, status=200)


class AppuiAdministratifViewSet(viewsets.ModelViewSet):
    queryset = DemandeAppui.objects.all()
    serializer_class = DemandeAppuiSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='mes-demandes')
    def mes_demandes(self, request):
        try:
            if not hasattr(request.user, 'profil_etudiant'):
                return Response([], status=200)
            profil = request.user.profil_etudiant
            demandes = DemandeAppui.objects.filter(etudiant=profil).order_by('-created_at')
            serializer = self.get_serializer(demandes, many=True)
            return Response(serializer.data, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    @action(detail=False, methods=['post'], url_path='demander')
    def demander_appui(self, request):
        try:
            if not hasattr(request.user, 'profil_etudiant'):
                return Response({"error": "Profil étudiant introuvable."}, status=403)
            profil = request.user.profil_etudiant
        except Exception:
            return Response({"error": "Action réservée aux étudiants."}, status=403)
        type_appui = request.data.get('type_appui')
        motif = request.data.get('motif')
        demande = DemandeAppui.objects.create(etudiant=profil, type_appui=type_appui, motif=motif)
        serializer = self.get_serializer(demande)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ==============================================================================
# 9. EMPLOI DU TEMPS
# ==============================================================================

class EmploiDuTempsViewSet(viewsets.ModelViewSet):
    queryset = EmploiDuTemps.objects.all()
    serializer_class = EmploiDuTempsSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='mon-planning')
    def mon_planning(self, request):
        if request.user.role != 'ENSEIGNANT':
            return Response({"error": "Accès réservé aux enseignants."}, status=403)
        planning = EmploiDuTemps.objects.filter(enseignant=request.user).order_by('jour', 'heure_debut')
        serializer = self.get_serializer(planning, many=True)
        return Response(serializer.data)


class PlanningViewSet(viewsets.ModelViewSet):
    queryset = EmploiDuTemps.objects.all().order_by('jour', 'heure_debut')
    serializer_class = EmploiDuTempsSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return EmploiDuTemps.objects.none()

        dept_id = self.request.query_params.get('departement', None)

        if user.role == 'ADMIN':
            if dept_id:
                return EmploiDuTemps.objects.filter(
                    matiere__classe__filiere__departement_id=dept_id
                ).order_by('jour', 'heure_debut')
            return EmploiDuTemps.objects.all().order_by('jour', 'heure_debut')

        elif user.role == 'CHEF_DEP':
            dept_chef = getattr(user, 'departement_dirige', None)
            if dept_chef:
                return EmploiDuTemps.objects.filter(
                    matiere__classe__filiere__departement=dept_chef
                ).order_by('jour', 'heure_debut')
            return EmploiDuTemps.objects.none()

        elif user.role == 'ENSEIGNANT':
            return EmploiDuTemps.objects.filter(enseignant=user).order_by('jour', 'heure_debut')

        elif user.role == 'ETUDIANT':
            if hasattr(user, 'profil_etudiant') and user.profil_etudiant.classe_actuelle:
                return EmploiDuTemps.objects.filter(
                    matiere__classe=user.profil_etudiant.classe_actuelle
                ).order_by('jour', 'heure_debut')
            return EmploiDuTemps.objects.none()

        return EmploiDuTemps.objects.none()

    def _check_write_permission(self, request, obj=None):
        user = request.user
        if user.role == 'ADMIN':
            return True
        if user.role == 'CHEF_DEP':
            if obj:
                dept_chef = getattr(user, 'departement_dirige', None)
                if dept_chef and obj.matiere.classe.filiere.departement == dept_chef:
                    return True
            else:
                return True
        raise permissions.PermissionDenied("Vous n'avez pas l'autorisation de modifier ce planning.")

    def update(self, request, *args, **kwargs):
        self._check_write_permission(request, self.get_object())
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self._check_write_permission(request, self.get_object())
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self._check_write_permission(request, self.get_object())
        return super().destroy(request, *args, **kwargs)


# ==============================================================================
# 10. SERVICE ÉTUDIANT : STAGES
# ==============================================================================

class DemandeStageViewSet(viewsets.ModelViewSet):
    queryset = DemandeStage.objects.all().order_by('-created_at')
    serializer_class = DemandeStageSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['statut']

    @action(detail=False, methods=['get'], url_path='mes-demandes')
    def mes_demandes(self, request):
        if not hasattr(request.user, 'profil_etudiant'):
            return Response([], status=200)
        profil = request.user.profil_etudiant
        demandes = DemandeStage.objects.filter(etudiant=profil).order_by('-created_at')
        serializer = self.get_serializer(demandes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='demander')
    def demander_stage(self, request):
        if not hasattr(request.user, 'profil_etudiant'):
            return Response({"error": "Profil étudiant introuvable."}, status=403)
        profil = request.user.profil_etudiant
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(etudiant=profil)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='toutes-les-demandes')
    def toutes_les_demandes(self, request):
        if request.user.role not in ['ADMIN', 'CHEF_DEP']:
            return Response({"error": "Accès non autorisé."}, status=403)
        demandes = DemandeStage.objects.all().order_by('-created_at')
        serializer = self.get_serializer(demandes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='decider')
    def decider_stage(self, request, pk=None):
        if request.user.role not in ['ADMIN', 'CHEF_DEP']:
            return Response({"error": "Accès non autorisé."}, status=403)
        demande = self.get_object()
        nouvel_statut = request.data.get('statut')
        if nouvel_statut not in ['VALIDE', 'REJETE']:
            return Response({"error": "Statut invalide. Utilisez 'VALIDE' ou 'REJETE'."}, status=400)
        demande.statut = nouvel_statut
        demande.save()
        return Response({"message": f"Demande de stage mise à jour : {nouvel_statut}"}, status=200)


class DemandeAppuiStageViewSet(viewsets.ModelViewSet):
    queryset = DemandeAppuiStage.objects.all().order_by('-created_at')
    serializer_class = DemandeAppuiStageSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['statut']

    @action(detail=False, methods=['get'], url_path='mes-demandes')
    def mes_demandes(self, request):
        if not hasattr(request.user, 'profil_etudiant'):
            return Response([], status=200)
        profil = request.user.profil_etudiant
        demandes = DemandeAppuiStage.objects.filter(etudiant=profil).order_by('-created_at')
        serializer = self.get_serializer(demandes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='demander')
    def demander_appui_stage(self, request):
        if not hasattr(request.user, 'profil_etudiant'):
            return Response({"error": "Profil étudiant introuvable."}, status=403)
        profil = request.user.profil_etudiant
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(etudiant=profil)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='toutes-les-demandes')
    def toutes_les_demandes(self, request):
        if request.user.role not in ['ADMIN', 'CHEF_DEP']:
            return Response({"error": "Accès non autorisé."}, status=403)
        demandes = DemandeAppuiStage.objects.all().order_by('-created_at')
        serializer = self.get_serializer(demandes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='decider')
    def decider_appui_stage(self, request, pk=None):
        if request.user.role not in ['ADMIN', 'CHEF_DEP']:
            return Response({"error": "Accès non autorisé."}, status=403)
        demande = self.get_object()
        nouvel_statut = request.data.get('statut')
        if nouvel_statut not in ['VALIDE', 'REJETE']:
            return Response({"error": "Statut invalide. Utilisez 'VALIDE' ou 'REJETE'."}, status=400)
        demande.statut = nouvel_statut
        if 'fichier_appui' in request.FILES:
            demande.fichier_appui = request.FILES['fichier_appui']
        demande.save()
        return Response({"message": f"Demande d'appui de stage mise à jour : {nouvel_statut}"}, status=200)


# ==============================================================================
# 11. STATISTIQUES CHEF DE DÉPARTEMENT
# ==============================================================================

class ChefDepartementStatsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role != 'CHEF_DEP':
            return Response({"error": "Accès non autorisé"}, status=403)

        dept_chef = getattr(user, 'departement_dirige', None)

        if not dept_chef:
            return Response({
                "classes_count": 0,
                "etudiants_count": 0,
                "enseignants_count": 0,
                "matieres_count": 0,
                "departement_nom": "Aucun département assigné"
            })

        classes = Classe.objects.filter(filiere__departement=dept_chef)
        return Response({
            "departement_nom": dept_chef.nom,
            "classes_count": classes.count(),
            "etudiants_count": EtudiantProfil.objects.filter(classe_actuelle__in=classes).count(),
            "enseignants_count": User.objects.filter(role='ENSEIGNANT', departement=dept_chef).count(),
            "matieres_count": Matiere.objects.filter(classe__in=classes).count(),
        })
