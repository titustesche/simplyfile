package de.titus.simplyfile.storage.file;

import de.titus.simplyfile.database.models.FileModel;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FileDTOTest {

    @Test
    void dtoFromModelCopiesAllFields() {
        FileModel model = new FileModel("hello.txt", "sha", "storage-key", "text/plain", 11L);

        FileDTO dto = new FileDTO(model);

        assertNull(dto.id());
        assertEquals("hello.txt", dto.filename());
        assertEquals("sha", dto.sha256());
        assertEquals("storage-key", dto.path());
        assertEquals("text/plain", dto.type());
        assertEquals(11L, dto.size());
        assertEquals(dto, model.toDTO());
    }
}
