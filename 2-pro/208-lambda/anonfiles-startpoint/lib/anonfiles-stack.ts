import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';

export interface AnonFilesStackProps extends cdk.StackProps {
  bucketName: string, // storage bucket
  domainName: string, // existing Route53 hosted zone
  subdomain: string,  // new subdomain to create and point at API
}

export class AnonFilesStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // a bucket to store the files

    // a Lambda to list and store files

    // an API gateway to talk to the outside world

    // a Lambda to clean up at midnight

    // a domain name pointed at the API


  }
}
