import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Divider, 
  Alert,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
  maxWidth: 800,
  margin: '0 auto',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(2),
  fontWeight: 600,
}));

const GrowthEntryForm = () => {
  const [formData, setFormData] = useState({
    baby_id: '',
    name: '',
    gender: 'male',
    birth_date: null,
    date: new Date(),
    age_months: '',
    weight_kg: '',
    height_cm: '',
  });
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (name) => (date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const calculateAgeInMonths = (birthDate, measurementDate) => {
    if (!birthDate || !measurementDate) return '';
    
    const diffInMs = measurementDate - birthDate;
    const diffInMonths = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 30.44));
    
    // Update age_months in form data
    setFormData(prev => ({
      ...prev,
      age_months: diffInMonths
    }));
    
    return diffInMonths;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/growth/records/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baby_id: formData.baby_id || 'new-baby-' + Date.now(),
          name: formData.name,
          gender: formData.gender,
          birth_date: formData.birth_date.toISOString().split('T')[0],
          date: formData.date.toISOString().split('T')[0],
          age_months: formData.age_months || calculateAgeInMonths(formData.birth_date, formData.date),
          weight_kg: parseFloat(formData.weight_kg),
          height_cm: parseFloat(formData.height_cm),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save growth record');
      }
      
      setResult(data);
      // Reset form if needed
      // setFormData({...formData, weight_kg: '', height_cm: ''});
    } catch (err) {
      setError(err.message || 'An error occurred while saving the growth record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <StyledPaper elevation={3}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Add Growth Record
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <SectionTitle variant="subtitle1">Baby Information</SectionTitle>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Baby's Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                variant="outlined"
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Gender</InputLabel>
                  <Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    label="Gender"
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                  </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Birth Date"
                value={formData.birth_date}
                onChange={handleDateChange('birth_date')}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth 
                    size="small" 
                    required 
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Measurement Date"
                value={formData.date}
                onChange={handleDateChange('date')}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth 
                    size="small" 
                    required 
                  />
                )}
              />
            </Grid>
            
            {formData.birth_date && formData.date && (
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Age: {calculateAgeInMonths(formData.birth_date, formData.date)} months
                </Typography>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <SectionTitle variant="subtitle1">Measurements</SectionTitle>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Weight (kg)"
                name="weight_kg"
                type="number"
                value={formData.weight_kg}
                onChange={handleChange}
                required
                variant="outlined"
                size="small"
                inputProps={{
                  step: '0.1',
                  min: '0.1',
                  max: '50'
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Height (cm)"
                name="height_cm"
                type="number"
                value={formData.height_cm}
                onChange={handleChange}
                required
                variant="outlined"
                size="small"
                inputProps={{
                  step: '0.1',
                  min: '30',
                  max: '150'
                }}
              />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {loading ? 'Saving...' : 'Save Growth Record'}
              </Button>
            </Grid>
          </Grid>
        </form>
        
        {result && (
          <Box sx={{ mt: 4, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>Results</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2">Weight Z-Score: {result.z_score_weight?.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Height Z-Score: {result.z_score_height?.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2">
                  Growth Status: {result.classification || 'Normal'}
                </Typography>
                {result.anomaly && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Anomaly detected in growth pattern
                  </Alert>
                )}
              </Grid>
            </Grid>
          </Box>
        )}
      </StyledPaper>
    </LocalizationProvider>
  );
};

export default GrowthEntryForm;
