package de.titus.simplyfile.e2e;

import de.titus.simplyfile.storage.file.FileDTO;
import io.cucumber.java.AfterAll;
import io.cucumber.java.Before;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.openqa.selenium.By;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.beans.factory.annotation.Autowired;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/** Steps that use the frontend like a user would, in a real browser. */
public class BrowserSteps {

    private static final Path LOCAL_FILES = TempDirectories.create("simplyfile-e2e-uploads");

    @Autowired
    private World world;

    private WebDriver driver;
    private WebDriverWait wait;

    @Before("@browser")
    public void prepareBrowser() {
        driver = Browser.driver();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        TempDirectories.clear(Browser.DOWNLOADS);
        TempDirectories.clear(LOCAL_FILES);
    }

    @AfterAll
    public static void quitBrowser() {
        Browser.quit();
    }

    //region Navigation

    @Given("I open the overview")
    public void openOverview() {
        driver.get(world.baseUrl() + "/");
        // The file count is filled once the file list has been loaded from the backend
        wait.until(d -> !text(By.id("file-count")).isEmpty());
    }

    @When("I open the page {string}")
    public void openPage(String path) {
        driver.get(world.baseUrl() + path);
    }

    @When("I open the link of {string}")
    public void openLinkOf(String filename) {
        driver.get(world.linkOf(world.file(filename).id()));
        detailsAreShown(filename);
    }

    @When("I open the link of an unknown file")
    public void openLinkOfUnknownFile() {
        driver.get(world.linkOf(UUID.randomUUID()));
    }

    @When("I go back to all files")
    public void goBackToAllFiles() {
        driver.findElement(By.id("file-details-back-button")).click();
    }

    @When("I navigate back in the browser")
    public void navigateBack() {
        driver.navigate().back();
    }

