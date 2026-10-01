package de.titus.simplyfile.e2e;

import de.titus.simplyfile.database.FileRepository;
import de.titus.simplyfile.storage.file.FileDTO;
import io.cucumber.java.Before;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * State and backend access shared by the step definitions of one scenario.
 * Every scenario starts without any files.
 */
public class World {

    @Value("${local.server.port}")
    private int port;

    @Autowired
    FileRepository repository;

    private final Map<String, FileDTO> files = new HashMap<>();
    private final Map<String, byte[]> contents = new HashMap<>();

    @Before(order = 0)
    public void removeAllFiles() {
        repository.deleteAll();
        TempDirectories.clear(CucumberSpringConfiguration.STORAGE);
    }

    String baseUrl() {
        return "http://localhost:" + port;
    }

    String linkOf(UUID id) {
        return baseUrl() + "/file/" + id;
    }

    RestClient client() {
        return RestClient.create(baseUrl());
    }

    /** Uploads over the API. Returns the created file, or nothing if the backend rejected it. */
    FileDTO upload(String filename, String type, byte[] content, ResponseRecorder recorder) {
        HttpHeaders partHeaders = new HttpHeaders();
        partHeaders.setContentType(MediaType.parseMediaType(type));

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new HttpEntity<>(new ByteArrayResource(content) {
            @Override
            public String getFilename() {
                return filename;
            }
        }, partHeaders));

        FileDTO uploaded = client().post()
                .uri("/file/upload")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .exchange((request, response) -> {
                    recorder.record(response.getStatusCode(), response.getHeaders(), null);
                    return response.getStatusCode().is2xxSuccessful() ? response.bodyTo(FileDTO.class) : null;
                });

        if (uploaded != null) {
            files.put(filename, uploaded);
            contents.put(filename, content);
        }
        return uploaded;
    }

    /** The file that was uploaded under this name last. */
    FileDTO file(String filename) {
        FileDTO file = files.get(filename);
        if (file == null) throw new AssertionError("No file named " + filename + " was uploaded in this scenario");
        return file;
    }

    byte[] contentOf(String filename) {
        file(filename);
        return contents.get(filename);
    }

    List<Path> storedObjects() {
        return TempDirectories.list(CucumberSpringConfiguration.STORAGE);
    }

    /** Receives status, headers and (optionally) the raw body of a backend response. */
    interface ResponseRecorder {
        ResponseRecorder NONE = (status, headers, body) -> { };

        void record(HttpStatusCode status, HttpHeaders headers, byte[] body);
    }
}
