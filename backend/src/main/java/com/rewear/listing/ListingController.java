package com.rewear.listing;

import com.rewear.auth.RewearUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ListingController {
    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse("ok", "RE:WEAR API is running");
    }

    @GetMapping("/listings")
    public List<Listing> getListings(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) ListingCategory category,
            @RequestParam(required = false) ListingType type,
            @RequestParam(required = false) BigDecimal maxPrice
    ) {
        return listingService.findListings(q, category, type, maxPrice);
    }

    @PostMapping("/listings")
    @ResponseStatus(HttpStatus.CREATED)
    public Listing createListing(
            @Valid @RequestBody ListingRequest request,
            @AuthenticationPrincipal RewearUserDetails userDetails
    ) {
        return listingService.createListing(request, userDetails.getAccount().getName());
    }

    public record HealthResponse(String status, String message) {
    }
}
