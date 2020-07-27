import { S3 } from "aws-sdk"

const bucketName = process.env.BUCKET!
const s3 = new S3()

const handler = async function (event: any, context: any) {
  emptyS3Directory(bucketName, '/');
}

// Recursive delete from https://stackoverflow.com/questions/20207063/how-can-i-delete-folder-on-s3-with-node-js
async function emptyS3Directory(bucket, dir) {
  const listParams = {
    Bucket: bucket,
    Prefix: dir
  };

  const listedObjects = await s3.listObjectsV2(listParams).promise();

  if (listedObjects.Contents.length === 0) return;

  const deleteParams = {
    Bucket: bucket,
    Delete: { Objects: [] }
  };

  listedObjects.Contents.forEach(({ Key }) => {
    deleteParams.Delete.Objects.push({ Key });
  });

  await s3.deleteObjects(deleteParams).promise();

  if (listedObjects.IsTruncated) await emptyS3Directory(bucket, dir);
}

export { handler }