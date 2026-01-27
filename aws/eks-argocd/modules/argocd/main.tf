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

# Gateway API for ArgoCD UI
# Gateway resource (infrastructure layer)
resource "kubernetes_manifest" "argocd_gateway" {
  count = var.enable_ingress ? 1 : 0

  manifest = {
    apiVersion = "gateway.networking.k8s.io/v1"
    kind       = "Gateway"
    metadata = {
      name      = "argocd-gateway"
      namespace = kubernetes_namespace.argocd.metadata[0].name
      annotations = {
        "alb.ingress.kubernetes.io/scheme" = var.ingress_scheme
      }
    }
    spec = {
      gatewayClassName = "alb"
      listeners = [{
        name     = "http"
        protocol = "HTTP"
        port     = 80
      }]
    }
  }

  depends_on = [helm_release.argocd]
}

# HTTPRoute resource (application routing layer)
resource "kubernetes_manifest" "argocd_httproute" {
  count = var.enable_ingress ? 1 : 0

  manifest = {
    apiVersion = "gateway.networking.k8s.io/v1"
    kind       = "HTTPRoute"
    metadata = {
      name      = "argocd-route"
      namespace = kubernetes_namespace.argocd.metadata[0].name
    }
    spec = {
      parentRefs = [{
        name      = "argocd-gateway"
        namespace = kubernetes_namespace.argocd.metadata[0].name
      }]
      rules = [{
        matches = [{
          path = {
            type  = "PathPrefix"
            value = "/"
          }
        }]
        backendRefs = [{
          name = "argocd-server"
          port = 80
        }]
      }]
    }
  }

  depends_on = [kubernetes_manifest.argocd_gateway]
}
