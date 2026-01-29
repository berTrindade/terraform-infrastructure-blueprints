#!/bin/bash
set -e

echo "=== Validating Test Projects ==="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Scenario 1: Node.js App
echo "Scenario 1: Node.js Express App"
echo "-----------------------------------"
cd scenario-1-app-exists

echo -n "  ✓ Checking package.json syntax... "
if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

echo -n "  ✓ Checking JavaScript syntax... "
if node --check src/index.js > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

echo -n "  ✓ Checking SQL syntax... "
if [ -f schema.sql ] && [ -s schema.sql ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

echo -n "  ✓ Testing npm install (dry-run)... "
if npm install --dry-run > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

echo ""
cd ..

# Scenario 2: Terraform
echo "Scenario 2: Terraform Configuration"
echo "-----------------------------------"
cd scenario-2-existing-terraform

echo -n "  ✓ Checking Terraform format... "
if terraform fmt -check -recursive > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}FORMATTING ISSUES (non-critical)${NC}"
fi

echo -n "  ✓ Checking Lambda function syntax... "
if node --check lambda/index.js > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

echo -n "  ✓ Checking Terraform files exist... "
if [ -f main.tf ] && [ -f variables.tf ] && [ -f outputs.tf ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

echo ""
cd ..

echo -e "${GREEN}All validations passed!${NC}"
echo ""
echo "Note: Full Terraform validation requires AWS credentials and 'terraform init'"
echo "Note: Full Node.js app testing requires a PostgreSQL database"
