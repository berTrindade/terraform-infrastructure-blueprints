# modules/argocd/outputs.tf

output "namespace" {
  value = kubernetes_namespace.argocd.metadata[0].name
}

output "chart_version" {
  value = helm_release.argocd.version
}

output "gateway_hostname_command" {
  description = "Command to get ArgoCD Gateway ALB hostname (if Gateway API enabled)"
  value       = var.enable_ingress ? "kubectl get gateway argocd-gateway -n ${var.namespace} -o jsonpath='{.status.addresses[0].value}'" : null
}

output "get_admin_password" {
  description = "Command to get initial admin password"
  value       = "kubectl -n ${var.namespace} get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d"
}
