#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {AwesomeNetworkStack} from '../lib/awesome/stacks/network';

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
};

const network = new AwesomeNetworkStack(app, `${org}-${environment}-network`, props);

