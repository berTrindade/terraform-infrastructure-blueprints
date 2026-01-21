# modules/argocd/main.tf
# ArgoCD installation via Helm

resource "kubernetes_namespace" "argocd" {
  metadata {
    name = var.namespace
    labels = {
      "app.kubernetes.io/name" = "argocd"
    }
  }
}

resource "helm_release" "argocd" {
  name       = "argocd"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  version    = var.chart_version
  namespace  = kubernetes_namespace.argocd.metadata[0].name

  # Server configuration
  set {
    name  = "server.service.type"
    value = var.enable_ingress ? "ClusterIP" : "LoadBalancer"
  }

  # Enable insecure mode if using ALB (ALB terminates TLS)
  set {
    name  = "configs.params.server\\.insecure"
    value = var.enable_ingress ? "true" : "false"
  }

  # HA configuration
  set {
    name  = "controller.replicas"
    value = var.ha_enabled ? "2" : "1"
  }

  set {
    name  = "server.replicas"
    value = var.ha_enabled ? "2" : "1"
  }

  set {
    name  = "repoServer.replicas"
    value = var.ha_enabled ? "2" : "1"
  }

  set {
    name  = "applicationSet.replicas"
    value = var.ha_enabled ? "2" : "1"
  }

  # Resource limits for dev environment
  dynamic "set" {
    for_each = var.set_resources ? [1] : []
    content {
      name  = "controller.resources.limits.memory"
      value = "512Mi"
    }
  }

  dynamic "set" {
    for_each = var.set_resources ? [1] : []
    content {
      name  = "server.resources.limits.memory"
      value = "256Mi"
    }
  }

  dynamic "set" {
    for_each = var.set_resources ? [1] : []
    content {
      name  = "repoServer.resources.limits.memory"
      value = "256Mi"
    }
  }

  values = var.values

  timeout = 600

  depends_on = [kubernetes_namespace.argocd]
}

# ALB Ingress for ArgoCD UI
resource "kubernetes_ingress_v1" "argocd" {
  count = var.enable_ingress ? 1 : 0

  metadata {
    name      = "argocd-server"
    namespace = kubernetes_namespace.argocd.metadata[0].name
    annotations = {
      "kubernetes.io/ingress.class"                    = "alb"
      "alb.ingress.kubernetes.io/scheme"               = var.ingress_scheme
      "alb.ingress.kubernetes.io/target-type"          = "ip"
      "alb.ingress.kubernetes.io/backend-protocol"     = "HTTP"
      "alb.ingress.kubernetes.io/healthcheck-protocol" = "HTTP"
      "alb.ingress.kubernetes.io/healthcheck-path"     = "/healthz"
      "alb.ingress.kubernetes.io/listen-ports"         = "[{\"HTTP\": 80}]"
    }
  }

  spec {
    rule {
      http {
        path {
          path      = "/"
          path_type = "Prefix"
          backend {
            service {
              name = "argocd-server"
              port {
                number = 80
              }
            }
          }
        }
      }
    }
  }

  depends_on = [helm_release.argocd]
}
