package de.titus.simplyfile.controllers;

import de.titus.simplyfile.database.models.FileModel;
import de.titus.simplyfile.storage.file.FileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.spring6.view.ThymeleafViewResolver;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class FrontendControllerTest {

    private FileService fileService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        fileService = mock(FileService.class);

        ClassLoaderTemplateResolver templateResolver = new ClassLoaderTemplateResolver();
        templateResolver.setPrefix("templates/");
        templateResolver.setSuffix(".html");
        templateResolver.setCharacterEncoding("UTF-8");

        SpringTemplateEngine templateEngine = new SpringTemplateEngine();
        templateEngine.setTemplateResolver(templateResolver);

        ThymeleafViewResolver viewResolver = new ThymeleafViewResolver();
        viewResolver.setTemplateEngine(templateEngine);
        viewResolver.setCharacterEncoding("UTF-8");

        mockMvc = MockMvcBuilders.standaloneSetup(new FrontendController(fileService))
                .setViewResolvers(viewResolver)
                .build();
    }

    @Test
    void landingPageRenders() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("~/share")))
                .andExpect(content().string(containsString("href=\"/files\"")));
    }

    @Test
    void filesPageListsFiles() throws Exception {
        when(fileService.getAll()).thenReturn(List.of(
                new FileModel("report.pdf", "abc", "/tmp/report.pdf", "application/pdf", 1024L)
        ));

        mockMvc.perform(get("/files"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("report.pdf")))
                .andExpect(content().string(containsString("id=\"dropzone\"")))
                .andExpect(content().string(containsString("/download")));
    }

    @Test
    void filesPageShowsEmptyState() throws Exception {
        when(fileService.getAll()).thenReturn(List.of());

        mockMvc.perform(get("/files"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Noch keine Dateien")))
                .andExpect(content().string(not(containsString("class=\"fileRow\""))));
    }

    @Test
    void uploadRedirectsToFilesPage() throws Exception {
        mockMvc.perform(get("/upload"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/files"));
    }
}
