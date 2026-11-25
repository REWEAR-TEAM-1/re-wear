package com.rewear.listing;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "app.uploads.directory=target/test-uploads"
)
class ListingApiIntegrationTest {
    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void healthCatalogFiltersAndListingCreationWorkEndToEnd() {
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
                "Test seller",
                ListingCategory.TOPS,
                "M",
                ListingCondition.GOOD,
                new BigDecimal("18000"),
                ListingType.SALE,
                null,
                "Seoul"
        );
        ResponseEntity<Listing> created =
                restTemplate.postForEntity("/api/listings", request, Listing.class);

        assertEquals(HttpStatus.CREATED, created.getStatusCode());
        assertEquals("Cotton shirt", created.getBody().getTitle());

        ResponseEntity<Listing[]> searchResponse =
                restTemplate.getForEntity("/api/listings?q=handspun", Listing[].class);
        assertEquals(1, searchResponse.getBody().length);
        assertEquals(created.getBody().getId(), searchResponse.getBody()[0].getId());
    }

    @Test
    void imageUploadReturnsAUrlThatServesTheUploadedImage() {
        byte[] imageBytes = Base64.getDecoder().decode(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII="
        );
        ByteArrayResource image = new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() {
                return "phone-photo.png";
            }
        };
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("file", image);

        ResponseEntity<ImageUploadController.ImageUploadResponse> uploadResponse = restTemplate.postForEntity(
                "/api/uploads",
                new HttpEntity<>(form, headers),
                ImageUploadController.ImageUploadResponse.class
        );

        assertEquals(HttpStatus.CREATED, uploadResponse.getStatusCode());
        String imageUrl = uploadResponse.getBody().imageUrl();
        assertTrue(imageUrl.matches("/uploads/[0-9a-f-]{36}\\.png"));
        ResponseEntity<byte[]> imageResponse = restTemplate.getForEntity(imageUrl, byte[].class);
        assertEquals(HttpStatus.OK, imageResponse.getStatusCode());
        assertArrayEquals(imageBytes, imageResponse.getBody());
    }
}
