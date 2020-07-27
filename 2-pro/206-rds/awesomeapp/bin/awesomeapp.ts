#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {AwesomeNetworkStack} from '../lib/awesome/stacks/network';
import {AwesomeAppStack} from '../lib/awesome/stacks/app';
import {AwesomeDatabaseStack} from '../lib/awesome/stacks/database';
import ec2 = require('@aws-cdk/aws-ec2');

const app = new cdk.App();

const org = 'awesome';
const environment = 'dev';

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
    dbEngine: 'mysql',
    dbInstanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
    ...commonProps,
  },
  {
    environment: 'prod',
    cidr: '10.1.0.0/16',
    dbEngine: 'aurora',
    dbInstanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
    ...commonProps
  },
];

for (const envProps of props) {
  
  const networkStack = new AwesomeNetworkStack(app, `${envProps.org}-${envProps.environment}-network`, envProps);

  const dbStack = new AwesomeDatabaseStack(app, `${envProps.org}-${envProps.environment}-db`, { ...envProps, vpc: networkStack.vpc });
  let databaseInfo;
  if (envProps.dbEngine == 'aurora') {
    const cluster = dbStack.launchAuroraCluster();
    databaseInfo = cluster.secret;
  }
  if (envProps.dbEngine == 'mysql') {
    dbStack.launchMysqlInstance();
  }

  const appStack = new AwesomeAppStack(app, `${envProps.org}-${envProps.environment}-app`, { ...envProps, vpc: networkStack.vpc, databaseInfo });
  if (envProps.environment == 'dev') {
    appStack.enableDaytimeOnly();
  }
  if (envProps.environment == 'prod') {
    appStack.enableCpuScaling();
    const certificateArn = 'arn:aws:acm:us-west-1:380653657229:certificate/898377be-dd9d-464e-ba40-395b730b63b7';
    appStack.terminateSSL(certificateArn);
  }

  // Allow ingress from EC2 to RDS
  //dbStack.securityGroup.addIngressRule(appStack.securityGroup, ec2.Port.tcp(3306));
}




