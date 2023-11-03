import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import './App.css';
import { ApolloClient, InMemoryCache, gql, useQuery } from '@apollo/client';

const ROOT_URL = 'https://mumbai.streamr.network/hub'

// Initialize Apollo Client
const client = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/samt1803/network-subgraphs',
  cache: new InMemoryCache()
});

// Define GraphQL query
const GET_FLAGS = gql`
query MyQuery {
  flags(orderBy: flaggingTimestamp, orderDirection: desc, first: 50) {
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
    }
  }
}
`;

const VoteDetails = ({ votes }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Voter ID</th>
          <th>Vote</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {votes.map((vote, index) => (
          <tr key={index}>
            <td>{vote.voter.metadataJsonString ? JSON.parse(vote.voter.metadataJsonString).name : vote.voter.id}</td>
            <td>{vote.votedKick ? 'Kick' : 'NoKick'}</td>
            <td>{new Date(vote.timestamp * 1000).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const TableRow = ({ flag }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    if (flag.votes.length > 0) {
      setIsExpanded(!isExpanded);
    }
  };

  const cursorStyle = flag.votes.length > 0 ? { cursor: 'pointer' } : {};

  const flaggerName = flag.flagger.metadataJsonString ? JSON.parse(flag.flagger.metadataJsonString).name : flag.flagger.id;
  const targetName = flag.target.metadataJsonString ? JSON.parse(flag.target.metadataJsonString).name : flag.target.id;

  const resultMapping = {
    failed: 'not kicked',
  }

  const styleMapping = {
    failed: 'nokick',
    kicked: 'kick'
  }

  return (
    <>
      <tr style={cursorStyle} onClick={handleClick}>
        <td>{isExpanded ? '▼' : flag.votes.length > 0 ? '►' : ''}</td>
        <td><a href={`${ROOT_URL}/network/operators/${flag.flagger.id}`} target="_blank" rel="noopener noreferrer">{flaggerName}</a></td>
        <td><a href={`${ROOT_URL}/network/operators/${flag.target.id}`} target="_blank" rel="noopener noreferrer">{targetName}</a></td>
        <td>{new Date(flag.flaggingTimestamp * 1000).toLocaleString()}</td>
        <td>{flag.votes.length}/{flag.reviewerCount}</td>
        <td className={styleMapping[flag.result] || ''}>{resultMapping[flag.result] || flag.result}</td>
        <td>
          <a href={`${ROOT_URL}/network/sponsorships/${flag.sponsorship.id}`} target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faExternalLinkAlt} size="xs"/>
          </a>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan="7">
            <VoteDetails votes={flag.votes} />
          </td>
        </tr>
      )}
    </>
  );
};

function App() {
  const { loading, error, data, refetch } = useQuery(GET_FLAGS, { client });

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 300000); // 300000 ms = 5 minutes

    return () => clearInterval(interval); // Clean up on component unmount
  }, [refetch]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;

  return (
    <div className="App">
      <header className="App-header">
        <h1>Streamr 1.0 Mumbai pre-testnet flags</h1>
      </header>
      <main>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Flagger</th>
              <th>Target</th>
              <th>Timestamp</th>
              <th>Votes</th>
              <th>Result</th>
              <th>Sponsorship</th>
            </tr>
          </thead>
          <tbody>
            {data.flags.map((flag) => (
              <TableRow key={flag.id} flag={flag} />
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}

export default App;
