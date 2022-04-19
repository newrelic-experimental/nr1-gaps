const DEFAULT_INTEGRATIONS = require('../../../integrations.json');

export const analyzeHostData = hostData => {
  hostData.forEach(h => {
    const {
      containerData,
      apmComponentData,
      nrdbEvents,
      processData,
      apmEntities,
      tags
    } = h;

    const operatingSystem = tags.find(t => t.key === 'operatingSystem')
      ?.values?.[0];

    const discoveredLanguages = [
      ...new Set(
        (apmEntities?.results || []).map(r => r?.target?.entity?.language)
      )
    ];
    const discoveredEvents = nrdbEvents?.results || [];
    const processEvents = processData?.results || [];
    const detectedGaps = {
      standard: {},
      flex: {},
      apm: {}
    };

    Object.keys(DEFAULT_INTEGRATIONS).forEach(category => {
      const integrations = DEFAULT_INTEGRATIONS[category];
      integrations.forEach(integration => {
        const { matches, id, events, notMatch } = integration;
        const notMatches = notMatch || [];
        const operatingSystems = integration.operatingSystems || [];

        const integrationEventsExist = discoveredEvents.some(discoveredEvent =>
          (events || []).some(event => discoveredEvent === event)
        );

        if (
          category === 'flex' &&
          !integrationEventsExist &&
          operatingSystems.includes(operatingSystem)
        ) {
          detectedGaps[category][id] = true;
        }

        const agentExists =
          category === 'apm' ? discoveredLanguages.includes(id) : false;

        if (
          !integrationEventsExist &&
          !agentExists &&
          matches &&
          (category === 'standard' || category === 'apm')
        ) {
          matches.forEach(match => {
            // check process events
            processEvents.forEach(event => {
              const attributes = [
                (event?.facet || '').toLowerCase(),
                (event?.processDisplayName || '').toLowerCase(),
                (event?.commandLine || '').toLowerCase(),
                (event?.commandName || '').toLowerCase(),
                (event?.containerImageName || '').toLowerCase()
              ];

              const ignoreMatch = attributes.some(a =>
                notMatches.some(n => a.includes(n))
              );

              if (attributes.includes(match) && !ignoreMatch) {
                if (!detectedGaps[category][id]) {
                  detectedGaps[category][id] = {};
                }

                if (!detectedGaps[category][id].processEvents) {
                  detectedGaps[category][id].processEvents = [];
                }

                detectedGaps[category][id].processEvents.push(event);
              }
            });

            // check containerData events
            containerData.forEach(event => {
              const { facet, containerImage } = event;
              const displayName = facet?.[0] || '';
              const containerName = facet?.[1] || '';

              const attributes = [
                (containerImage || '').toLowerCase(),
                (displayName || '').toLowerCase(),
                (containerName || '').toLowerCase()
              ];

              const ignoreMatch = attributes.some(a =>
                notMatches.some(n => a.includes(n))
              );

              if (attributes.includes(match) && !ignoreMatch) {
                if (!detectedGaps[category][id]) {
                  detectedGaps[category][id] = {};
                }

                if (!detectedGaps[category][id].containerEvents) {
                  detectedGaps[category][id].containerEvents = [];
                }

                detectedGaps[category][id].containerEvents.push(event);
              }
            });

            // check apm component events
            apmComponentData.forEach(event => {
              const component = event?.facet || '';
              const attributes = [component.toLowerCase()];

              const ignoreMatch = attributes.some(a =>
                notMatches.some(n => a.includes(n))
              );

              if (attributes.includes(match) && !ignoreMatch) {
                if (!detectedGaps[category][id]) {
                  detectedGaps[category][id] = {};
                }

                if (!detectedGaps[category][id].apmComponentEvents) {
                  detectedGaps[category][id].apmComponentEvents = [];
                }

                detectedGaps[category][id].apmComponentEvents.push(event);
              }
            });
          });
        }
      });
      //
    });

    Object.keys(detectedGaps).forEach(key => {
      if (Object.keys(detectedGaps[key]).length === 0) {
        delete detectedGaps[key];
      }
    });

    if (Object.keys(detectedGaps).length > 0) {
      h.detectedGaps = detectedGaps;
    }

    // console.log(h.name, detectedGaps);
    // console.log(events, processEvents, containerData, apmComponentData);
    //
  });
};
