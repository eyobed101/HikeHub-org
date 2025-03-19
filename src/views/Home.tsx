import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Registering chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Home: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Dummy data for charts
  const chartData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [
      {
        label: 'Total Sales',
        data: [65, 59, 80, 81, 56, 55],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      },
    ],
  };

  useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <Grid container spacing={3}>
        {/* Top Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Earnings</Typography>
              {isLoading ? <Typography>Loading...</Typography> : <Typography>$5000</Typography>}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Orders</Typography>
              {isLoading ? <Typography>Loading...</Typography> : <Typography>300</Typography>}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Income</Typography>
              {isLoading ? <Typography>Loading...</Typography> : <Typography>$1500</Typography>}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Growth</Typography>
              {isLoading ? <Typography>Loading...</Typography> : <Typography>12%</Typography>}
            </CardContent>
          </Card>
        </Grid>

        {/* Chart */}
        <Grid item xs={12} md={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">Sales Growth Over Time</Typography>
              <div style={{ height: '300px' }}>
                <Line data={chartData} />
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default Home;
