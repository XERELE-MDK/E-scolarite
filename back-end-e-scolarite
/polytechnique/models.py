from django.db import models

# Create your models here.

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
import datetime

# ==============================================================================
# 1. AUTHENTIFICATION & UTILISATEURS (Gestion des Rôles)
# ==============================================================================

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrateur'
        CHEF_DEPARTEMENT = 'CHEF_DEP', 'Chef de département'
        ENSEIGNANT = 'ENSEIGNANT', 'Enseignant'
        ETUDIANT = 'ETUDIANT', 'Étudiant'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.ADMIN)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    adresse = models.TextField(blank=True, null=True)
    photo_profil = models.ImageField(upload_to='profils/', blank=True, null=True)
    
    # AJOUT : Liaison vers le département (Optionnel pour l'Admin, obligatoire pour les profs)
    departement = models.ForeignKey(
        'Departement',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='membres'
    )

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"


# ==============================================================================
# 2. STRUCTURE ACADÉMIQUE
# ==============================================================================

class Departement(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)
    chef = models.OneToOneField(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        limit_choices_to={'role': 'CHEF_DEP'},
        related_name='departement_dirige'
    )

    def __str__(self):
        return self.nom


class Filiere(models.Model):
    nom = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)
    departement = models.ForeignKey(Departement, on_delete=models.CASCADE, related_name='filieres')

    def __str__(self):
        return self.nom


class Classe(models.Model):
    nom = models.CharField(max_length=50) # Ex: Master 1 Génie Logiciel
    code = models.CharField(max_length=20, unique=False)
    filiere = models.ForeignKey(Filiere, on_delete=models.CASCADE, related_name='classes')
    annee_universitaire = models.CharField(max_length=9) # Ex: 2025-2026

    def __str__(self):
        return f"{self.nom} ({self.annee_universitaire})"


class Matiere(models.Model):
    nom = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)
    coefficient = models.IntegerField(default=1)
    classe = models.ForeignKey(Classe, on_delete=models.CASCADE, related_name='matieres')
    enseignant = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        limit_choices_to={'role': 'ENSEIGNANT'},
        related_name='matieres_enseignees'
    )

   

    def __str__(self):
        return f"{self.nom} ({self.classe.nom})"


# ==============================================================================
# 3. PROFILS SPÉCIFIQUES & DOSSIERS ACADÉMIQUES
# ==============================================================================

class EtudiantProfil(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profil_etudiant')
    matricule = models.CharField(max_length=20, unique=True, blank=True, null=True)
    date_naissance = models.DateField(null=True, blank=True)
    classe_actuelle = models.ForeignKey(Classe, on_delete=models.SET_NULL, null=True, blank=True, related_name='etudiants')

    def save(self, *args, **kwargs):
        if not self.matricule:
            annee = datetime.datetime.now().year
            # Utilise l'ID max existant + 1 plutôt que count()
            # pour éviter les collisions après suppression
            dernier = EtudiantProfil.objects.order_by('-id').first()
            prochain_id = (dernier.id + 1) if dernier else 1
            matricule_candidat = f"POLY-{annee}-{prochain_id:04d}"
            
            # Sécurité finale : si par malchance ce matricule existe déjà, on ajoute un suffixe unique
            while EtudiantProfil.objects.filter(matricule=matricule_candidat).exists():
                prochain_id += 1
                matricule_candidat = f"POLY-{annee}-{prochain_id:04d}"
            
            self.matricule = matricule_candidat
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.matricule} - {self.user.get_full_name()}"


# ==============================================================================
# 4. INSCRIPTIONS & FINANCES
# ==============================================================================

class Inscription(models.Model):
    STATUS_CHOICES = [
        ('BROUILLON', 'Brouillon'),
        ('VALIDE', 'Validé'),
        ('REJETE', 'Rejeté'),
    ]
    etudiant = models.ForeignKey(EtudiantProfil, on_delete=models.CASCADE, related_name='inscriptions')
    classe = models.ForeignKey(Classe, on_delete=models.CASCADE)
    date_inscription = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=15, choices=STATUS_CHOICES, default='BROUILLON')
    montant_total = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Inscription de {self.etudiant.user.last_name} en {self.classe.nom}"


class Paiement(models.Model):
    inscription = models.ForeignKey(Inscription, on_delete=models.CASCADE, related_name='paiements')
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    date_paiement = models.DateTimeField(auto_now_add=True)
    recu_pdf = models.FileField(upload_to='recus/', blank=True, null=True)

    def __str__(self):
        return f"Paiement de {self.montant} pour {self.inscription.etudiant.matricule}"


# ==============================================================================
# 5. EXAMENS & NOTES
# ==============================================================================

