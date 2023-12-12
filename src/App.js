import React, { useState, useEffect } from 'react';
import { toBigInt, formatEther } from 'ethers';
import { ApolloClient, InMemoryCache, gql, useQuery } from '@apollo/client';
import FlagChart from './FlagChart';
import VotesChart from './VotesChart';
import './App.css';


const NETWORKS = {
  polygon: {
    hubBaseUrl: 'https://streamr.network/hub',
    apolloClient: new ApolloClient({
      uri: 'https://gateway-arbitrum.network.thegraph.com/api/dd0022f5d4d06f3bd55e0c757912fb7d/subgraphs/id/EGWFdhhiWypDuz22Uy7b3F69E9MEkyfU9iAQMttkH5Rj',
      cache: new InMemoryCache()
    }),
  },
  mumbai: {
    hubBaseUrl: 'https://mumbai.streamr.network/hub',
    apolloClient: new ApolloClient({
      uri: 'https://api.thegraph.com/subgraphs/name/samt1803/network-subgraphs',
      cache: new InMemoryCache()
    }),
  },
}

const DEFAULT_NETWORK = 'polygon'

// Define GraphQL query
const GET_FLAGS = gql`
query MyQuery {
  flags(orderBy: flaggingTimestamp, orderDirection: desc, first: 100) {
    target {
      id
      metadataJsonString
    }
    flagger {
      id
      metadataJsonString
    }
    flaggingTimestamp
    reviewerCount
    id
    metadata
    votesAgainstKick
    votesForKick
    votes {
      voter {
        id
        metadataJsonString
      }
      timestamp
      votedKick
      voterWeight
    }
    result
    sponsorship {
      id
      stream {
        id
      }
    }
    reviewers {
      id
      metadataJsonString
    }
  }
}
`;


// Calculate the timestamp which is at midnight UTC seven full days ago
const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
startDate.setUTCHours(0, 0, 0, 0);
const startDateTimestamp = Math.floor(startDate.getTime() / 1000);

const GET_FLAG_STATS = gql`
query MyQuery {
  flags(
    orderBy: flaggingTimestamp
    orderDirection: asc
    where: {flaggingTimestamp_gt: ${startDateTimestamp}}
    first: 1000
  ) {
    flaggingTimestamp
    result
  }
}
`

const VoteDetails = ({ flag, network }) => {
  const votesByVoterId = {}
  flag.votes.forEach((vote) => {
    votesByVoterId[vote.voter.id] = vote
  })
  return (
    <table>
      <thead>
        <tr>
          <th>Voter ID</th>
          <th>Vote</th>
          <th>Weight</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {flag.reviewers.map((reviewer, index) => {
          const vote = votesByVoterId[reviewer.id]

          return (
          <tr key={index}>
            <td><a href={`${network.hubBaseUrl}/network/operators/${reviewer.id}`} target="_blank" rel="noopener noreferrer">{reviewer.metadataJsonString ? JSON.parse(reviewer.metadataJsonString).name : reviewer.id}</a></td>
            <td>{vote ? (vote.votedKick ? 'Kick' : 'NoKick') : '(didn\'t vote)'}</td>
            <td>{vote ? Math.floor(parseFloat(formatEther(vote.voterWeight))) : ''}</td>
            <td>{vote ? new Date(vote.timestamp * 1000).toLocaleString() : ''}</td>
          </tr>
        )})}
      </tbody>
    </table>
  );
};

