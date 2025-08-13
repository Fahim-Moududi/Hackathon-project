import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TablePagination,
  Button, CircularProgress, Alert, Grid, Card, CardContent,
  CardHeader, Divider, IconButton, Tooltip, Chip, useTheme,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { 
  Timeline as TimelineIcon, Add as AddIcon, Refresh as RefreshIcon,
  Edit as EditIcon, Delete as DeleteIcon, Warning as WarningIcon,
  CheckCircle as CheckCircleIcon, ArrowBack as ArrowBackIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';
import { growthApi, babyApi } from '../services/api';
import { styled } from '@mui/material/styles';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip as ChartTooltip, Legend, Filler 
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, ChartTooltip, Legend, Filler
);

// Styled Components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  marginBottom: theme.spacing(3),
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
}));

const ChartContainer = styled(Box)({
  position: 'relative',
  height: '300px',
  width: '100%',
  '& canvas': {
    height: '100% !important',
    width: '100% !important',
  },
});

const StatusChip = styled(Chip)(({ theme, status }) => ({
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
  
  // State management
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
      
      const sortedRecords = [...recordsData].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      setRecords(sortedRecords);
      setFilteredRecords(sortedRecords);
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
    }
  };
  
  // Prepare chart data
  const prepareChartData = (records) => {
    if (!records || records.length === 0) {
      setChartData({ weight: null, height: null });
      return;
    }
    
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
    setPage(0);
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
        title: { display: true, text: 'Measurement Value' },
      },
      zScoreAxis: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Z-Score' },
      },
      x: { title: { display: true, text: 'Age (months)' } },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`,
        },
      },
      legend: { position: 'top' },
    },
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecords();
  };

  // Initial data fetch
  useEffect(() => {
    fetchRecords();
    fetchBabies();
  }, []);

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">Growth History</Typography>
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

      {/* Error Alert */}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

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
                  <IconButton size="small" disabled>
                    <FilterListIcon fontSize="small" />
                  </IconButton>
                }
                disabled={loading || babies.length === 0}
              >
                <MenuItem value="all">All Children</MenuItem>
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

      {/* Records Table */}
      <StyledPaper>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6">Growth Records</Typography>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredRecords.length} of {records.length} total records
          </Typography>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredRecords.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            <TimelineIcon fontSize="large" sx={{ mb: 1, opacity: 0.5 }} />
            <Typography>No growth records found. Add your first record to get started.</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Child</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell>Weight (kg)</TableCell>
                    <TableCell>Height (cm)</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((record) => (
                      <TableRow key={record.id} hover>
                        <TableCell>
                          {format(parseISO(record.date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {babies.find(b => b.id === record.baby_id)?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>{record.age_months} months</TableCell>
                        <TableCell>{record.weight_kg?.toFixed(2)}</TableCell>
                        <TableCell>{record.height_cm?.toFixed(1)}</TableCell>
                        <TableCell>
                          <StatusChip 
                            size="small" 
                            status={record.status || 'normal'} 
                            label={record.status || 'Normal'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              component={Link} 
                              to={`/edit-growth/${record.id}`}
                              disabled={loading}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteRecord(record.id)}
                              disabled={loading}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredRecords.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Rows per page:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
              }
              sx={{
                '& .MuiTablePagination-toolbar': {
                  flexWrap: 'wrap',
                  justifyContent: 'flex-start',
                  gap: 1,
                  p: 1,
                },
                '& .MuiTablePagination-actions': {
                  ml: 'auto',
                },
              }}
            />
          </>
        )}
      </StyledPaper>
    </Box>
  );
};

export default GrowthHistory;
