#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AnonfilesStack } from '../lib/anonfiles-stack';

const app = new cdk.App();
new AnonfilesStack(app, 'AnonfilesStack');
