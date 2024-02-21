import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      stacked: true,
      grid: {
        drawOnChartArea: false,
      },
    },
    y: {
      stacked: true,
    },
  },
};

const FlagChart = ({ flagsPerDay }) => {
  const data = {
    labels: Object.keys(flagsPerDay),
    datasets: [
      {
        label: 'Not Kicked',
        data: Object.values(flagsPerDay).map(day => day.results['failed'] || 0),
        backgroundColor: 'rgb(75, 192, 192)',
      },
      {
        label: 'Kicked',
        data: Object.values(flagsPerDay).map(day => day.results['kicked'] || 0),
        backgroundColor: 'rgb(255, 99, 132)',
      },
      {
        label: 'Voting',
        data: Object.values(flagsPerDay).map(day => day.results['voting'] || 0),
        backgroundColor: 'rgb(153, 102, 255)',
      },
    ],
  };
  
  return (
    <Bar options={options} data={data} />
  );
};

export default FlagChart;