package de.titus.simplyfile.storage.file;

import de.titus.simplyfile.database.FileRepository;
import de.titus.simplyfile.database.models.FileModel;
import de.titus.simplyfile.storage.StorageService;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class FileService {

    private final FileRepository repository;
    private final StorageService storage;

    public FileService(
            FileRepository repository,
            StorageService storage
    ) {
        this.repository = repository;
        this.storage = storage;
    }

    public FileDTO upload(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        try {
            String storageKey = storage.store(file);

            FileModel fileModel = new FileModel(
                    file.getOriginalFilename(),
                    "TODO",
                    storageKey,
                    file.getContentType(),
                    file.getSize()
            );

            repository.save(fileModel);

            return new FileDTO(
                    fileModel.getId(),
                    fileModel.getName(),
                    fileModel.getPath(),
                    fileModel.getSize()
            );
        }

        catch (Exception e) {
            throw new RuntimeException("Could not store file: " + e);
        }
    }

    public Resource download(FileModel model) throws IOException {
        return storage.load(model.getPath());
    }

    public FileModel get(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found"));
    }
}
