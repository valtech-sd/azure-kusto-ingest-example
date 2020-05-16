// Kusto dependencies
const KustoConnectionStringBuilder = require('azure-kusto-data')
  .KustoConnectionStringBuilder;
const KustoIngestClient = require('azure-kusto-ingest').IngestClient;
const IngestionProperties = require('azure-kusto-ingest').IngestionProperties;
const {
  DataFormat,
  JsonColumnMapping,
} = require('azure-kusto-ingest').IngestionPropertiesEnums;

// Other dependencies
const { Readable } = require('stream');

/**
 *
 * The main KustoIngest class is a wrapper around KustoIngestClient to facilitate ingesting from both a Stream
 * as well as an Array. In the case of ingesting from an Array, the Array items are concatenated into a Stream
 * and newline (\n) delimited.
 *
 */
class KustoIngest {
  /**
   * A method that ingests into Kusto from the passed STREAM (could be any valid stream, file, http response, etc.)
   *
   * @param inputStream - the Stream.Readable to ingest. Note that the stream should delimit records by newline (\n).
   * @param authorityId - Kusto Authentication, see README.md
   * @param appid - Kusto Authentication, see README.md
   * @param appkey - Kusto Authentication, see README.md
   * @param cluster - The name of the Kusto cluster to ingest into.
   * @param region - The region for the Kusto cluster.
   * @param kustoDatabase - the Database to ingest into (which should exist.)
   * @param destTable - the Table to ingest into (which should exist.)
   * @param destTableMapping - an ingest table mapping suitable for your ingested data.
   * @param dataFormat - the proper DATA format for the ingest (csv, json, etc. per NodeJS Kusto documentation.)
   *
   * @returns {Promise<unknown>}
   */
  static async ingestFromStream(
    inputStream,
    authorityId,
    appid,
    appkey,
    cluster,
    region,
    kustoDatabase,
    destTable,
    destTableMapping,
    dataFormat
  ) {
    // Setup Kusto Overhead
    const kustoIngestUri = `https://ingest-${cluster}.${region}.kusto.windows.net:443`;
    // And create the authentication string
    const kcsbIngest = KustoConnectionStringBuilder.withAadApplicationKeyAuthentication(
      kustoIngestUri,
      appid,
      appkey,
      authorityId
    );
    // Some other settings for ingestion
    const defaultProps = new IngestionProperties({
      database: kustoDatabase,
      table: destTable,
      format: dataFormat,
      ingestionMapping: null,
      ingestionMappingReference: destTableMapping,
    });
    // Create a Kusto Client with a all of this
    const ingestClient = new KustoIngestClient(kcsbIngest, defaultProps);

    // Now, let's ingest with the stream
    return new Promise((resolve, reject) => {
      ingestClient.ingestFromStream(inputStream, defaultProps, (err) => {
        if (err) {
          console.error(`ingestFromStream ERROR: ${err.message}`);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * A method that ingests into Kusto from the passed ARRAY.
   *
   * @param inputArray - the Array to ingest. The array will be processed into a stream and each array item delimited by a newline (\n) character.
   * @param authorityId - Kusto Authentication, see README.md
   * @param appid - Kusto Authentication, see README.md
   * @param appkey - Kusto Authentication, see README.md
   * @param cluster - The name of the Kusto cluster to ingest into.
   * @param region - The region for the Kusto cluster.
   * @param kustoDatabase - the Database to ingest into (which should exist.)
   * @param destTable - the Table to ingest into (which should exist.)
   * @param destTableMapping - an ingest table mapping suitable for your ingested data.
   * @param dataFormat - the proper DATA format for the ingest (csv, json, etc. per NodeJS Kusto documentation.)
   *
   * @returns {Promise<unknown>}
   */
  static ingestFromArray(
    inputArray,
    authorityId,
    appid,
    appkey,
    cluster,
    region,
    kustoDatabase,
    destTable,
    destTableMapping,
    dataFormat
  ) {
    // Our incoming array might be an array of Objects, in case we need to stringify it.
    // Also we inject a newline (\n) to delimit each "line" of the array in the stream form so that
    // Kusto properly tells one record apart from another.
    const inputProcessed = [];

    inputArray.forEach((item) => {
      const arrayItemType = typeof item;
      if (arrayItemType === 'object') {
        // Stringify objects
        inputProcessed.push(JSON.stringify(item) + '\n');
      } else {
        // Otherwise, coerce to string (harmless if already a string)
        inputProcessed.push(item.toString() + '\n');
      }
    });

    // Put the processed array into a stream
    const processedStream = Readable.from(inputProcessed);

    // Ingest from the event stream we created
    return KustoIngest.ingestFromStream(
      processedStream,
      authorityId,
      appid,
      appkey,
      cluster,
      region,
      kustoDatabase,
      destTable,
      destTableMapping,
      dataFormat
    );
  }
}

module.exports = KustoIngest;