class Examen(models.Model):
    matiere = models.ForeignKey(Matiere, on_delete=models.CASCADE, related_name='examens')
    nom = models.CharField(max_length=50) # Ex: Examen Partiel, Examen Final
    date_examen = models.DateTimeField()
    est_publie = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.nom} - {self.matiere.nom}"


class Note(models.Model):
    etudiant = models.ForeignKey(EtudiantProfil, on_delete=models.CASCADE, related_name='notes')
    examen = models.ForeignKey(Examen, on_delete=models.CASCADE, related_name='notes_examen')
    valeur = models.DecimalField(max_digits=4, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(20)])
    date_saisie = models.DateTimeField(auto_now=True)
    valide_par_enseignant = models.BooleanField(default=False)

    class Meta:
        unique_together = ('etudiant', 'examen') # Un étudiant a une seule note par examen

    def __str__(self):
        return f"{self.etudiant.matricule} : {self.valeur} en {self.examen.matiere.nom}"


# ==============================================================================
# 6. SUIVI DES ABSENCES
# ==============================================================================

class Absence(models.Model):
    etudiant = models.ForeignKey(EtudiantProfil, on_delete=models.CASCADE, related_name='absences')
    matiere = models.ForeignKey(Matiere, on_delete=models.CASCADE)
    date_absence = models.DateField()
    est_justifiee = models.BooleanField(default=False)
    motif_justification = models.TextField(blank=True, null=True)
    document_justificatif = models.FileField(upload_to='justificatifs/', blank=True, null=True)

    def __str__(self):
        statut = "Justifiée" if self.est_justifiee else "Non justifiée"
        return f"Absence de {self.etudiant.user.last_name} le {self.date_absence} ({statut})"






from django.core.exceptions import ValidationError

# ==============================================================================
# 7. SERVICE DE LOGEMENT (CAMPUS POLYTECHNIQUE)
# ==============================================================================

class Chambre(models.Model):
    code = models.CharField(max_length=20, unique=True)  # Ex: CH-102-A
    pavillon = models.CharField(max_length=50, default="Pavillon A")
    
    @property
    def nb_occupants(self):
        # Calcule le nombre d'étudiants ayant une demande validée pour cette chambre
        return self.demandes_logement.filter(statut='VALIDE').count()

    def __str__(self):
        return f"Chambre {self.code} ({self.pavillon}) - {self.nb_occupants}/4 places"


class DemandeLogement(models.Model):
    STATUS_CHOICES = [
        ('BROUILLON', 'En attente'),
        ('VALIDE', 'Validé'),
        ('REJETE', 'Rejeté'),
    ]
    etudiant = models.ForeignKey(EtudiantProfil, on_delete=models.CASCADE, related_name='demandes_chambre')
    chambre = models.ForeignKey(Chambre, on_delete=models.CASCADE, related_name='demandes_logement')
    date_demande = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=15, choices=STATUS_CHOICES, default='BROUILLON')

    class Meta:
        # Un étudiant ne peut pas faire plusieurs demandes actives pour la même chambre
        unique_together = ('etudiant', 'chambre')

    def clean(self):
        # RÈGLE MÉTIER STRICTE : Empêcher la validation si la chambre est déjà pleine
        if self.statut == 'VALIDE' and self.chambre.nb_occupants >= 4:
            # Si la demande en cours était déjà validée, on ne la bloque pas
            if not DemandeLogement.objects.filter(id=self.id, statut='VALIDE').exists():
                raise ValidationError(f"Impossible de valider : La chambre {self.chambre.code} est déjà complète (Max 4 personnes).")

    def save(self, *args, **kwargs):
        self.full_clean()  # Force l'exécution de la méthode clean() avant la sauvegarde
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Demande de {self.etudiant.user.last_name} - Chambre {self.chambre.code} ({self.statut})"


# ==============================================================================
# 8. APPUI ADMINISTRATIF & LETTRES OFFICIELLES
# ==============================================================================

class DemandeAppui(models.Model):
    TYPE_CHOICES = [
        ('STAGE', 'Appui pour demande de Stage'),
        ('VISA', 'Lettre d\'appui pour Visa Études'),
        ('BOURSE', 'Demande d\'appui pour Bourse'),
    ]
    STATUS_CHOICES = [
        ('BROUILLON', 'En attente'),
        ('VALIDE', 'Validé'),
        ('REJETE', 'Rejeté'),
    ]
    etudiant = models.ForeignKey(EtudiantProfil, on_delete=models.CASCADE, related_name='demandes_appui')
    type_appui = models.CharField(max_length=15, choices=TYPE_CHOICES, default='STAGE')
    motif = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=15, choices=STATUS_CHOICES, default='BROUILLON')
    fichier_appui = models.FileField(upload_to='appuis_docs/', blank=True, null=True)  # Le document final téléversé par l'admin

    def __str__(self):
        return f"Appui {self.type_appui} - {self.etudiant.user.last_name} ({self.statut})"


