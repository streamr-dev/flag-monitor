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
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Kicked',
        data: Object.values(flagsPerDay).map(day => day.results['kicked'] || 0),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
      {
        label: 'Voting',
        data: Object.values(flagsPerDay).map(day => day.results['voting'] || 0),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
      },
    ],
  };

  return <Bar options={options} data={data} />;
};

export default FlagChart;