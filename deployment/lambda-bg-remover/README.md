# Avatar Background Removal - AWS Lambda Deployment Guide

## Overview

This Lambda function removes backgrounds from avatar images using the `rembg` library (U2-Net model). It's deployed as a Docker container to AWS Lambda.

## Architecture

```
Frontend → Backend API → AWS Lambda (rembg) → Return processed image → Upload to S3
```

## Prerequisites

Before deploying, ensure you have:

1. **AWS CLI** installed and configured
   ```bash
   aws --version
   # If not installed: https://aws.amazon.com/cli/
   ```

2. **Docker** installed and running
   ```bash
   docker --version
   # If not installed: https://www.docker.com/get-started
   ```

3. **AWS Account ID**
   ```bash
   aws sts get-caller-identity --query Account --output text
   ```

4. **IAM Role for Lambda** with these permissions:
   - `AWSLambdaBasicExecutionRole` (for CloudWatch Logs)
   - No S3 permissions needed (images passed via base64)

## Step 1: Create IAM Role for Lambda

```bash
# Create trust policy file
cat > lambda-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
  --role-name lambda-bg-remover-role \
  --assume-role-policy-document file://lambda-trust-policy.json

# Attach basic execution policy
aws iam attach-role-policy \
  --role-name lambda-bg-remover-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Get the role ARN (save this for later)
aws iam get-role --role-name lambda-bg-remover-role --query 'Role.Arn' --output text
```

## Step 2: Deploy Lambda Function

```bash
cd deployment/lambda-bg-remover

# Set your AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Run the deployment script
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. Create ECR repository (if not exists)
2. Build Docker image
3. Push to ECR
4. Create/update Lambda function

**Note:** When prompted, enter the IAM role ARN from Step 1.

## Step 3: Test Lambda Function

### Test with AWS CLI

Create a test image (base64-encoded):

```bash
# Convert test image to base64
base64 -i /path/to/test-avatar.jpg | tr -d '\n' > test-image-base64.txt

# Create test payload
cat > test-payload.json <<EOF
{
  "image": "$(cat test-image-base64.txt)"
}
EOF

# Invoke Lambda function
aws lambda invoke \
  --function-name bg-remover \
  --payload file://test-payload.json \
  --region ap-southeast-1 \
  response.json

# Check response
cat response.json | jq '.success'
# Should return: true
```

### Test via AWS Console

1. Go to AWS Lambda Console → Functions → `bg-remover`
2. Click "Test" tab
3. Create test event with JSON:
   ```json
   {
     "image": "BASE64_ENCODED_IMAGE_HERE"
   }
   ```
4. Click "Test" and check result

Expected response:
```json
{
  "statusCode": 200,
  "body": "{\"success\": true, \"image\": \"BASE64_ENCODED_RESULT\", \"error\": null}"
}
```

## Step 4: Update Backend Configuration

Add environment variables to your backend:

```bash
# For development (backoffice)
export LAMBDA_BG_REMOVER_FUNCTION=bg-remover

# For production
# Add to your deployment environment:
LAMBDA_BG_REMOVER_FUNCTION=bg-remover
```

## Step 5: Test End-to-End

1. **Start backend:**
   ```bash
   cd backoffice
   mvn clean package
   java -jar target/backoffice-0.0.1-SNAPSHOT.jar
   ```

2. **Start frontend:**
   ```bash
   cd frontend-app
   npm run dev
   ```

3. **Test upload:**
   - Open browser → Profile page
   - Click "Chỉnh sửa hồ sơ"
   - Select avatar image
   - **Check "Tự động xóa background"**
   - Click "Lưu thay đổi"
   - Avatar should be uploaded with background removed

## Monitoring & Logs

### CloudWatch Logs

View Lambda execution logs:

```bash
aws logs tail /aws/lambda/bg-remover --follow --region ap-southeast-1
```

### Lambda Metrics

Check metrics in AWS Console:
- Invocations
- Duration (should be 5-10s)
- Errors
- Throttles

## Cost Estimate

Based on 1000 avatar uploads/month:

- **Lambda compute:** ~$0.10/month
- **ECR storage:** ~$0.20/month
- **CloudWatch Logs:** ~$0.01/month

**Total:** ~$0.30-0.50/month

Compare to Remove.bg: $9/month → **95% savings!**

## Troubleshooting

### Error: "Task timed out after 30 seconds"

Increase Lambda timeout:

```bash
aws lambda update-function-configuration \
  --function-name bg-remover \
  --timeout 60 \
  --region ap-southeast-1
```

### Error: "Memory limit exceeded"

Increase Lambda memory:

```bash
aws lambda update-function-configuration \
  --function-name bg-remover \
  --memory-size 2048 \
  --region ap-southeast-1
```

### Cold Start Issues

First invocation may take 5-10s to download the U2-Net model. Subsequent invocations will be faster (~2-3s).

To reduce cold starts:
- Use Lambda Provisioned Concurrency (costs extra)
- Or accept the occasional cold start

### Backend Errors

Check backend logs for errors:

```bash
# If background removal fails, it should gracefully fallback to original image
grep "Background removal failed" backoffice.log
```

## Updating Lambda Function

When you update the Lambda code:

```bash
cd deployment/lambda-bg-remover

# Rebuild and redeploy
./deploy.sh
```

The script will automatically update the existing function.

## Cleanup

To remove all resources:

```bash
# Delete Lambda function
aws lambda delete-function --function-name bg-remover --region ap-southeast-1

# Delete ECR repository
aws ecr delete-repository --repository-name 11of-bg-remover --force --region ap-southeast-1

# Delete IAM role
aws iam detach-role-policy \
  --role-name lambda-bg-remover-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam delete-role --role-name lambda-bg-remover-role
```

## Support

For issues or questions:
- Check CloudWatch Logs first
- Verify IAM permissions
- Test Lambda function directly before testing end-to-end
- Check backend logs for graceful fallback behavior
