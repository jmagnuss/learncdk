#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwesomeNetworkStack } from '../lib/awesome/stacks/network';
import { AwesomeAppStack } from '../lib/awesome/stacks/app';

const app = new cdk.App();

const org = 'awesome';

const commonProps = {
  org: org,
  maxAzs: 2,
  env: {
    account: '380653657229',
    region: 'us-west-1'
  },
  domainName: 'aws.learncdk.com',
  domainZoneId: 'Z01579783AM6CR1D6G2HK',
};
const props = [
  {
    environment: 'dev',
    cidr: '10.2.0.0/16',
    ...commonProps,
  },
  {
    environment: 'prod',
    cidr: '10.1.0.0/16',
    ...commonProps,
  }
]
for (const envProps of props){
  const networkStack = new AwesomeNetworkStack(app, `${envProps.org}-${envProps.environment}-network`, envProps);

  const appStack = new AwesomeAppStack(app, `${envProps.org}-${envProps.environment}-app`, {...envProps, vpc: networkStack.vpc });
  if (envProps.environment == 'dev') {
    appStack.enableDaytimeOnly();
  }
  if (envProps.environment == 'prod') {
    appStack.terminateSSL('arn:aws:acm:us-west-1:380653657229:certificate/a4d192e6-8920-4a5b-a864-386e3dd46e8e');
    appStack.enableCpuScaling();
  }
}