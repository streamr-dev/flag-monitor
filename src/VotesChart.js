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
      display: false,
      grid: {
        drawOnChartArea: false,
      },
    },
    y: {
      stacked: true,
    },
  },
};
  
const VotesChart = ({ flags }) => {
  const filteredFlags = flags.filter(flag => flag.result !== 'waiting')
  const data = {
    labels: filteredFlags.map(flag => new Date(flag.flaggingTimestamp * 1000).toLocaleString()),
    datasets: [
      {
        label: 'NoKick',
        data: filteredFlags.map(flag => flag.votes.filter(vote => !vote.votedKick).length),
        backgroundColor: 'rgb(75, 192, 192)',
      },
      {
        label: 'Kick',
        data: filteredFlags.map(flag => flag.votes.filter(vote => vote.votedKick).length),
        backgroundColor: 'rgb(255, 99, 132)',
      },
    ],
  };
  
  return <Bar options={options} data={data} />;
};

export default VotesChart;