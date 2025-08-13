from django.db import models
from django.contrib.auth.models import User

class Baby(models.Model):
    parent = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    gender = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female')])
    birth_date = models.DateField()

class GrowthRecord(models.Model):
    baby = models.ForeignKey(Baby, on_delete=models.CASCADE)
    date = models.DateField()
    age_months = models.IntegerField()
    weight_kg = models.FloatField()
    height_cm = models.FloatField()
    z_score_weight = models.FloatField(null=True, blank=True)
    z_score_height = models.FloatField(null=True, blank=True)
    classification = models.CharField(max_length=50, null=True, blank=True)
    anomaly = models.BooleanField(default=False)
