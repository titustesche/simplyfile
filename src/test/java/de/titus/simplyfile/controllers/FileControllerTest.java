package de.titus.simplyfile.controllers;

import de.titus.simplyfile.database.models.FileModel;
import de.titus.simplyfile.storage.file.FileDTO;
import de.titus.simplyfile.storage.file.FileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class FileControllerTest {

    private FileService fileService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        fileService = mock(FileService.class);
        FileController controller = new FileController(fileService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void uploadReturnsFileDto() throws Exception {
        UUID id = UUID.randomUUID();
        FileDTO dto = new FileDTO(id, "hello.txt", "sha", "storage-key", "text/plain", 11L);

        when(fileService.upload(any(MultipartFile.class))).thenReturn(dto);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "hello.txt",
                "text/plain",
                "hello world".getBytes()
        );

        mockMvc.perform(multipart("/file/upload").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.filename").value("hello.txt"))
                .andExpect(jsonPath("$.sha256").value("sha"))
                .andExpect(jsonPath("$.path").value("storage-key"))
                .andExpect(jsonPath("$.type").value("text/plain"))
                .andExpect(jsonPath("$.size").value(11));
    }

    @Test
    void uploadWithoutFilePartIsRejected() throws Exception {
        mockMvc.perform(multipart("/file/upload"))
                .andExpect(status().isBadRequest());

        verify(fileService, never()).upload(any());
    }

    @Test
    void downloadReturnsFileContent() throws Exception {
        UUID id = UUID.randomUUID();
        FileModel model = new FileModel("hello.txt", "sha", "storage-key", "text/plain", 11L);

        when(fileService.get(id)).thenReturn(model);
        when(fileService.download(model)).thenReturn(new ByteArrayResource("hello world".getBytes()));

        mockMvc.perform(get("/file/{id}/download", id))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"hello.txt\""
                ))
                .andExpect(content().contentType("application/octet-stream"))
                .andExpect(content().bytes("hello world".getBytes()));
    }

    @Test
    void listReturnsAllFiles() throws Exception {
        when(fileService.getAll()).thenReturn(List.of(
                new FileModel("report.pdf", "abc", "storage-key", "application/pdf", 1024L)
        ));

        mockMvc.perform(get("/file/list"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].filename").value("report.pdf"))
                .andExpect(jsonPath("$[0].sha256").value("abc"))
                .andExpect(jsonPath("$[0].type").value("application/pdf"))
                .andExpect(jsonPath("$[0].size").value(1024));
    }

    @Test
    void listWithoutFilesReturnsEmptyArray() throws Exception {
        when(fileService.getAll()).thenReturn(List.of());

        mockMvc.perform(get("/file/list"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void invalidFileIdIsRejected() throws Exception {
        mockMvc.perform(get("/file/{id}/download", "not-a-uuid"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(delete("/file/{id}", "not-a-uuid"))
                .andExpect(status().isBadRequest());

        verify(fileService, never()).get(any());
    }

    @Test
    void deleteRemovesFile() throws Exception {
        UUID id = UUID.randomUUID();
        FileModel model = new FileModel("hello.txt", "sha", "storage-key", "text/plain", 11L);

        when(fileService.get(id)).thenReturn(model);

        mockMvc.perform(delete("/file/{id}", id))
                .andExpect(status().isNoContent());

        verify(fileService).delete(model);
    }
}
