package de.titus.simplyfile.e2e;

import de.titus.simplyfile.storage.file.FileDTO;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/** Steps that talk to the HTTP API like an external client would. */
public class ApiSteps {

    @Autowired
    private World world;

    private HttpStatusCode status;
    private HttpHeaders headers;
    private byte[] body;

    private FileDTO uploaded;
    private List<FileDTO> listed;

    //region Requests

    @When("the client requests {string}")
    public void clientRequests(String path) {
        request(HttpMethod.GET, path);
    }

    @When("the client requests the link of {string}")
    public void clientRequestsLinkOf(String filename) {
        request(HttpMethod.GET, "/file/" + world.file(filename).id());
    }

    @When("the client uploads {string} of type {string} with content {string}")
    public void clientUploads(String filename, String type, String content) {
        uploaded = world.upload(filename, type, content.getBytes(StandardCharsets.UTF_8), this::record);
    }

    @When("the client lists the files")
    public void clientListsFiles() {
        listed = world.client().get()
                .uri("/file/list")
                .exchange((request, response) -> {
                    record(response.getStatusCode(), response.getHeaders(), null);
                    return response.getStatusCode().is2xxSuccessful()
                            ? response.bodyTo(new ParameterizedTypeReference<List<FileDTO>>() { })
                            : null;
                });
    }

    @When("the client downloads {string}")
    public void clientDownloads(String filename) {
        request(HttpMethod.GET, "/file/" + world.file(filename).id() + "/download");
    }

    @When("the client downloads an unknown file")
    public void clientDownloadsUnknownFile() {
        request(HttpMethod.GET, "/file/" + UUID.randomUUID() + "/download");
    }

    @When("the client deletes {string}")
    public void clientDeletes(String filename) {
        request(HttpMethod.DELETE, "/file/" + world.file(filename).id());
    }

    @When("the client deletes the last uploaded file")
    public void clientDeletesLastUploadedFile() {
        assertNotNull(uploaded, "No file was uploaded");
        request(HttpMethod.DELETE, "/file/" + uploaded.id());
    }

    @When("the client deletes an unknown file")
    public void clientDeletesUnknownFile() {
        request(HttpMethod.DELETE, "/file/" + UUID.randomUUID());
    }

    //endregion
    //region Responses

    @Then("the response status is {int}")
    public void responseStatusIs(int expected) {
        assertEquals(expected, status.value());
    }

    @Then("the response is an error")
    public void responseIsAnError() {
        assertTrue(status.isError(), "Expected an error status but got " + status);
    }

    @Then("the response has the content type {string}")
    public void responseHasContentType(String contentType) {
        assertEquals(MediaType.parseMediaType(contentType), headers.getContentType());
    }

    @Then("the response is an attachment named {string}")
    public void responseIsAttachmentNamed(String filename) {
        assertEquals(
                "attachment; filename=\"" + filename + "\"",
                headers.getFirst(HttpHeaders.CONTENT_DISPOSITION)
        );
    }

    @Then("the response body is the content of {string}")
    public void responseBodyIsContentOf(String filename) {
        assertArrayEquals(world.contentOf(filename), body);
    }

    @Then("the response is the Simplyfile page")
    public void responseIsTheSimplyfilePage() {
        assertTrue(headers.getContentType().isCompatibleWith(MediaType.TEXT_HTML));
        assertTrue(new String(body, StandardCharsets.UTF_8).contains("<title>Simplyfile</title>"));
    }

    @Then("the uploaded file has the name {string}, the type {string} and the size {long}")
    public void uploadedFileHas(String filename, String type, long size) {
        assertNotNull(uploaded.id());
        assertEquals(filename, uploaded.filename());
        assertEquals(type, uploaded.type());
        assertEquals(size, uploaded.size());
    }

    // The digest has to be correct; the step does not prescribe hex or Base64 encoding.
    @Then("the uploaded file has the SHA-256 of {string}")
    public void uploadedFileHasSha256Of(String content) throws NoSuchAlgorithmException {
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(content.getBytes(StandardCharsets.UTF_8));

        List<String> accepted = List.of(
                HexFormat.of().formatHex(digest),
                Base64.getEncoder().encodeToString(digest)
        );
        assertTrue(accepted.contains(uploaded.sha256()), "Not the SHA-256 of the content: " + uploaded.sha256());
    }

    @Then("no files are listed")
    public void noFilesAreListed() {
        assertEquals(List.of(), listed);
    }

    @Then("the listed files are:")
    public void listedFilesAre(List<Map<String, String>> expected) {
        List<Map<String, String>> actual = listed.stream()
                .map(file -> Map.of(
                        "filename", file.filename(),
                        "type", file.type(),
                        "size", String.valueOf(file.size())
                ))
                .toList();

        assertEquals(expected.size(), actual.size());
        assertTrue(actual.containsAll(expected), "Expected " + expected + " but got " + actual);
        for (FileDTO file : listed) assertEquals(world.file(file.filename()), file);
    }

    //endregion

    private void request(HttpMethod method, String path) {
        world.client().method(method)
                .uri(path)
                .exchange((request, response) -> {
                    record(response.getStatusCode(), response.getHeaders(), response.getBody().readAllBytes());
                    return null;
                });
    }

    private void record(HttpStatusCode status, HttpHeaders headers, byte[] body) {
        this.status = status;
        this.headers = headers;
        this.body = body;
    }
}
