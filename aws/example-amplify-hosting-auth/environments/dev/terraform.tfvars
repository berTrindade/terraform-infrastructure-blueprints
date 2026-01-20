# environments/dev/terraform.tfvars

project     = "amplify-auth"
environment = "dev"
aws_region  = "us-east-1"

# Cognito - CHANGE THIS to a unique value
cognito_domain           = "my-app-auth-unique-12345"
password_minimum_length  = 8
password_require_symbols = false
mfa_configuration        = "OFF"
access_token_validity    = 1
id_token_validity        = 1
refresh_token_validity   = 30

# Amplify
# repository_url = "https://github.com/your-org/your-repo"
framework              = "React"
main_branch_name       = "main"
build_output_directory = "build"
create_webhook         = false
