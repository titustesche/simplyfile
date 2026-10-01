package de.titus.simplyfile.storage.file;

import de.titus.simplyfile.database.FileRepository;
import de.titus.simplyfile.database.models.FileModel;
import de.titus.simplyfile.storage.StorageService;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.List;
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

            //region Calculate SHA256
            String sha256;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(file.getBytes());
            sha256 = Base64.getEncoder().encodeToString(hash);

            FileModel fileModel = new FileModel(
                    file.getOriginalFilename(),
                    sha256,
                    storageKey,
                    file.getContentType(),
                    file.getSize()
            );

            repository.save(fileModel);

            return new FileDTO(
                    fileModel.getId(),
                    fileModel.getName(),
                    fileModel.getSha256(),
                    fileModel.getPath(),
                    fileModel.getType(),
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

    public void delete(FileModel model) throws IOException {
        storage.delete(model.getPath());
        repository.delete(model);
    }

    public FileModel get(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found"));
    }

    public List<FileModel> getAll() {
        return repository.findAll();
    }
}
