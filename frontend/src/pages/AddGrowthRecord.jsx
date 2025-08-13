import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CircularProgress,
  FormHelperText,
  InputAdornment,
  Autocomplete
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, differenceInMonths, parseISO } from 'date-fns';
import { growthApi, babyApi } from '../services/api';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
  maxWidth: 1000,
  margin: '0 auto',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(3),
  fontWeight: 600,
  fontSize: '1.25rem',
}));

const AddGrowthRecord = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    baby_id: '',
    baby_name: '',
    gender: 'male',
    birth_date: null,
    measurement_date: new Date(),
    weight_kg: '',
    height_cm: '',
  });
  
  const [babies, setBabies] = useState([]);
  const [loadingBabies, setLoadingBabies] = useState(true);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [isNewBaby, setIsNewBaby] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (name) => (date) => {
    const newFormData = {
      ...formData,
      [name]: date
    };
    
    setFormData(newFormData);
    
    // Calculate age in months if both dates are available
    if (name === 'birth_date' || name === 'measurement_date') {
      if (newFormData.birth_date && newFormData.measurement_date) {
        const months = differenceInMonths(
          newFormData.measurement_date,
          newFormData.birth_date
        );
        setAgeMonths(months > 0 ? months : 0);
      }
    }
  };

  const validateForm = () => {
    if (!formData.baby_name) {
      setError('Please enter baby\'s name');
      return false;
    }
    if (!formData.birth_date) {
      setError('Please select birth date');
      return false;
    }
    if (!formData.measurement_date) {
      setError('Please select measurement date');
      return false;
    }
    if (formData.measurement_date < formData.birth_date) {
      setError('Measurement date cannot be before birth date');
      return false;
    }
    if (!formData.weight_kg || isNaN(formData.weight_kg) || formData.weight_kg <= 0) {
      setError('Please enter a valid weight');
      return false;
    }
    if (!formData.height_cm || isNaN(formData.height_cm) || formData.height_cm <= 0) {
      setError('Please enter a valid height');
      return false;
    }
    return true;
  };

  // Fetch babies list on component mount
  useEffect(() => {
    const fetchBabies = async () => {
      try {
        const { data, error } = await babyApi.getAll();
        if (error) throw new Error(error);
        setBabies(data || []);
      } catch (err) {
        console.error('Error fetching babies:', err);
        setError('Failed to load baby profiles');
      } finally {
        setLoadingBabies(false);
      }
    };

    fetchBabies();
  }, []);

  // Update age in months when dates change
  useEffect(() => {
    if (formData.birth_date && formData.measurement_date) {
      const months = differenceInMonths(
        formData.measurement_date,
        formData.birth_date
      );
      setAgeMonths(months > 0 ? months : 0);
    }
  }, [formData.birth_date, formData.measurement_date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Prepare payload based on whether it's a new or existing baby
      const payload = {
        baby_id: isNewBaby ? undefined : formData.baby_id,
        name: formData.baby_name,
        gender: formData.gender,
        birth_date: format(formData.birth_date, 'yyyy-MM-dd'),
        date: format(formData.measurement_date, 'yyyy-MM-dd'),
        age_months: ageMonths,
        weight_kg: parseFloat(formData.weight_kg),
        height_cm: parseFloat(formData.height_cm),
      };
      
      // Call the API service
      const { data, error } = await growthApi.create(payload);
      
      if (error) throw new Error(error);
      
      setResult(data);
      
      // Reset form but keep baby selection if it's an existing baby
      setFormData(prev => ({
        ...prev,
        measurement_date: new Date(),
        weight_kg: '',
        height_cm: '',
      }));
      
      // Show success message
      setError('');
      
    } catch (err) {
      console.error('Error submitting growth record:', err);
      setError(err.message || 'Failed to save growth record. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBabySelect = (event, value) => {
    if (value) {
      // Existing baby selected
      setFormData({
        ...formData,
        baby_id: value.id,
        baby_name: value.name,
        gender: value.gender,
        birth_date: parseISO(value.birth_date),
      });
      setIsNewBaby(false);
    } else {
      // New baby
      setFormData({
        ...formData,
        baby_id: '',
        baby_name: '',
        gender: 'male',
        birth_date: null,
      });
      setIsNewBaby(true);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Add Growth Record
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Enter your child's measurements to track their growth and development.
        </Typography>
        
        <StyledPaper elevation={3} sx={{ mt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <SectionTitle>Child Information</SectionTitle>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Autocomplete
                  options={babies}
                  getOptionLabel={(option) => option.name || ''}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onChange={handleBabySelect}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Child or Add New"
                      variant="outlined"
                      size="small"
                      required
                      helperText="Select an existing child or start typing to add a new one"
                    />
                  )}
                  loading={loadingBabies}
                  freeSolo
                  onInputChange={(event, newValue) => {
                    if (event && event.type === 'change') {
                      setFormData(prev => ({
                        ...prev,
                        baby_name: newValue,
                      }));
                      setIsNewBaby(true);
                    }
                  }}
                />
              </Grid>
              
              {isNewBaby && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Child's Name"
                      name="baby_name"
                      value={formData.baby_name}
                      onChange={handleChange}
                      required={isNewBaby}
                      variant="outlined"
                      size="small"
                      disabled={!isNewBaby}
                    />
                  </Grid>
                </>
              )}
              
              {isNewBaby && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      label="Gender"
                      disabled={!isNewBaby}
                    >
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Birth Date"
                  value={formData.birth_date}
                  onChange={handleDateChange('birth_date')}
                  maxDate={new Date()}
                  disabled={!isNewBaby}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      size="small" 
                      required
                      disabled={!isNewBaby}
                      helperText={isNewBaby ? "Required" : "Edit in baby's profile"}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Measurement Date"
                  value={formData.measurement_date}
                  onChange={handleDateChange('measurement_date')}
                  maxDate={new Date()}
                  minDate={formData.birth_date || undefined}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      size="small" 
                      required 
                      helperText="Required"
                    />
                  )}
                />
              </Grid>
              
              {ageMonths !== '' && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Age at measurement: {ageMonths} months
                  </Typography>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <SectionTitle>Measurements</SectionTitle>
              </Grid>
              
              <Grid item xs={12} md={6}>
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
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                    inputProps: {
                      step: '0.1',
                      min: '0.1',
                      max: '50'
                    }
                  }}
                  helperText="Enter weight in kilograms"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
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
                  InputProps={{
                    endAdornment: <InputAdornment position="end">cm</InputAdornment>,
                    inputProps: {
                      step: '0.1',
                      min: '30',
                      max: '150'
                    }
                  }}
                  helperText="Enter height in centimeters"
                />
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => navigate('/')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Saving...' : 'Save Record'}
                </Button>
              </Grid>
            </Grid>
          </form>
          
          {result && (
            <Box sx={{ mt: 4, p: 3, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>Results</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Weight Z-Score:</strong> {result.z_score_weight?.toFixed(2) || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Height Z-Score:</strong> {result.z_score_height?.toFixed(2) || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>Growth Status:</strong> {result.classification || 'Normal'}
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
      </Box>
    </LocalizationProvider>
  );
};

export default AddGrowthRecord;
