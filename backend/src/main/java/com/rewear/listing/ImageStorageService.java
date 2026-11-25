package com.rewear.listing;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class ImageStorageService {
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    private final Path uploadDirectory;

    public ImageStorageService(@Value("${app.uploads.directory:uploads}") String uploadDirectory) {
        this.uploadDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDirectory);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not create image upload directory", exception);
        }
    }

    public String store(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose an image to upload.");
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Images must be 5 MB or smaller.");
        }

        try {
            byte[] content = file.getBytes();
            String extension = detectImageExtension(content);
            if (extension == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Upload a JPG, PNG, GIF, or WEBP image."
                );
            }

            String filename = UUID.randomUUID() + "." + extension;
            Files.write(uploadDirectory.resolve(filename), content);
            return "/uploads/" + filename;
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "The image could not be saved.", exception);
        }
    }

    public Path getUploadDirectory() {
        return uploadDirectory;
    }

    private String detectImageExtension(byte[] content) {
        if (startsWith(content, new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF})) {
            return "jpg";
        }
        if (startsWith(content, new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
        })) {
            return "png";
        }
        if (startsWith(content, "GIF87a".getBytes(StandardCharsets.US_ASCII))
                || startsWith(content, "GIF89a".getBytes(StandardCharsets.US_ASCII))) {
            return "gif";
        }
        if (content.length >= 12
                && startsWith(content, "RIFF".getBytes(StandardCharsets.US_ASCII))
                && startsWithAt(content, "WEBP".getBytes(StandardCharsets.US_ASCII), 8)) {
            return "webp";
        }
        return null;
    }

    private boolean startsWith(byte[] content, byte[] prefix) {
        return startsWithAt(content, prefix, 0);
    }

    private boolean startsWithAt(byte[] content, byte[] prefix, int offset) {
        if (content.length < offset + prefix.length) {
            return false;
        }
        for (int index = 0; index < prefix.length; index++) {
            if (content[offset + index] != prefix[index]) {
                return false;
            }
        }
        return true;
    }
}
