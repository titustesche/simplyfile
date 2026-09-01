package de.titus.simplyfile.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class LocalStorageService implements StorageService {

    private final Path root;

    public LocalStorageService(
            @Value("${storage.path}")
            Path root
    ) {
        this.root = root;

        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new RuntimeException("Could not create storage directory", e);
        }
    }

    @Override
    public String store(MultipartFile file) throws IOException {
        String key = UUID.randomUUID().toString();

        Path target = root.resolve(key);

        try (var input = file.getInputStream()) {
            Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
        }

        return key;
    }

    @Override
    public Resource load(String storageKey) throws IOException {
        Path path = root.resolve(storageKey);

        return new FileSystemResource(path);
    }

    @Override
    public void delete(String storageKey) throws IOException {
        Files.deleteIfExists(root.resolve(storageKey));
    }
}
