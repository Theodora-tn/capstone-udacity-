import 'source-map-support/register'

import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { createLogger } from '../utils/logger'

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('todosStorage')

export class TodosStorage {

  constructor(
    private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' }),
    private readonly bucketName = process.env.ATTACHMENTS_S3_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION,
    private readonly thumbnailBucketName = process.env.THUMBNAILS_S3_BUCKET
  ) {}

  async getAttachmentUrl(attachmentId: string): Promise<string> {
      const attachmentUrl = `https://${this.bucketName}.s3.amazonaws.com/${attachmentId}`
      return attachmentUrl
  }
 
  async getNewAttachmentUrl(attachmentId: string): Promise<string> {
    const attachmentUrl = `https://${this.thumbnailBucketName}.s3.amazonaws.com/${attachmentId}.jpeg`
    return attachmentUrl
}

  async getUploadUrl(attachmentId: string): Promise<string> {
    const uploadUrl = this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: attachmentId,
      Expires: parseInt(this.urlExpiration)
    })
    return uploadUrl
  }

  async deleteTodoItemAttachment(itemPath: string): Promise<void> {
    logger.info(`itemPath ${itemPath}`, {itemPath})
    
    const params = {
      'Bucket': this.bucketName,
      'Key': itemPath
     };
  
    await this.s3.deleteObject(params).promise()
    
  }

}
