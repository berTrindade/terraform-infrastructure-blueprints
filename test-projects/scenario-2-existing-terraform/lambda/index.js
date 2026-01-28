exports.handler = async (event) => {
  try {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Hello from Lambda'
      })
    };
  } catch (error) {
    console.error('Lambda handler error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error'
      })
    };
  }
};
