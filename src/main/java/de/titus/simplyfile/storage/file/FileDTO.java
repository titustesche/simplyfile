package de.titus.simplyfile.storage.file;

import java.util.UUID;

public record FileDTO(
        UUID id,
        String filename,
        String path,
        Long size
) { }
