/**
 * This config file is an example of the structure you need. See the README for more information.
 * TODO: Copy this config example to a new file config.js and edit the values to suit your environment.
 */

const {
  DataFormat,
  JsonColumnMapping,
} = require('azure-kusto-ingest').IngestionPropertiesEnums;

// You want to change all the values below to suit your environment
const config = {
  authorityId: 'insert your authorityId here',
  appid: 'insert your appid here',
  appkey: 'insert your appkey here',
  cluster: 'name-of-yout-kusto-cluster',
  region: 'region-for-your-cluster',
  kustoDatabase: 'kusto-database-to-ingest-into',
  destTable: 'kusto-table-to-ingest-into',
  destTableMapping: 'kusto-table-mapping-as-declared-for-the-target-table',
  dataFormat: DataFormat.JSON, // your data format (what format is your data coming in as?)
};

module.exports = config;
