# modules/argocd/outputs.tf

output "namespace" {
  value = kubernetes_namespace.argocd.metadata[0].name
}

output "chart_version" {
  value = helm_release.argocd.version
}

output "ingress_hostname" {
  description = "ArgoCD ALB hostname (if ingress enabled)"
  value       = var.enable_ingress ? kubernetes_ingress_v1.argocd[0].status[0].load_balancer[0].ingress[0].hostname : null
}

output "get_admin_password" {
  description = "Command to get initial admin password"
  value       = "kubectl -n ${var.namespace} get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d"
}
