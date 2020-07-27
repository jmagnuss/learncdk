import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import autoscaling = require('@aws-cdk/aws-autoscaling');
import elb = require('@aws-cdk/aws-elasticloadbalancingv2');
import certmgr = require('@aws-cdk/aws-certificatemanager');
import route53 = require('@aws-cdk/aws-route53');
import targets = require('@aws-cdk/aws-route53-targets');
import secretmanager = require('@aws-cdk/aws-secretsmanager');

export interface AwesomeAppStackProps extends cdk.StackProps {
  org: string,
  environment: string,
  vpc: ec2.IVpc,
  domainName: string,
  domainZoneId: string,
  databaseInfo?: secretmanager.ISecret,
} 

export class AwesomeAppStack extends cdk.Stack {

  private readonly props: AwesomeAppStackProps;
  private readonly targetGroup: elb.ApplicationTargetGroup;
  public readonly autoScaleGroup: autoscaling.AutoScalingGroup;
  public readonly loadBalancer: elb.ApplicationLoadBalancer;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: cdk.Construct, id: string, props: AwesomeAppStackProps) {
    super(scope, id, props);

    this.props = props;

    this.securityGroup = new ec2.SecurityGroup(this, `${props.org}-${props.environment}-appServerSG`, {
      vpc: props.vpc,
      securityGroupName: `${props.org}-${props.environment}-appServerSG`,
      description: 'Allow ssh and web access from anywhere',
      allowAllOutbound: true
    });
    this.securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'allow public http access')
    this.securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'allow public https access')

    const userData = ec2.UserData.forLinux();
    userData.addCommands('yum install -y nginx', 'chkconfig nginx on', 'service nginx start');
    // make sure the latest SSM Agent is installed.
    const SSM_AGENT_RPM = 'https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm';
    userData.addCommands(
      `sudo yum install -y ${SSM_AGENT_RPM}`, 
      'restart amazon-ssm-agent', 
      `export DB_SECRET_ARN1=${props.databaseInfo?.secretValue.toString()}`,
      `export DB_SECRET_ARN2=${props.databaseInfo?.secretValueFromJson('password').toString()}`,
      `export DB_SECRET_ARN3=${props.databaseInfo?.secretValueFromJson('password')}`,
      );

    // define the IAM role that will allow the EC2 instance to communicate with SSM 
    const role = new iam.Role(this, `${props.org}-${props.environment}-appServerRole`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
    });
    // arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));

    this.autoScaleGroup = new autoscaling.AutoScalingGroup(this, `${props.org}-${props.environment}-autoScale`, {
      vpc: props.vpc,
      machineImage: new ec2.AmazonLinuxImage(),
      instanceType: new ec2.InstanceType('t3.micro'),
      userData: userData,
      // https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-ec2.SubnetSelection.html
      vpcSubnets: props.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE
      }),
      role: role,
      maxCapacity: 5
    });
    this.autoScaleGroup.addSecurityGroup(this.securityGroup);

    this.loadBalancer = new elb.ApplicationLoadBalancer(this, 'LoadBalancer', {
      vpc: props.vpc,
      internetFacing: true
    });

    const httpListener = this.loadBalancer.addListener('HttpListener', {
      port: 80,
    });
    this.targetGroup = httpListener.addTargets('ApplicationFleet', {
      port: 80,
      targets: [this.autoScaleGroup]
    });

    const domain = route53.HostedZone.fromHostedZoneAttributes(this, 'RootDomain', {
      zoneName: this.props.domainName,
      hostedZoneId: this.props.domainZoneId,
    });
    const dns = new route53.ARecord(this, 'StaticWebsiteSubdomain', {
      zone: domain,
      recordName: `${props.environment}app`,
      target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(this.loadBalancer))
    });

    new cdk.CfnOutput(this, `${props.org}-${props.environment}-DNS`, { value: dns.domainName });

  }

  public terminateSSL(certificateArn: string) {
    const certificate = certmgr.Certificate.fromCertificateArn(this, 'Certificate', certificateArn);
    const httpsListener = this.loadBalancer.addListener('HttpsListener', {
      port: 443,
      certificates: [certificate]
    });
    httpsListener.addTargetGroups('ApplicationFleet', {
      targetGroups: [this.targetGroup]

    });
  }

  public enableDaytimeOnly(startTime: number = 7, endTime: number = 19) {
    this.autoScaleGroup.scaleOnSchedule('PrescaleInTheMorning', {
      schedule: autoscaling.Schedule.cron({ hour: String(startTime), minute: '0' }),
      desiredCapacity: 1,
    });

    this.autoScaleGroup.scaleOnSchedule('AllowDownscalingAtNight', {
      schedule: autoscaling.Schedule.cron({ hour: String(endTime), minute: '0' }),
      desiredCapacity: 0
    });
  }

  public enableCpuScaling(max: number = 50) {
    this.autoScaleGroup.scaleOnCpuUtilization('KeepSpareCPU', {
      targetUtilizationPercent: max
    });
  }

}
