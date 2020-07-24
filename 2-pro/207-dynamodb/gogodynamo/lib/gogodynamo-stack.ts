import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as customres from '@aws-cdk/custom-resources';
import * as iam from '@aws-cdk/aws-iam';

export interface GogoDynamoStackProps extends cdk.StackProps {
  org: string,
  userTableArn: string,
}

export class GogodynamoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: GogoDynamoStackProps) {
    super(scope, id, props);

    const userTable = dynamodb.Table.fromTableArn(this, 'userTable', props.userTableArn);
    new cdk.CfnOutput(this, 'UserTableName', { value: userTable.tableName });

    const singleTable = new dynamodb.Table(this, 'bookstoreTable', {
      tableName: 'bookstore',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
    });

    singleTable.addGlobalSecondaryIndex({
      indexName: 'gsi1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },

    });
    new cdk.CfnOutput(this, 'singleTableName', { value: singleTable.tableName });
    new cdk.CfnOutput(this, 'singleTableArn', { value: singleTable.tableArn });

    const fakeCustomer = {
      PK: { S: 'CUSTOMER#jmagnuss' },
      SK: { S: 'CUSTOMER#jmagnuss' },
      firstName: { S: 'Jeff' },
      lastName: { S: 'Magnusson'},
    };
    new customres.AwsCustomResource(this, 'FakeCustomerInserter', {
      onCreate: {
        service: 'DynamoDB',
        action: 'putItem',
        parameters: {
          TableName: singleTable.tableName,
          Item: fakeCustomer,
        },
        physicalResourceId: { id: 'insertFakeCustomer'},
      },
      policy: customres.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'dynamodb:PutItem'
          ],
          resources: [
            singleTable.tableArn
          ]
        })
      ])
    });
  }
}
