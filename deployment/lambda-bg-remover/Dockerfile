# Use AWS Lambda Python 3.11 base image
FROM public.ecr.aws/lambda/python:3.11

# Install system dependencies for image processing
RUN yum install -y gcc gcc-c++ make

# Upgrade pip to latest version
RUN pip install --upgrade pip

# Copy requirements file
COPY requirements.txt ${LAMBDA_TASK_ROOT}/

# Install Python dependencies (use pre-built wheels when available)
RUN pip install --no-cache-dir --prefer-binary -r requirements.txt

# Copy function code
COPY lambda_function.py ${LAMBDA_TASK_ROOT}/

# Set the CMD to your handler
CMD [ "lambda_function.handler" ]
