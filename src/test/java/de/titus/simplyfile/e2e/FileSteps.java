package de.titus.simplyfile.e2e;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import org.springframework.beans.factory.annotation.Autowired;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

import static org.junit.jupiter.api.Assertions.*;

/** Steps about the files known to the backend, used by API and browser scenarios alike. */
public class FileSteps {

    @Autowired
    private World world;

    @Given("the file {string} of type {string} with content {string} exists")
    public void fileWithContentExists(String filename, String type, String content) {
        fileExists(filename, type, content.getBytes(StandardCharsets.UTF_8));
    }

    @Given("the file {string} of type {string} exists with the content:")
    public void fileWithMultilineContentExists(String filename, String type, String content) {
        fileExists(filename, type, content.getBytes(StandardCharsets.UTF_8));
    }

    @Given("the file {string} of type {string} with {int} bytes exists")
    public void fileWithSizeExists(String filename, String type, int size) {
        byte[] content = new byte[size];
        for (int i = 0; i < size; i++) content[i] = (byte) i;
        fileExists(filename, type, content);
    }

    @Then("the database contains {int} file(s)")
    public void databaseContainsFiles(int count) {
        assertEquals(count, world.repository.count());
    }

    @Then("the database no longer contains {string}")
    public void databaseNoLongerContains(String filename) {
        assertFalse(world.repository.existsById(world.file(filename).id()));
    }

    @Then("the storage contains {int} object(s)")
    public void storageContainsObjects(int count) {
        assertEquals(count, world.storedObjects().size());
    }

    @Then("the stored object has the content {string}")
    public void storedObjectHasContent(String content) throws IOException {
        assertEquals(1, world.storedObjects().size());
        assertEquals(content, Files.readString(world.storedObjects().getFirst()));
    }

    private void fileExists(String filename, String type, byte[] content) {
        assertNotNull(
                world.upload(filename, type, content, World.ResponseRecorder.NONE),
                "The backend rejected " + filename
        );
    }
}
