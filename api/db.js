const { MongoClient, ServerApiVersion } = require('mongodb');
const { dbUri } = require('./config');

const client = new MongoClient(dbUri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connect() {
  let connection;

  try {
    connection = await client.connect();
  } catch (error) {
    console.error(error);
  }

  let db = connection.db('pssa');

  return db;
}

module.exports = {
  connect,
  client,
};
