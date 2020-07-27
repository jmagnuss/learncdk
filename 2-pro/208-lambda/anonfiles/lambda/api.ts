// From https://github.com/aws-samples/aws-cdk-examples/blob/master/typescript/lambda-api-ci/src/handler.ts
import { S3 } from "aws-sdk"
const uuid = require('uuid/v1');
const fileType = require('file-type');

const bucketName = process.env.BUCKET!;
const s3 = new S3();
const S3URL = "https://s3-ap-southeast-2.amazonaws.com/";

// From https://docs.aws.amazon.com/cdk/latest/guide/serverless_example.html
const handler = async function (event: any, context: any) {

  try {
    var method = event.httpMethod

    if (method === "GET") {
      if (event.path === "/") {
        const data = await s3.listObjectsV2({ Bucket: bucketName }).promise()
        var body = {
          widgets: data.Contents!.map(function (e) {
            return e.Key
          }),
        }
        return {
          statusCode: 200,
          headers: {},
          body: JSON.stringify(body),
        }
      }

    }
    else if (method == 'PUT') {
      const buffer = new Buffer(event.body.base64, 'base64');
      const fileMime = fileType(buffer);
      console.log(`PUT ${event.body.name} type ${fileMime}`);

      const params = {
        Bucket: bucketName,
        Key: uuid() + event.body.name,
        Body: buffer,
        ACL: "public-read"
      };
      s3.putObject(params, function (err, data) {
        if (err) {
          throw err;
        }
        return {
          statusCode: 200,
          headers: {},
          body: JSON.stringify(params.Key),
        }
      });

      /*
      const base64String = event.body.request.base64String;
      const buffer = new Buffer(base64String, 'base64');
      const fileMime = fileType(buffer);
      if (fileMime === null) {
        throw Error('The upload data is not a valid file type');
      }
      const file = getFile(fileMime, buffer);
      s3.putObject(file.params, function(err, data) {
        if (err) {
          throw err;
        }
        return {
          statusCode: 200,
          headers: {},
          body: JSON.stringify(file.full_path),
        }
      });
      */
    }

    // Method we don't handle...
    return {
      statusCode: 400,
      headers: {},
      body: "Bad method",
    }
  } catch (error) {
    const body = error.stack || JSON.stringify(error, null, 2)
    return {
      statusCode: 400,
      headers: {},
      body: JSON.stringify(body),
    }
  }
}

function getFile(fileMime, buffer) {

}

export { handler }