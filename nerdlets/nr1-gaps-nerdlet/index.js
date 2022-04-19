import React, { useEffect, useContext } from 'react';
import { PlatformStateContext, NerdletStateContext, nerdlet, Icon } from 'nr1';
import { DataProvider } from './context/data';
import GapDetector from './components/gapDetector';

function GapDetectorRoot() {
  useEffect(() => {
    nerdlet.setConfig({
      accountPicker: false,
      timePicker: false,
      actionControls: true,
      actionControlButtons: [
        {
          label: 'New Issue',
          type: 'secondary',
          iconType: Icon.TYPE.INTERFACE__SIGN__EXCLAMATION,
          onClick: () =>
            window.open(
              'https://github.com/newrelic-experimental/nr1-gaps/issues/new?assignees=&labels=bug%2C+needs-triage&template=bug_report.md&title=',
              '_blank'
            )
        },
        {
          label: 'Feature Request',
          type: 'secondary',
          iconType: Icon.TYPE.PROFILES__EVENTS__FAVORITE__WEIGHT_BOLD,
          onClick: () =>
            window.open(
              'https://github.com/newrelic-experimental/nr1-gaps/issues/new?assignees=&labels=enhancement%2C+needs-triage&template=enhancement.md&title=',
              '_blank'
            )
        }
      ]
    });
  }, []);

  const platformContext = useContext(PlatformStateContext);
  const nerdletContext = useContext(NerdletStateContext);

  return (
    <div>
      <DataProvider {...platformContext} {...nerdletContext}>
        <GapDetector />
      </DataProvider>
    </div>
  );
}

export default GapDetectorRoot;
