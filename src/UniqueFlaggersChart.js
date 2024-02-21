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
    },
    y: {
      stacked: true,
    },
  },
};

const UniqueFlaggersChart = ({ flagsPerDay }) => {
  const data = {
    labels: Object.keys(flagsPerDay),
    datasets: [
      {
        label: 'Unique Flaggers',
        data: Object.values(flagsPerDay).map(day => Object.keys(day.flaggers).length),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };
  
  return (
    <Bar options={options} data={data} />
  );
};

export default UniqueFlaggersChart;