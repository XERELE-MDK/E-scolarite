from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.get_admin_urls() if hasattr(admin.site, 'get_admin_urls') else admin.site.urls),
    
    # Toutes les routes de notre API seront préfixées par /api/
    path('api/', include('polytechnique.urls')),
]

# Prise en charge des fichiers médias (photos de profil, justificatifs d'absences, reçus PDF...)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)