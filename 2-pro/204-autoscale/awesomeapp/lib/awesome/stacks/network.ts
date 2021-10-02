import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');

export interface AwesomeNetworkStackProps extends cdk.StackProps {
  org: string,
  environment: string,
  cidr: string,
  maxAzs: number
}

export class AwesomeNetworkStack extends cdk.Stack {

  public readonly vpc: ec2.Vpc;

  constructor(scope: cdk.Construct, id: string, props: AwesomeNetworkStackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, `${props.org}-${props.environment}-vpc`, {
      cidr: props.cidr,
      maxAzs: props.maxAzs,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 28,
        },
        {
          name: 'app',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 24,
        },
        {
          name: 'database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        }
      ]
    });
  }
}
