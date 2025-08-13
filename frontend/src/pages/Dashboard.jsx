import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardActionArea,
  CardMedia,
  Avatar,
  Divider,
  LinearProgress,
  Chip,
  useTheme
} from '@mui/material';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import {
  Add as AddIcon,
  Timeline as TimelineIcon,
  Notifications as NotificationsIcon,
  ChildCare as ChildCareIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { growthApi } from '../services/api';

// Sample data for the dashboard
const growthData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Weight (kg)',
      data: [3.2, 4.1, 4.8, 5.5, 6.1, 6.7],
      borderColor: '#1976d2',
      backgroundColor: 'rgba(25, 118, 210, 0.1)',
      tension: 0.3,
      fill: true,
    },
    {
      label: 'Height (cm)',
      data: [50, 54, 58, 62, 65, 68],
      borderColor: '#4caf50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      tension: 0.3,
      fill: true,
    },
  ],
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
  },
  scales: {
    y: {
      beginAtZero: false,
    },
  },
};

const StatCard = ({ icon, title, value, color, to }) => (
  <Card 
    elevation={0} 
    sx={{ 
      bgcolor: 'background.paper',
      borderRadius: 2,
      height: '100%',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 3,
      },
    }}
  >
    <CardActionArea component={Link} to={to} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.dark` }}>
            {icon}
          </Avatar>
          <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
            {value}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </CardActionArea>
  </Card>
);

const QuickAction = ({ icon, title, description, to, color = 'primary' }) => (
  <Card 
    elevation={0}
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      height: '100%',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 3,
      },
    }}
  >
    <CardActionArea component={Link} to={to} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.dark`, mr: 2 }}>
            {icon}
          </Avatar>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', color: `${color}.main` }}>
          <Typography variant="button" sx={{ mr: 0.5 }}>
            Get started
          </Typography>
          <ArrowForwardIcon fontSize="small" />
        </Box>
      </CardContent>
    </CardActionArea>
  </Card>
);

const Dashboard = () => {
  const theme = useTheme();
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentRecords = async () => {
      try {
        setLoading(true);
        const { data } = await growthApi.getAll();
        setRecentRecords(data.slice(0, 3)); // Get 3 most recent records
      } catch (error) {
        console.error('Error fetching recent records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentRecords();
  }, []);

  const stats = [
    {
      icon: <ChildCareIcon />,
      title: 'Children',
      value: '3',
      color: 'primary',
      to: '/children',
    },
    {
      icon: <TrendingUpIcon />,
      title: 'Growth Records',
      value: '24',
      color: 'success',
      to: '/history',
    },
    {
      icon: <AssessmentIcon />,
      title: 'Monthly Avg. Growth',
      value: '1.2 kg',
      color: 'warning',
      to: '/reports',
    },
  ];

  const quickActions = [
    {
      icon: <AddIcon />,
      title: 'Add New Record',
      description: 'Record your child\'s latest measurements and track their growth progress.',
      to: '/add-growth',
      color: 'primary',
    },
    {
      icon: <TimelineIcon />,
      title: 'View Growth History',
      description: 'Visualize your child\'s growth patterns and track progress over time.',
      to: '/history',
      color: 'success',
    },
    {
      icon: <NotificationsIcon />,
      title: 'View Alerts',
      description: 'Check for any important growth milestones or concerns.',
      to: '/alerts',
      color: 'warning',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Welcome Back, Parent!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your children's growth and development.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Growth Chart */}
      <Card sx={{ mb: 4, p: 3, borderRadius: 2 }} elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Growth Progress
          </Typography>
          <Button 
            component={Link} 
            to="/history" 
            endIcon={<ArrowForwardIcon />}
            size="small"
          >
            View Details
          </Button>
        </Box>
        <Box sx={{ height: 300 }}>
          <Line data={growthData} options={chartOptions} />
        </Box>
      </Card>

      {/* Quick Actions */}
      <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} md={4} key={index}>
            <QuickAction {...action} />
          </Grid>
        ))}
      </Grid>

      {/* Recent Records */}
      <Card sx={{ mb: 4, p: 3, borderRadius: 2 }} elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Recent Records
          </Typography>
          <Button 
            component={Link} 
            to="/history" 
            endIcon={<ArrowForwardIcon />}
            size="small"
          >
            View All
          </Button>
        </Box>
        
        {loading ? (
          <Box sx={{ width: '100%' }}>
            <LinearProgress />
          </Box>
        ) : recentRecords.length > 0 ? (
          <Grid container spacing={2}>
            {recentRecords.map((record, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" component="div">
                          {record.childName || 'Child Name'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(record.date), 'MMM d, yyyy')} • {record.age} months
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Weight
                          </Typography>
                          <Typography variant="subtitle1">
                            {record.weight} kg
                          </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem />
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Height
                          </Typography>
                          <Typography variant="subtitle1">
                            {record.height} cm
                          </Typography>
                        </Box>
                        <Chip 
                          label={record.status || 'Normal'} 
                          color={record.status === 'Warning' ? 'warning' : 'success'}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <TimelineIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              No growth records found. Add your first record to get started.
            </Typography>
            <Button 
              variant="contained" 
              component={Link} 
              to="/add-growth" 
              startIcon={<AddIcon />}
              sx={{ mt: 2 }}
            >
              Add First Record
            </Button>
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default Dashboard;
