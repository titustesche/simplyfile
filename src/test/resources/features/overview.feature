@e2e @browser
Feature: File overview
  The start page lists all files and lets the user search and sort them.

  Scenario: The empty overview invites to upload
    When I open the overview
    Then the page title is "Simplyfile"
    And the file count shows "0 Dateien · 0 B"
    And the file list shows the hint "Noch keine Dateien – zieh etwas in das Feld oben."
    And no files are shown

  Scenario: The overview lists existing files
    Given the file "notes.txt" of type "text/plain" with content "hello world" exists
    And the file "report.pdf" of type "application/pdf" with 2048 bytes exists
    When I open the overview
    Then the files are shown in this order:
      | notes.txt  |
      | report.pdf |
    And the file count shows "2 Dateien · 2,0 KB"
    And the row of "report.pdf" shows the size "2,0 KB" and the type "application/pdf"

  Scenario: Searching filters the file list
    Given the file "notes.txt" of type "text/plain" with content "a" exists
    And the file "report.pdf" of type "application/pdf" with content "b" exists
    And I open the overview
    When I search for "REPORT"
    Then the files are shown in this order:
      | report.pdf |
    When I search for "missing"
    Then no files are shown
    And the file list shows the hint "Keine Treffer für „missing“"

  Scenario: The sort button cycles through the sort orders
    Given the file "alpha.txt" of type "text/plain" with 300 bytes exists
    And the file "beta.txt" of type "text/plain" with 100 bytes exists
    And the file "gamma.txt" of type "text/plain" with 200 bytes exists
    When I open the overview
    Then the sort button shows "Name A–Z"
    And the files are shown in this order:
      | alpha.txt |
      | beta.txt  |
      | gamma.txt |
    When I click the sort button
    Then the sort button shows "Name Z–A"
    And the files are shown in this order:
      | gamma.txt |
      | beta.txt  |
      | alpha.txt |
    When I click the sort button
    Then the sort button shows "Größte zuerst"
    And the files are shown in this order:
      | alpha.txt |
      | gamma.txt |
      | beta.txt  |
    When I click the sort button
    Then the sort button shows "Kleinste zuerst"
    And the files are shown in this order:
      | beta.txt  |
      | gamma.txt |
      | alpha.txt |
    When I click the sort button
    Then the sort button shows "Name A–Z"

  Scenario: Legacy pages redirect to the overview
    When I open the page "/files"
    Then I am on the overview
