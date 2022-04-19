import { ngql } from 'nr1';

export const accountsQuery = ngql`{
  actor {
    accounts {
      id
      name
      reportingEventTypes
    }
  }
}`;

export const entityCountQuery = ngql`{
  actor {
    entitySearch(query: "type IN ('HOST') and reporting = 'true'", sortBy: TYPE) {
      types {
        domain
        count
        entityType
        type
      }
      count
    }
  }
}`;

export const getHostGuids = (accountId, cursor) => ngql`{
  actor {
    entitySearch(query: "type IN ('HOST') and reporting = 'true' ${
      accountId ? `and tags.accountId IN ('${accountId}')` : ''
    }", sortBy: TYPE) {
      results${cursor ? `(cursor: "${cursor}")` : ''} {
        entities {
          guid
          tags {
            key
            values
          }
        }
        nextCursor
      }
    }
  }
}`;

export const containerQuery = hostname =>
  `FROM K8sContainerSample, ContainerSample SELECT latest(containerImage) as 'containerImage' FACET displayName, containerName LIMIT MAX WHERE hostname = '${hostname}'`;

export const hostQuery = ngql`query Query($guids: [EntityGuid]!, $nrdbEventsQuery: Nrql!, $processQuery: Nrql!) {
  actor {
    entities(guids: $guids) {
      reporting
      alertSeverity
      name
      guid
      domain
      type
      entityType
      tags {
        key
        values
      }
      nrdbEvents: nrdbQuery(nrql: $nrdbEventsQuery) {
        results
        nrql
      }
      processData: nrdbQuery(nrql: $processQuery) {
        results
        nrql
      }
      ignoredSuggestions: nerdStorage {
        collection(collection: "ignoredSuggestions") {
          document
          id
        }
      }
      apmEntities: relatedEntities(filter: {entityDomainTypes: {include: {domain: "APM", type: "APPLICATION"}}}) {
        results {
          target {
            entity {
              ... on ApmApplicationEntityOutline {
                name
                guid
                domain
                applicationId
                account {
                  id
                  name
                }
                language
                reporting
                alertSeverity
                type
                entityType
                tags {
                  key
                  values
                }
              }
            }
          }
        }
      }
    }
  }
}`;

export const nrqlQuery = `query Query($accountId: Int!, $containerQuery: Nrql!, $apmComponentsQuery: Nrql!) {
  actor {
    account(id: $accountId) {
      containerData: nrql(query: $containerQuery) {
        results
      }
      apmComponentData: nrql(query: $apmComponentsQuery) {
        results
      }
    }
  }
}`;

export const processQuery = `SELECT latest(contained) as 'contained', latest(containerImageName) as 'containerImageName',\
 latest(commandLine) as 'commandLine', latest(commandName) as 'commandName', latest(eventType()) as 'eventType', \
 latest(apmApplicationIds) as 'apmApplicationIds' FROM ProcessSample, AnsibleServiceSample FACET processDisplayName LIMIT MAX`;

export const containerNrqlQuery = hostname =>
  `FROM K8sContainerSample, ContainerSample SELECT latest(containerImage) as 'containerImage', \
  latest(apmApplicationNames) as 'apmApplicationNames', latest(hostname) as 'hostname', latest(eventType()) as 'eventType' \
   FACET displayName, containerName LIMIT MAX WHERE hostname = '${hostname}'`;

export const apmComponentsQuery = hostname =>
  `FROM Span SELECT count(*) FACET component LIMIT MAX WHERE hostname = '${hostname}' or host = '${hostname}' SINCE 12 hours ago`;
