import { SNSEvent, SNSHandler, S3EventRecord } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import Jimp from 'jimp/es'
// import { updateAttachmentUrl} from '../../businessLogic/todos';
import { createLogger } from '../../utils/logger'
// import { TodosAccess } from '../../dataLayer/TodosAccess'

const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new XAWS.S3()

const imagesBucketName = process.env.ATTACHMENTS_S3_BUCKET
const thumbnailBucketName = process.env.THUMBNAILS_S3_BUCKET
// const todosAccess = new TodosAccess()
const logger = createLogger('image-resize')

export const handler: SNSHandler = async (event: SNSEvent) => {
  console.log('Processing SNS event ', JSON.stringify(event))
  for (const snsRecord of event.Records) {
    const s3EventStr = snsRecord.Sns.Message
    console.log('Processing S3 event', s3EventStr)
    const s3Event = JSON.parse(s3EventStr)

    for (const record of s3Event.Records) {
      await processImage(record)
    }
  }
}

async function processImage(record: S3EventRecord) {
  const key = record.s3.object.key
  console.log('Processing S3 item with key: ', key)
  const response = await s3
    .getObject({
      Bucket: imagesBucketName,
      Key: key
    })
    .promise()

  const body = response.Body
  const image = await Jimp.read(body)

  console.log('Resizing image')
  image.resize(150, 150)
  const convertedBuffer = await image.getBufferAsync(Jimp.AUTO)

  console.log(`Writing image back to S3 bucket: ${thumbnailBucketName}`)
  await s3
    .putObject({
      Bucket: thumbnailBucketName,
      Key: `${key}.jpeg`,
      Body: convertedBuffer
    })
    .promise()

    logger.info(`thumbnail image upload success with key: ${key}`)

    // const imageItem = await todosAccess.getTodoItem(key)

    // await updateAttachmentUrl(imageItem.userId, imageItem.todoId, `https://${thumbnailBucketName}.s3.amazonaws.com/${key}.jpeg`)



}


