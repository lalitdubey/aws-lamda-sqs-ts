import { SQSEvent, SQSRecord, Context, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';

export const processQueue = async (event: SQSEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const sqs = new AWS.SQS();

  // Receive messages from FirstQueue
  const receiveParams: AWS.SQS.ReceiveMessageRequest = {
    QueueUrl: 'https://sqs.us-east-1.amazonaws.com/854238308734/FirstQueue',
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 1,
  };

  try {
    const receiveResult = await sqs.receiveMessage(receiveParams).promise();

    if (receiveResult.Messages) {
        // Messages received from FirstQueue
        const messages: AWS.SQS.SendMessageBatchRequestEntry[] = receiveResult.Messages.map(message => {
          return {
            Id: message.MessageId || 'defaultId',
            MessageBody: message.Body || 'defaultBody',
          };
        });
    
        // Send messages to SecondQueue
        const sendParams: AWS.SQS.SendMessageBatchRequest = {
          Entries: messages,
          QueueUrl: 'https://sqs.us-east-1.amazonaws.com/854238308734/SecondQueue',
        };
    
        await sqs.sendMessageBatch(sendParams).promise();
    
        // Delete received messages from FirstQueue
        const deleteParams: AWS.SQS.DeleteMessageBatchRequest = {
          Entries: receiveResult.Messages.map(message => {
            return {
              Id: message.MessageId || 'defaultId',
              ReceiptHandle: message.ReceiptHandle || 'defaultReceiptHandle',
            };
          }),
          QueueUrl: 'https://sqs.us-east-1.amazonaws.com/854238308734/FirstQueue',
        };
    
        await sqs.deleteMessageBatch(deleteParams).promise();
      }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Messages processed and sent to SecondQueue.',
      }),
    };
  } catch (error) {
    console.error('Error receiving messages:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal Server Error',
      }),
    };
  }
};
