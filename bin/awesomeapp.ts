#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwesomeappStack } from '../lib/awesomeapp-stack';

const app = new cdk.App();
new AwesomeappStack(app, 'AwesomeappStack');
