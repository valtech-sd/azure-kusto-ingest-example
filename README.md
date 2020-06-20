# Kusto Ingest Example

## Summary

This repository contains an Azure Kusto data ingest example focusing on ingestion from in memory Streams and Arrays. This is based on the Kusto Ingest package.

Why is this useful?

The Kusto examples were not super detailed, especially around authentication. Also, the Kusto examples did not include any mechanism to ingest data from an Array or data that was not already in a Stream.

## Dependencies

- NodeJS 10+ due to the use of a custom stream.
- An Azure Kusto Cluster
- App AAD Credentials

## Bootstrap

To use this example, you need a Kusto table. You may use this code in your Kusto query tool to create and setup the table.

```text
// Drop the RV table - use in case you need to drop and recreate
.drop table Simple

// Create a 'Simple' table
.create table Simple (pipeline_path: string, when: datetime, what: string) 

// Create a JSON ingest map for 'Simple'
.create table Simple ingestion json mapping 'Simple_mapping' '[{"column":"pipeline_path","path":"$.pipeline_path","datatype":"","transform":null},{"column":"when","path":"$.when","datatype":"","transform":null},{"column":"what","path":"$.what","datatype":"","transform":null}]'

// Ingest test data inline
.ingest inline into table Simple with (format=json, jsonMappingReference=Simple_mapping) <|
{"pipeline_path":"/usr/share/logstash/input/Simple.json","when":"2020-05-15T17:01:35.775Z","what":"0.6620756362437774"}
{"pipeline_path":"/usr/share/logstash/input/Simple.json","when":"2020-05-15T17:01:35.775Z","what":"0.6620756362437774"}

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

## Debugging Ingestion in Kusto (Azure Data Explorer)

The following commands are very useful to debug the results of your ingest. Run these in Kusto Query.

```text
.show operations
| where StartedOn > ago(1h) and Database == "uni-p658-shared-dev" and Operation == "DataIngestPull"
| summarize arg_max(LastUpdatedOn, *) by OperationId
```

```text
.show ingestion failures
| where FailedOn > ago(4h) and Database == "uni-p658-shared-dev"
| order by FailedOn desc
```

## Examples

The following two examples illustrate ingesting from a file Stream and an Array. 

- example-static-data-from-file-as-stream.js - An example of ingesting data into Kusto from a static file (a file Stream).
- example-random-data-from-array-of-objects.js - An example of ingesting data into Kusto from a dynamic (random) array of objects.