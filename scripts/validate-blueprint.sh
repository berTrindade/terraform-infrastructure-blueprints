#!/bin/bash
# validate-blueprint.sh
# Validates that a blueprint follows the required structure and quality standards
#
# Usage:
#   ./scripts/validate-blueprint.sh <blueprint-path>
#   ./scripts/validate-blueprint.sh blueprints/aws/example-sqs-worker-api
#   ./scripts/validate-blueprint.sh --all  # Validate all blueprints
#
# Exit codes:
#   0 - All validations passed
#   1 - Validation failed

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASS=0
FAIL=0
WARN=0

# Find repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# ============================================
# Helper functions
# ============================================

check_pass() {
    echo -e "  ${GREEN}✓${NC} $1"
    ((PASS++))
}

check_fail() {
    echo -e "  ${RED}✗${NC} $1"
    ((FAIL++))
}

check_warn() {
    echo -e "  ${YELLOW}WARNING:${NC} $1"
    ((WARN++))
}

check_info() {
    echo -e "  ${BLUE}ℹ${NC} $1"
}

# ============================================
# Validation functions
# ============================================

validate_structure() {
    local blueprint="$1"
    local path="$REPO_ROOT/$blueprint"
    
    echo ""
    echo -e "${BLUE}Checking structure...${NC}"
    
    # Required directories
    if [ -d "$path/environments/dev" ]; then
        check_pass "environments/dev/ exists"
    else
        check_fail "environments/dev/ missing"
    fi
    
    if [ -d "$path/modules" ]; then
        local module_count=$(find "$path/modules" -maxdepth 1 -mindepth 1 -type d | wc -l | tr -d ' ')
        if [ "$module_count" -gt 0 ]; then
            check_pass "modules/ exists with $module_count module(s)"
        else
            check_warn "modules/ exists but is empty"
        fi
    else
        check_fail "modules/ missing"
    fi
    
    # Required files in environments/dev
    local dev_path="$path/environments/dev"
    for file in main.tf variables.tf outputs.tf versions.tf terraform.tfvars; do
        if [ -f "$dev_path/$file" ]; then
            check_pass "environments/dev/$file exists"
        else
            check_fail "environments/dev/$file missing"
        fi
    done
    
    # Backend template
    if [ -f "$dev_path/backend.tf.example" ]; then
        check_pass "environments/dev/backend.tf.example exists"
    else
        check_warn "environments/dev/backend.tf.example missing (recommended)"
    fi
    
    # Scripts
    if [ -f "$path/scripts/create-environment.sh" ]; then
        check_pass "scripts/create-environment.sh exists"
        if [ -x "$path/scripts/create-environment.sh" ]; then
            check_pass "scripts/create-environment.sh is executable"
        else
            check_fail "scripts/create-environment.sh is not executable"
        fi
    else
        check_fail "scripts/create-environment.sh missing"
    fi
    
    # GitHub workflows
    if [ -f "$path/.github/workflows/deploy.yml" ]; then
        check_pass ".github/workflows/deploy.yml exists"
    else
        check_fail ".github/workflows/deploy.yml missing"
    fi
    
    # README
    if [ -f "$path/README.md" ]; then
        check_pass "README.md exists"
    else
        check_fail "README.md missing"
    fi
}

validate_readme() {
    local blueprint="$1"
    local readme="$REPO_ROOT/$blueprint/README.md"
    
    echo ""
    echo -e "${BLUE}Checking README.md...${NC}"
    
    if [ ! -f "$readme" ]; then
        check_fail "README.md not found"
        return
    fi
    
    # Required sections
    local sections=(
        "Architecture"
        "Quick Start"
        "Estimated Costs"
        "Cleanup"
    )
    
    for section in "${sections[@]}"; do
        if grep -qi "^##.*$section" "$readme"; then
            check_pass "README has '$section' section"
        else
            check_fail "README missing '$section' section"
        fi
    done
    
    # Check for Mermaid diagram
    if grep -q '```mermaid' "$readme"; then
        check_pass "README has architecture diagram (Mermaid)"
    else
        check_warn "README missing architecture diagram (Mermaid recommended)"
    fi
    
    # Check for curl examples in Quick Start
    if grep -q 'curl' "$readme"; then
        check_pass "README has curl examples"
    else
        check_warn "README missing curl examples (recommended for API blueprints)"
    fi
}

validate_terraform() {
    local blueprint="$1"
    local dev_path="$REPO_ROOT/$blueprint/environments/dev"
    
    echo ""
    echo -e "${BLUE}Checking Terraform...${NC}"
    
    if [ ! -d "$dev_path" ]; then
        check_fail "environments/dev/ not found, skipping Terraform checks"
        return
    fi
    
    # Check terraform fmt
    cd "$dev_path"
    if terraform fmt -check -recursive >/dev/null 2>&1; then
        check_pass "Terraform formatting is correct"
    else
        check_fail "Terraform formatting issues found (run: terraform fmt -recursive)"
    fi
    
    # Check terraform validate (requires init)
    # Skip if not initialized - CI will run full validation
    if [ -d ".terraform" ]; then
        if terraform validate >/dev/null 2>&1; then
            check_pass "Terraform configuration is valid"
        else
            check_warn "Terraform validation failed (may need: terraform init)"
        fi
    else
        check_info "Skipping terraform validate (run: terraform init -backend=false)"
    fi
    
    cd "$REPO_ROOT"
}