    @Then("I am on the overview")
    public void iAmOnTheOverview() {
        wait.until(ExpectedConditions.urlToBe(world.baseUrl() + "/"));
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("overview")));
    }

    @Then("the address is the link of {string}")
    public void addressIsLinkOf(String filename) {
        wait.until(ExpectedConditions.urlToBe(world.linkOf(world.file(filename).id())));
    }

    @Then("the page title is {string}")
    public void pageTitleIs(String title) {
        assertEquals(title, driver.getTitle());
    }

    //endregion
    //region Overview

    @When("I search for {string}")
    public void searchFor(String query) {
        WebElement search = driver.findElement(By.cssSelector("#file-filter input.text-input"));
        search.clear();
        search.sendKeys(query);
    }

    @When("I click the sort button")
    public void clickSortButton() {
        driver.findElement(By.id("file-sort-button")).click();
    }

    @When("I click the file {string}")
    public void clickFile(String filename) {
        row(filename).click();
    }

    @Then("the sort button shows {string}")
    public void sortButtonShows(String label) {
        assertEquals(label, text(By.id("file-sort-button")));
    }

    @Then("the file count shows {string}")
    public void fileCountShows(String expected) {
        waitForText(By.id("file-count"), expected);
    }

    @Then("the file list shows the hint {string}")
    public void fileListShowsHint(String hint) {
        waitForText(By.cssSelector("#file-list .file-list-info-text"), hint);
    }

    @Then("no files are shown")
    public void noFilesAreShown() {
        filesAreShownInOrder(List.of());
    }

    @Then("the files are shown in this order:")
    public void filesAreShownInOrder(List<String> filenames) {
        try {
            wait.until(d -> fileNames().equals(filenames));
        } catch (TimeoutException e) {
            assertEquals(filenames, fileNames());
        }
    }

    @Then("the row of {string} shows the size {string} and the type {string}")
    public void rowShowsSizeAndType(String filename, String size, String type) {
        WebElement row = row(filename);
        assertEquals(size, row.findElement(By.className("file-row-size")).getText());
        assertEquals(type, row.findElement(By.className("file-row-type")).getText());
    }

    @Then("the overview is hidden")
    public void overviewIsHidden() {
        assertFalse(driver.findElement(By.id("overview")).isDisplayed());
    }

    //endregion
    //region Upload

    @When("I select the local file {string} with content {string} for upload")
    public void selectLocalFile(String name, String content) {
        selectFiles(List.of(localFile(name, content)));
    }

    @When("I select these local files for upload:")
    public void selectLocalFiles(List<Map<String, String>> files) {
        selectFiles(files.stream().map(file -> localFile(file.get("name"), file.get("content"))).toList());
    }

    @Then("the upload of {string} is marked as {word}")
    public void uploadIsMarkedAs(String filename, String state) {
        // The entry is only rendered once the browser has read the selected files
        wait.until(d -> findUploadItem(filename)
                .map(item -> item.getAttribute("class").contains("state-" + state))
                .orElse(false));
    }

    @Then("the upload of {string} shows {string} and can be retried")
    public void uploadShowsAndCanBeRetried(String filename, String label) {
        WebElement item = uploadItem(filename);
        assertEquals(label, item.findElement(By.className("upload-item-percent")).getText());
        assertTrue(item.findElement(By.cssSelector("[title='Erneut versuchen']")).isDisplayed());
    }

    //endregion
    //region Details

    @Then("the details of {string} are shown")
    public void detailsAreShown(String filename) {
        FileDTO file = world.file(filename);
        WebElement details = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.id("file-details-container-" + file.id())));
        assertEquals(filename, details.findElement(By.cssSelector(".file-details-title-card .title")).getText());
    }

    @Then("the details show the size {string} and the type {string}")
    public void detailsShowSizeAndType(String size, String type) {
        Map<String, String> details = detailValues();
        assertEquals(size, details.get("Größe"));
        assertEquals(type, details.get("Typ"));
    }

    @Then("the details show the SHA-256, the ID and the link of {string}")
    public void detailsShowIdentityOf(String filename) {
        FileDTO file = world.file(filename);
        Map<String, String> details = detailValues();
        assertEquals(file.sha256(), details.get("SHA-256"));
        assertEquals(file.id().toString(), details.get("ID"));
        assertEquals(world.linkOf(file.id()), details.get("Link"));
    }

    @Then("the preview shows:")
    public void previewShows(String content) {
        waitForText(By.cssSelector("#details .file-details-preview pre"), content);
    }

    @Then("no preview is shown")
    public void noPreviewIsShown() {
        assertEquals(List.of(), driver.findElements(By.cssSelector("#details .file-details-preview")));
    }

    @When("I click the download button")
    public void clickDownloadButton() {
        driver.findElement(By.id("file-download-button")).click();
    }

    @Then("the browser has downloaded {string} with the content {string}")
    public void browserHasDownloaded(String filename, String content) {
        Path downloaded = Browser.DOWNLOADS.resolve(filename);
        wait.until(d -> Files.exists(downloaded) && downloaded.toFile().length() == content.length());
        assertEquals(content, readString(downloaded));
    }

    //endregion
    //region Dialogs and notifications

    @When("I click the delete button")
    public void clickDeleteButton() {
        driver.findElement(By.id("file-delete-button")).click();
    }

    @When("I choose {string} from the menu of {string}")
    public void chooseFromMenuOf(String label, String filename) {
        row(filename).findElement(By.cssSelector("[title='Weitere Aktionen']")).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("context-menu-container")));
        driver.findElements(By.cssSelector(".context-menu-container .ctx-menu-item")).stream()
                .filter(item -> item.getText().equals(label))
                .findFirst()
                .orElseThrow(() -> new AssertionError("No menu item " + label))
                .click();
    }

    @When("I confirm the deletion")
    public void confirmDeletion() {
        wait.until(ExpectedConditions.elementToBeClickable(By.id("delete-file-submit"))).click();
    }

    @When("I cancel the deletion")
    public void cancelDeletion() {
        wait.until(ExpectedConditions.elementToBeClickable(By.id("delete-file-cancel"))).click();
    }

    @When("I open the settings")
    public void openSettings() {
        driver.findElement(By.id("settings-button")).click();
    }

    @When("I close the settings")
    public void closeSettings() {
        wait.until(ExpectedConditions.elementToBeClickable(By.id("settings-modal-close"))).click();
    }

    @Then("the dialog {string} is shown")
    public void dialogIsShown(String title) {
        waitForText(By.cssSelector(".modal-container .title"), title);
    }

    @Then("the dialog mentions {string}")
    public void dialogMentions(String message) {
        String dialog = text(By.className("modal-container"));
        assertTrue(dialog.contains(message), "Dialog does not mention " + message + ": " + dialog);
    }

    @Then("no dialog is shown")
    public void noDialogIsShown() {
        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.className("modal-container")));
    }

    @Then("the notification {string} appears")
    public void notificationAppears(String title) {
        wait.until(d -> d.findElements(By.cssSelector("#popup-container .popup-title")).stream()
                .anyMatch(popup -> popup.getText().equals(title)));
    }

    //endregion
    //region Helpers

    private String text(By locator) {
        return driver.findElement(locator).getText();
    }

    // Waits for the text and reports the difference if it never shows up
    private void waitForText(By locator, String expected) {
        try {
            wait.until(d -> d.findElements(locator).stream().anyMatch(element -> element.getText().equals(expected)));
        } catch (TimeoutException e) {
            assertEquals(expected, text(locator));
        }
    }

    private List<String> fileNames() {
        return driver.findElements(By.cssSelector("#file-list .file-row-name")).stream()
                .map(WebElement::getText)
                .toList();
    }

    private WebElement row(String filename) {
        return driver.findElements(By.cssSelector("#file-list .file-row")).stream()
                .filter(row -> row.findElement(By.className("file-row-name")).getText().equals(filename))
                .findFirst()
                .orElseThrow(() -> new AssertionError("No row for " + filename));
    }

    private Optional<WebElement> findUploadItem(String filename) {
        return driver.findElements(By.cssSelector("#upload-list .upload-item")).stream()
                .filter(item -> item.findElement(By.className("upload-item-name")).getText().equals(filename))
                .findFirst();
    }

    private WebElement uploadItem(String filename) {
        return findUploadItem(filename).orElseThrow(() -> new AssertionError("No upload of " + filename));
    }

    private Map<String, String> detailValues() {
        List<WebElement> labels = driver.findElements(By.cssSelector("#details .file-details-info .file-details-label"));
        List<WebElement> values = driver.findElements(By.cssSelector("#details .file-details-info .file-details-value"));
        assertEquals(labels.size(), values.size());

        Map<String, String> details = new LinkedHashMap<>();
        for (int i = 0; i < labels.size(); i++) details.put(labels.get(i).getText(), values.get(i).getText());
        return details;
    }

    // The file input is hidden behind the dropzone, the driver fills it directly
    private void selectFiles(List<Path> files) {
        String paths = files.stream().map(Path::toString).collect(Collectors.joining("\n"));
        driver.findElement(By.id("upload-file-input")).sendKeys(paths);
    }

    private Path localFile(String name, String content) {
        try {
            return Files.writeString(LOCAL_FILES.resolve(name), content);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static String readString(Path path) {
        try {
            return Files.readString(path);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    //endregion
}
