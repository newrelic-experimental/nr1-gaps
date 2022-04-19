import React, { useContext } from 'react';
import {
  Stack,
  StackItem,
  HeadingText,
  Layout,
  LayoutItem,
  EmptyState,
  BlockText,
  Popover,
  PopoverBody,
  PopoverTrigger,
  Icon,
  Button,
  AccountPicker
} from 'nr1';
import DataContext from '../context/data';
import QuickStart from './quickStart';
import Results from './results';
import TagModal from './tags/modal';

function GapDetector() {
  const dataContext = useContext(DataContext);
  const {
    updateDataState,
    fetchingHostGuids,
    fetchingHostData,
    scanning,
    scanComplete,
    scanData,
    entityCount,
    entitiesCollected,
    entitiesProcessed,
    selectedAccountId
  } = dataContext;

  const renderFetchingHostGuids = () => {
    return (
      <EmptyState
        title="Hold tight — fetching entities"
        description={`${entitiesCollected} entities`}
        type={EmptyState.TYPE.LOADING}
      />
    );
  };

  const renderFetchingHostData = () => {
    const completePercentage = (
      (entitiesProcessed / entitiesCollected) *
      100
    ).toFixed(2);
    const percentageTxt = entitiesProcessed ? `${completePercentage}%` : '';
    return (
      <EmptyState
        title={`Hold tight — fetching host data ${percentageTxt}`}
        description={`${entitiesCollected} entities`}
        type={EmptyState.TYPE.LOADING}
      />
    );
  };

  return (
    <>
      <TagModal />
      <Layout>
        <LayoutItem>
          <Stack directionType={Stack.DIRECTION_TYPE.VERTICAL} fullWidth>
            <StackItem style={{ width: '100%' }}>
              <HeadingText
                type={HeadingText.TYPE.HEADING_3}
                style={{
                  paddingBottom: '0px',
                  marginBottom: '1px',
                  fontSize: '18px'
                }}
              >
                Active Gap Detector
              </HeadingText>
              <BlockText
                type={BlockText.TYPE.PARAGRAPH}
                style={{ float: 'left' }}
              >
                {entityCount} entities found&nbsp;&nbsp;
                <Popover openOnHover>
                  <PopoverTrigger>
                    <Icon type={Icon.TYPE.INTERFACE__INFO__INFO} />
                  </PopoverTrigger>
                  <PopoverBody>
                    <BlockText>
                      &nbsp;Ensure you subscribe this app to the relevant
                      accounts that you wish to look for Active Gaps&nbsp;
                    </BlockText>
                  </PopoverBody>
                </Popover>
              </BlockText>
            </StackItem>
            <StackItem>
              <QuickStart />
              {/* <Button
                onClick={() =>
                  navigation.openStackedNerdlet({
                    id: 'setup-nerdlets.setup-java-integration'
                  })
                }
              >
                test
              </Button> */}
            </StackItem>
            <StackItem style={{ marginBottom: '5px' }}>
              <HeadingText
                style={{ marginBottom: '5px' }}
                type={HeadingText.TYPE.HEADING_4}
              >
                Scan
              </HeadingText>
              <AccountPicker
                value={selectedAccountId}
                onChange={(e, selectedAccountId) =>
                  updateDataState({ selectedAccountId })
                }
              />
              &nbsp;
              <Button
                type={Button.TYPE.PRIMARY}
                sizeType={Button.SIZE_TYPE.SMALL}
                disabled={!selectedAccountId || scanning}
                onClick={() => scanData(selectedAccountId)}
              >
                Scan selected
              </Button>
              &nbsp;&nbsp;{' '}
              <Button
                style={{ cursor: 'text' }}
                type={Button.TYPE.PLAIN}
                sizeType={Button.SIZE_TYPE.SMALL}
              >
                OR
              </Button>
              &nbsp;&nbsp;
              <Button
                type={Button.TYPE.PRIMARY}
                sizeType={Button.SIZE_TYPE.SMALL}
                disabled={scanning}
                onClick={() => scanData()}
              >
                Scan all accounts
              </Button>
            </StackItem>
            {scanning && (
              <StackItem style={{ width: '100%' }}>
                {fetchingHostGuids && renderFetchingHostGuids()}
                {fetchingHostData && renderFetchingHostData()}
              </StackItem>
            )}
          </Stack>
          {!scanning && scanComplete && <Results />}
        </LayoutItem>
      </Layout>
    </>
  );
}

export default GapDetector;
