package com.elevenof.backoffice.service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.DeleteObjectRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URL;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {

    private final AmazonS3 amazonS3;

    @Value("${aws.s3.bucketName}")
    private String bucketName;

    @Value("${aws.s3.avatarFolder}")
    private String avatarFolder;

    @Value("${aws.s3.eventImageFolder}")
    private String eventImageFolder;

    /**
     * Upload avatar to S3 and return public URL
     *
     * @param file The multipart file to upload
     * @param userId User ID for generating unique filename
     * @return Public URL of the uploaded file
     * @throws IOException If upload fails
     */
    public String uploadAvatar(MultipartFile file, Long userId) throws IOException {
        // Generate unique filename: userId_timestamp_uuid.extension
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String fileName = String.format("%s_%d_%s.%s",
                userId,
                System.currentTimeMillis(),
                UUID.randomUUID().toString().substring(0, 8),
                extension);

        String key = avatarFolder + fileName;

        // Set metadata
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(file.getSize());
        metadata.setContentType(file.getContentType());

        try {
            // Upload to S3
            PutObjectRequest putObjectRequest = new PutObjectRequest(
                    bucketName,
                    key,
                    file.getInputStream(),
                    metadata
            );

            amazonS3.putObject(putObjectRequest);

            // Get public URL
            URL url = amazonS3.getUrl(bucketName, key);
            log.info("Successfully uploaded avatar for user {} to S3: {}", userId, url.toString());

            return url.toString();
        } catch (Exception e) {
            log.error("Failed to upload avatar for user {} to S3", userId, e);
            throw new IOException("Failed to upload file to S3: " + e.getMessage(), e);
        }
    }

    /**
     * Delete avatar from S3 using the full URL
     *
     * @param avatarUrl Full S3 URL of the avatar
     */
    public void deleteAvatar(String avatarUrl) {
        if (avatarUrl == null || avatarUrl.isEmpty()) {
            return;
        }

        try {
            // Extract key from URL
            // URL format: https://bucket-name.s3.region.amazonaws.com/avatars/filename.jpg
            String key = extractKeyFromUrl(avatarUrl);

            if (key != null && !key.isEmpty()) {
                DeleteObjectRequest deleteObjectRequest = new DeleteObjectRequest(bucketName, key);
                amazonS3.deleteObject(deleteObjectRequest);
                log.info("Successfully deleted avatar from S3: {}", key);
            }
        } catch (Exception e) {
            log.error("Failed to delete avatar from S3: {}", avatarUrl, e);
            // Don't throw exception - deletion failure shouldn't block upload
        }
    }

    /**
     * Extract S3 key from full URL
     */
    private String extractKeyFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return null;
        }

        try {
            // Remove the bucket URL prefix
            String bucketUrl = String.format("https://%s.s3", bucketName);
            if (url.contains(bucketUrl)) {
                // Find the key after the bucket domain
                int keyStartIndex = url.indexOf(avatarFolder);
                if (keyStartIndex != -1) {
                    return url.substring(keyStartIndex);
                }
            }
        } catch (Exception e) {
            log.error("Failed to extract key from URL: {}", url, e);
        }

        return null;
    }

    /**
     * Get file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "jpg"; // default
        }

        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < filename.length() - 1) {
            return filename.substring(lastDotIndex + 1).toLowerCase();
        }

        return "jpg"; // default
    }

    /**
     * Validate file type for avatar uploads
     *
     * @param file The file to validate
     * @return true if valid, false otherwise
     */
    public boolean isValidAvatarFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();

        // Check content type
        if (contentType == null || !isValidImageType(contentType)) {
            return false;
        }

        // Check file extension
        String extension = getFileExtension(filename);
        return isValidImageExtension(extension);
    }

    private boolean isValidImageType(String contentType) {
        return contentType.equals("image/jpeg") ||
               contentType.equals("image/png") ||
               contentType.equals("image/gif") ||
               contentType.equals("image/webp");
    }

    private boolean isValidImageExtension(String extension) {
        return extension.equals("jpg") ||
               extension.equals("jpeg") ||
               extension.equals("png") ||
               extension.equals("gif") ||
               extension.equals("webp");
    }

    /**
     * Upload event image to S3 with compression and return public URL
     *
     * @param file The multipart file to upload
     * @param eventId Event ID for generating unique filename
     * @return Public URL of the uploaded file
     * @throws IOException If upload fails
     */
    public String uploadEventImage(MultipartFile file, Long eventId) throws IOException {
        if (!isValidImageFile(file)) {
            throw new IllegalArgumentException("Invalid image file");
        }

        // Generate unique filename
        String extension = getFileExtension(file.getOriginalFilename());
        String fileName = String.format("event_%s_%d_%s.%s",
                eventId,
                System.currentTimeMillis(),
                UUID.randomUUID().toString().substring(0, 8),
                extension);

        String key = eventImageFolder + fileName;

        try {
            // Compress image before upload
            byte[] compressedImage = compressImage(file, 1920, 1080, 0.85f); // Max 1920x1080, 85% quality

            // Set metadata
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(compressedImage.length);
            metadata.setContentType("image/jpeg"); // Always save as JPEG after compression

            // Upload to S3
            PutObjectRequest putObjectRequest = new PutObjectRequest(
                    bucketName,
                    key,
                    new ByteArrayInputStream(compressedImage),
                    metadata
            );

            amazonS3.putObject(putObjectRequest);

            // Get public URL
            URL url = amazonS3.getUrl(bucketName, key);
            log.info("Successfully uploaded event image for event {} to S3: {}", eventId, url.toString());

            return url.toString();
        } catch (Exception e) {
            log.error("Failed to upload event image for event {} to S3", eventId, e);
            throw new IOException("Failed to upload event image to S3: " + e.getMessage(), e);
        }
    }

    /**
     * Delete event image from S3 using the full URL
     *
     * @param imageUrl Full S3 URL of the event image
     */
    public void deleteEventImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            return;
        }

        try {
            String key = extractKeyFromUrl(imageUrl, eventImageFolder);

            if (key != null && !key.isEmpty()) {
                DeleteObjectRequest deleteObjectRequest = new DeleteObjectRequest(bucketName, key);
                amazonS3.deleteObject(deleteObjectRequest);
                log.info("Successfully deleted event image from S3: {}", key);
            }
        } catch (Exception e) {
            log.error("Failed to delete event image from S3: {}", imageUrl, e);
        }
    }

    /**
     * Compress image to reduce file size while maintaining quality
     *
     * @param file Original image file
     * @param maxWidth Maximum width
     * @param maxHeight Maximum height
     * @param quality JPEG quality (0.0 to 1.0)
     * @return Compressed image as byte array
     * @throws IOException If compression fails
     */
    private byte[] compressImage(MultipartFile file, int maxWidth, int maxHeight, float quality) throws IOException {
        // Read original image
        BufferedImage originalImage = ImageIO.read(file.getInputStream());
        if (originalImage == null) {
            throw new IOException("Failed to read image file");
        }

        // Calculate new dimensions while maintaining aspect ratio
        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();
        int newWidth = originalWidth;
        int newHeight = originalHeight;

        if (originalWidth > maxWidth || originalHeight > maxHeight) {
            float widthRatio = (float) maxWidth / originalWidth;
            float heightRatio = (float) maxHeight / originalHeight;
            float ratio = Math.min(widthRatio, heightRatio);

            newWidth = Math.round(originalWidth * ratio);
            newHeight = Math.round(originalHeight * ratio);
        }

        // Resize image
        BufferedImage resizedImage = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = resizedImage.createGraphics();
        graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        graphics.drawImage(originalImage, 0, 0, newWidth, newHeight, null);
        graphics.dispose();

        // Compress to JPEG
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        javax.imageio.ImageWriter writer = ImageIO.getImageWritersByFormatName("jpg").next();
        javax.imageio.stream.ImageOutputStream ios = ImageIO.createImageOutputStream(outputStream);
        writer.setOutput(ios);

        javax.imageio.ImageWriteParam param = writer.getDefaultWriteParam();
        if (param.canWriteCompressed()) {
            param.setCompressionMode(javax.imageio.ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(quality);
        }

        writer.write(null, new javax.imageio.IIOImage(resizedImage, null, null), param);
        writer.dispose();
        ios.close();

        byte[] result = outputStream.toByteArray();
        log.info("Compressed image from {}KB to {}KB ({}x{} -> {}x{})",
                file.getSize() / 1024,
                result.length / 1024,
                originalWidth, originalHeight,
                newWidth, newHeight);

        return result;
    }

    /**
     * Extract S3 key from full URL with specific folder
     */
    private String extractKeyFromUrl(String url, String folder) {
        if (url == null || url.isEmpty()) {
            return null;
        }

        try {
            String bucketUrl = String.format("https://%s.s3", bucketName);
            if (url.contains(bucketUrl)) {
                int keyStartIndex = url.indexOf(folder);
                if (keyStartIndex != -1) {
                    return url.substring(keyStartIndex);
                }
            }
        } catch (Exception e) {
            log.error("Failed to extract key from URL: {}", url, e);
        }

        return null;
    }

    /**
     * Validate file for image uploads (events, avatars, etc.)
     */
    public boolean isValidImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();

        if (contentType == null || !isValidImageType(contentType)) {
            return false;
        }

        String extension = getFileExtension(filename);
        return isValidImageExtension(extension);
    }
}
