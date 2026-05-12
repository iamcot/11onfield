#!/bin/bash

# Reset Admin Password Script
# Usage: ./reset-password.sh <phone> <new_password>

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if arguments are provided
if [ $# -ne 2 ]; then
    echo -e "${RED}❌ Error: Missing required arguments${NC}"
    echo ""
    echo "Usage: ./reset-password.sh <phone> <new_password>"
    echo ""
    echo "Examples:"
    echo "  ./reset-password.sh admin newpassword123"
    echo "  ./reset-password.sh 0123456789 mySecurePass456"
    echo ""
    exit 1
fi

PHONE=$1
PASSWORD=$2

# Validate password length
if [ ${#PASSWORD} -lt 6 ]; then
    echo -e "${RED}❌ Error: Password must be at least 6 characters long${NC}"
    exit 1
fi

echo -e "${YELLOW}🔄 Resetting password for user: ${PHONE}${NC}"
echo ""

# Check if we're in the backoffice directory
if [ ! -f "pom.xml" ]; then
    echo -e "${RED}❌ Error: This script must be run from the backoffice directory${NC}"
    echo "Current directory: $(pwd)"
    echo "Please cd to: /path/to/11of/backoffice"
    exit 1
fi

# Compile the utility first if needed
if [ ! -f "target/classes/com/elevenof/backoffice/util/SimplePasswordReset.class" ]; then
    echo -e "${YELLOW}Compiling utility...${NC}"
    mvn compile -DskipTests -q
fi

# Run using Maven exec:java (handles classpath automatically)
echo -e "${YELLOW}Resetting password...${NC}"
echo ""

mvn exec:java \
    -Dexec.mainClass="com.elevenof.backoffice.util.SimplePasswordReset" \
    -Dexec.args="${PHONE} ${PASSWORD}" \
    -Dexec.cleanupDaemonThreads=false \
    -q

EXIT_CODE=$?

# Check exit code
if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Password has been reset successfully!${NC}"
    echo -e "${GREEN}You can now login with the new password.${NC}"
else
    echo ""
    echo -e "${RED}❌ Failed to reset password. Please check the error messages above.${NC}"
    exit 1
fi
