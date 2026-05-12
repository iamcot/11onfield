package com.elevenof.backoffice.service;

import com.amazonaws.services.lambda.AWSLambda;
import com.amazonaws.services.lambda.model.InvokeRequest;
import com.amazonaws.services.lambda.model.InvokeResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Background Removal Service
 * Integrates with AWS Lambda function to remove image backgrounds
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BackgroundRemovalService {

    private final AWSLambda lambdaClient;
    private final ObjectMapper objectMapper;

    @Value("${aws.lambda.bgRemoverFunctionName}")
    private String functionName;

    /**
     * Remove background from image
     *
     * @param imageBytes Original image bytes
     * @return Processed image bytes with background removed (PNG format)
     * @throws Exception if processing fails
     */
    public byte[] removeBackground(byte[] imageBytes) throws Exception {
        log.info("Starting background removal, image size: {} bytes", imageBytes.length);

        try {
            // Encode image to Base64
            String imageBase64 = Base64.getEncoder().encodeToString(imageBytes);

            // Prepare Lambda request payload
            String payload = String.format("{\"image\":\"%s\"}", imageBase64);

            // Invoke Lambda function
            InvokeRequest invokeRequest = new InvokeRequest()
                .withFunctionName(functionName)
                .withPayload(ByteBuffer.wrap(payload.getBytes(StandardCharsets.UTF_8)));

            log.info("Invoking Lambda function: {}", functionName);
            InvokeResult invokeResult = lambdaClient.invoke(invokeRequest);

            // Check for Lambda execution errors
            if (invokeResult.getFunctionError() != null) {
                String errorMessage = new String(invokeResult.getPayload().array(), StandardCharsets.UTF_8);
                log.error("Lambda function error: {}", errorMessage);
                throw new RuntimeException("Lambda function error: " + errorMessage);
            }

            // Parse response
            String responseJson = new String(invokeResult.getPayload().array(), StandardCharsets.UTF_8);
            JsonNode responseNode = objectMapper.readTree(responseJson);

            // Extract body (Lambda returns statusCode + body)
            JsonNode bodyNode = responseNode.has("body")
                ? objectMapper.readTree(responseNode.get("body").asText())
                : responseNode;

            // Check success
            boolean success = bodyNode.has("success") && bodyNode.get("success").asBoolean();
            if (!success) {
                String error = bodyNode.has("error") ? bodyNode.get("error").asText() : "Unknown error";
                log.error("Background removal failed: {}", error);
                throw new RuntimeException("Background removal failed: " + error);
            }

            // Decode result
            String resultBase64 = bodyNode.get("image").asText();
            byte[] resultBytes = Base64.getDecoder().decode(resultBase64);

            log.info("Background removal successful, output size: {} bytes", resultBytes.length);
            return resultBytes;

        } catch (Exception e) {
            log.error("Error removing background", e);
            throw e;
        }
    }

    /**
     * Remove background with graceful fallback
     * If removal fails, returns original image
     *
     * @param imageBytes Original image bytes
     * @return Processed image bytes or original if processing fails
     */
    public byte[] removeBackgroundWithFallback(byte[] imageBytes) {
        try {
            return removeBackground(imageBytes);
        } catch (Exception e) {
            log.warn("Background removal failed, using original image: {}", e.getMessage());
            return imageBytes;
        }
    }
}
