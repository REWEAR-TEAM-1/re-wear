package com.rewear.listing;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
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
}
