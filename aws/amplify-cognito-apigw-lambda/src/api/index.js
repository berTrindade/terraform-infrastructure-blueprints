// Lambda handler with Cognito context - CRUD operations
exports.handler = async (event) => {
  console.log('Cognito Region:', process.env.COGNITO_REGION);
  console.log('Cognito User Pool ID:', process.env.COGNITO_USER_POOL_ID);
  console.log('Cognito Client ID:', process.env.COGNITO_CLIENT_ID);

  // Extract user info from JWT claims (provided by API Gateway authorizer)
  const claims = event.requestContext?.authorizer?.jwt?.claims || {};
  const userId = claims.sub;
  const email = claims.email;

  const method = event.requestContext?.http?.method;
  const path = event.rawPath;
  const pathParameters = event.pathParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};

  let response;

  // Route handling
  if (method === 'GET' && path === '/items') {
    // List items
    response = {
      message: 'List items',
      user: { id: userId, email },
      items: [], // Replace with actual data fetch
    };
  } else if (method === 'GET' && pathParameters.id) {
    // Get single item
    response = {
      message: 'Get item',
      user: { id: userId, email },
      item: { id: pathParameters.id }, // Replace with actual data fetch
    };
  } else if (method === 'POST' && path === '/items') {
    // Create item
    response = {
      message: 'Item created',
      user: { id: userId, email },
      item: { ...body, owner: userId },
    };
  } else if (method === 'PUT' && pathParameters.id) {
    // Update item
    response = {
      message: 'Item updated',
      user: { id: userId, email },
      item: { id: pathParameters.id, ...body },
    };
  } else if (method === 'DELETE' && pathParameters.id) {
    // Delete item
    response = {
      message: 'Item deleted',
      user: { id: userId, email },
      itemId: pathParameters.id,
    };
  } else {
    response = {
      message: 'Unknown route',
      method,
      path,
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(response),
  };
};
