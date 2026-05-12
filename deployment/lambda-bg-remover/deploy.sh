#!/bin/bash

# AWS Lambda Background Remover Deploy Script
# Prerequisites:
# - AWS CLI configured
# - Docker installed
# - ECR repository created

set -e

# Configuration
AWS_REGION="${AWS_REGION:-ap-southeast-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}"
ECR_REPO_NAME="11of-bg-remover"
LAMBDA_FUNCTION_NAME="bg-remover"
IMAGE_TAG="latest"

# Check if AWS_ACCOUNT_ID is set
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo "Error: AWS_ACCOUNT_ID environment variable is not set"
    echo "Usage: export AWS_ACCOUNT_ID=your-account-id && ./deploy.sh"
    exit 1
fi

ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"

echo "=========================================="
echo "AWS Lambda Background Remover Deployment"
echo "=========================================="
echo "Region: $AWS_REGION"
echo "Account ID: $AWS_ACCOUNT_ID"
echo "ECR Repo: $ECR_REPO_NAME"
echo "Lambda Function: $LAMBDA_FUNCTION_NAME"
echo ""

# Step 1: Create ECR repository if it doesn't exist
echo "[1/6] Checking ECR repository..."
aws ecr describe-repositories --repository-names $ECR_REPO_NAME --region $AWS_REGION 2>/dev/null || \
    aws ecr create-repository --repository-name $ECR_REPO_NAME --region $AWS_REGION

# Step 2: Login to ECR
echo "[2/6] Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI

# Step 3: Build Docker image
echo "[3/6] Building Docker image..."
docker build -t $ECR_REPO_NAME:$IMAGE_TAG .

# Step 4: Tag image for ECR
echo "[4/6] Tagging image..."
docker tag $ECR_REPO_NAME:$IMAGE_TAG $ECR_URI:$IMAGE_TAG

# Step 5: Push to ECR
echo "[5/6] Pushing image to ECR..."
docker push $ECR_URI:$IMAGE_TAG

# Step 6: Create or update Lambda function
echo "[6/6] Creating/updating Lambda function..."

# Check if function exists
if aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --region $AWS_REGION 2>/dev/null; then
    echo "Function exists, updating..."
    aws lambda update-function-code \
        --function-name $LAMBDA_FUNCTION_NAME \
        --image-uri $ECR_URI:$IMAGE_TAG \
        --region $AWS_REGION
else
    echo "Function doesn't exist, creating..."
    echo ""
    echo "Note: You need to create an IAM role first with Lambda execution permissions."
    echo "Role ARN format: arn:aws:iam::${AWS_ACCOUNT_ID}:role/lambda-execution-role"
    echo ""
    read -p "Enter Lambda execution role ARN: " ROLE_ARN

    aws lambda create-function \
        --function-name $LAMBDA_FUNCTION_NAME \
        --package-type Image \
        --code ImageUri=$ECR_URI:$IMAGE_TAG \
        --role $ROLE_ARN \
        --memory-size 1024 \
        --timeout 30 \
        --region $AWS_REGION
fi

echo ""
echo "=========================================="
echo "Deployment completed successfully!"
echo "=========================================="
echo "Function Name: $LAMBDA_FUNCTION_NAME"
echo "Image URI: $ECR_URI:$IMAGE_TAG"
echo ""
echo "Test the function:"
echo "aws lambda invoke --function-name $LAMBDA_FUNCTION_NAME --payload '{\"image\":\"...\"}' response.json"
