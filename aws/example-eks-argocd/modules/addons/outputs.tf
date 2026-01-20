# modules/addons/outputs.tf

output "coredns_version" {
  value = aws_eks_addon.coredns.addon_version
}

output "vpc_cni_version" {
  value = aws_eks_addon.vpc_cni.addon_version
}

output "kube_proxy_version" {
  value = aws_eks_addon.kube_proxy.addon_version
}

output "ebs_csi_version" {
  value = aws_eks_addon.ebs_csi.addon_version
}

output "ebs_csi_role_arn" {
  value = aws_iam_role.ebs_csi.arn
}

output "lb_controller_role_arn" {
  value = var.enable_lb_controller ? aws_iam_role.lb_controller[0].arn : null
}
