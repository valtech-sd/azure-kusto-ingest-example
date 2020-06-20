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
    let inputProcessed = [];

    inputArray.forEach((item) => {
      const arrayItemType = typeof item;
      if (arrayItemType === 'object') {
        // Stringify objects
        inputProcessed.push(JSON.stringify(item));
      } else {
        // Otherwise, coerce to string (harmless if already a string)
        inputProcessed.push(item.toString());
      }
    });

    // Add newlines at the end of each item to identify rows to Kusto
    inputProcessed = inputProcessed.map((item) => item + '\n');

    // log all the records we'll be sending
    console.log(`TO-INGEST:\n${inputProcessed.join('')}`);

    // Put the processed array into a stream (this is for nodejs 12+ only)
    // const processedStream = Readable.from(inputProcessed);

    // Put the processed array into a stream, including the read method
    // which simply outputs our array as a 'joined' string.
    // Also we split using a newline (\n) to delimit each "line" of the array in the stream form so that
    // Kusto properly tells one record apart from another.
    let processedStream = new Readable({
      read(size) {
        this.push(inputProcessed.join('\n'));
        this.push(null);
      },
    });

    //
    // To be left commented out unless we want to test the stream contents!
    //
    // let chunk;
    // while (null !== (chunk = processedStream.read())) {
    //   logger.info(
    //     `Received ${chunk.length} bytes of data: ${chunk.toString()}`
    //   );
    // }
    // return new Promise.resolve();

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
