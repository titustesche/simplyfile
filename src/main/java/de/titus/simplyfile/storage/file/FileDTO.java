package de.titus.simplyfile.storage.file;

import de.titus.simplyfile.database.models.FileModel;

import java.util.UUID;

public record FileDTO(
        UUID id,
        String filename,
        String sha256,
        String path,
        String type,
        Long size
) {
    public FileDTO(UUID id, String name, String path, long size) {
        this(id, name, null, path, null, size);
    }

    public FileDTO(FileModel model) {
        this(model.getId(), model.getName(), model.getSha256(), model.getPath(), model.getType(), model.getSize());
    }
}
