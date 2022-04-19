import React, { useState } from 'react';
import {
  Modal,
  Button,
  navigation,
  HeadingText,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
  EntityTitleTableRowCell,
  JsonChart
} from 'nr1';

// eslint-disable-next-line no-unused-vars
export default function EntityTable(props) {
  const { entities, category, integration } = props;
  const { id, installNerdlet, github } = integration;
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Modal hidden={!modalOpen} onClose={() => setModalOpen(false)}>
        <HeadingText type={HeadingText.TYPE.HEADING_3}>
          Detected Data
        </HeadingText>

        <JsonChart data={modalOpen} fullWidth fullHeight />

        <Button onClick={() => setModalOpen(false)}>Close</Button>
      </Modal>

      <Table items={entities}>
        <TableHeader>
          <TableHeaderCell value={({ item }) => item.name}>
            Name
          </TableHeaderCell>
          {['standard', 'apm'].includes(category) && (
            <TableHeaderCell
              value={({ item }) =>
                (item?.detectedGaps?.[category]?.[id]?.processEvents || [])
                  .length
              }
            >
              Detected Processes
            </TableHeaderCell>
          )}
          {['standard', 'apm'].includes(category) && (
            <TableHeaderCell
              value={({ item }) =>
                (item?.detectedGaps?.[category]?.[id]?.containerEvents || [])
                  .length
              }
            >
              Detected Containers
            </TableHeaderCell>
          )}
          {['standard', 'apm'].includes(category) && (
            <TableHeaderCell
              value={({ item }) =>
                (item?.detectedGaps?.[category]?.[id]?.apmComponentEvents || [])
                  .length
              }
            >
              Detected via APM Component
            </TableHeaderCell>
          )}
          <TableHeaderCell value={({ item }) => item.phone}>
            Install
          </TableHeaderCell>
        </TableHeader>

        {({ item }) => {
          const processEvents =
            item?.detectedGaps?.[category]?.[id]?.processEvents || [];
          const containerEvents =
            item?.detectedGaps?.[category]?.[id]?.containerEvents || [];
          const apmComponentEvents =
            item?.detectedGaps?.[category]?.[id]?.apmComponentEvents || [];

          const stackedInstaller = installNerdlet
            ? { ...installNerdlet }
            : undefined;

          if (stackedInstaller) {
            if (stackedInstaller.urlState) {
              stackedInstaller.urlState.accountId = parseInt(
                item.tags.find(t => t.key === 'accountId')?.values?.[0] || 0
              );
            }
          }

          return (
            <TableRow>
              <EntityTitleTableRowCell
                value={item}
                onClick={() => navigation.openStackedEntity(item.guid)}
              />
              {['standard', 'apm'].includes(category) && (
                <TableRowCell>
                  {processEvents.length > 0 && (
                    <Button
                      sizeType={Button.SIZE_TYPE.SMALL}
                      onClick={() => setModalOpen(processEvents)}
                    >
                      View data ({processEvents.length})
                    </Button>
                  )}
                </TableRowCell>
              )}
              {['standard', 'apm'].includes(category) && (
                <TableRowCell>
                  {containerEvents.length > 0 && (
                    <Button
                      sizeType={Button.SIZE_TYPE.SMALL}
                      onClick={() => setModalOpen(containerEvents)}
                    >
                      View data ({containerEvents.length})
                    </Button>
                  )}
                </TableRowCell>
              )}
              {['standard', 'apm'].includes(category) && (
                <TableRowCell>
                  {apmComponentEvents.length > 0 && (
                    <Button
                      sizeType={Button.SIZE_TYPE.SMALL}
                      onClick={() => setModalOpen(apmComponentEvents)}
                    >
                      View data ({apmComponentEvents.length})
                    </Button>
                  )}
                </TableRowCell>
              )}
              <TableRowCell>
                {stackedInstaller && (
                  <Button
                    sizeType={Button.SIZE_TYPE.SMALL}
                    onClick={() =>
                      navigation.openStackedNerdlet(stackedInstaller)
                    }
                  >
                    Install
                  </Button>
                )}
                {category === 'flex' && (
                  <Button
                    sizeType={Button.SIZE_TYPE.SMALL}
                    onClick={() =>
                      window.open(`https://github.com/${github}`, '_blank')
                    }
                  >
                    Install
                  </Button>
                )}
              </TableRowCell>
            </TableRow>
          );
        }}
      </Table>
    </>
  );
}
