#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwesomeNetworkStack } from '../lib/awesome/stacks/network';
import { AwesomeAppStack } from '../lib/awesome/stacks/app';
import { AwesomeDatabaseStack } from '../lib/awesome/stacks/database';
import ec2 = require('@aws-cdk/aws-ec2');

const app = new cdk.App();

const org = 'awesome';

const commonProps = {
  org: org,
  maxAzs: 2,
  domainName: 'aws.learncdk.com',
  domainZoneId: 'Z01579783AM6CR1D6G2HK',
  env: {
    account: '380653657229',
    region: 'us-west-1'
  },
  sshKeyName: 'learncdk'
};
const props = [
  {
    environment: 'dev',
    cidr: '10.2.0.0/16',
    dbEngine: 'mysql',
    dbInstanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.SMALL),
    ...commonProps,
  },
  {
    environment: 'prod',
    cidr: '10.1.0.0/16',
    dbEngine: 'aurora',
    dbInstanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.SMALL),
    ...commonProps,
  }
]
for (const envProps of props){
  const networkStack = new AwesomeNetworkStack(app, `${envProps.org}-${envProps.environment}-network`, envProps);

  const dbStack = new AwesomeDatabaseStack(app, `${envProps.org}-${envProps.environment}-db`, {...envProps, vpc: networkStack.vpc });
  if (envProps.dbEngine === 'aurora') {
    dbStack.launchAuroraCluster();
  }
  if (envProps.dbEngine === 'mysql') {
    dbStack.launchMysqlCluster();
  }
  const appStack = new AwesomeAppStack(app, `${envProps.org}-${envProps.environment}-app`, {...envProps, vpc: networkStack.vpc });
  if (envProps.environment == 'dev') {
    appStack.enableDaytimeOnly();
  }
  if (envProps.environment == 'prod') {
    appStack.terminateSSL('arn:aws:acm:us-west-1:380653657229:certificate/a4d192e6-8920-4a5b-a864-386e3dd46e8e');
    appStack.enableCpuScaling();
  }
  const appServerSecurityGroup = appStack.securityGroup;
  const dbServerSecurityGroup = dbStack.securityGroup;
  dbServerSecurityGroup.addIngressRule(appServerSecurityGroup, ec2.Port.tcp(3306), 'allow app servers')
}