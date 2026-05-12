package com.elevenof.backoffice.config;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.lambda.AWSLambda;
import com.amazonaws.services.lambda.AWSLambdaClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * AWS Lambda Configuration
 * Configures AWS Lambda client for background removal service
 */
@Configuration
public class AwsLambdaConfig {

    @Value("${aws.lambda.accessKey}")
    private String accessKey;

    @Value("${aws.lambda.secretKey}")
    private String secretKey;

    @Value("${aws.lambda.region}")
    private String region;

    @Bean
    public AWSLambda awsLambdaClient() {
        BasicAWSCredentials credentials = new BasicAWSCredentials(accessKey, secretKey);
        return AWSLambdaClientBuilder.standard()
            .withCredentials(new AWSStaticCredentialsProvider(credentials))
            .withRegion(region)
            .build();
    }
}
