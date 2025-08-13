from rest_framework import serializers
from .models import Baby, GrowthRecord

class BabySerializer(serializers.ModelSerializer):
    class Meta:
        model = Baby
        fields = '__all__'

class GrowthRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrowthRecord
        fields = '__all__'
