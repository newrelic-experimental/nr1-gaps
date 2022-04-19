import React from 'react';
import { Card, CardBody } from 'nr1';

// eslint-disable-next-line no-unused-vars
export default function QuickStart(props) {
  return (
    <>
      <Card>
        <CardBody style={{ marginTop: '0px' }}>
          - Ensure you are generating HOST entities via the Infrastructure
          Agent, Flex or Ansible.
          <br />- Enable{' '}
          <span
            style={{ cursor: 'pointer', color: '#017C86', fontWeight: 'bold' }}
            onClick={() =>
              window.open(
                'https://docs.newrelic.com/docs/infrastructure/install-infrastructure-agent/configuration/infrastructure-agent-configuration-settings/#enable-process-metrics',
                '_blank'
              )
            }
          >
            process metrics
          </span>{' '}
          if using the Infrastructure Agent (temporarily is okay) or;
          <br />- Utilize the container based integrations for additional
          visibility, eg.{' '}
          <span
            style={{ cursor: 'pointer', color: '#017C86', fontWeight: 'bold' }}
            onClick={() =>
              window.open(
                'https://docs.newrelic.com/docs/kubernetes-pixie/kubernetes-integration/installation/kubernetes-integration-install-configure/',
                '_blank'
              )
            }
          >
            Kubernetes
          </span>
          ,{' '}
          <span
            style={{ cursor: 'pointer', color: '#017C86', fontWeight: 'bold' }}
            onClick={() =>
              window.open(
                'https://docs.newrelic.com/docs/infrastructure/elastic-container-service-integration/installation/install-ecs-integration',
                '_blank'
              )
            }
          >
            ECS
          </span>
          ,{' '}
          <span
            style={{ cursor: 'pointer', color: '#017C86', fontWeight: 'bold' }}
            onClick={() =>
              window.open(
                'https://docs.newrelic.com/docs/infrastructure/install-infrastructure-agent/linux-installation/docker-instrumentation-infrastructure-monitoring',
                '_blank'
              )
            }
          >
            Docker
          </span>
          &nbsp;etc.
          {/* <br />- External databases can be detected if APM or cloud
          integrations are installed */}
        </CardBody>
      </Card>
    </>
  );
}
