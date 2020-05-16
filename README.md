# Kusto Ingest Example

## Summary

This repository contains an Azure Kusto data ingest example focusing on ingestion from in memory Streams and Arrays. This is based on the Kusto Ingest package.

Why is this useful?

The Kusto examples were not super detailed, especially around authentication. Also, the Kusto examples did not include any mechanism to ingest data from an Array or data that was not already in a Stream.

## Dependencies

- NodeJS 12.3+ due to the use of [stream.Readable.from(iterable, [options])](https://nodejs.org/docs/latest-v12.x/api/stream.html#stream_stream_readable_from_iterable_options).
- An Azure Kusto Cluster
- App AAD Credentials

## Bootstrap

To use this example, you need a Kusto table. You may use this code in your Kusto query tool to create and setup the table.

```text
// Drop the RV table - use in case you need to drop and recreate
.drop table Simple

// Create a 'Simple' table
.create table Simple (when: datetime, what: string)

// Create a JSON ingest map for 'Simple'
.create table Simple ingestion json mapping 'SimpleJSONMapping1' '[{"column":"when","path":"$.when"},{"column":"what","path":"$.what"}]'

// Ingest test data inline
.ingest inline into table Simple with (format=json, jsonMappingReference=SimpleJSONMapping1) <|
{"when":"2020-05-15T02:35:38.458Z","what":"test"}
{"when":"2020-05-15T15:45:12.824Z","what":"manual 0.8118900534601039"}

// Select data
Simple

// Drop all data
.drop extents from Simple
```    
    
After you have your Kusto Table, you want to make a copy of **config-example.js** and name it **config.js**. Then you want to edit the following:

App Permission Values: (https://docs.microsoft.com/en-us/azure/data-explorer/kusto/management/access-control/how-to-provision-aad-app)

- authorityId
- appid
- appkey

Kusto Values:

- cluster
- region
- kustoDatabase
- destTable
- destTableMapping

> **Note:** Be sure you've added your App's identity as a user to your Kusto database. In your database dashboard, click **Permissions** and add your application user.

## Examples

The following two examples illustrate ingesting from a file Stream and an Array. 

- example-static-data-from-file-as-stream.js - An example of ingesting data into Kusto from a static file (a file Stream).
- example-random-data-from-array-of-objects.js - An example of ingesting data into Kusto from a dynamic (random) array of objects.