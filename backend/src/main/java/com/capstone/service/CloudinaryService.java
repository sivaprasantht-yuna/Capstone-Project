package com.capstone.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Uploads any file (image, PDF, doc) to Cloudinary.
     * @return publicly accessible URL
     */
    public String uploadFile(MultipartFile file, String folder) throws IOException {
        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "capstone/" + folder,
                        "resource_type", "auto",
                        "use_filename", true,
                        "unique_filename", true
                )
        );
        return (String) result.get("secure_url");
    }

    /**
     * Uploads a raw byte array as a PDF (used for certificate generation).
     */
    public String uploadPdf(byte[] bytes, String publicId) throws IOException {
        Map<?, ?> result = cloudinary.uploader().upload(
                bytes,
                ObjectUtils.asMap(
                        "folder", "capstone/certificates",
                        "public_id", publicId,
                        "resource_type", "raw",
                        "format", "pdf"
                )
        );
        return (String) result.get("secure_url");
    }

    public void deleteFile(String publicId) throws IOException {
        cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }
}
