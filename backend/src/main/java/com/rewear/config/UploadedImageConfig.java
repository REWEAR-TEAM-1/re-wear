package com.rewear.config;

import com.rewear.listing.ImageStorageService;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class UploadedImageConfig implements WebMvcConfigurer {
    private final Path uploadDirectory;

    public UploadedImageConfig(ImageStorageService imageStorageService) {
        this.uploadDirectory = imageStorageService.getUploadDirectory();
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadDirectory.toUri().toString());
    }
}
