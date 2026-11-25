package com.rewear.listing;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ListingServiceTest {
    @Mock
    private ListingRepository repository;

    private ListingService service;

    @BeforeEach
    void setUp() {
        service = new ListingService(repository);
    }

    @Test
    void filtersBySearchCategoryTypeAndMaximumPrice() {
        Listing affordableTop = listing(
                "Linen shirt",                 ListingCategory.TOPS, ListingType.SALE, "19000.00", "Mina"
        );
        Listing redesignCoat = listing(
                "Coat refresh",                 ListingCategory.OUTERWEAR, ListingType.REDESIGN, "45000.00", "Mina"
        );
        when(repository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(affordableTop, redesignCoat));

        List<Listing> result = service.findListings("linen", ListingCategory.TOPS, ListingType.SALE, new BigDecimal("20000.00"));

        assertEquals(List.of(affordableTop), result);
    }

    @Test
    void trimsInputAndPersistsOptionalImageAsNull() {
        ListingRequest request = new ListingRequest(
                "  Linen shirt ",
                "  Light and breathable ",
                "  Mina ",
                ListingCategory.TOPS,
                " M ",
                ListingCondition.GOOD,
                new BigDecimal("19000.00"),
                ListingType.SALE,
                " ",
                " Seoul "
        );
        when(repository.save(any(Listing.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Listing saved = service.createListing(request, "Signed-in seller");

        assertEquals("Linen shirt", saved.getTitle());
        assertEquals("Light and breathable", saved.getDescription());
        assertEquals("Signed-in seller", saved.getSellerName());
        assertEquals("M", saved.getSize());
        assertEquals("Seoul", saved.getLocation());
        assertNull(saved.getImageUrl());
        verify(repository).save(any(Listing.class));
    }

    private Listing listing(String title, ListingCategory category, ListingType type, String price, String seller) {
        return new Listing(
                title,
                "A second-life piece",
                seller,
                category,
                "M",
                ListingCondition.GOOD,
                new BigDecimal(price),
                type,
                null,
                "Seoul"
        );
    }
}
