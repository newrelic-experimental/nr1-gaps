import React, { useContext, useState } from 'react';
import {
  navigation,
  Card,
  CardHeader,
  CardBody,
  Stack,
  StackItem,
  HeadingText,
  Layout,
  LayoutItem,
  CollapsibleLayoutItem,
  SegmentedControl,
  SegmentedControlItem,
  EmptyState,
  CheckboxGroup,
  Checkbox,
  Button,
  Dropdown,
  DropdownItem,
  DropdownSection
} from 'nr1';
import DataContext from '../../context/data';
import TagBar from '../tags/bar';
import { buildCategories, filterEntities } from '../../context/utils';
import groupBy from 'lodash.groupby';
import EntityTable from './entityTable';

const DEFAULT_INTEGRATIONS = require('../../../../integrations.json');

// eslint-disable-next-line no-unused-vars
export default function Results(props) {
  const dataContext = useContext(DataContext);
  const { hostData, selectedTags } = dataContext;
  const filteredEntities = filterEntities(hostData, selectedTags);
  const categories = buildCategories(filteredEntities);

  const [groupByValue, updateGroupBy] = useState('accountId');
  const [search, updateSearch] = useState('');
  const [categoryValues, updateCategoryValues] = useState([]);
  const [selectedCategory, updateCategory] = useState(
    Object.keys(categories)?.[0]
  );

  const categoryOptions = DEFAULT_INTEGRATIONS[selectedCategory].filter(sc =>
    categories[selectedCategory].includes(sc.id)
  );

  const renderNoEntities = () => {
    return (
      <StackItem>
        <EmptyState
          iconType={
            EmptyState.ICON_TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__ALL_ENTITIES
          }
          title="No results"
          description="Are you in the correct account?"
          type={EmptyState.TYPE.ERROR}
        />
      </StackItem>
    );
  };

  if (filteredEntities.length === 0) {
    return <Stack>{renderNoEntities()}</Stack>;
  }

  const integrationList =
    categoryValues.length === 0
      ? categoryOptions
      : DEFAULT_INTEGRATIONS[selectedCategory].filter(integration =>
          categoryValues.includes(integration.id)
        );

  const allTags = [
    ...new Set(filteredEntities.map(e => e.tags.map(t => t.key)).flat())
  ].filter(t => t.toLowerCase().includes(search.toLowerCase()));

  const commonTags = allTags.filter(
    t =>
      t.toLowerCase().includes('account') ||
      t.toLowerCase().includes('team') ||
      t.toLowerCase().includes('owner') ||
      t.toLowerCase().includes('email') ||
      t.toLowerCase().includes('contact')
  );

  const otherTags = allTags.filter(t => !commonTags.includes(t));

  // inject relevant entities
  integrationList.forEach((integration, i) => {
    const { id } = integration;
    integrationList[i].entities = groupBy(
      (filteredEntities || []).filter(
        e => e?.detectedGaps?.[selectedCategory]?.[id]
      ),
      e => e.tags.find(t => t.key === groupByValue)?.values?.[0]
    );
  });

  return (
    <>
      <Stack directionType={Stack.DIRECTION_TYPE.VERTICAL}>
        <StackItem>
          <HeadingText
            style={{ marginBottom: '5px' }}
            type={HeadingText.TYPE.HEADING_4}
          >
            Results
          </HeadingText>
          <TagBar />
        </StackItem>

        <StackItem style={{ marginTop: '0px' }}>
          <SegmentedControl
            value={selectedCategory}
            onChange={(evt, selectedCategory) => {
              updateCategory(selectedCategory);
              updateCategoryValues([]);
            }}
          >
            <SegmentedControlItem
              disabled={!categories.standard}
              value="standard"
              label={`On Host Integrations ${
                categories.standard ? `(${categories.standard.length})` : ''
              }`}
            />
            <SegmentedControlItem
              disabled={!categories.apm}
              value="apm"
              label={`APM Agents ${
                categories.apm ? `(${categories.apm.length})` : ''
              }`}
            />
            <SegmentedControlItem
              disabled={!categories.flex}
              value="flex"
              label={`Flex Integrations ${
                categories.flex ? `(${categories.flex.length})` : ''
              }`}
            />
          </SegmentedControl>
          &nbsp;
          <Dropdown
            title={`Group By: ${groupByValue}`}
            sectioned
            search={search}
            onSearch={e => updateSearch(e.target.value)}
            style={{ float: 'right' }}
          >
            <DropdownSection title="Common">
              {commonTags.map(t => (
                <DropdownItem key={t} onClick={() => updateGroupBy(t)}>
                  {t}
                </DropdownItem>
              ))}
            </DropdownSection>

            <DropdownSection title="Other">
              {otherTags.map(t => (
                <DropdownItem key={t} onClick={() => updateGroupBy(t)}>
                  {t}
                </DropdownItem>
              ))}
            </DropdownSection>
          </Dropdown>
        </StackItem>
      </Stack>

      <Layout style={{ marginLeft: '5px', marginTop: '10px' }}>
        <CollapsibleLayoutItem
          triggerType={CollapsibleLayoutItem.TRIGGER_TYPE.INBUILT}
          type={LayoutItem.TYPE.SPLIT_LEFT}
          sizeType={LayoutItem.SIZE_TYPE.SMALL}
        >
          <HeadingText
            style={{ paddingTop: '0px', paddingBottom: '5px' }}
            type={HeadingText.TYPE.HEADING_4}
          >
            Available
          </HeadingText>
          <CheckboxGroup
            value={categoryValues}
            onChange={(e, v) => updateCategoryValues(v)}
          >
            {categoryOptions.map(option => (
              <Checkbox key={option.id} label={option.name} value={option.id} />
            ))}
          </CheckboxGroup>
        </CollapsibleLayoutItem>

        <LayoutItem>
          <div>
            <div>
              {selectedCategory === 'flex' && (
                <Button
                  onClick={() =>
                    window.open(
                      'https://github.com/newrelic/nri-flex/tree/master/examples',
                      '_blank'
                    )
                  }
                >
                  View all Flex integrations
                </Button>
              )}
              {integrationList.map(integration => {
                const {
                  id,
                  name,
                  docs,
                  entities,
                  github,
                  installNerdlet
                } = integration;
                const entityGroups = Object.keys(entities);

                return (
                  <Card key={id} collapsible>
                    <CardHeader
                      style={{ marginTop: '0px', marginBottom: '0px' }}
                      title={name}
                    />
                    <CardBody style={{ marginTop: '0px' }}>
                      <div>
                        {docs?.[0] && (
                          <>
                            <Button
                              type={Button.TYPE.PLAIN}
                              onClick={() => window.open(docs?.[0], '_blank')}
                              sizeType={Button.SIZE_TYPE.SMALL}
                            >
                              Docs
                            </Button>
                            &nbsp;
                          </>
                        )}
                        {github && (
                          <>
                            <Button
                              type={Button.TYPE.PLAIN}
                              onClick={() =>
                                window.open(
                                  `https://github.com/${github}`,
                                  '_blank'
                                )
                              }
                              sizeType={Button.SIZE_TYPE.SMALL}
                            >
                              Github
                            </Button>
                            &nbsp;
                          </>
                        )}
                        {installNerdlet && (
                          <>
                            <Button
                              type={Button.TYPE.PLAIN}
                              onClick={() =>
                                navigation.openStackedNerdlet(installNerdlet)
                              }
                              sizeType={Button.SIZE_TYPE.SMALL}
                            >
                              Install
                            </Button>
                            &nbsp;
                          </>
                        )}
                      </div>

                      {entityGroups.map(group => {
                        const groupedEntities = entities[group];

                        return (
                          <Card key={group} collapsible defaultCollapsed>
                            <CardHeader
                              title={`${
                                group === 'undefined' ? 'Unknown' : group
                              } (${groupedEntities.length})`}
                              style={{ marginTop: '0px', marginBottom: '0px' }}
                            />
                            <CardBody style={{ marginTop: '0px' }}>
                              <EntityTable
                                entities={groupedEntities}
                                integration={integration}
                                group={group}
                                category={selectedCategory}
                              />
                            </CardBody>
                          </Card>
                        );
                      })}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        </LayoutItem>
      </Layout>
    </>
  );
}
