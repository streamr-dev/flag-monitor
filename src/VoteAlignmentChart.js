import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  LineElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  LineElement,
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
  elements: {
    point:{
      radius: 0
    }
  },
};

function calculateAlignment(votes) {
  let kick = 0
  votes.forEach(vote => (vote.votedKick ? kick++ : null))
  return (votes.length ? Math.max(kick, votes.length - kick) / votes.length : 0)
}
  
const VoteAlignmentChart = ({ flags }) => {
  const filteredFlags = flags.filter(flag => flag.result !== 'waiting')
  const data = {
    labels: filteredFlags.map(flag => new Date(flag.flaggingTimestamp * 1000).toLocaleString()),
    datasets: [
      {
        type: 'line',
        label: 'Vote alignment',
        data: filteredFlags.map(flag => calculateAlignment(flag.votes)),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgb(75, 192, 192)',
        pointRadius: 0,
      },
    ],
  };
  
  return <Line options={options} data={data} />;
};

export default VoteAlignmentChart;