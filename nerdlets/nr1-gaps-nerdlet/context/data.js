/* eslint
no-console: 0,
no-async-promise-executor: 0,
no-func-assign: 0,
require-atomic-updates: 0,
no-unused-vars: 0
*/

import React, { Component } from 'react';
import { NerdGraphQuery } from 'nr1';
import {
  accountsQuery,
  apmComponentsQuery,
  containerNrqlQuery,
  entityCountQuery,
  getHostGuids,
  hostQuery,
  nrqlQuery,
  processQuery
} from './queries';
import queue from 'async/queue';
import { buildEventString, buildTags, chunk } from './utils';
import { analyzeHostData } from './analyze';

const DataContext = React.createContext();

const QUEUE_LIMIT = 5;
const ENTITY_SEARCH_CHUNK_MAX = 25;
const DEFAULT_INTEGRATIONS = require('../../../integrations.json');

export class DataProvider extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      entityCount: null,
      entityTypes: null,
      accounts: [],
      selectedAccountId: null,
      selectedAccount: null,
      scanComplete: false,
      scanning: false,
      fetchingAccounts: false,
      fetchingHostGuids: false,
      fetchingHostData: false,
      hostGuids: [],
      hostData: [],
      entitiesCollected: 0,
      entitiesProcessed: 0,
      entityTags: {},
      queriedTags: {},
      selectedTags: {},
      integrations: null
    };
  }

  async componentDidMount() {
    this.setIntegrations();
    await this.getAccounts();
    this.getEntityCount();
  }

  async componentDidUpdate() {
    // this.handleUpdate(this.props);
  }

  componentDidCatch(err, errInfo) {
    this.setState({ hasError: true, err, errInfo });
  }

  componentWillUnmount() {
    //
  }

  setIntegrations() {
    return new Promise(resolve => {
      try {
        fetch(
          'https://raw.githubusercontent.com/newrelic-experimental/nr1-gaps/main/integrations.json'
        )
          .then(response => response.json())
          .then(integrations =>
            this.setState({ integrations }, () => resolve())
          )
          .catch(e => {
            console.log('failed to get latest integrations, using defaults');
            console.log(e);
            this.setState({ integrations: DEFAULT_INTEGRATIONS }, () =>
              resolve()
            );
          });
      } catch (e) {
        console.log('failed to get latest integrations, using defaults');
        console.log(e);
        this.setState({ integrations: DEFAULT_INTEGRATIONS }, () => resolve());
      }
    });
  }

  scanData = accountId => {
    return new Promise(resolve => {
      this.setState({ scanning: true, scanComplete: false }, async () => {
        await this.fetchHostGuids(accountId);
        const hostData = await this.fetchHostData();
        analyzeHostData(hostData);
        this.setState({ scanning: false, scanComplete: true, hostData }, () =>
          resolve()
        );
      });
    });
  };

  fetchHostGuids = accountId => {
    return new Promise(resolve => {
      this.setState({ fetchingHostGuids: true }, async () => {
        let hostGuids = [];

        const hostGuidQueue = queue((task, callback) => {
          const { query } = task;

          NerdGraphQuery.query({ query }).then(values => {
            const results = values?.data?.actor?.entitySearch?.results || null;

            if (results) {
              const nextCursor = results?.nextCursor;
              const entities = results?.entities || [];
              hostGuids = [...hostGuids, ...entities];

              if (nextCursor) {
                hostGuidQueue.push({
                  query: getHostGuids(accountId, nextCursor)
                });
              }

              callback();
            } else {
              callback();
            }
          });
        }, QUEUE_LIMIT);

        hostGuidQueue.push({ query: getHostGuids(accountId) });

        this.pollGuidStatus = setInterval(() => {
          this.setState({ entitiesCollected: hostGuids.length });
        }, 2500);

        await hostGuidQueue.drain();

        this.setState({ entitiesCollected: hostGuids.length }, () => {
          clearInterval(this.pollGuidStatus);
        });

        const entityTags = buildTags(hostGuids);

        this.setState({ hostGuids, entityTags, fetchingHostGuids: false }, () =>
          resolve(hostGuids)
        );
      });
    });
  };

  fetchHostData = incomingGuids => {
    const { integrations, hostGuids } = this.state;
    const guids = incomingGuids || hostGuids;
    const eventString = buildEventString(integrations);

    const guidChunks = chunk(
      guids.map(e => e.guid),
      ENTITY_SEARCH_CHUNK_MAX
    );

    return new Promise(resolve => {
      this.setState({ fetchingHostData: true }, async () => {
        let hostData = [];

        const hostDataQueue = queue((guids, callback) => {
          NerdGraphQuery.query({
            query: hostQuery,
            variables: {
              guids,
              nrdbEventsQuery: `SELECT count(*) FROM ${eventString} FACET eventType()`,
              processQuery
            }
          }).then(values => {
            const entities = values?.data?.actor?.entities || [];
            hostData = [...hostData, ...entities];
            callback();
          });
        }, QUEUE_LIMIT);

        // REMOVE SLICE .slice(0, 5)
        hostDataQueue.push(guidChunks);

        await hostDataQueue.drain();
        const queriedTags = buildTags(hostData);

        const extraData = [];
        let entitiesProcessed = 0;

        const extraDataQueue = queue((entity, callback) => {
          entitiesProcessed++;
          const hostname = entity.tags.find(t => t.key === 'hostname')
            ?.values?.[0];
          const accountId = entity.tags.find(t => t.key === 'accountId')
            ?.values?.[0];

          if (hostname && accountId) {
            NerdGraphQuery.query({
              query: nrqlQuery,
              variables: {
                containerQuery: containerNrqlQuery(hostname),
                apmComponentsQuery: apmComponentsQuery(hostname),
                accountId: parseInt(accountId)
              }
            }).then(values => {
              const data = values?.data?.actor?.account || null;

              if (data) {
                const apmComponentData = data?.apmComponentData || [];
                const containerData = data?.containerData || [];

                extraData.push({ apmComponentData, containerData, hostname });
              }
              callback();
            });
          } else {
            callback();
          }
        }, QUEUE_LIMIT);

        extraDataQueue.push(hostData);

        this.pollExtraStatus = setInterval(() => {
          this.setState({ entitiesProcessed });
        }, 2500);

        await extraDataQueue.drain();

        this.setState({ entitiesProcessed }, () => {
          clearInterval(this.pollExtraStatus);
        });

        hostData.forEach(entity => {
          const hostname = entity.tags.find(t => t.key === 'hostname')
            ?.values?.[0];

          for (let z = 0; z < extraData.length; z++) {
            if (extraData[z].hostname === hostname) {
              const { containerData, apmComponentData } = extraData[z];
              entity.containerData = containerData?.results || [];
              entity.apmComponentData = apmComponentData?.results || [];

              break;
            }
          }
        });

        this.setState(
          {
            hostData,
            queriedTags,
            fetchingHostData: false,
            entitiesCollected: 0,
            entitiesProcessed: 0
          },
          () => resolve(hostData)
        );
      });
    });
  };

  getAccounts = () => {
    return new Promise(resolve => {
      this.setState({ fetchingAccounts: true }, () => {
        NerdGraphQuery.query({ query: accountsQuery }).then(value => {
          const accounts = value?.data?.actor?.accounts || [];
          this.setState({ accounts, fetchingAccounts: false }, () =>
            resolve(accounts)
          );
        });
      });
    });
  };

  getEntityCount = () => {
    return new Promise(resolve => {
      NerdGraphQuery.query({ query: entityCountQuery }).then(value => {
        const entitySearchData = value?.data?.actor?.entitySearch;
        const entityCount = entitySearchData?.count || 0;
        const entityTypes = entitySearchData?.type || [];
        this.setState({ entityCount, entityTypes }, () =>
          resolve({ entityCount, entityTypes })
        );
      });
    });
  };

  updateDataState = (stateData, actions) =>
    new Promise(resolve => {
      this.setState(stateData, () => {
        resolve();
      });
    });

  render() {
    const { children } = this.props;

    return (
      <DataContext.Provider
        value={{
          ...this.state,
          updateDataState: this.updateDataState,
          scanData: this.scanData
        }}
      >
        {children}
      </DataContext.Provider>
    );
  }
}

export default DataContext;
export const DataConsumer = DataContext.Consumer;
