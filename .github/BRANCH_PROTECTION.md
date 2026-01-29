# Branch Protection Rules

Branch protection rules require GitHub Pro for private repositories, or the repository must be public.

## Recommended Settings for `main` Branch

When you have access to branch protection, configure these settings via:
**Settings → Branches → Add rule → Branch name pattern: `main`**

### Required Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| **Require a pull request before merging** | Enabled | Prevent direct pushes to main |
| **Required approving reviews** | 1 | Ensure code review |
| **Dismiss stale pull request approvals** | Enabled | Re-review after changes |
| **Require review from Code Owners** | Enabled | Ensure proper ownership |
| **Require status checks to pass** | Enabled | Ensure CI passes |
| **Required status checks** | `CI Summary` | Main CI workflow |
| **Require branches to be up to date** | Enabled | Prevent merge conflicts |
| **Require conversation resolution** | Enabled | Address all feedback |
| **Do not allow bypassing settings** | Enabled | Apply to admins too |

### Optional (Recommended) Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| **Require signed commits** | Enabled | Verify commit authenticity |
| **Require linear history** | Optional | Cleaner git history |
| **Allow force pushes** | Disabled | Prevent history rewriting |
| **Allow deletions** | Disabled | Protect branch |

## Applying via GitHub CLI

Once you have GitHub Pro or make the repo public:

```bash
gh api repos/berTrindade/terraform-infrastructure-blueprints/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI Summary"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":true,"required_approving_review_count":1}' \
  --field restrictions=null \
  --field required_linear_history=false \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field required_conversation_resolution=true
```

## Alternative: Rulesets (GitHub Free)

GitHub Rulesets are available on GitHub Free and provide similar functionality:

1. Go to **Settings → Rules → Rulesets**
2. Click **New ruleset → New branch ruleset**
3. Configure similar protections

Note: Rulesets have slightly different options but achieve the same goals.

---

# GitHub Environments

Three deployment environments have been configured:

| Environment | Protection | Description |
|-------------|------------|-------------|
| `dev` | None | Development deployments |
| `staging` | Branch policy | Only from protected branches |
| `production` | Branch policy | Only from protected branches |

## Environment Protection Rules (GitHub Pro Required)

Additional protection rules require GitHub Pro for private repositories:

| Feature | dev | staging | production |
|---------|-----|---------|------------|
| Required reviewers | - | 1 reviewer | 2 reviewers |
| Wait timer | - | - | 10 minutes |
| Branch restrictions | - | Enabled | Enabled |

### Applying Protection Rules (When Available)

```bash
# Add required reviewers and wait timer to production
gh api repos/berTrindade/terraform-infrastructure-blueprints/environments/production \
  --method PUT \
  --input - << 'EOF'
{
  "wait_timer": 10,
  "reviewers": [
    {"type": "User", "id": YOUR_USER_ID}
  ],
  "deployment_branch_policy": {
    "protected_branches": true,
    "custom_branch_policies": false
  }
}
EOF
```

## Using Environments in Workflows

Workflows reference environments like this:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # Triggers protection rules
    steps:
      - name: Deploy
        run: terraform apply -auto-approve
```

## Environment Secrets

Add environment-specific secrets via:
**Settings → Environments → [env] → Environment secrets**

Recommended secrets per environment:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- Or use AWS OIDC (recommended for production)
