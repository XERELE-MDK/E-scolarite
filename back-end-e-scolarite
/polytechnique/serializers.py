from rest_framework import serializers
from .models import (
    User, Departement, Filiere, Classe, Matiere,
    EtudiantProfil, Inscription, Paiement, Examen, Note, Absence,
    Chambre, DemandeLogement, DemandeAppui, EmploiDuTemps,
    DemandeStage, DemandeAppuiStage
)

# ==============================================================================
# 1. UTILISATEURS & AUTHENTIFICATION
# ==============================================================================

class UserSerializer(serializers.ModelSerializer):
    student_profile = serializers.SerializerMethodField()
    departement_details = serializers.SerializerMethodField()
    departement_dirige_details = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'telephone', 'adresse', 'photo_profil',
            'departement', 'departement_details', 'departement_dirige_details',
            'student_profile', 'password'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': True},
            'role': {'required': True},
            'departement': {'required': False, 'allow_null': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        role = validated_data.pop('role')
        departement = validated_data.pop('departement', None)

        user = User.objects.create_user(
            username=validated_data.pop('username'),
            email=validated_data.pop('email', ''),
            password=password,
            role=role,
            departement=departement,
            is_active=True,
            **validated_data
        )
        return user

    def get_departement_details(self, obj):
        if obj.departement:
            return {"id": obj.departement.id, "nom": obj.departement.nom, "code": obj.departement.code}
        return None

    def get_departement_dirige_details(self, obj):
        if obj.role == 'CHEF_DEP' and hasattr(obj, 'departement_dirige'):
            dept = obj.departement_dirige
            return {"id": dept.id, "nom": dept.nom, "code": dept.code}
        return None

    def get_student_profile(self, obj):
        if obj.role == 'ETUDIANT' and hasattr(obj, 'profil_etudiant'):
            profil = obj.profil_etudiant

            inscription = profil.inscriptions.filter(statut='VALIDE').first()
            classe_nom = "Non assignée (En attente)"
            departement_nom = "Non assigné"

            if inscription and inscription.classe:
                classe_nom = inscription.classe.nom
                if inscription.classe.filiere and inscription.classe.filiere.departement:
                    departement_nom = inscription.classe.filiere.departement.nom
            elif profil.classe_actuelle:
                classe_nom = profil.classe_actuelle.nom
                if profil.classe_actuelle.filiere and profil.classe_actuelle.filiere.departement:
                    departement_nom = profil.classe_actuelle.filiere.departement.nom

            logement = profil.demandes_chambre.filter(statut='VALIDE').first()
            chambre_info = "Non logé (Pas de chambre)"
            if logement and logement.chambre:
                chambre_info = f"Chambre {logement.chambre.code} ({logement.chambre.pavillon})"

            return {
                "matricule": profil.matricule,
                "departement": departement_nom,
                "classe": classe_nom,
                "logement": chambre_info,
                "statut_inscription": inscription.statut if inscription else "Aucune inscription active"
            }
        return None


# ==============================================================================
# 2. STRUCTURE ACADÉMIQUE
# ==============================================================================

class DepartementSerializer(serializers.ModelSerializer):
    chef_details = UserSerializer(source='chef', read_only=True)

    class Meta:
        model = Departement
        fields = ['id', 'nom', 'code', 'chef', 'chef_details']


class FiliereSerializer(serializers.ModelSerializer):
    departement_details = DepartementSerializer(source='departement', read_only=True)

    class Meta:
        model = Filiere
        fields = ['id', 'nom', 'code', 'departement', 'departement_details']


class ClasseSerializer(serializers.ModelSerializer):
    filiere_details = FiliereSerializer(source='filiere', read_only=True)

    class Meta:
        model = Classe
        fields = ['id', 'nom', 'filiere', 'filiere_details', 'annee_universitaire']
        extra_kwargs = {
            'filiere': {'required': False, 'allow_null': True}
        }


class MatiereSerializer(serializers.ModelSerializer):
    classe_details = serializers.SerializerMethodField()
    enseignant_details = serializers.SerializerMethodField()

    class Meta:
        model = Matiere
        fields = ['id', 'nom', 'code', 'coefficient', 'classe', 'classe_details', 'enseignant', 'enseignant_details']

    def get_classe_details(self, obj):
        if obj.classe:
            return {"id": obj.classe.id, "nom": obj.classe.nom}
        return None

    def get_enseignant_details(self, obj):
        if obj.enseignant:
            return {
                "id": obj.enseignant.id,
                "first_name": obj.enseignant.first_name,
                "last_name": obj.enseignant.last_name
            }
        return None


# ==============================================================================
# 3. PROFILS ÉTUDIANTS
# ==============================================================================

class EtudiantProfilSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    classe_details = ClasseSerializer(source='classe_actuelle', read_only=True)

    class Meta:
        model = EtudiantProfil
        fields = ['id', 'user', 'user_details', 'matricule', 'date_naissance', 'classe_actuelle', 'classe_details']
        read_only_fields = ['matricule']


# ==============================================================================
# 4. INSCRIPTIONS & FINANCES
# ==============================================================================

class PaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paiement
        fields = ['id', 'inscription', 'montant', 'date_paiement', 'recu_pdf']


class InscriptionSerializer(serializers.ModelSerializer):
    etudiant_details = EtudiantProfilSerializer(source='etudiant', read_only=True)
    classe_details = ClasseSerializer(source='classe', read_only=True)
    paiements = PaiementSerializer(many=True, read_only=True)

    class Meta:
        model = Inscription
        fields = ['id', 'etudiant', 'etudiant_details', 'classe', 'classe_details', 'date_inscription', 'statut', 'montant_total', 'paiements']


# ==============================================================================
# 5. EXAMENS & NOTES
# ==============================================================================

class ExamenSerializer(serializers.ModelSerializer):
    matiere_details = MatiereSerializer(source='matiere', read_only=True)

    class Meta:
        model = Examen
        fields = ['id', 'matiere', 'matiere_details', 'nom', 'date_examen', 'est_publie']


class NoteSerializer(serializers.ModelSerializer):
    etudiant_details = EtudiantProfilSerializer(source='etudiant', read_only=True)
    examen_details = ExamenSerializer(source='examen', read_only=True)

    class Meta:
        model = Note
        fields = ['id', 'etudiant', 'etudiant_details', 'examen', 'examen_details', 'valeur', 'date_saisie', 'valide_par_enseignant']

    def validate_valeur(self, value):
        if value < 0 or value > 20:
            raise serializers.ValidationError("La note doit être comprise entre 0 et 20.")
        return value


# ==============================================================================
# 6. ABSENCES
# ==============================================================================

class AbsenceSerializer(serializers.ModelSerializer):
    etudiant_details = EtudiantProfilSerializer(source='etudiant', read_only=True)
    matiere_details = MatiereSerializer(source='matiere', read_only=True)

    class Meta:
        model = Absence
        fields = ['id', 'etudiant', 'etudiant_details', 'matiere', 'matiere_details', 'date_absence', 'est_justifiee', 'motif_justification', 'document_justificatif']


# ==============================================================================
# 7. LOGEMENT & APPUI ADMINISTRATIF
# ==============================================================================

class ChambreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chambre
        fields = ['id', 'code', 'pavillon', 'nb_occupants']


class DemandeLogementSerializer(serializers.ModelSerializer):
    chambre_details = ChambreSerializer(source='chambre', read_only=True)
    etudiant_details = serializers.SerializerMethodField()

    class Meta:
        model = DemandeLogement
        fields = ['id', 'etudiant', 'chambre', 'chambre_details', 'etudiant_details', 'date_demande', 'statut']
        read_only_fields = ['etudiant', 'statut']

    def get_etudiant_details(self, obj):
        return {
            "matricule": obj.etudiant.matricule,
            "user_details": {
                "first_name": obj.etudiant.user.first_name,
                "last_name": obj.etudiant.user.last_name,
            }
        }


class DemandeAppuiSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeAppui
        fields = ['id', 'type_appui', 'motif', 'created_at', 'statut', 'fichier_appui']
        read_only_fields = ['statut', 'fichier_appui']


# ==============================================================================
# 8. EMPLOI DU TEMPS
# ==============================================================================

class EmploiDuTempsSerializer(serializers.ModelSerializer):
    matiere_details = serializers.SerializerMethodField()

    class Meta:
        model = EmploiDuTemps
        fields = ['id', 'matiere', 'enseignant', 'jour', 'heure_debut', 'heure_fin', 'salle', 'matiere_details']

    def get_matiere_details(self, obj):
        if obj.matiere:
            return {
                "nom": obj.matiere.nom,
                "classe": obj.matiere.classe.nom if obj.matiere.classe else "Générale"
            }
        return None


# ==============================================================================
# 9. SERVICE ÉTUDIANT : STAGES
# ==============================================================================

class DemandeStageSerializer(serializers.ModelSerializer):
    etudiant_details = serializers.SerializerMethodField()

    class Meta:
        model = DemandeStage
        fields = [
            'id', 'etudiant', 'etudiant_details', 'entreprise', 'poste',
            'date_debut', 'date_fin', 'description', 'statut', 'created_at', 'convention'
        ]
        read_only_fields = ['statut', 'etudiant']

    def get_etudiant_details(self, obj):
        return {
            "matricule": obj.etudiant.matricule,
            "nom": obj.etudiant.user.last_name,
            "prenom": obj.etudiant.user.first_name,
        }

    def validate(self, data):
        if data.get('date_debut') and data.get('date_fin'):
            if data['date_debut'] >= data['date_fin']:
                raise serializers.ValidationError("La date de fin doit être après la date de début.")
        return data


class DemandeAppuiStageSerializer(serializers.ModelSerializer):
    etudiant_details = serializers.SerializerMethodField()

    class Meta:
        model = DemandeAppuiStage
        fields = [
            'id', 'etudiant', 'etudiant_details', 'motif',
            'created_at', 'statut', 'fichier_appui'
        ]
        read_only_fields = ['statut', 'fichier_appui', 'etudiant']

    def get_etudiant_details(self, obj):
        return {
            "matricule": obj.etudiant.matricule,
            "nom": obj.etudiant.user.last_name,
            "prenom": obj.etudiant.user.first_name,
        }
