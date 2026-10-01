@e2e @browser
Feature: Upload
  Files selected in the browser are uploaded and show up in the file list.

  Background:
    Given I open the overview

  Scenario: An uploaded file appears in the list and is stored
    When I select the local file "hello.txt" with content "hello world" for upload
    Then the files are shown in this order:
      | hello.txt |
    And the notification "Hochgeladen" appears
    And the upload of "hello.txt" is marked as done
    And the file count shows "1 Datei · 11 B"
    And the row of "hello.txt" shows the size "11 B" and the type "text/plain"
    And the database contains 1 file
    And the storage contains 1 object
    And the stored object has the content "hello world"

  Scenario: Several files are uploaded one after another
    When I select these local files for upload:
      | name      | content |
      | one.txt   | 1       |
      | two.txt   | 22      |
      | three.txt | 333     |
    Then the files are shown in this order:
      | one.txt   |
      | three.txt |
      | two.txt   |
    And the file count shows "3 Dateien · 6 B"
    And the database contains 3 files
    And the storage contains 3 objects

  Scenario: An uploaded file survives a reload
    When I select the local file "hello.txt" with content "hello world" for upload
    Then the files are shown in this order:
      | hello.txt |
    When I open the overview
    Then the files are shown in this order:
      | hello.txt |

  Scenario: A rejected upload is marked as failed
    # The backend rejects empty files
    When I select the local file "empty.txt" with content "" for upload
    Then the upload of "empty.txt" is marked as failed
    And the upload of "empty.txt" shows "Fehler" and can be retried
    And the notification "Upload fehlgeschlagen" appears
    And no files are shown
    And the database contains 0 files
    And the storage contains 0 objects
