// Our lib
const KustoIngest = require('./lib/kusto-ingest.js');

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

// Create some test data
const testDataArray = [];
const howMany = 100; // how many records/rows will be generated
for (let i = 0; i < howMany; i++) {
  testDataArray.push({
    pipeline_path: '/usr/share/logstash/input/Simple.json',
    when: new Date().toISOString(),
    what: Math.random().toString(),
  });
}

// Ingest from the event stream we created
KustoIngest.ingestFromArray(
  testDataArray,
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
    console.log(`ingestFromArray Done!`);
  })
  .catch((err) => {
    console.error(`ingestFromArray ERROR: ${err.message}`);
  });