const FlagInfo = ({ flag, network }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  const flaggerName = flag.flagger.metadataJsonString ? JSON.parse(flag.flagger.metadataJsonString).name : flag.flagger.id;
  const targetName = flag.target.metadataJsonString ? JSON.parse(flag.target.metadataJsonString).name : flag.target.id;

  const resultMapping = {
    failed: 'not kicked',
  }

  const styleMapping = {
    failed: 'nokick',
    kicked: 'kick'
  }

  const votesForKick = toBigInt(flag.votesForKick)
  const votesAgainstKick = toBigInt(flag.votesAgainstKick)

  const votesForKickFraction = flag.votes.length ? parseFloat(formatEther(votesForKick)) / parseFloat(formatEther(votesForKick + votesAgainstKick)) : 0

  const streamIdComponents = flag.sponsorship.stream.id.split('/')
  const streamLinkText = `${streamIdComponents[0].substring(0,6)}.../${streamIdComponents[streamIdComponents.length-1]}`

  return (
    <>
      <tr style={{cursor: 'pointer'}} onClick={handleClick}>
        <td>{isExpanded ? '▼' : '►'}</td>
        <td><a href={`${network.hubBaseUrl}/network/operators/${flag.flagger.id}`} target="_blank" rel="noopener noreferrer">{flaggerName}</a></td>
        <td><a href={`${network.hubBaseUrl}/network/operators/${flag.target.id}`} target="_blank" rel="noopener noreferrer">{targetName}</a></td>
        <td>{new Date(flag.flaggingTimestamp * 1000).toLocaleString()}</td>
        <td>{flag.votes.length}/{flag.reviewerCount}</td>
        <td>{Math.round(votesForKickFraction*100)}%</td>
        <td className={styleMapping[flag.result] || ''}>{resultMapping[flag.result] || flag.result}</td>
        <td>
          <a href={`${network.hubBaseUrl}/network/sponsorships/${flag.sponsorship.id}`} target="_blank" rel="noopener noreferrer">
            {streamLinkText}
          </a>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan="7">
            <VoteDetails flag={flag} network={network} />
          </td>
        </tr>
      )}
    </>
  );
};

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const selectedNetwork = urlParams.get('network') || DEFAULT_NETWORK;
  const { loading: loadingFlags, error: errorFlags, data: dataFlags, refetch: refetchFlags } = useQuery(GET_FLAGS, { client: NETWORKS[selectedNetwork].apolloClient });
  const { loading: loadingStats, error: errorStats, data: dataStats, refetch: refetchStats } = useQuery(GET_FLAG_STATS, { client: NETWORKS[selectedNetwork].apolloClient });

  useEffect(() => {
    const interval = setInterval(() => {
      refetchFlags();
    }, 300000); // 300000 ms = 5 minutes

    return () => clearInterval(interval); // Clean up on component unmount
  }, [refetchFlags]);

  if (loadingFlags || loadingStats) return <p>Loading...</p>;
  if (errorFlags || errorStats) return <p>Error :(</p>;

  const networkConfig = NETWORKS[selectedNetwork]

  const flagsPerDay = dataStats.flags.reduce((acc, flag) => {
    const flagDate = new Date(flag.flaggingTimestamp * 1000);
    const flagDay = `${flagDate.getUTCFullYear()}-${flagDate.getUTCMonth() + 1}-${flagDate.getUTCDate()}`;
  
    if (!acc[flagDay]) {
      acc[flagDay] = { total: 0, results: {} };
    }
  
    acc[flagDay].total++;
  
    if (!acc[flagDay].results[flag.result]) {
      acc[flagDay].results[flag.result] = 0;
    }
  
    acc[flagDay].results[flag.result]++;
  
    return acc;
  }, {});

  console.log(flagsPerDay)

  return (
    <div className="App">
      <header className="App-header">
        <h1>Streamr 1.0 flag monitor</h1>
      </header>
      <main>
        <div className='networkSelector'>
          <label>Select Network:</label>&nbsp;
          {Object.keys(NETWORKS).map(network => (
            <a key={network} href={`?network=${network}`} className={selectedNetwork === network ? 'selected' : ''}>{network.charAt(0).toUpperCase() + network.slice(1)}</a>
          ))}
        </div>

        <div className='chartsContainer'>
          <div className='flagChart'>
            <FlagChart flagsPerDay={flagsPerDay} />
          </div>
          <div className='flagChart'>
            <VotesChart flags={dataFlags.flags} />
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Flagger</th>
              <th>Target</th>
              <th>Timestamp</th>
              <th>Votes</th>
              <th>KickWeight</th>
              <th>Result</th>
              <th>Sponsorship</th>
            </tr>
          </thead>
          <tbody>
            {dataFlags.flags.map((flag) => (
              <FlagInfo key={flag.id} flag={flag} network={networkConfig} />
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}

export default App;
