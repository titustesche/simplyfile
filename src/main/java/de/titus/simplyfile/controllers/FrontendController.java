package de.titus.simplyfile.controllers;
import de.titus.simplyfile.storage.file.FileDTO;
import de.titus.simplyfile.storage.file.FileService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.UUID;

@Controller
public class FrontendController {
    private final FileService fileService;

    public FrontendController(FileService fileService) {
        this.fileService = fileService;
    }

    @GetMapping("/")
    public String landingPage() {
        return "index";
    }

    @GetMapping("/file/{id}")
    public String filePage(
            @PathVariable("id") UUID id,
            Model model
    ) {
        FileDTO file = fileService.get(id).toDTO();

        model.addAttribute("file", file);

        return "file";
    }

    @GetMapping("/files")
    public String filesPage(Model model) {
        List<FileDTO> files = fileService.getAll()
                .stream()
                .map(FileDTO::new)
                .toList();

        model.addAttribute("files", files);
        return "files";
    }

    @GetMapping("/upload")
    public String uploadPage() {
        return "redirect:/files";
    }
}
