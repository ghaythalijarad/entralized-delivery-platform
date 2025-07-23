const AWS_CONFIG = {
    region: 'us-east-1',
    userPoolId: 'us-east-1_9IItcBz7P',
    userPoolClientId: '5r4pff0krdrblr5nkcfuglo4j1',
    identityPoolId: 'us-east-1:your-identity-pool-id',
    graphqlEndpoint: 'https://your-appsync-api-id.appsync-api.us-east-1.amazonaws.com/graphql',
    apiKey: 'your-api-key-here'
};

const API_ENDPOINTS = {
    drivers: 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev/drivers',
    merchants: 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev/merchants',
    orders: 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev/orders',
    customers: 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev/customers'
};

// Legacy support
const awsConfig = {
    cognito: {
        userPoolId: AWS_CONFIG.userPoolId,
        userPoolClientId: AWS_CONFIG.userPoolClientId,
        region: AWS_CONFIG.region
    }
};

// Export configurations
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AWS_CONFIG, API_ENDPOINTS, awsConfig };
} else {
    window.AWS_CONFIG = AWS_CONFIG;
    window.API_ENDPOINTS = API_ENDPOINTS;
    window.awsConfig = awsConfig;
}