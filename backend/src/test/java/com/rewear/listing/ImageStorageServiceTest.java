package com.rewear.listing;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ImageStorageServiceTest {
    @TempDir
    Path temporaryDirectory;

    private ImageStorageService service;

    @BeforeEach
    void setUp() {
        service = new ImageStorageService(temporaryDirectory.toString());
    }

    @Test
    void storesImagesWithGeneratedNamesAndKeepsTheImageBytes() throws IOException {
        byte[] image = new byte[]{
                (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x01, 0x02
        };
        MockMultipartFile upload = new MockMultipartFile(
                "file",
                "../../not-the-saved-name.jpg",
                "image/jpeg",
                image
        );

        String imageUrl = service.store(upload);

        assertTrue(imageUrl.matches("/uploads/[0-9a-f-]{36}\\.jpg"));
        assertArrayEquals(image, Files.readAllBytes(temporaryDirectory.resolve(Path.of(imageUrl).getFileName())));
    }

    @Test
    void rejectsUnsupportedFilesEvenWhenTheyClaimToBeImages() {
        MockMultipartFile upload = new MockMultipartFile(
                "file", "picture.svg", "image/svg+xml", "<svg/>".getBytes()
        );

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.store(upload));

        assertEquals(400, error.getStatusCode().value());
    }

    @Test
    void rejectsFilesLargerThanFiveMegabytes() {
        MockMultipartFile upload = new MockMultipartFile(
                "file",
                "large.jpg",
                "image/jpeg",
                new byte[5 * 1024 * 1024 + 1]
        );

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.store(upload));

        assertEquals(413, error.getStatusCode().value());
    }
}
