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
      
      // Fetch growth records from the backend
      const { data: recordsData, error: recordsError } = await growthApi.getAll();
      if (recordsError) throw new Error(recordsError);
      
      if (!recordsData || !Array.isArray(recordsData)) {
        throw new Error('Invalid data received from server');
      }
      
      // Sort records by date (newest first for the table)
      const sortedRecords = [...recordsData].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      setRecords(sortedRecords);
      setFilteredRecords(sortedRecords);
      
      // Prepare chart data with the fetched records
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
      const response = await babyApi.getAll();
      if (response.error) throw new Error(response.error);
      
      // Ensure we always set an array, even if data is null/undefined
      const babiesData = Array.isArray(response.data) ? response.data : 
                       (response.data && Array.isArray(response.data.results)) ? response.data.results : [];
      
      setBabies(babiesData);
      
      // If there's only one baby, select it by default
      if (babiesData.length === 1) {
        setSelectedBaby(String(babiesData[0].id));
      }
    } catch (err) {
      console.error('Error fetching babies:', err);
      // Set empty array on error to prevent map errors
      setBabies([]);
    }
  };
  
  // Helper function to get z-score from a record
  const getZScore = (record, type) => {
    if (!record) return null;
    
    // Check for direct z_score properties first
    if (type === 'weight' && record.z_score_weight !== undefined) {
      return record.z_score_weight;
    } else if (type === 'height' && record.z_score_height !== undefined) {
      return record.z_score_height;
    }
    
    // Check for nested z_scores object
    if (record.z_scores) {
      if (type === 'weight' && record.z_scores.weight !== undefined) {
        return record.z_scores.weight;
      } else if (type === 'height' && record.z_scores.height !== undefined) {
        return record.z_scores.height;
      }
    }
    
    return null;
  };

  // Prepare chart data
  const prepareChartData = (records) => {
    if (!records || records.length === 0) {
      setChartData({ weight: null, height: null });
      return;
    }
    
    // Sort by age_months for proper chart rendering
    const sortedByAge = [...records].sort((a, b) => a.age_months - b.age_months);
    
    // Helper function to safely parse z-scores
    const getZScore = (record, type) => {
      // First try direct property access
      if (record[`z_score_${type}`] !== undefined && record[`z_score_${type}`] !== null) {
        return record[`z_score_${type}`];
      }
      // Then check if z_scores object exists
      if (record.z_scores && record.z_scores[type] !== undefined) {
        return record.z_scores[type];
      }
      // Default to null if not found
      return null;
    };
    
    // Weight Chart Data
    const weightData = {
      labels: sortedByAge.map(record => `${record.age_months} mo`),
      datasets: [
        {
          label: 'Weight (kg)',
          data: sortedByAge.map(record => record.weight_kg),
          borderColor: theme.palette.primary.main,
          backgroundColor: `${theme.palette.primary.main}20`,
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'Weight Z-Score',
          data: sortedByAge.map(record => getZScore(record, 'weight')),
          borderColor: theme.palette.secondary.main,
          borderWidth: 2,
          borderDash: [5, 5],
          backgroundColor: 'transparent',
          tension: 0.3,
          yAxisID: 'zScoreAxis',
        }
      ]
    };
    
    // Height Chart Data
    const heightData = {
      labels: sortedByAge.map(record => `${record.age_months} mo`),
      datasets: [
        {
          label: 'Height (cm)',
          data: sortedByAge.map(record => record.height_cm),
          borderColor: theme.palette.success.main,
          borderWidth: 2,
          backgroundColor: `${theme.palette.success.main}20`,
          tension: 0.3,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'Height Z-Score',
          data: sortedByAge.map(record => getZScore(record, 'height')),
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
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Age (months)'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { 
          display: true, 
          text: 'Measurement (kg/cm)' 
        },
        beginAtZero: true
      },
      zScoreAxis: {
        type: 'linear',
        display: true,
        position: 'right',
        title: { 
          display: true, 
          text: 'Z-Score (SD)' 
        },
        grid: {
          drawOnChartArea: false
        },
        min: -3,
        max: 3,
        ticks: {
          stepSize: 1,
          callback: value => `${value} SD`
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2);
              if (label.includes('Z-Score')) {
                label += ' SD';
              } else if (label.includes('kg')) {
                label += ' kg';
              } else if (label.includes('cm')) {
                label += ' cm';
              }
            }
            return label;
          }
        }
      },
      legend: {
        position: 'top'
      }
    },
    elements: {
      line: {
        tension: 0.3
      },
      point: {
        radius: 4,
        hoverRadius: 6
      }
    }
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
                renderValue={(selected) => {
                  if (selected === 'all') return 'All Children';
                  const baby = babies.find(b => String(b.id) === selected);
                  return baby ? baby.name : 'Select a child';
                }}
              >
                <MenuItem value="all">
                  <em>All Children</em>
                </MenuItem>
                {Array.isArray(babies) && babies.map((baby) => (
                  <MenuItem key={baby.id} value={String(baby.id)}>
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
                <Tooltip title="Refresh data">
                  <IconButton 
                    onClick={handleRefresh} 
                    disabled={refreshing}
                    color="primary"
                    size="small"
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <Divider />
            <CardContent>
              <ChartContainer>
                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress size={24} />
                  </Box>
                ) : (!chartData.weight || chartData.weight.labels.length === 0) ? (
                  <Box 
                    display="flex" 
                    justifyContent="center" 
                    alignItems="center" 
                    height="100%"
                    minHeight="200px"
                    color="text.secondary"
                    textAlign="center"
                    p={2}
                  >
                    <Typography variant="body1">
                      No weight data available. Add your first record to see the chart.
                    </Typography>
                  </Box>
                ) : (
                  <Line 
                    data={chartData.weight} 
                    options={chartOptions}
                    redraw={refreshing}
                  />
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
                <Tooltip title="Refresh data">
                  <IconButton 
                    onClick={handleRefresh} 
                    disabled={refreshing}
                    color="primary"
                    size="small"
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <Divider />
            <CardContent>
              <ChartContainer>
                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress size={24} />
                  </Box>
                ) : (!chartData.height || chartData.height.labels.length === 0) ? (
                  <Box 
                    display="flex" 
                    justifyContent="center" 
                    alignItems="center" 
                    height="100%"
                    minHeight="200px"
                    color="text.secondary"
                    textAlign="center"
                    p={2}
                  >
                    <Typography variant="body1">
                      No height data available. Add your first record to see the chart.
                    </Typography>
                  </Box>
                ) : (
                  <Line 
                    data={chartData.height} 
                    options={chartOptions}
                    redraw={refreshing}
                  />
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
                    <TableCell align="right">Age</TableCell>
                    <TableCell align="right">Weight (kg)</TableCell>
                    <TableCell align="right">Height (cm)</TableCell>
                    <TableCell align="right">Weight Z-Score</TableCell>
                    <TableCell align="right">Height Z-Score</TableCell>
                    <TableCell>Status</TableCell>
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
                            {getZScore(record, 'weight') !== null ? getZScore(record, 'weight').toFixed(2) : 'N/A'}
                          </TableCell>
                          <TableCell align="right">
                            {getZScore(record, 'height') !== null ? getZScore(record, 'height').toFixed(2) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {record.classification || 'Normal'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary" gutterBottom>
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
