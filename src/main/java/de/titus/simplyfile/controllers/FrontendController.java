package de.titus.simplyfile.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

/**
 * Serves the single page frontend (static/index.html). The frontend reads the
 * selected file from the path, so shared links like /file/{id} keep working.
 */
@Controller
public class FrontendController {

    @GetMapping({"/", "/file/{id}"})
    public String app(@PathVariable(value = "id", required = false) UUID id) {
        return "forward:/index.html";
    }

    @GetMapping({"/files", "/upload"})
    public String legacyPages() {
        return "redirect:/";
    }
}
