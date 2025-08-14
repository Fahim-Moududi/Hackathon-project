import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Divider, 
  FormControlLabel, 
  Checkbox,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Lock as LockIcon, 
  Email as EmailIcon,
  Visibility,
  VisibilityOff,
  ChildCare as ChildCareIcon
} from '@mui/icons-material';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import AppleIcon from '@mui/icons-material/Apple';
import authService from '../services/authService';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    babyName: '',
    gender: 'male',
    birthDate: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { username, email, password, confirmPassword, babyName, gender, birthDate } = formData;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    
    try {
      setError('');
      setLoading(true);
      
      await authService.register({
        username,
        email,
        password,
        babyName,
        gender,
        birthDate
      });
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Main Container */}
      <Box 
        sx={{
          display: 'flex',
          maxWidth: '1200px',
          width: '100%',
          height: '90vh',
          maxHeight: '900px',
          bgcolor: 'background.paper',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: 3,
          position: 'relative',
        }}
      >
        {/* Left Side - Form */}
        <Box 
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: { xs: 4, sm: 6, md: 6 },
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none'
          }}
        >
          <Box 
            sx={{ 
              maxWidth: '600px',  
              width: '100%',
              mx: 'auto',
              my: 'auto',
              '& .MuiFormControl-root': {
                mb: 1.5,  
              },
              '& .MuiButton-root': {
                mt: 1,  
              }
            }}
          >
            <Typography variant="h5" component="h1" sx={{ mb: 2, fontWeight: 'bold' }}>
              Create Your Account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Join our community today
            </Typography>
            
            {/* Social Login Buttons */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <Button
                variant="outlined"
                fullWidth
                size="small"
                startIcon={<GoogleIcon />}
                sx={{ py: 1, borderRadius: 2 }}
              />
              <Button
                variant="outlined"
                fullWidth
                size="small"
                startIcon={<FacebookIcon />}
                sx={{ py: 1, borderRadius: 2 }}
              />
              <Button
                variant="outlined"
                fullWidth
                size="small"
                startIcon={<AppleIcon />}
                sx={{ py: 1, borderRadius: 2 }}
              />
            </Box>
            
            <Divider sx={{ my: 2 }}>
              <Typography variant="caption" color="text.secondary">
                OR
              </Typography>
            </Divider>
            
            {/* Signup Form */}
            <Box component="form" onSubmit={handleSubmit}>
              {error && (
                <Typography color="error" variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
                  {error}
                </Typography>
              )}
              
              <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { sm: '1fr 1fr' }, mb: 1 }}>
                {/* Username */}
                <TextField
                  size="small"
                  fullWidth
                  label="Username"
                  name="username"
                  value={username}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                
                {/* Email */}
                <TextField
                  size="small"
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { sm: '1fr 1fr' }, mb: 1 }}>
                {/* Password */}
                <TextField
                  size="small"
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={handleClickShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                {/* Confirm Password */}
                <TextField
                  size="small"
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              
              <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, fontWeight: 'medium' }}>
                Baby's Information
              </Typography>
              
              <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { sm: '1fr 1fr' }, mb: 1 }}>
                {/* Baby's Name */}
                <TextField
                  size="small"
                  fullWidth
                  label="Baby's Name"
                  name="babyName"
                  value={babyName}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ChildCareIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                
                {/* Baby's Gender */}
                <FormControl fullWidth size="small" required>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    name="gender"
                    value={gender}
                    onChange={handleChange}
                    label="Gender"
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {/* Baby's Birth Date */}
              <TextField
                size="small"
                fullWidth
                label="Birth Date"
                name="birthDate"
                type="date"
                value={birthDate}
                onChange={handleChange}
                required
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Checkbox 
                    size="small" 
                    value="terms" 
                    color="primary" 
                    required 
                    sx={{ py: 0, my: 0 }}
                  />
                }
                label={
                  <Typography variant="caption">
                    I agree to the <Link to="/terms" style={{ color: '#4f46e5', textDecoration: 'none' }}>Terms</Link> and <Link to="/privacy" style={{ color: '#4f46e5', textDecoration: 'none' }}>Privacy</Link>
                  </Typography>
                }
                sx={{ mt: 0.5, mb: 1.5 }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="medium"
                disabled={loading}
                sx={{
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)',
                  }
                }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
              
              <Typography variant="caption" align="center" sx={{ mt: 1, display: 'block' }}>
                Already have an account?{' '}
                <Button 
                  component={Link} 
                  to="/login" 
                  size="small"
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 600,
                    p: 0,
                    minWidth: 'auto',
                    '&:hover': {
                      background: 'none'
                    }
                  }}
                >
                  Sign In
                </Button>
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* Right Side - Image */}
        <Box 
          sx={{
            flex: 1,
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            display: { xs: 'none', lg: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            p: 8,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url(https://source.unsplash.com/random/800x600?baby) center/cover no-repeat',
              opacity: 0.1,
              zIndex: 0
            }
          }}
        >
          <Box sx={{ 
            color: 'white', 
            maxWidth: '500px', 
            zIndex: 1, 
            textAlign: 'center',
            p: 4
          }}>
            <Typography variant="h3" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
              Welcome to Our Family
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mb: 4 }}>
              Track your baby's growth and milestones with our easy-to-use platform. 
              Join thousands of parents who trust us with their baby's journey.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Signup;