validate_tfvars() {
    local blueprint="$1"
    local tfvars="$REPO_ROOT/$blueprint/environments/dev/terraform.tfvars"
    
    echo ""
    echo -e "${BLUE}Checking terraform.tfvars...${NC}"
    
    if [ ! -f "$tfvars" ]; then
        check_fail "terraform.tfvars not found"
        return
    fi
    
    # Required variables
    if grep -q 'project\s*=' "$tfvars"; then
        check_pass "terraform.tfvars has 'project' variable"
    else
        check_fail "terraform.tfvars missing 'project' variable"
    fi
    
    if grep -q 'environment\s*=' "$tfvars"; then
        check_pass "terraform.tfvars has 'environment' variable"
    else
        check_fail "terraform.tfvars missing 'environment' variable"
    fi
    
    if grep -q 'aws_region\s*=' "$tfvars"; then
        check_pass "terraform.tfvars has 'aws_region' variable"
        
        # Check if region is eu-west-2 (default)
        if grep -q 'aws_region\s*=\s*"eu-west-2"' "$tfvars"; then
            check_pass "aws_region is set to eu-west-2 (default)"
        else
            check_warn "aws_region is not eu-west-2 (expected default)"
        fi
    else
        check_fail "terraform.tfvars missing 'aws_region' variable"
    fi
}

validate_security() {
    local blueprint="$1"
    local path="$REPO_ROOT/$blueprint"
    
    echo ""
    echo -e "${BLUE}Checking security...${NC}"
    
    # Check for hardcoded secrets patterns
    local secret_patterns=(
        'password\s*=\s*"[^"]*[a-zA-Z0-9]'
        'secret\s*=\s*"[^"]*[a-zA-Z0-9]'
        'api_key\s*=\s*"[^"]*[a-zA-Z0-9]'
        'AKIA[0-9A-Z]{16}'  # AWS Access Key
    )
    
    local found_secrets=false
    for pattern in "${secret_patterns[@]}"; do
        if grep -r -E "$pattern" "$path" --include="*.tf" --include="*.tfvars" 2>/dev/null | grep -v 'example\|placeholder\|changeme\|TODO' >/dev/null; then
            found_secrets=true
            break
        fi
    done
    
    if [ "$found_secrets" = true ]; then
        check_fail "Potential hardcoded secrets found"
    else
        check_pass "No obvious hardcoded secrets"
    fi
    
    # Check for public access patterns
    if grep -r 'publicly_accessible\s*=\s*true' "$path" --include="*.tf" >/dev/null 2>&1; then
        check_warn "Found 'publicly_accessible = true' (review if intended)"
    else
        check_pass "No public database access configured"
    fi
    
    # Check for open security groups
    if grep -r 'cidr_blocks\s*=\s*\["0.0.0.0/0"\]' "$path" --include="*.tf" >/dev/null 2>&1; then
        check_warn "Found 0.0.0.0/0 CIDR block (review if intended)"
    fi
}

# ============================================
# Main
# ============================================

print_usage() {
    echo "Usage: $0 <blueprint-path>"
    echo "       $0 --all"
    echo ""
    echo "Examples:"
    echo "  $0 blueprints/aws/example-sqs-worker-api"
    echo "  $0 --all"
}

validate_blueprint() {
    local blueprint="$1"
    
    echo ""
    echo "========================================"
    echo -e "${BLUE}Validating: $blueprint${NC}"
    echo "========================================"
    
    # Reset counters for each blueprint
    PASS=0
    FAIL=0
    WARN=0
    
    validate_structure "$blueprint"
    validate_readme "$blueprint"
    validate_terraform "$blueprint"
    validate_tfvars "$blueprint"
    validate_security "$blueprint"
    
    # Summary
    echo ""
    echo "----------------------------------------"
    echo -e "Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}, ${YELLOW}$WARN warnings${NC}"
    
    if [ $FAIL -gt 0 ]; then
        echo -e "${RED}VALIDATION FAILED${NC}"
        return 1
    elif [ $WARN -gt 0 ]; then
        echo -e "${YELLOW}VALIDATION PASSED WITH WARNINGS${NC}"
        return 0
    else
        echo -e "${GREEN}VALIDATION PASSED${NC}"
        return 0
    fi
}

# Parse arguments
if [ $# -eq 0 ]; then
    print_usage
    exit 1
fi

if [ "$1" = "--all" ]; then
    echo -e "${BLUE}Validating all blueprints...${NC}"
    
    TOTAL_PASS=0
    TOTAL_FAIL=0
    
    for blueprint in "$REPO_ROOT"/blueprints/aws/*/; do
        blueprint_name=$(basename "$blueprint")
        if validate_blueprint "blueprints/aws/$blueprint_name"; then
            ((TOTAL_PASS++))
        else
            ((TOTAL_FAIL++))
        fi
    done
    
    echo ""
    echo "========================================"
    echo -e "${BLUE}OVERALL SUMMARY${NC}"
    echo "========================================"
    echo -e "Blueprints: ${GREEN}$TOTAL_PASS passed${NC}, ${RED}$TOTAL_FAIL failed${NC}"
    
    if [ $TOTAL_FAIL -gt 0 ]; then
        exit 1
    fi
else
    blueprint="$1"
    
    # Validate path exists
    if [ ! -d "$REPO_ROOT/$blueprint" ]; then
        echo -e "${RED}Error: Blueprint not found: $blueprint${NC}"
        exit 1
    fi
    
    if ! validate_blueprint "$blueprint"; then
        exit 1
    fi
fi
