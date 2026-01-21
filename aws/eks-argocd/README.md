# EKS + ArgoCD

Production-ready Amazon EKS cluster with ArgoCD for GitOps deployments.

## Architecture

```mermaid
flowchart TB
    Dev([Developer])
    Git[(Git Repository)]
    ArgoCD[ArgoCD]
    EKS[EKS Cluster]
    Apps[Applications]
    ALB[Application<br/>Load Balancer]
    
    Dev -->|Push| Git
    Git -->|Webhook/Poll| ArgoCD
    ArgoCD -->|Sync| EKS
    EKS --> Apps
    ALB --> ArgoCD
    ALB --> Apps
```

## Requirements

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Terraform >= 1.9
- kubectl installed
- Git repository for manifests

## Deployment

```bash
cd environments/dev
terraform init
terraform apply
```

> EKS + ArgoCD deployment takes ~15-20 minutes.

## How it works

ArgoCD implements GitOps for Kubernetes - it watches a Git repository and automatically syncs changes to your cluster. This blueprint includes:

- **EKS 1.29+** with managed node groups
- **ArgoCD** for GitOps continuous deployment
- **AWS Load Balancer Controller** for ALB ingress
- **App of Apps** pattern ready
- **Sample application** included
- **IRSA** (IAM Roles for Service Accounts)

## Testing

### Configure kubectl

```bash
aws eks update-kubeconfig --region us-east-1 --name $(terraform output -raw cluster_name)
```

### Access ArgoCD UI

```bash
# Get ArgoCD URL
terraform output argocd_url

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d
```

Login with username `admin` and the password from above.

### Set Up GitOps

1. Push manifests to your Git repository
2. Update `manifests/argocd-apps/sample-app.yaml` with your repo URL:

```yaml
spec:
  source:
    repoURL: https://github.com/YOUR-ORG/YOUR-REPO.git
```

3. Register the app:

```bash
kubectl apply -f manifests/argocd-apps/sample-app.yaml
```

Now edit manifests and push to Git - ArgoCD will automatically sync!

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `project` | - | Project name (lowercase, alphanumeric) |
| `environment` | - | Environment: dev, staging, prod |
| `cluster_version` | 1.29 | EKS version |
| `node_instance_types` | t3.medium | Node instance types |
| `node_desired_size` | 2 | Desired node count |
| `argocd_version` | 2.9.3 | ArgoCD Helm chart version |

## Estimated Costs

| Resource | Cost (monthly) |
|----------|----------------|
| EKS Control Plane | $72 |
| NAT Gateway | ~$32 + data |
| t3.medium nodes (2x) | ~$60 |
| ALB (ArgoCD + apps) | ~$32 + data |

**Total estimate: ~$200/month**

## Cleanup

```bash
# Delete ArgoCD apps first
kubectl delete applications --all -n argocd

# Delete workloads
kubectl delete ingress --all -A
kubectl delete svc --all -A --field-selector="spec.type=LoadBalancer"

# Wait for ALB cleanup
sleep 60

terraform destroy
```

## Related Blueprints

| Blueprint | Relationship | Use Case |
|-----------|--------------|----------|
| `eks-cluster` | Without GitOps | Manual kubectl/Helm deployments |
| `alb-ecs-fargate` | Simpler | Don't need Kubernetes |
| `apigw-lambda-dynamodb` | Serverless | Prefer serverless over containers |
