from django.contrib import admin
from django.urls import path
from api.views import mesh_status, execute_on_mesh, get_installer

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/mesh/<str:mesh_id>/', mesh_status),
    path('api/mesh/<str:mesh_id>/execute/', execute_on_mesh),
    path('api/install.sh', get_installer),
]
