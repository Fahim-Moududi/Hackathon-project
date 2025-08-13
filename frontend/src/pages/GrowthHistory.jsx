import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TablePagination,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  Tooltip,
  Chip,
  useTheme,
  FormControl,
  InputLabel,
  InputAdornment,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Timeline as TimelineIcon, 
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';
import { growthApi, babyApi } from '../services/api';
import { styled } from '@mui/material/styles';

// Initialize ChartJS
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip as ChartTooltip, 
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

// Styled Components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  marginBottom: theme.spacing(3),
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
  overflow: 'hidden',
}));

const ChartContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  height: '300px',
  width: '100%',
  '& canvas': {
    height: '100% !important',
    width: '100% !important',
  },
}));

const StatusChip = styled(Chip)(({ theme, status = 'normal' }) => ({
  fontWeight: 500,
  textTransform: 'capitalize',
  backgroundColor: status === 'normal' 
    ? theme.palette.success.light 
    : theme.palette.warning.light,
  color: status === 'normal' 
    ? theme.palette.success.contrastText 
    : theme.palette.warning.contrastText,
}));

const GrowthHistory = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedBaby, setSelectedBaby] = useState('all');
  const [babies, setBabies] = useState([]);
  const [chartData, setChartData] = useState({ weight: null, height: null });

  // Fetch growth records
  const fetchRecords = async () => {
    try {
      setLoading(!refreshing);
      setError('');
      
      const { data: recordsData, error: recordsError } = await growthApi.getAll();
      if (recordsError) throw new Error(recordsError);
      
      // Sort records by date (newest first)
      const sortedRecords = [...recordsData].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      setRecords(sortedRecords);
      setFilteredRecords(sortedRecords);
      
      // Prepare chart data
      prepareChartData(sortedRecords);
      
    } catch (err) {
      console.error('Error fetching growth records:', err);
      setError(err.message || 'Failed to load growth records. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fetch baby profiles
  const fetchBabies = async () => {
    try {
      const { data, error } = await babyApi.getAll();
      if (error) throw new Error(error);
      
      setBabies(data || []);
    } catch (err) {
      console.error('Error fetching babies:', err);
      // Don't block the UI for this error
    }
  };
  
  // Prepare chart data
  const prepareChartData = (records) => {
    if (!records || records.length === 0) {
      setChartData({ weight: null, height: null });
      return;
    }
    
    // Sort by age_months for proper chart rendering
    const sortedByAge = [...records].sort((a, b) => a.age_months - b.age_months);
    
    const weightData = {
      labels: sortedByAge.map(record => `${record.age_months} mo`),
      datasets: [
        {
          label: 'Weight (kg)',
          data: sortedByAge.map(record => record.weight_kg),
          borderColor: theme.palette.primary.main,
          backgroundColor: `${theme.palette.primary.main}20`,
          tension: 0.3,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'Weight Z-Score',
          data: sortedByAge.map(record => record.z_score_weight),
          borderColor: theme.palette.secondary.main,
          borderDash: [5, 5],
          backgroundColor: 'transparent',
          tension: 0.3,
          yAxisID: 'zScoreAxis',
        }
      ]
    };
    
    const heightData = {
      labels: sortedByAge.map(record => `${record.age_months} mo`),
      datasets: [
        {
          label: 'Height (cm)',
          data: sortedByAge.map(record => record.height_cm),
          borderColor: theme.palette.success.main,
          backgroundColor: `${theme.palette.success.main}20`,
          tension: 0.3,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'Height Z-Score',
          data: sortedByAge.map(record => record.z_score_height),
          borderColor: theme.palette.warning.main,
          borderDash: [5, 5],
          backgroundColor: 'transparent',
          tension: 0.3,
          yAxisID: 'zScoreAxis',
        }
      ]
    };
    
    setChartData({ weight: weightData, height: heightData });
  };
  
  // Filter records by selected baby
  const handleBabyFilter = (event) => {
    const babyId = event.target.value;
    setSelectedBaby(babyId);
    
    if (babyId === 'all') {
      setFilteredRecords(records);
      prepareChartData(records);
    } else {
      const filtered = records.filter(record => record.baby_id === babyId);
      setFilteredRecords(filtered);
      prepareChartData(filtered);
    }
    setPage(0); // Reset to first page when filtering
  };
  
  // Handle record deletion
  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await growthApi.delete(recordId);
      if (error) throw new Error(error);
      
      // Refresh records after deletion
      fetchRecords();
    } catch (err) {
      console.error('Error deleting record:', err);
      setError(err.message || 'Failed to delete record');
      setLoading(false);
    }
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Measurement Value',
        },
      },
      zScoreAxis: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Z-Score',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Age (months)',
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toFixed(2)}`;
          },
        },
      },
      legend: {
        position: 'top',
      },
    },
  };

  useEffect(() => {
    fetchRecords();
    fetchBabies();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecords();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Growth History
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            to="/add-growth"
            disabled={loading}
          >
            Add Record
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filter Section */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="baby-filter-label">Filter by Child</InputLabel>
              <Select
                labelId="baby-filter-label"
                value={selectedBaby}
                onChange={handleBabyFilter}
                label="Filter by Child"
                startAdornment={
                  <InputAdornment position="start">
                    <FilterListIcon color="action" />
                  </InputAdornment>
                }
                disabled={loading || babies.length === 0}
              >
                <MenuItem value="all">
                  <em>All Children</em>
                </MenuItem>
                {babies.map((baby) => (
                  <MenuItem key={baby.id} value={baby.id}>
                    {baby.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
              {selectedBaby !== 'all' ? ` for ${babies.find(b => b.id === selectedBaby)?.name || 'selected child'}` : ''}
            </Typography>
          </Grid>
        </Grid>
      </Card>
      
      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Weight Progress" 
              action={
                <Tooltip title="Weight-for-age Z-scores (WAZ) indicate how a child's weight compares to the WHO growth standards.">
                  <WarningIcon color="action" fontSize="small" sx={{ mt: 1 }} />
                </Tooltip>
              }
            />
            <Divider />
            <CardContent>
              <ChartContainer>
                {chartData.weight ? (
                  <Line data={chartData.weight} options={chartOptions} />
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100%',
                    flexDirection: 'column',
                    gap: 2,
                    color: 'text.secondary'
                  }}>
                    <TimelineIcon fontSize="large" />
                    <Typography>No weight data available</Typography>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      component={Link} 
                      to="/add-growth"
                      startIcon={<AddIcon />}
                    >
                      Add Record
                    </Button>
                  </Box>
                )}
              </ChartContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Height Progress"
              action={
                <Tooltip title="Height-for-age Z-scores (HAZ) indicate how a child's height compares to the WHO growth standards.">
                  <WarningIcon color="action" fontSize="small" sx={{ mt: 1 }} />
                </Tooltip>
              }
            />
            <Divider />
            <CardContent>
              <ChartContainer>
                {chartData.height ? (
                  <Line data={chartData.height} options={chartOptions} />
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100%',
                    flexDirection: 'column',
                    gap: 2,
                    color: 'text.secondary'
                  }}>
                    <TimelineIcon fontSize="large" />
                    <Typography>No height data available</Typography>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      component={Link} 
                      to="/add-growth"
                      startIcon={<AddIcon />}
                    >
                      Add Record
                    </Button>
                  </Box>
                )}
              </ChartContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <StyledPaper>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Growth Records
            {loading && <CircularProgress size={20} />}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh data">
              <IconButton 
                onClick={handleRefresh} 
                disabled={loading}
                size="small"
                color="primary"
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Child</TableCell>
                    <TableCell align="right">Age</TableCell>
                    <TableCell align="right">Weight (kg)</TableCell>
                    <TableCell align="right">Height (cm)</TableCell>
                    <TableCell align="right">Weight Z-Score</TableCell>
                    <TableCell align="right">Height Z-Score</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords.length > 0 ? (
                    filteredRecords
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((record) => (
                        <TableRow 
                          key={record.id} 
                          hover 
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell>
                            {format(parseISO(record.date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            {record.baby_name || 'N/A'}
                          </TableCell>
                          <TableCell align="right">
                            {record.age_months} mo
                          </TableCell>
                          <TableCell align="right">
                            {record.weight_kg ? record.weight_kg.toFixed(1) : 'N/A'}
                          </TableCell>
                          <TableCell align="right">
                            {record.height_cm ? record.height_cm.toFixed(1) : 'N/A'}
                          </TableCell>
                          <TableCell align="right">
                            {record.z_score_weight ? record.z_score_weight.toFixed(2) : 'N/A'}
                          </TableCell>
                          <TableCell align="right">
                            {record.z_score_height ? record.z_score_height.toFixed(2) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <StatusChip 
                              size="small"
                              status={record.anomaly ? 'warning' : 'normal'}
                              label={record.classification || 'Normal'}
                              icon={record.anomaly ? <WarningIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Edit record">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => navigate(`/edit-growth/${record.id}`)}
                                disabled={loading}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete record">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteRecord(record.id)}
                                disabled={loading}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary">
                          No growth records found
                        </Typography>
                        <Button
                          variant="outlined"
                          startIcon={<AddIcon />}
                          component={Link}
                          to="/add-growth"
                          sx={{ mt: 2 }}
                        >
                          Add New Record
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {filteredRecords.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredRecords.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Rows per page:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`}
                sx={{
                  '& .MuiTablePagination-toolbar': {
                    minHeight: '56px',
                  },
                  '& .MuiTablePagination-selectLabel': {
                    margin: 0,
                  },
                  '& .MuiTablePagination-displayedRows': {
                    margin: 0,
                  },
                }}
              />
            )}
          </>
        )}
      </StyledPaper>
  </Box>
  );
};

export default GrowthHistory;
