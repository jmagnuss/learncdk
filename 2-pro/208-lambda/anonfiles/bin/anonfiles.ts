#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AnonFilesStack } from '../lib/anonfiles-stack';

const config = {
  bucketName: 'anonfiles-storage',
  domainName: 'aws.learncdk.com',
  subdomain: 'anonfiles',
  env: {
    account: '380653657229',
    region: 'us-west-1'
  }

};

const app = new cdk.App();
new AnonFilesStack(app, 'AnonfilesStack', config);
