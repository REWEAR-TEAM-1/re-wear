package com.rewear.listing;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rewear.auth.RewearUserDetails;
import com.rewear.auth.UserAccount;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Base64;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "app.uploads.directory=target/test-uploads"
)
@AutoConfigureMockMvc
class ListingApiIntegrationTest {
    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private RewearUserDetails testUser;

    @BeforeEach
    void setUp() {
        testUser = new RewearUserDetails(new UserAccount("Test seller", "test@example.com", "not-a-password"));
    }

    @Test
    void healthCatalogFiltersAndListingCreationWorkEndToEnd() throws Exception {
        ResponseEntity<ListingController.HealthResponse> health =
                restTemplate.getForEntity("/api/health", ListingController.HealthResponse.class);
        assertEquals(HttpStatus.OK, health.getStatusCode());
        assertEquals("ok", health.getBody().status());

        ResponseEntity<Listing[]> redesignResponse =
                restTemplate.getForEntity("/api/listings?type=REDESIGN", Listing[].class);
        assertEquals(HttpStatus.OK, redesignResponse.getStatusCode());
        assertTrue(Arrays.stream(redesignResponse.getBody()).allMatch(listing -> listing.getType() == ListingType.REDESIGN));

        ListingRequest request = new ListingRequest(
                "Cotton shirt",
                "A handspun cotton piece ready for another home.",
                "Client supplied name",
                ListingCategory.TOPS,
                "M",
                ListingCondition.GOOD,
                new BigDecimal("18000"),
                ListingType.SALE,
                null,
                "Seoul"
        );
        MvcResult createResult = mockMvc.perform(post("/api/listings")
                        .with(user(testUser))
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isCreated())
                .andReturn();
        Listing created = objectMapper.readValue(createResult.getResponse().getContentAsByteArray(), Listing.class);

        assertEquals("Cotton shirt", created.getTitle());
        assertEquals("Test seller", created.getSellerName());

        ResponseEntity<Listing[]> searchResponse =
                restTemplate.getForEntity("/api/listings?q=handspun", Listing[].class);
        assertEquals(1, searchResponse.getBody().length);
        assertEquals(created.getId(), searchResponse.getBody()[0].getId());
    }

    @Test
    void imageUploadReturnsAUrlThatServesTheUploadedImage() throws Exception {
        byte[] imageBytes = Base64.getDecoder().decode(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII="
        );
        MockMultipartFile image = new MockMultipartFile("file", "phone-photo.png", "image/png", imageBytes);
        MvcResult uploadResult = mockMvc.perform(multipart("/api/uploads")
                        .file(image)
                        .with(user(testUser))
                        .with(csrf()))
                .andExpect(status().isCreated())
                .andReturn();

        String imageUrl = objectMapper.readValue(
                uploadResult.getResponse().getContentAsByteArray(),
                ImageUploadController.ImageUploadResponse.class
        ).imageUrl();
        assertTrue(imageUrl.matches("/uploads/[0-9a-f-]{36}\\.png"));
        ResponseEntity<byte[]> imageResponse = restTemplate.getForEntity(imageUrl, byte[].class);
        assertEquals(HttpStatus.OK, imageResponse.getStatusCode());
        assertArrayEquals(imageBytes, imageResponse.getBody());
    }
}
