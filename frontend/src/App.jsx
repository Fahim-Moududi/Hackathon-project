import './App.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddGrowthRecord from './pages/AddGrowthRecord';
import GrowthHistory from './pages/GrowthHistory';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f7fa',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});

// Layout wrapper for protected routes
const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

// Public route wrapper
const PublicLayout = () => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
              </Route>
              
              {/* Protected Routes with Layout */}
              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/add-growth" element={<AddGrowthRecord />} />
                <Route path="/history" element={<GrowthHistory />} />
              </Route>
              
              {/* Catch all other routes */}
              <Route 
                path="*" 
                element={
                  <Navigate to={
                    localStorage.getItem('access_token') ? 
                    "/" : "/login"
                  } replace />
                } 
              />
            </Routes>
          </ThemeProvider>
        </LocalizationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
