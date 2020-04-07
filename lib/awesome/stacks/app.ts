import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');

export interface AwesomeAppStackProps extends cdk.StackProps {
  org: string,
  environment: string,
  vpc: ec2.IVpc,
  sshKeyName: string,
}

export class AwesomeAppStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props: AwesomeAppStackProps) {
    super(scope, id, props);

    const securityGroup = new ec2.SecurityGroup(this, `${props.org}-${props.environment}-appServerSG`, {
      vpc: props.vpc,
      securityGroupName: "AppServerSG",
      description: 'Allow ssh and web access from anywhere',
      allowAllOutbound: true
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow public ssh access')
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'allow public http access')
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'allow public https access')

    const instance = new ec2.Instance(this, `${props.org}-${props.environment}-appServer`, {
      vpc: props.vpc,
      machineImage: new ec2.AmazonLinuxImage(),
      instanceType: new ec2.InstanceType('t3.micro'),
      instanceName: 'App Server',
      keyName: props.sshKeyName,
      securityGroup: securityGroup,
      userData: userData,
      // https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-ec2.SubnetSelection.html
      vpcSubnets: props.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PUBLIC
      }),
    });
  }

}
