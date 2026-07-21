package com.capstone.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class DocumentSanitizerService {

    // Defaults to Vercel-deployed Python service; override via MATCHING_SERVICE_URL env var
    @Value("${matching.service.url:https://capstone-matching.vercel.app}")
    private String pythonServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public String callPythonSanitizer(MultipartFile file) throws IOException {
        // ── Step 1: Extract raw text from the PDF locally (Apache PDFBox) ─────────
        // This converts a 15 MB binary into a few KB of plain text — never sending
        // the huge file over the network to Vercel's serverless function.
        String rawText;
        try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            rawText = stripper.getText(doc);
        }

        if (rawText == null || rawText.isBlank()) {
            throw new IllegalArgumentException(
                "The PDF appears to be empty or contains only scanned images (no selectable text).");
        }

        // ── Step 2: POST only the tiny text payload to Vercel ─────────────────────
        String targetUrl = pythonServiceUrl + "/api/v1/sanitizer/process-text";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = new HashMap<>();
        body.put("raw_text", rawText);

        HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(body, headers);

        // ── Step 3: Receive the cleaned Markdown from the AI microservice ─────────
        ResponseEntity<Map> response = restTemplate.postForEntity(targetUrl, requestEntity, Map.class);

        if (response.getBody() != null && response.getBody().containsKey("cleaned_document")) {
            return (String) response.getBody().get("cleaned_document");
        }

        throw new RuntimeException("Failed to parse document via AI microservice");
    }
}
