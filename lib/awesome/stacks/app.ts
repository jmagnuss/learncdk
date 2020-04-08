import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import { Role, ServicePrincipal, ManagedPolicy, CfnInstanceProfile } from '@aws-cdk/aws-iam'


export interface AwesomeAppStackProps extends cdk.StackProps {
  org: string,
  environment: string,
  vpc: ec2.IVpc,
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
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'allow public http access')
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'allow public https access')

    const userData = ec2.UserData.forLinux();
    userData.addCommands('yum install -y nginx', 'chkconfig nginx on', 'service nginx start');
    // make sure the latest SSM Agent is installed.
    const SSM_AGENT_RPM = 'https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm';
    userData.addCommands(`sudo yum install -y ${SSM_AGENT_RPM}`, 'restart amazon-ssm-agent');

    // define the IAM role that will allow the EC2 instance to communicate with SSM 
    const role = new Role(this, `${props.org}-${props.environment}-appServerRole`, {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com')
    });
    // arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
    role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));

    const instance = new ec2.Instance(this, `${props.org}-${props.environment}-appServer`, {
      vpc: props.vpc,
      machineImage: new ec2.AmazonLinuxImage(),
      instanceType: new ec2.InstanceType('t3.micro'),
      instanceName: 'App Server',
      securityGroup: securityGroup,
      userData: userData,
      // https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-ec2.SubnetSelection.html
      vpcSubnets: props.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PUBLIC
      }),
      role: role,
    });

    new cdk.CfnOutput(this, 'Instance ID', { value: instance.instanceId });
    new cdk.CfnOutput(this, 'Instance Public IP', { value: instance.instancePublicIp });

  }

}
