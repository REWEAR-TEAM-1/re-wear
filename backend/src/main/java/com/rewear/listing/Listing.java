package com.rewear.listing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "listings")
public class Listing {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(nullable = false, length = 80)
    private String sellerName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ListingCategory category;

    @Column(nullable = false, length = 16)
    private String size;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ListingCondition condition;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ListingType type;

    @Column(length = 2048)
    private String imageUrl;

    @Column(nullable = false, length = 100)
    private String location;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected Listing() {
    }

    public Listing(
            String title,
            String description,
            String sellerName,
            ListingCategory category,
            String size,
            ListingCondition condition,
            BigDecimal price,
            ListingType type,
            String imageUrl,
            String location
    ) {
        this.title = title;
        this.description = description;
        this.sellerName = sellerName;
        this.category = category;
        this.size = size;
        this.condition = condition;
        this.price = price;
        this.type = type;
        this.imageUrl = imageUrl;
        this.location = location;
    }

    @PrePersist
    void setCreatedAt() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getSellerName() {
        return sellerName;
    }

    public ListingCategory getCategory() {
        return category;
    }

    public String getSize() {
        return size;
    }

    public ListingCondition getCondition() {
        return condition;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public ListingType getType() {
        return type;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getLocation() {
        return location;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
