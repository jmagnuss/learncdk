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

  private props: AwesomeDatabaseStackProps;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: cdk.Construct, id: string, props: AwesomeDatabaseStackProps) {
    super(scope, id, props);
    this.props = props;

    this.securityGroup = new ec2.SecurityGroup(this, `${this.props.org}-${this.props.environment}-DbIngress`, {
      vpc: this.props.vpc,
      allowAllOutbound: false,
      securityGroupName: `${this.props.environment}DbIngress`,
    });
  }

  public launchAuroraCluster(): rds.DatabaseCluster {
    return new rds.DatabaseCluster(this, `${this.props.org}-${this.props.environment}-Db`, {
      engine: rds.DatabaseClusterEngine.AURORA,
      masterUser: {
        username: 'master'
      },
      instanceProps: {
        instanceType: this.props.dbInstanceType,
        securityGroup: this.securityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.ISOLATED,
        },
        vpc: this.props.vpc
      },
      clusterIdentifier: `${this.props.org}-${this.props.environment}`,
      defaultDatabaseName: 'learncdk',
      storageEncrypted: true,
      backup: {
        retention: cdk.Duration.days(30),
      }
    });
  }

  public launchMysqlInstance() {
    return new rds.DatabaseInstance(this, `${this.props.org}-${this.props.environment}-Db`, {
      engine: rds.DatabaseInstanceEngine.MYSQL,
      instanceClass: this.props.dbInstanceType,
      masterUsername: 'master',

      securityGroups: [ this.securityGroup ],
      vpc: this.props.vpc,

      instanceIdentifier: `${this.props.org}-${this.props.environment}`,
      allocatedStorage: 50, // 50GB
      masterUserPassword: cdk.SecretValue.plainText('devPass123'),
      databaseName: 'learncdk',
      engineVersion: "5.7",
    });
    
  }
}