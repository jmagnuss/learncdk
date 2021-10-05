#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AnonFilesStack } from '../lib/anonfiles-stack';

const app = new cdk.App();
new AnonFilesStack(app, 'AnonfilesStack');
