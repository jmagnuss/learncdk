#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {AwesomeNetworkStack} from '../lib/awesome/stacks/network';
import {AwesomeAppStack} from '../lib/awesome/stacks/app';

const app = new cdk.App();

const org = 'awesome';
const environment = 'dev';

const props = {
  org: org,
  environment: environment,
  cidr: '10.1.0.0/16',
  maxAzs: 2,
  env: {
    account: '380653657229',
    region: 'us-west-1'
  },
  domainName: 'aws.learncdk.com',
  domainZoneId: 'Z01579783AM6CR1D6G2HK',
};

const networkStack = new AwesomeNetworkStack(app, `${org}-${environment}-network`, props);
const appStack = new AwesomeAppStack(app, `${org}-${environment}-app`, { ...props, vpc: networkStack.vpc });
appStack.enableDaytimeOnly();

props.environment = 'prod';
const appStackProd = new AwesomeAppStack(app, `${org}-prod-app`, { ...props, vpc: networkStack.vpc });
appStackProd.enableCpuScaling();
  const certificateArn = 'arn:aws:acm:us-west-1:380653657229:certificate/898377be-dd9d-464e-ba40-395b730b63b7';
  appStackProd.terminateSSL(certificateArn);

