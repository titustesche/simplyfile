package de.titus.simplyfile.storage;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class LocalStorageServiceTest {

    @TempDir
    Path tempDir;

    private LocalStorageService storageService;

    @BeforeEach
    void setUp() {
        storageService = new LocalStorageService(tempDir.resolve("storage"));
    }

    @Test
    void constructorCreatesStorageDirectory() {
        assertTrue(Files.isDirectory(tempDir.resolve("storage")));
    }

    @Test
    void storeWritesFileAndReturnsKey() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "hello.txt",
                "text/plain",
                "hello world".getBytes()
        );

        String key = storageService.store(file);

        assertNotNull(key);
        Path stored = tempDir.resolve("storage").resolve(key);
        assertTrue(Files.exists(stored));
        assertArrayEquals("hello world".getBytes(), Files.readAllBytes(stored));
    }

    @Test
    void storeReturnsUniqueKeys() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "hello.txt",
                "text/plain",
                "hello".getBytes()
        );

        String first = storageService.store(file);
        String second = storageService.store(file);

        assertNotEquals(first, second);
    }

    @Test
    void loadReturnsStoredContent() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "hello.txt",
                "text/plain",
                "some content".getBytes()
        );

        String key = storageService.store(file);
        Resource resource = storageService.load(key);

        assertTrue(resource.exists());
        assertArrayEquals("some content".getBytes(), resource.getInputStream().readAllBytes());
    }

    @Test
    void loadMissingKeyReturnsNonExistingResource() throws IOException {
        Resource resource = storageService.load("does-not-exist");

        assertFalse(resource.exists());
    }

    @Test
    void deleteRemovesStoredFile() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "hello.txt",
                "text/plain",
                "bye".getBytes()
        );

        String key = storageService.store(file);
        storageService.delete(key);

        assertFalse(Files.exists(tempDir.resolve("storage").resolve(key)));
    }

    @Test
    void deleteMissingKeyDoesNotThrow() {
        assertDoesNotThrow(() -> storageService.delete("does-not-exist"));
    }
}
