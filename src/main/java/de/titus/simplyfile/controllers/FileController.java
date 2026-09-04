package de.titus.simplyfile.controllers;

import de.titus.simplyfile.database.FileRepository;
import de.titus.simplyfile.database.models.FileModel;
import de.titus.simplyfile.storage.file.FileDTO;
import de.titus.simplyfile.storage.file.FileService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/file")
public class FileController {

    private final FileService fileService;
    private final FileRepository repository;

    public FileController(
            FileService fileService,
            FileRepository repository
    ) {
        this.fileService = fileService;
        this.repository = repository;
    }

    @PostMapping("upload")
    public ResponseEntity<FileDTO> upload(
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(fileService.upload(file));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable("id") UUID id) throws IOException {

        FileModel file = fileService.get(id);
        Resource resource = fileService.download(file);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + file.getName() + "\""
                )
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
}
