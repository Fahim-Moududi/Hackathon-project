from django.urls import path
from . import views

urlpatterns = [
    # Endpoint to add a new growth record and get risk prediction
    path('growth/', views.add_growth_record, name='add-growth-record'),
    
    # Endpoint to get all growth records
    path('growth/records/', views.get_growth_records, name='get-growth-records'),
    
    # Endpoint to get a specific growth record by ID
    path('growth/records/<int:record_id>/', views.get_growth_record, name='get-growth-record'),
    
    # Endpoint to get a risk prediction without saving the record
    path('growth/predict/', views.predict_growth_risk_api, name='predict-growth-risk'),
]