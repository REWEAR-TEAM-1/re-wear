package com.rewear.listing;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

@Service
public class ListingService {
    private final ListingRepository repository;

    public ListingService(ListingRepository repository) {
        this.repository = repository;
    }

    public List<Listing> findListings(
            String query,
            ListingCategory category,
            ListingType type,
            BigDecimal maxPrice
    ) {
        String normalizedQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .filter(listing -> normalizedQuery.isEmpty()
                        || containsIgnoreCase(listing.getTitle(), normalizedQuery)
                        || containsIgnoreCase(listing.getDescription(), normalizedQuery)
                        || containsIgnoreCase(listing.getSellerName(), normalizedQuery)
                        || listing.getCategory().name().toLowerCase(Locale.ROOT).contains(normalizedQuery))
                .filter(listing -> category == null || listing.getCategory() == category)
                .filter(listing -> type == null || listing.getType() == type)
                .filter(listing -> maxPrice == null || listing.getPrice().compareTo(maxPrice) <= 0)
                .toList();
    }

    public Listing createListing(ListingRequest request, String sellerName) {
        Listing listing = new Listing(
                request.title().trim(),
                request.description().trim(),
                sellerName.trim(),
                request.category(),
                request.size().trim(),
                request.condition(),
                request.price(),
                request.type(),
                normalizeOptional(request.imageUrl()),
                request.location().trim()
        );
        return repository.save(listing);
    }

    private boolean containsIgnoreCase(String value, String query) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(query);
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
