package com.rewear.config;

import com.rewear.listing.Listing;
import com.rewear.listing.ListingCategory;
import com.rewear.listing.ListingCondition;
import com.rewear.listing.ListingRepository;
import com.rewear.listing.ListingType;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

@Configuration
public class DemoDataInitializer {
    @Bean
    ApplicationRunner seedDemoListings(ListingRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                repository.saveAll(List.of(
                        new Listing(
                                "The everyday linen shirt",
                                "Easy, breathable linen with plenty of life left. A relaxed fit for all seasons.",
                                "Mina's closet",
                                ListingCategory.TOPS,
                                "M",
                                ListingCondition.LIKE_NEW,
                                new BigDecimal("24000.00"),
                                ListingType.SALE,
                                "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=900&q=85",
                                "Seoul"
                        ),
                        new Listing(
                                "Reworked denim jacket",
                                "A pre-loved denim jacket refreshed with hand-stitched details by a local maker.",
                                "Studio Again",
                                ListingCategory.OUTERWEAR,
                                "L",
                                ListingCondition.GOOD,
                                new BigDecimal("58000.00"),
                                ListingType.SALE,
                                "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=900&q=85",
                                "Seoul"
                        ),
                        new Listing(
                                "Make it yours: denim redesign",
                                "Turn your old jeans into a one-of-a-kind tote or patchwork skirt. Bring your own denim.",
                                "Threadkind Studio",
                                ListingCategory.BOTTOMS,
                                "Custom",
                                ListingCondition.REWORKABLE,
                                new BigDecimal("35000.00"),
                                ListingType.REDESIGN,
                                "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=85",
                                "Seoul"
                        ),
                        new Listing(
                                "Soft knit, second season",
                                "A cozy knit in a muted green, ready for another winter. No visible wear.",
                                "Jae",
                                ListingCategory.TOPS,
                                "S",
                                ListingCondition.GOOD,
                                new BigDecimal("29000.00"),
                                ListingType.SALE,
                                "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=85",
                                "Incheon"
                        ),
                        new Listing(
                                "A new shape for your old coat",
                                "Designer service: adjust the silhouette, replace buttons, or add a new lining to a coat you already own.",
                                "Soo Reworks",
                                ListingCategory.OUTERWEAR,
                                "Custom",
                                ListingCondition.REWORKABLE,
                                new BigDecimal("42000.00"),
                                ListingType.REDESIGN,
                                "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=900&q=85",
                                "Seoul"
                        ),
                        new Listing(
                                "Weekend cotton dress",
                                "A gently loved cotton dress in a warm neutral. Washed and ready to wear.",
                                "Hana",
                                ListingCategory.DRESSES,
                                "M",
                                ListingCondition.LIKE_NEW,
                                new BigDecimal("31000.00"),
                                ListingType.SALE,
                                "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85",
                                "Busan"
                        )
                ));
            }
        };
    }
}
