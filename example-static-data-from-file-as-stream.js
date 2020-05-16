// Our lib
const KustoIngest = require('./lib/kusto-ingest.js');

// Other dependencies
const fs = require('fs');

// Grab our config
const {
  authorityId,
  appid,
  appkey,
  cluster,
  region,
  kustoDatabase,
  destTable,
  destTableMapping,
  dataFormat,
} = require('./conf/config.js');

// Open the file stream
const filePath = './data/datafile01.txt';
const eventDataStream = fs.createReadStream(filePath);

// Ingest from the file stream
KustoIngest.ingestFromStream(
  eventDataStream,
  authorityId,
  appid,
  appkey,
  cluster,
  region,
  kustoDatabase,
  destTable,
  destTableMapping,
  dataFormat
)
  .then(() => {
    console.log(`ingestFromStream Done!`);
  })
  .catch((err) => {
    console.error(`ingestFromStream ERROR: ${err.message}`);
  });
