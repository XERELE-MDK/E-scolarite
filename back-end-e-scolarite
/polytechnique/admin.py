from django.contrib import admin

# Register your models here.


from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Departement, Filiere, Classe, Matiere, EtudiantProfil, Inscription, Paiement, Examen, Note, Absence, Chambre, DemandeLogement, DemandeAppui      
# 1. Configuration de l'utilisateur personnalisé
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Informations Complémentaires', {'fields': ('role', 'telephone', 'adresse', 'photo_profil')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Informations Complémentaires', {'fields': ('role', 'telephone', 'adresse', 'photo_profil')}),
    )

# 2. Gestion de la structure académique
@admin.register(Departement)
class DepartementAdmin(admin.ModelAdmin):
    list_display = ('nom', 'code', 'chef')
    search_fields = ('nom', 'code')

@admin.register(Filiere)
class FiliereAdmin(admin.ModelAdmin):
    list_display = ('nom', 'code', 'departement')
    list_filter = ('departement',)
    search_fields = ('nom', 'code')

@admin.register(Classe)
class ClasseAdmin(admin.ModelAdmin):
    list_display = ('nom', 'code', 'filiere', 'annee_universitaire')
    list_filter = ('filiere', 'annee_universitaire')
    search_fields = ('nom', 'code')
@admin.register(Matiere)
class MatiereAdmin(admin.ModelAdmin):
    list_display = ('nom', 'code', 'coefficient', 'classe', 'enseignant')
    list_filter = ('classe', 'enseignant')
    search_fields = ('nom', 'code')

# 3. Profils Étudiants
@admin.register(EtudiantProfil)
class EtudiantProfilAdmin(admin.ModelAdmin):
    list_display = ('matricule', 'get_full_name', 'classe_actuelle', 'date_naissance')
    list_filter = ('classe_actuelle', 'classe_actuelle__filiere')
    search_fields = ('matricule', 'user__last_name', 'user__first_name')
    readonly_fields = ('matricule',)

    def get_full_name(self, obj):
        return obj.user.get_full_name()
    get_full_name.short_description = 'Nom Complet'

# 4. Inscriptions & Finances
class PaiementInline(admin.TabularInline):
    model = Paiement
    extra = 1

@admin.register(Inscription)
class InscriptionAdmin(admin.ModelAdmin):
    list_display = ('etudiant', 'classe', 'statut', 'montant_total', 'date_inscription')
    list_filter = ('statut', 'classe')
    search_fields = ('etudiant__matricule', 'etudiant__user__last_name')
    inlines = [PaiementInline]

@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ('inscription', 'montant', 'date_paiement')
    list_filter = ('date_paiement',)
    search_fields = ('inscription__etudiant__matricule',)

# 5. Examens & Notes
class NoteInline(admin.TabularInline):
    model = Note
    extra = 1

@admin.register(Examen)
class ExamenAdmin(admin.ModelAdmin):
    list_display = ('nom', 'matiere', 'date_examen', 'est_publie')
    list_filter = ('est_publie', 'matiere__classe', 'matiere')
    search_fields = ('nom', 'matiere__nom')
    inlines = [NoteInline]

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('etudiant', 'examen', 'valeur', 'valide_par_enseignant', 'date_saisie')
    list_filter = ('valide_par_enseignant', 'examen__matiere__classe', 'examen')
    search_fields = ('etudiant__matricule', 'etudiant__user__last_name')

# 6. Absences
@admin.register(Absence)
class AbsenceAdmin(admin.ModelAdmin):
    list_display = ('etudiant', 'matiere', 'date_absence', 'est_justifiee')
    list_filter = ('est_justifiee', 'date_absence', 'matiere')
    search_fields = ('etudiant__matricule', 'etudiant__user__last_name')



from django.contrib import admin
from .models import Chambre, DemandeLogement, DemandeAppui, DemandeStage, DemandeAppuiStage

@admin.register(Chambre)
class ChambreAdmin(admin.ModelAdmin):
    list_display = ('code', 'pavillon', 'nb_occupants')

@admin.register(DemandeLogement)
class DemandeLogementAdmin(admin.ModelAdmin):
    list_display = ('etudiant', 'chambre', 'statut', 'date_demande')
    list_filter = ('statut', 'chambre__pavillon')

@admin.register(DemandeAppui)
class DemandeAppuiAdmin(admin.ModelAdmin):
    list_display = ('etudiant', 'type_appui', 'statut', 'created_at')
    list_filter = ('statut', 'type_appui')

@admin.register(DemandeStage)
class DemandeStageAdmin(admin.ModelAdmin):
    list_display = ('etudiant', 'entreprise', 'poste', 'date_debut', 'date_fin', 'statut', 'created_at')
    list_filter = ('statut',)
    search_fields = ('etudiant__matricule', 'etudiant__user__last_name', 'entreprise', 'poste')

@admin.register(DemandeAppuiStage)
class DemandeAppuiStageAdmin(admin.ModelAdmin):
    list_display = ('etudiant', 'statut', 'created_at')
    list_filter = ('statut',)
    search_fields = ('etudiant__matricule', 'etudiant__user__last_name')

from django.contrib import admin
from .models import EmploiDuTemps  # Assure-toi d'importer le modèle

@admin.register(EmploiDuTemps)
class PlanningAdmin(admin.ModelAdmin):
    list_display = ('matiere', 'enseignant', 'jour', 'heure_debut', 'heure_fin', 'salle')
    list_filter = ('jour', 'enseignant', 'matiere__classe')
    search_fields = ('salle', 'matiere__nom', 'enseignant__username') # Optionnel : ajoute une barre de recherche pratique