import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Divider, 
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { 
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  Facebook as FacebookIcon,
  Apple as AppleIcon
} from '@mui/icons-material';
import authService from '../services/authService';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    showPassword: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { username, password, showPassword } = formData;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleClickShowPassword = () => {
    setFormData({
      ...formData,
      showPassword: !formData.showPassword,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      return setError('Please fill in all fields');
    }
    
    try {
      setError('');
      setLoading(true);
      
      await authService.login({
        username,
        password,
      });
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
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
          maxHeight: '800px',
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
            p: { xs: 4, sm: 6, md: 8 },
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
              maxWidth: '400px',
              width: '100%',
              mx: 'auto',
              my: 'auto'
            }}
          >
            <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 'bold' }}>
              Welcome Back!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Please sign in to your account
            </Typography>
            
            {/* Social Login Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<GoogleIcon />}
                sx={{ py: 1.5, borderRadius: 2 }}
              >
                Google
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<FacebookIcon />}
                sx={{ py: 1.5, borderRadius: 2 }}
              >
                Facebook
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<AppleIcon />}
                sx={{ py: 1.5, borderRadius: 2 }}
              >
                Apple
              </Button>
            </Box>
            
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>
            
            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit}>
              {error && (
                <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
                  {error}
                </Typography>
              )}
              
              <TextField
                fullWidth
                label="Username"
                name="username"
                type="text"
                value={username}
                onChange={handleChange}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handleChange}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <FormControlLabel
                  control={<Checkbox value="remember" color="primary" />}
                  label="Remember me"
                />
                <Button component={Link} to="/forgot-password" color="primary">
                  Forgot Password?
                </Button>
              </Box>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  mb: 2,
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)',
                  }
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              
              <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                Don't have an account?{' '}
                <Button 
                  component={Link} 
                  to="/signup" 
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 600,
                    p: 0,
                    '&:hover': {
                      background: 'none'
                    }
                  }}
                >
                  Sign Up
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
              background: 'url(https://source.unsplash.com/random/800x600?technology) center/cover no-repeat',
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
              Welcome to Our Platform
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mb: 4 }}>
              Join thousands of users who trust our platform for their needs. 
              Experience seamless integration and powerful features.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
