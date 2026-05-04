from django.db import models
from django.contrib.auth.models import User
import uuid

class Mesh(models.Model):
    name = models.CharField(max_length=100)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    mesh_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Device(models.Model):
    mesh = models.ForeignKey(Mesh, on_delete=models.CASCADE, related_name='devices')
    node_id = models.CharField(max_length=100, unique=True)
    role = models.CharField(max_length=50) 
    ip_address = models.GenericIPAddressField()
    port = models.IntegerField()
    status = models.CharField(max_length=20, default='online')
    last_seen = models.DateTimeField(auto_now=True)

class SetupToken(models.Model):
    mesh = models.ForeignKey(Mesh, on_delete=models.CASCADE)
    token = models.CharField(max_length=64, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
