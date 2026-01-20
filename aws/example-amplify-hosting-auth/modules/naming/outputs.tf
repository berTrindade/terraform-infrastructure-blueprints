# modules/naming/outputs.tf

output "prefix" {
  value = local.prefix
}

output "amplify_app" {
  value = local.names.amplify_app
}

output "user_pool" {
  value = local.names.user_pool
}

output "user_pool_client" {
  value = local.names.user_pool_client
}

output "identity_pool" {
  value = local.names.identity_pool
}
