// netlify-functions/create-short-url.js
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const MONGODB_URI = 'your_mongodb_connection_string';
const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToDatabase() {
  if (!client.isConnected()) await client.connect();
  return client.db('url-shortener');
}

exports.handler = async function (event, context) {
  const { url } = JSON.parse(event.body);

  // Validate URL
  const urlPattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator

  if (!urlPattern.test(url)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid URL' }),
    };
  }

  const db = await connectToDatabase();
  const urls = db.collection('urls');

  // Check if URL already exists
  const existingUrl = await urls.findOne({ originalUrl: url });
  if (existingUrl) {
    return {
      statusCode: 200,
      body: JSON.stringify({ shortUrl: `${event.headers.origin}/${existingUrl.shortCode}` }),
    };
  }

  // Create a short code
  const shortCode = crypto.randomBytes(3).toString('hex');
  await urls.insertOne({ originalUrl: url, shortCode });

  return {
    statusCode: 200,
    body: JSON.stringify({ shortUrl: `${event.headers.origin}/${shortCode}` }),
  };
};
