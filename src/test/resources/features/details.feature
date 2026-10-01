@e2e @browser
Feature: File details
  Every file has a details page that is reachable through a shareable link.

  Scenario: Clicking a file shows its details
    Given the file "notes.txt" of type "text/plain" with content "hello world" exists
    And I open the overview
    When I click the file "notes.txt"
    Then the details of "notes.txt" are shown
    And the address is the link of "notes.txt"
    And the overview is hidden
    And the details show the size "11 B (11 Bytes)" and the type "text/plain"
    And the details show the SHA-256, the ID and the link of "notes.txt"

  Scenario: The preview shows the content of text files
    Given the file "notes.txt" of type "text/plain" exists with the content:
      """
      first line
      second line
      """
    When I open the link of "notes.txt"
    Then the preview shows:
      """
      first line
      second line
      """

  Scenario: Binary files have no preview
    Given the file "data.bin" of type "application/octet-stream" with 16 bytes exists
    When I open the link of "data.bin"
    Then the details of "data.bin" are shown
    And no preview is shown

  Scenario: A shared link opens the file directly
    Given the file "shared.txt" of type "text/plain" with content "shared" exists
    When I open the link of "shared.txt"
    Then the details of "shared.txt" are shown
    And the address is the link of "shared.txt"

  Scenario: An unknown shared link falls back to the overview
    Given the file "notes.txt" of type "text/plain" with content "hello world" exists
    When I open the link of an unknown file
    Then the notification "Datei nicht gefunden" appears
    And I am on the overview
    And the files are shown in this order:
      | notes.txt |

  Scenario: The back button and the browser history navigate between the views
    Given the file "notes.txt" of type "text/plain" with content "hello world" exists
    And I open the overview
    When I click the file "notes.txt"
    Then the details of "notes.txt" are shown
    When I go back to all files
    Then I am on the overview
    When I navigate back in the browser
    Then the address is the link of "notes.txt"
    And the details of "notes.txt" are shown
    When I navigate back in the browser
    Then I am on the overview

  Scenario: The download button saves the original file
    Given the file "download.txt" of type "text/plain" with content "download me" exists
    And I open the link of "download.txt"
    When I click the download button
    Then the browser has downloaded "download.txt" with the content "download me"
