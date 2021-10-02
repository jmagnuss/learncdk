import cdk = require('@aws-cdk/core');
import rds = require('@aws-cdk/aws-rds');
import ec2 = require('@aws-cdk/aws-ec2');

export interface AwesomeDatabaseStackProps extends cdk.StackProps {
  org: string,
  environment: string,
  vpc: ec2.IVpc,
  dbInstanceType: ec2.InstanceType,
}

export class AwesomeDatabaseStack extends cdk.Stack {

  private readonly props: AwesomeDatabaseStackProps;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: cdk.Construct, id: string, props: AwesomeDatabaseStackProps) {
    super(scope, id, props);
    this.props = props;

    this.securityGroup = new ec2.SecurityGroup(this, `${this.props.org}-${this.props.environment}-dbServerSG`, {
      vpc: this.props.vpc,
      securityGroupName: `${props.org}-${props.environment}-dbServerSG`,
      description: 'Allow app servers to access db server',
  	});
  }
  public launchAuroraCluster() {
    const cluster = new rds.DatabaseCluster(this, `${this.props.org}-${this.props.environment}-db`, {
      engine: rds.DatabaseClusterEngine.auroraMysql({ version: rds.AuroraMysqlEngineVersion.VER_2_08_1 }),
      credentials: rds.Credentials.fromGeneratedSecret('master'), // Optional - will default to 'admin' username and generated password
      instanceProps: {
        // optional , defaults to t3.medium
        instanceType: this.props.dbInstanceType,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        },
        vpc: this.props.vpc,
        securityGroups: [ this.securityGroup ]
      },
      clusterIdentifier: `${this.props.org}-${this.props.environment}-db`,
      defaultDatabaseName: 'learncdk',
      storageEncrypted: true,
      backup: {
        retention: cdk.Duration.days(30),
      }
    });
    new cdk.CfnOutput(this, `${this.props.org}-${this.props.environment}-DBEndpoint`, { value: cluster.clusterEndpoint.hostname });
  }
  public launchMysqlCluster() {
    const instance = new rds.DatabaseInstance(this, `${this.props.org}-${this.props.environment}-db`, {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_5_7
      }),
      instanceType: this.props.dbInstanceType,
      credentials: {
        username: 'master',
        password: cdk.SecretValue.plainText('devPass123')
      },
      vpc: this.props.vpc,
      allocatedStorage: 50,
      backupRetention: cdk.Duration.days(30),
      databaseName: 'learncdk',
      instanceIdentifier: `${this.props.org}-${this.props.environment}-db`,
      securityGroups: [ this.securityGroup ]
    })
    new cdk.CfnOutput(this, `${this.props.org}-${this.props.environment}-DBEndpoint`, { value: instance.dbInstanceEndpointAddress });
  }
}
