@e2e @browser
Feature: Settings

  Scenario: The settings dialog opens and closes
    Given I open the overview
    When I open the settings
    Then the dialog "Einstellungen" is shown
    When I close the settings
    Then no dialog is shown
