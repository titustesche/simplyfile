package de.titus.simplyfile.e2e;

import org.junit.jupiter.api.Assumptions;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * One headless Chrome/Chromium shared by all browser scenarios.
 * <p>
 * The browser is taken from {@code CHROME_BIN} or the {@code PATH}. Without a usable
 * browser the scenarios are skipped locally, on CI (environment variable {@code CI}) they fail.
 */
final class Browser {

    private static final List<String> BINARY_NAMES =
            List.of("google-chrome", "google-chrome-stable", "chromium", "chromium-browser");

    static final Path DOWNLOADS = TempDirectories.create("simplyfile-e2e-downloads");

    private static WebDriver driver;
    private static RuntimeException startupFailure;

    private Browser() { }

    static WebDriver driver() {
        if (driver == null && startupFailure == null) start();
        if (startupFailure != null) {
            if (System.getenv("CI") != null) throw startupFailure;
            Assumptions.abort("No usable Chrome/Chromium for the browser scenarios: " + startupFailure.getMessage());
        }
        return driver;
    }

    static void quit() {
        if (driver != null) driver.quit();
        driver = null;
    }

    private static void start() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new", "--window-size=1400,1000", "--no-sandbox", "--disable-dev-shm-usage");
        options.setExperimentalOption("prefs", Map.of(
                "download.default_directory", DOWNLOADS.toString(),
                "download.prompt_for_download", false
        ));
        findBinary().ifPresent(options::setBinary);

        try {
            driver = new ChromeDriver(options);
        } catch (RuntimeException e) {
            startupFailure = e;
        }
    }

    private static Optional<String> findBinary() {
        String configured = System.getenv("CHROME_BIN");
        if (configured != null && !configured.isBlank()) return Optional.of(configured);

        String path = System.getenv("PATH");
        if (path == null) return Optional.empty();

        return BINARY_NAMES.stream()
                .flatMap(name -> Arrays.stream(path.split(File.pathSeparator)).map(dir -> Path.of(dir, name)))
                .filter(Files::isExecutable)
                .map(Path::toString)
                .findFirst();
    }
}
