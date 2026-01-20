/**
 * RAG API Handler for Bedrock Knowledge Base
 */

const {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
  RetrieveCommand,
} = require('@aws-sdk/client-bedrock-agent-runtime');

const {
  BedrockAgentClient,
  StartIngestionJobCommand,
  GetIngestionJobCommand,
} = require('@aws-sdk/client-bedrock-agent');

const {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3');

const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const bedrockRuntime = new BedrockAgentRuntimeClient({});
const bedrockAgent = new BedrockAgentClient({});
const s3 = new S3Client({});

const KNOWLEDGE_BASE_ID = process.env.KNOWLEDGE_BASE_ID;
const MODEL_ID = process.env.MODEL_ID;
const S3_BUCKET = process.env.S3_BUCKET;
const DATA_SOURCE_ID = process.env.DATA_SOURCE_ID;

/**
 * Query the knowledge base with RAG
 */
async function query(body) {
  const { question, maxResults = 5 } = body;

  if (!question) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Question is required' }) };
  }

  const command = new RetrieveAndGenerateCommand({
    input: { text: question },
    retrieveAndGenerateConfiguration: {
      type: 'KNOWLEDGE_BASE',
      knowledgeBaseConfiguration: {
        knowledgeBaseId: KNOWLEDGE_BASE_ID,
        modelArn: `arn:aws:bedrock:${process.env.AWS_REGION}::foundation-model/${MODEL_ID}`,
        retrievalConfiguration: {
          vectorSearchConfiguration: {
            numberOfResults: maxResults,
          },
        },
      },
    },
  });

  const response = await bedrockRuntime.send(command);

  return {
    statusCode: 200,
    body: JSON.stringify({
      answer: response.output?.text || '',
      citations: response.citations?.map(c => ({
        text: c.generatedResponsePart?.textResponsePart?.text,
        sources: c.retrievedReferences?.map(r => ({
          content: r.content?.text,
          location: r.location?.s3Location?.uri,
        })),
      })) || [],
    }),
  };
}

/**
 * Retrieve relevant chunks without generation
 */
async function retrieve(body) {
  const { question, maxResults = 5 } = body;

  if (!question) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Question is required' }) };
  }

  const command = new RetrieveCommand({
    knowledgeBaseId: KNOWLEDGE_BASE_ID,
    retrievalQuery: { text: question },
    retrievalConfiguration: {
      vectorSearchConfiguration: {
        numberOfResults: maxResults,
      },
    },
  });

  const response = await bedrockRuntime.send(command);

  return {
    statusCode: 200,
    body: JSON.stringify({
      results: response.retrievalResults?.map(r => ({
        content: r.content?.text,
        score: r.score,
        location: r.location?.s3Location?.uri,
        metadata: r.metadata,
      })) || [],
    }),
  };
}

/**
 * Generate pre-signed URL for document upload
 */
async function ingest(body) {
  const { filename, contentType = 'application/pdf' } = body;

  if (!filename) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Filename is required' }) };
  }

  const key = `documents/${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

  return {
    statusCode: 200,
    body: JSON.stringify({
      uploadUrl,
      key,
      expiresIn: 3600,
      note: 'After upload, call POST /sync to index the document',
    }),
  };
}

/**
 * List indexed documents
 */
async function listSources() {
  const command = new ListObjectsV2Command({
    Bucket: S3_BUCKET,
    Prefix: 'documents/',
  });

  const response = await s3.send(command);

  return {
    statusCode: 200,
    body: JSON.stringify({
      sources: response.Contents?.map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
      })) || [],
    }),
  };
}

/**
 * Trigger knowledge base sync
 */
async function syncKnowledgeBase() {
  const command = new StartIngestionJobCommand({
    knowledgeBaseId: KNOWLEDGE_BASE_ID,
    dataSourceId: DATA_SOURCE_ID,
  });

  const response = await bedrockAgent.send(command);

  return {
    statusCode: 202,
    body: JSON.stringify({
      jobId: response.ingestionJob?.ingestionJobId,
      status: response.ingestionJob?.status,
      message: 'Ingestion job started. Documents will be indexed shortly.',
    }),
  };
}

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const { routeKey } = event.requestContext || {};
  const method = routeKey?.split(' ')[0];
  const path = event.rawPath;

  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString()
        : event.body);
    } catch (e) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON body' }),
      };
    }
  }

  try {
    let response;

    if (method === 'POST' && path === '/query') {
      response = await query(body);
    } else if (method === 'POST' && path === '/retrieve') {
      response = await retrieve(body);
    } else if (method === 'POST' && path === '/ingest') {
      response = await ingest(body);
    } else if (method === 'GET' && path === '/sources') {
      response = await listSources();
    } else if (method === 'POST' && path === '/sync') {
      response = await syncKnowledgeBase();
    } else {
      response = { statusCode: 404, body: JSON.stringify({ error: 'Route not found' }) };
    }

    return {
      ...response,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        ...response.headers,
      },
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
