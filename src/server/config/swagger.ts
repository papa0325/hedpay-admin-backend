export default {
  pathPrefixSize: 2,
  basePath: '/api/',
  host: process.env.LOCAL ? 'localhost:3010' : 'manage-test.hedpay.com',
  grouping: 'path',
  info: {
    title: 'API Documentation',
    version: '',
    description: 'API Documentation',
  },
  securityDefinitions: {
    // prettier-ignore
    'Bearer': {
      'type': 'apiKey',
      'name': 'Authorization',
      'in': 'header',
      'x-keyPrefix': 'Bearer ',
    },
  },
  security: [{ Bearer: [] }],
  jsonPath: '/documentation.json',
  documentationPath: '/documentation',
  schemes: [],
  debug: true,
};
