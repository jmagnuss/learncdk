import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';
import * as events from '@aws-cdk/aws-events';
import * as eventTargets from '@aws-cdk/aws-events-targets';

export interface AnonFilesStackProps extends cdk.StackProps {
  bucketName: string, // storage bucket
  domainName: string, // existing Route53 hosted zone
  subdomain: string,  // new subdomain to create and point at API
}

export class AnonFilesStack extends cdk.Stack {

  public readonly bucket: s3.Bucket;
  public readonly restApi: apigw.RestApi
  public readonly apiLambda: lambda.Function;
  public readonly cleanupLambda: lambda.Function;

  constructor(scope: cdk.Construct, id: string, props: AnonFilesStackProps) {
    super(scope, id, props);

    // a bucket to store the files
    this.bucket = new s3.Bucket(this, "FileStorage", {
      bucketName: props.bucketName,
    });

    // a Lambda to list and store files
    const lambdaPolicy = new iam.PolicyStatement();
    lambdaPolicy.addActions('s3:ListBucket','s3.Put');
    lambdaPolicy.addResources(this.bucket.bucketArn);

    this.apiLambda = new lambda.Function(this, 'FileApiFunction', {
      code: lambda.Code.fromAsset('lambda'),
      handler: "api.handler",
      runtime: lambda.Runtime.NODEJS_10_X,
      timeout: cdk.Duration.seconds(10),
      environment: {
        BUCKET: this.bucket.bucketName,
      },
      initialPolicy: [lambdaPolicy],
      tracing: lambda.Tracing.ACTIVE
    });

    // an API gateway to talk to the outside world
    this.restApi = new apigw.RestApi(this, "RestApi", {
      deployOptions: {
        metricsEnabled: true,
        loggingLevel: apigw.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
    });
    this.restApi.root.addMethod("GET", new apigw.LambdaIntegration(this.apiLambda, {}))
    this.restApi.root.addMethod("PUT", new apigw.LambdaIntegration(this.apiLambda, {}))

    // a Lambda to clean up at midnight
    const lambdaFn = new lambda.Function(this, 'NightlyCleanup', {
      code: lambda.Code.fromAsset('lambda'),
      handler: "nightlyDelete.handler",
      runtime: lambda.Runtime.NODEJS_10_X,
      timeout: cdk.Duration.seconds(300),
      tracing: lambda.Tracing.ACTIVE
    });
    // Run every day at 6PM UTC
    // See https://docs.aws.amazon.com/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html
    const rule = new events.Rule(this, 'Rule', {
      schedule: events.Schedule.expression('cron(0 18 ? * MON-FRI *)')
    });
    rule.addTarget(new eventTargets.LambdaFunction(lambdaFn));

    /*
    // a domain name pointed at the API
    const zone = route53.HostedZone.fromLookup(this, 'MyZone', {
      domainName: 'example.com'
    });
    // TODO: what subdomain name gets created?  AliasRecord?
    new route53.ARecord(this, 'AliasRecord', {      
      zone,
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(this.restApi)),
      // or - route53.RecordTarget.fromAlias(new alias.ApiGatewayDomainName(domainName)),
    });
    */

  }
}
