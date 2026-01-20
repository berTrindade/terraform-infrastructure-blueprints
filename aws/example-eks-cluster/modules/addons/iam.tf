# modules/addons/iam.tf
# IAM roles for EKS addons using IRSA

# EBS CSI Driver Role
resource "aws_iam_role" "ebs_csi" {
  name = var.ebs_csi_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Principal = {
        Federated = var.oidc_provider_arn
      }
      Condition = {
        StringEquals = {
          "${var.oidc_issuer}:aud" = "sts.amazonaws.com"
          "${var.oidc_issuer}:sub" = "system:serviceaccount:kube-system:ebs-csi-controller-sa"
        }
      }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "ebs_csi" {
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
  role       = aws_iam_role.ebs_csi.name
}

# AWS Load Balancer Controller Role
resource "aws_iam_role" "lb_controller" {
  count = var.enable_lb_controller ? 1 : 0

  name = var.lb_controller_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Principal = {
        Federated = var.oidc_provider_arn
      }
      Condition = {
        StringEquals = {
          "${var.oidc_issuer}:aud" = "sts.amazonaws.com"
          "${var.oidc_issuer}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
        }
      }
    }]
  })

  tags = var.tags
}

resource "aws_iam_policy" "lb_controller" {
  count = var.enable_lb_controller ? 1 : 0

  name = "${var.lb_controller_role_name}-policy"

  policy = file("${path.module}/policies/lb-controller-policy.json")

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lb_controller" {
  count = var.enable_lb_controller ? 1 : 0

  policy_arn = aws_iam_policy.lb_controller[0].arn
  role       = aws_iam_role.lb_controller[0].name
}
