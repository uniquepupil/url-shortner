// netlify-functions/redirect.js
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'your_mongodb_connection_string';
const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToDatabase() {
  if (!client.isConnected()) await client.connect();
  return client.db('url-shortener');
}

exports.handler = async function (event, context) {
  const shortCode = event.path.split('/').pop();

  const db = await connectToDatabase();
  const urls = db.collection('urls');

  const url = await urls.findOne({ shortCode });

  if (!url) {
    return {
      statusCode: 404,
      body: 'Not Found',
    };
  }

  return {
    statusCode: 301,
    headers: {
      Location: url.originalUrl,
    },
  };
};
