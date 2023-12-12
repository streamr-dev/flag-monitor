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
  scales: {
    x: {
      stacked: true,
      display: false,
    },
    y: {
      stacked: true,
    },
  },
};
  
const VotesChart = ({ flags }) => {
  const reversedFlags = [...flags].reverse().filter(flag => flag.result !== 'waiting')
  const data = {
    labels: reversedFlags.map(flag => new Date(flag.flaggingTimestamp * 1000).toLocaleString()),
    datasets: [
      {
        label: 'NoKick',
        data: reversedFlags.map(flag => flag.votes.filter(vote => !vote.votedKick).length),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Kick',
        data: reversedFlags.map(flag => flag.votes.filter(vote => vote.votedKick).length),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
    ],
  };
  
  return <Bar options={options} data={data} />;
};

export default VotesChart;