package de.titus.simplyfile.storage.file;

import de.titus.simplyfile.database.FileRepository;
import de.titus.simplyfile.database.models.FileModel;
import de.titus.simplyfile.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class FileServiceTest {

    private FileRepository repository;
    private StorageService storage;
    private FileService fileService;

    @BeforeEach
    void setUp() {
        repository = mock(FileRepository.class);
        storage = mock(StorageService.class);
        fileService = new FileService(repository, storage);
    }

    @Test
    void uploadStoresFileAndReturnsDto() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "hello.txt",
                "text/plain",
                "hello world".getBytes()
        );

        when(storage.store(file)).thenReturn("storage-key");
        when(repository.save(any(FileModel.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FileDTO dto = fileService.upload(file);

        assertNotNull(dto);
        assertEquals("hello.txt", dto.filename());
        assertEquals("storage-key", dto.path());
        assertEquals(11L, dto.size());

        verify(storage).store(file);
        verify(repository).save(any(FileModel.class));
    }

    @Test
    void uploadEmptyFileThrowsIllegalArgumentException() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "empty.txt",
                "text/plain",
                new byte[0]
        );

        assertThrows(IllegalArgumentException.class, () -> fileService.upload(file));

        verify(storage, never()).store(any());
        verify(repository, never()).save(any());
    }

    @Test
    void uploadWrapsStorageFailureInRuntimeException() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "fail.txt",
                "text/plain",
                "data".getBytes()
        );

        when(storage.store(file)).thenThrow(new IOException("disk full"));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> fileService.upload(file));
        assertTrue(exception.getMessage().contains("Could not store file"));

        verify(repository, never()).save(any());
    }

    @Test
    void downloadLoadsResourceFromStorage() throws IOException {
        FileModel model = new FileModel("name.txt", "sha", "storage-key", "text/plain", 4L);
        Resource resource = new ByteArrayResource("data".getBytes());

        when(storage.load("storage-key")).thenReturn(resource);

        Resource result = fileService.download(model);

        assertSame(resource, result);
        verify(storage).load("storage-key");
    }

    @Test
    void getReturnsModelWhenFound() {
        UUID id = UUID.randomUUID();
        FileModel model = new FileModel("name.txt", "sha", "path", "text/plain", 4L);

        when(repository.findById(id)).thenReturn(Optional.of(model));

        assertSame(model, fileService.get(id));
    }

    @Test
    void getThrowsWhenNotFound() {
        UUID id = UUID.randomUUID();

        when(repository.findById(id)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> fileService.get(id));
        assertEquals("File not found", exception.getMessage());
    }
}
