from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """Accès réservé uniquement aux administrateurs (SUPER ADMIN)."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'

class IsChefDepartement(permissions.BasePermission):
    """Accès réservé aux chefs de département ou aux administrateurs."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'CHEF_DEP']

class IsEnseignant(permissions.BasePermission):
    """Accès réservé aux enseignants, aux chefs de département et aux administrateurs."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'CHEF_DEP', 'ENSEIGNANT']

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Un étudiant peut voir ses propres données (Profil, Notes, Absences),
    mais seul le personnel académique peut les modifier.
    """
    def has_object_permission(self, request, view, obj):
        # Les requêtes de lecture (GET) sont autorisées pour l'étudiant concerné
        if request.method in permissions.SAFE_METHODS:
            if hasattr(obj, 'user') and obj.user == request.user:
                return True
            if hasattr(obj, 'etudiant') and obj.etudiant.user == request.user:
                return True
        
        # Les modifications (POST, PUT, DELETE) nécessitent d'être au moins enseignant, chef ou admin
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'CHEF_DEP', 'ENSEIGNANT']