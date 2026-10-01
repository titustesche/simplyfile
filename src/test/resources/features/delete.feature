@e2e @browser
Feature: Delete
  Files are only deleted after the user has confirmed it.

  Scenario: Deleting from the details removes the file everywhere
    Given the file "notes.txt" of type "text/plain" with content "hello world" exists
    And the file "keep.txt" of type "text/plain" with content "keep" exists
    And I open the link of "notes.txt"
    When I click the delete button
    Then the dialog "Datei löschen?" is shown
    And the dialog mentions "„notes.txt“ wird endgültig gelöscht"
    When I confirm the deletion
    Then the notification "Gelöscht" appears
    And I am on the overview
    And the files are shown in this order:
      | keep.txt |
    And no dialog is shown
    And the database no longer contains "notes.txt"
    And the storage contains 1 object

  Scenario: Deleting from the menu of a list entry removes the file
    Given the file "notes.txt" of type "text/plain" with content "hello world" exists
    And I open the overview
    When I choose "Löschen" from the menu of "notes.txt"
    And I confirm the deletion
    Then the notification "Gelöscht" appears
    And no files are shown
    And the file count shows "0 Dateien · 0 B"
    And the database contains 0 files
    And the storage contains 0 objects

  Scenario: Cancelling the dialog keeps the file
    Given the file "notes.txt" of type "text/plain" with content "hello world" exists
    And I open the link of "notes.txt"
    When I click the delete button
    And I cancel the deletion
    Then no dialog is shown
    And the details of "notes.txt" are shown
    And the database contains 1 file
    And the storage contains 1 object
