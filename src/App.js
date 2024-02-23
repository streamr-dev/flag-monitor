import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Spinner } from 'react-bootstrap'
import { toBigInt, formatEther } from 'ethers';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import FlagChart from './FlagChart';
import VotesChart from './VotesChart';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import UniqueFlaggersChart from './UniqueFlaggersChart';
import VoteAlignmentChart from './VoteAlignmentChart';

const FETCH_DAYS = 14
const PAGE_SIZE = 1000

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
const getFlagsQuery = (flaggingDateGreaterThanSeconds) => gql`
query MyQuery {
  flags(
    orderBy: flaggingTimestamp, 
    orderDirection: asc, 
    first: ${PAGE_SIZE},
    where: {flaggingTimestamp_gt: ${flaggingDateGreaterThanSeconds}}
  ) {
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
const startDate = new Date(Date.now() - FETCH_DAYS * 24 * 60 * 60 * 1000);
startDate.setUTCHours(0, 0, 0, 0);
const startDateTimestamp = Math.floor(startDate.getTime() / 1000);

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

  const [flags, setFlags] = useState([])
  const [loadingFlags, setLoadingFlags] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    setFlags([])
    setLoadingFlags(true)
    ;(async () => {
      let startDate = startDateTimestamp

      while (true) {
        console.log(`Fetching flags starting from ${startDate}`)
        let query = getFlagsQuery(startDate)
        const apolloClient = NETWORKS[selectedNetwork].apolloClient

        try {
          const { data } = await apolloClient.query({
            query: query
          });

          if (data.flags.length) {
            setFlags((f) => [...f, ...data.flags]);

            // Fetch next page
            startDate = data.flags[data.flags.length-1].flaggingTimestamp
            console.log(`Got ${data.flags.length} flags. startDate for next page is ${startDate}`)
          } else {
            console.log(`Didn't find any further flags starting from date ${startDate}`)
            // Stop the iteration
            break
          }
        } catch (error) {
          setError(true);
          console.error("Error fetching flags:", error);
          break
        }
      }
      setLoadingFlags(false)
    })()
  }, []);

  const flagsPerDay = useMemo(() => flags.reduce((acc, flag) => {
    const flagDate = new Date(flag.flaggingTimestamp * 1000);
    const flagDay = `${flagDate.getUTCFullYear()}-${flagDate.getUTCMonth() + 1}-${flagDate.getUTCDate()}`;
  
    if (!acc[flagDay]) {
      acc[flagDay] = { total: 0, results: {}, flaggers: {} };
    }
  
    acc[flagDay].total++;
    acc[flagDay].flaggers[flag.flagger.id] = true
  
    if (!acc[flagDay].results[flag.result]) {
      acc[flagDay].results[flag.result] = 0;
    }
  
    acc[flagDay].results[flag.result]++;
  
    return acc;
  }, {}), [flags]);

  function countFlagsBy(flags, getIdFn, getOperatorFn) {
    const flagCountById = flags.reduce(
      (acc, flag) => {
        const id = getIdFn(flag)
        if (!acc[id]) {
          acc[id] = {
            count: 1,
            operator: getOperatorFn(flag)
          }
        }
        else {
          acc[id].count++
        }

        return acc;
      },
      {}
    )
    return Object.values(flagCountById).sort((a, b) => b.count - a.count).map(item => ({...item.operator, count: item.count}))
  }

  const topFlaggers = useMemo(() => countFlagsBy(flags, (flag) => flag.flagger.id, (flag) => flag.flagger), [flags]);
  const topTargets = useMemo(() => countFlagsBy(flags, (flag) => flag.target.id, (flag) => flag.target), [flags]);

  const networkConfig = NETWORKS[selectedNetwork]

  console.log(topFlaggers)

  if (loadingFlags) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spinner animation="grow"/>
    </div>
  )
  if (error) return <p>Error :(</p>;

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

        <Row>
          <Col lg={6}>
            <div className='chartsContainer'>
              <div className='flagChart'>
                <FlagChart flagsPerDay={flagsPerDay} />
              </div>
            </div>
          </Col>
          <Col lg={6}>
            <div className='chartsContainer'>
              <div className='flagChart'>
                <UniqueFlaggersChart flagsPerDay={flagsPerDay} />
              </div>
            </div>
          </Col>
        </Row>
        
        <div className='chartsContainer'>
          <div className='flagChart'>
            <VotesChart flags={flags} />
          </div>
        </div>

        <div className='chartsContainer'>
          <div className='flagChart'>
            <VoteAlignmentChart flags={flags} />
          </div>
        </div>
        
        <Row style={{marginTop: '40px', marginBottom: '40px'}}>
            <Col lg={6}>
                <table>
                  <thead>
                    <tr>
                      <th>Frequent Flaggers</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topFlaggers.slice(0, 5).map((operator) => (
                      <tr>
                        <td>
                          <a href={`${networkConfig.hubBaseUrl}/network/operators/${operator.id}`} target="_blank" rel="noreferrer">
                            {JSON.parse(operator.metadataJsonString).name}
                          </a>
                        </td>
                        <td>{operator.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </Col>

            <Col lg={6}>
                <table>
                  <thead>
                    <tr>
                      <th>Frequent Targets</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTargets.slice(0, 5).map((operator) => (
                      <tr>
                        <td>
                          <a href={`${networkConfig.hubBaseUrl}/network/operators/${operator.id}`} target="_blank" rel="noreferrer">
                            {JSON.parse(operator.metadataJsonString).name}
                          </a>
                        </td>
                        <td>{operator.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </Col>
        </Row>

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
            {[...flags].reverse().map((flag) => (
              <FlagInfo key={flag.id} flag={flag} network={networkConfig} />
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}

export default App;
