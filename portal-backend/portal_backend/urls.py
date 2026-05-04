from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from api import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', views.register, name='register'),
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/meshes/', views.mesh_list_create, name='mesh_list_create'),
    path('api/mesh/<str:mesh_id>/', views.mesh_status, name='mesh_status'),
    path('api/mesh/<str:mesh_id>/remove/', views.remove_mesh, name='remove_mesh'),
    path('api/mesh/<str:mesh_id>/execute/', views.execute_on_mesh, name='execute_on_mesh'),
    path('api/fleet/overview/', views.fleet_overview, name='fleet_overview'),
    path('api/profile/', views.user_profile, name='user_profile'),
    path('api/install.sh', views.get_installer, name='installer'),
]
