export const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

export const buildTags = hostGuids => {
  const tags = {};
  hostGuids.forEach(h => {
    (h?.tags || []).forEach(t => {
      const { key, values } = t;
      if (!tags[key]) {
        tags[key] = values;
      } else {
        tags[key] = [...new Set([...tags[key], ...values])];
      }
    });
  });
  return tags;
};

export const buildEventString = integrations => {
  let events = [];

  Object.keys(integrations).forEach(key => {
    const section = integrations[key];
    section.forEach(integration => {
      if (integration.events) {
        events = [...events, ...integration.events];
      }
    });
  });

  const eventString = `\`${events.join('`,`')}\``;

  return eventString;
};

export const filterEntities = (hostData, selectedTags) => {
  const filteredEntities = hostData.filter(h => {
    if (!h.detectedGaps) return false;

    const selectedKeys = Object.keys(selectedTags);

    if (selectedKeys.length > 0) {
      for (let z = 0; z < selectedKeys.length; z++) {
        const foundValues =
          h.tags.find(t => t.key === selectedKeys[z])?.values || [];

        if (foundValues) {
          const selectedValues = Object.keys(
            selectedTags[selectedKeys[z]] || {}
          );

          const found = selectedValues.some(sv =>
            foundValues.some(fv => sv === fv)
          );
          if (found) return true;
        }
      }
      return false;
    }

    // if nothing selected return all
    return true;
  });

  return filteredEntities;
};

export const buildCategories = entities => {
  const categories = { standard: [], flex: [], apm: [] };

  entities.forEach(e => {
    const { detectedGaps } = e;

    if (detectedGaps) {
      Object.keys(detectedGaps).forEach(gap => {
        categories[gap] = [
          ...categories[gap],
          ...Object.keys(detectedGaps[gap] || {})
        ];
      });
    }
  });

  // get unique integrations
  Object.keys(categories).forEach(cat => {
    categories[cat] = [...new Set(categories[cat])];
    if (categories[cat].length === 0) {
      delete categories[cat];
    }
  });

  return categories;
};
