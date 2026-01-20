#!/bin/bash
# create-environment.sh
# Creates a new environment (staging/prod) from an existing dev environment
#
# Usage:
#   ./scripts/create-environment.sh <blueprint-path> <environment>
#
# Examples:
#   ./scripts/create-environment.sh aws/example-sqs-worker-api staging
#   ./scripts/create-environment.sh aws/example-ecs-fargate-api prod

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validate arguments
if [ $# -ne 2 ]; then
    echo -e "${RED}Usage: $0 <blueprint-path> <environment>${NC}"
    echo ""
    echo "Examples:"
    echo "  $0 aws/example-sqs-worker-api staging"
    echo "  $0 aws/example-ecs-fargate-api prod"
    exit 1
fi

BLUEPRINT_PATH="$1"
ENVIRONMENT="$2"

# Validate environment name
if [[ ! "$ENVIRONMENT" =~ ^(staging|prod|production|uat|qa)$ ]]; then
    echo -e "${YELLOW}Warning: '$ENVIRONMENT' is not a standard environment name.${NC}"
    echo "Standard names: staging, prod, production, uat, qa"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Normalize 'production' to 'prod'
if [ "$ENVIRONMENT" = "production" ]; then
    ENVIRONMENT="prod"
fi

# Find the repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Validate blueprint exists
DEV_PATH="$REPO_ROOT/$BLUEPRINT_PATH/environments/dev"
if [ ! -d "$DEV_PATH" ]; then
    echo -e "${RED}Error: Dev environment not found at $DEV_PATH${NC}"
    exit 1
fi

# Check if target environment already exists
TARGET_PATH="$REPO_ROOT/$BLUEPRINT_PATH/environments/$ENVIRONMENT"
if [ -d "$TARGET_PATH" ]; then
    echo -e "${RED}Error: Environment '$ENVIRONMENT' already exists at $TARGET_PATH${NC}"
    exit 1
fi

echo -e "${GREEN}Creating $ENVIRONMENT environment for $BLUEPRINT_PATH${NC}"
echo ""

# Copy dev environment to new environment
echo "Copying dev environment..."
cp -r "$DEV_PATH" "$TARGET_PATH"

# Extract project name from terraform.tfvars
PROJECT_NAME=$(grep 'project' "$TARGET_PATH/terraform.tfvars" | sed 's/.*=.*"\(.*\)".*/\1/' | tr -d ' ')

# Update terraform.tfvars with environment-specific values
echo "Updating terraform.tfvars..."

# Update environment name
sed -i '' "s/environment.*=.*\"dev\"/environment = \"$ENVIRONMENT\"/" "$TARGET_PATH/terraform.tfvars"

# Apply environment-specific scaling
case "$ENVIRONMENT" in
    staging)
        # Staging: medium resources
        sed -i '' 's/worker_memory_size.*=.*[0-9]*/worker_memory_size = 512/' "$TARGET_PATH/terraform.tfvars" 2>/dev/null || true
        sed -i '' 's/memory.*=.*[0-9]*/memory = 512/' "$TARGET_PATH/terraform.tfvars" 2>/dev/null || true
        sed -i '' 's/log_retention_days.*=.*[0-9]*/log_retention_days = 30/' "$TARGET_PATH/terraform.tfvars" 2>/dev/null || true
        sed -i '' 's/sqs_retention_seconds.*=.*[0-9]*/sqs_retention_seconds = 604800/' "$TARGET_PATH/terraform.tfvars" 2>/dev/null || true
        sed -i '' 's/dlq_retention_seconds.*=.*[0-9]*/dlq_retention_seconds = 1209600/' "$TARGET_PATH/terraform.tfvars" 2>/dev/null || true
        ;;
    prod|production)
        # Production: large resources
        sed -i '' 's/worker_memory_size.*=.*[0-9]*/worker_memory_size = 1024/' "$TARGET_PATH/terraform.tfvars" 2>/dev/null || true
        sed -i '' 's/memory.*=.*[0-9]*/memory = 1024/' "$TARGET_PATH/terraform.tfvars" 2>/dev/null || true
        sed -i '' 's/log_retention_days.*=.*[0-9]*/log_retention_days = 90/' "$TARGET_PATH/terraform.tfvars" 2>/dev/null || true
        sed -i '' 's/sqs_retention_seconds.*=.*[0-9]*/sqs_retention_seconds = 1209600/' "$TARGET_PATH/terraform.tfvars" 2>/dev/null || true
        sed -i '' 's/dlq_retention_seconds.*=.*[0-9]*/dlq_retention_seconds = 1209600/' "$TARGET_PATH/terraform.tfvars" 2>/dev/null || true
        ;;
esac

# Update backend.tf.example with new state key
if [ -f "$TARGET_PATH/backend.tf.example" ]; then
    echo "Updating backend.tf.example..."
    sed -i '' "s|key.*=.*\".*\"|key = \"$PROJECT_NAME/$ENVIRONMENT/terraform.tfstate\"|" "$TARGET_PATH/backend.tf.example"
fi

# Remove any existing .terraform directory and lock file (fresh start)
rm -rf "$TARGET_PATH/.terraform" "$TARGET_PATH/.terraform.lock.hcl" 2>/dev/null || true

echo ""
echo -e "${GREEN}✓ Environment '$ENVIRONMENT' created successfully!${NC}"
echo ""
echo "Location: $TARGET_PATH"
echo ""
echo "Next steps:"
echo "  1. Review and customize: $TARGET_PATH/terraform.tfvars"
echo "  2. Set up remote state:  cp backend.tf.example backend.tf && edit backend.tf"
echo "  3. Initialize:           cd $TARGET_PATH && terraform init"
echo "  4. Deploy:               terraform plan && terraform apply"
echo ""
echo -e "${YELLOW}Environment-specific scaling applied:${NC}"
case "$ENVIRONMENT" in
    staging)
        echo "  - Memory: 512 MB (medium)"
        echo "  - Log retention: 30 days"
        echo "  - Message retention: 7 days"
        ;;
    prod|production)
        echo "  - Memory: 1024 MB (large)"
        echo "  - Log retention: 90 days"
        echo "  - Message retention: 14 days"
        ;;
esac
