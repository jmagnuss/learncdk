#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { GogodynamoStack } from '../lib/gogodynamo-stack';

const config = {
  org: 'gogodynamo',
  env: {
    account: '<ACCOUNT_ID>',
    region: 'us-west-1'
  },
  userTableArn: '<TABLE_ARN>',
};

const app = new cdk.App();
new GogodynamoStack(app, 'GogodynamoStack', config);
