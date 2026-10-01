package de.titus.simplyfile.controllers;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class FrontendControllerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new FrontendController()).build();
    }

    @Test
    void rootServesSinglePageApp() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    void fileLinkServesSinglePageApp() throws Exception {
        mockMvc.perform(get("/file/{id}", UUID.randomUUID()))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    void invalidFileIdIsRejected() throws Exception {
        mockMvc.perform(get("/file/{id}", "not-a-uuid"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void legacyPagesRedirectToRoot() throws Exception {
        mockMvc.perform(get("/files"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/"));

        mockMvc.perform(get("/upload"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/"));
    }
}
