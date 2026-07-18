package com.capstone.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;

@Service
public class DocumentSanitizerService {

    // Defaults to local Python service port, overridden by environment variables in production
    @Value("${matching.service.url:http://localhost:8000}")
    private String pythonServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public String callPythonSanitizer(MultipartFile file) throws IOException {
        String targetUrl = pythonServiceUrl + "/api/v1/sanitizer/process-pdf";

        // 1. Set up the Multipart headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        // 2. Convert MultipartFile to a Resource Spring's RestTemplate can serialize
        ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        };

        // 3. Populate the form payload matching the Python "file" parameter name
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        // 4. Fire the POST request to the FastAPI application
        ResponseEntity<Map> response = restTemplate.postForEntity(targetUrl, requestEntity, Map.class);

        if (response.getBody() != null && response.getBody().containsKey("cleaned_document")) {
            return (String) response.getBody().get("cleaned_document");
        }

        throw new RuntimeException("Failed to parse document via AI microservice");
    }
}
