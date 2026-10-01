@e2e @api
Feature: File API
  Files can be uploaded, listed, downloaded and deleted over HTTP.

  Scenario: The status endpoint reports that the backend is up
    When the client requests "/status"
    Then the response status is 200

  Scenario: Uploading persists metadata and content
    When the client uploads "hello.txt" of type "text/plain" with content "hello world"
    Then the response status is 200
    And the uploaded file has the name "hello.txt", the type "text/plain" and the size 11
    And the uploaded file has the SHA-256 of "hello world"
    And the database contains 1 file
    And the storage contains 1 object
    And the stored object has the content "hello world"

  Scenario: Without uploads the file list is empty
    When the client lists the files
    Then the response status is 200
    And no files are listed

  Scenario: Uploaded files show up in the list
    Given the file "first.txt" of type "text/plain" with content "hello world" exists
    And the file "second.json" of type "application/json" with content "{}" exists
    When the client lists the files
    Then the listed files are:
      | filename    | type             | size |
      | first.txt   | text/plain       | 11   |
      | second.json | application/json | 2    |

  Scenario: Downloading returns the uploaded bytes as an attachment
    Given the file "data.bin" of type "application/octet-stream" with 65536 bytes exists
    When the client downloads "data.bin"
    Then the response status is 200
    And the response has the content type "application/octet-stream"
    And the response is an attachment named "data.bin"
    And the response body is the content of "data.bin"

  Scenario: Files with the same name and content are stored independently
    When the client uploads "same.txt" of type "text/plain" with content "hello world"
    And the client uploads "same.txt" of type "text/plain" with content "hello world"
    Then the database contains 2 files
    And the storage contains 2 objects
    When the client deletes the last uploaded file
    Then the response status is 204
    And the database contains 1 file
    And the storage contains 1 object

  Scenario: Deleting removes metadata and content
    Given the file "hello.txt" of type "text/plain" with content "hello world" exists
    When the client deletes "hello.txt"
    Then the response status is 204
    And the database contains 0 files
    And the storage contains 0 objects
    When the client downloads "hello.txt"
    Then the response is an error

  Scenario: An empty upload is rejected and leaves nothing behind
    When the client uploads "empty.txt" of type "text/plain" with content ""
    Then the response is an error
    And the database contains 0 files
    And the storage contains 0 objects

  Scenario: An unknown file can neither be downloaded nor deleted
    When the client downloads an unknown file
    Then the response is an error
    When the client deletes an unknown file
    Then the response is an error

  Scenario: A malformed file id is a bad request
    When the client requests "/file/not-a-uuid/download"
    Then the response status is 400

  Scenario: The link of a file serves the frontend
    Given the file "hello.txt" of type "text/plain" with content "hello world" exists
    When the client requests the link of "hello.txt"
    Then the response status is 200
    And the response is the Simplyfile page