# ==============================================================================
# 9. SERVICE ÉTUDIANT : STAGES
# ==============================================================================

class DemandeStage(models.Model):
    STATUS_CHOICES = [
        ('BROUILLON', 'En attente'),
        ('VALIDE', 'Validé'),
        ('REJETE', 'Rejeté'),
    ]
    etudiant = models.ForeignKey(EtudiantProfil, on_delete=models.CASCADE, related_name='demandes_stage')
    entreprise = models.CharField(max_length=200)
    poste = models.CharField(max_length=200)
    date_debut = models.DateField()
    date_fin = models.DateField()
    description = models.TextField(blank=True)
    statut = models.CharField(max_length=15, choices=STATUS_CHOICES, default='BROUILLON')
    created_at = models.DateTimeField(auto_now_add=True)
    convention = models.FileField(upload_to='conventions_stage/', blank=True, null=True)

    def clean(self):
        if self.date_debut and self.date_fin and self.date_debut >= self.date_fin:
            raise ValidationError("La date de fin doit être après la date de début.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Stage {self.poste} @ {self.entreprise} - {self.etudiant.user.last_name} ({self.statut})"


class DemandeAppuiStage(models.Model):
    STATUS_CHOICES = [
        ('BROUILLON', 'En attente'),
        ('VALIDE', 'Validé'),
        ('REJETE', 'Rejeté'),
    ]
    etudiant = models.ForeignKey(EtudiantProfil, on_delete=models.CASCADE, related_name='demandes_appui_stage')
    motif = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=15, choices=STATUS_CHOICES, default='BROUILLON')
    fichier_appui = models.FileField(upload_to='appuis_stage/', blank=True, null=True)

    def __str__(self):
        return f"Appui stage - {self.etudiant.user.last_name} ({self.statut})"




class EmploiDuTemps(models.Model):
    JOURS_CHOICES = [
        ('LUNDI', 'Lundi'),
        ('MARDI', 'Mardi'),
        ('MERCREDI', 'Mercredi'),
        ('JEUDI', 'Jeudi'),
        ('VENDREDI', 'Vendredi'),
        ('SAMEDI', 'Samedi'),
    ]
    
    matiere = models.ForeignKey(Matiere, on_delete=models.CASCADE, related_name='creneaux_horaires')
    enseignant = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'ENSEIGNANT'})
    jour = models.CharField(max_length=15, choices=JOURS_CHOICES)
    heure_debut = models.TimeField()  # Ex: 08:00:00
    heure_fin = models.TimeField()    # Ex: 10:00:00
    salle = models.CharField(max_length=50)

    def clean(self):
        from django.core.exceptions import ValidationError

        # 1. Sécurité : L'heure de fin doit être après l'heure de début
        if self.heure_debut and self.heure_fin and self.heure_debut >= self.heure_fin:
            raise ValidationError("L'heure de fin doit être strictement supérieure à l'heure de début.")

        # 2. Sécurité : Vérifier les conflits d'horaire pour l'ENSEIGNANT
        conflit_enseignant = EmploiDuTemps.objects.filter(
            enseignant=self.enseignant,
            jour=self.jour,
            heure_debut__lt=self.heure_fin,
            heure_fin__gt=self.heure_debut
        ).exclude(id=self.id).exists()
        
        if conflit_enseignant:
            raise ValidationError("Cet enseignant est déjà occupé sur un autre cours durant ce créneau horaire.")

        # 3. 👑 NOUVEAU : Vérifier si la SALLE est déjà occupée au même moment par un autre cours
        conflit_salle = EmploiDuTemps.objects.filter(
            salle__iexact=self.salle,  # Évite les doublons de casse (ex: "Salle 1" vs "salle 1")
            jour=self.jour,
            heure_debut__lt=self.heure_fin,
            heure_fin__gt=self.heure_debut
        ).exclude(id=self.id).exists()

        if conflit_salle:
            raise ValidationError(f"La salle '{self.salle}' est déjà réservée pour un autre cours sur ce créneau horaire.")

        # 4. 👑 NOUVEAU : Vérifier si la CLASSE cible a déjà un autre cours programmé à cette heure
        if self.matiere and self.matiere.classe:
            conflit_classe = EmploiDuTemps.objects.filter(
                matiere__classe=self.matiere.classe,
                jour=self.jour,
                heure_debut__lt=self.heure_fin,
                heure_fin__gt=self.heure_debut
            ).exclude(id=self.id).exists()

            if conflit_classe:
                raise ValidationError(f"Les étudiants de la classe [{self.matiere.classe.nom}] ont déjà un autre cours prévu sur ce créneau.")

    def save(self, *args, **kwargs):
        self.full_clean()  # Force l'exécution de la méthode clean() avant la sauvegarde
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.matiere.nom} - {self.jour} ({self.heure_debut}-{self.heure_fin})"