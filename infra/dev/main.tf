terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "3.106.1"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "2.50.0"
    }
    github = {
      source  = "integrations/github"
      version = "6.2.1"
    }
  }
}

provider "azurerm" {
  features {}
}

provider "github" {
  owner = var.github_organization_name
}

resource "azuread_application" "this" {
  display_name = "github-${var.github_repository_name}"
}

resource "azuread_service_principal" "this" {
  client_id = azuread_application.this.client_id
}

data "azurerm_subscription" "current" {
  subscription_id = var.azure_subscription_id
}

resource "azurerm_role_assignment" "this" {
  for_each = toset(var.azure_roles)
  scope    = data.azurerm_subscription.current.id
  principal_id   = azuread_service_principal.this.object_id
  principal_type = "ServicePrincipal"
  role_definition_name = each.value
  skip_service_principal_aad_check = true
}

resource "azuread_application_federated_identity_credential" "branches" {
  for_each = toset(var.branches)
  application_id = azuread_application.this.object_id
  display_name = "github-${var.github_organization_name}.${var.github_repository_name}-${each.value}"
  description = "Credenziali di identità federata GitHub"
  subject = "repo:${var.github_organization_name}/${var.github_repository_name}:ref:refs/heads/${each.value}"
  audiences = ["api://AzureADTokenExchange"]
  issuer = "https://token.actions.githubusercontent.com"
}

resource "azuread_application_federated_identity_credential" "tags" {
  for_each = toset(var.tags)
  application_id = azuread_application.this.object_id
  display_name = "github-${var.github_organization_name}.${var.github_repository_name}-${each.value}"
  description = "Credenziali di identità federata GitHub"
  subject = "repo:${var.github_organization_name}/${var.github_repository_name}:ref:refs/tags/${each.value}"
  audiences = ["api://AzureADTokenExchange"]
  issuer = "https://token.actions.githubusercontent.com"
}

resource "azuread_application_federated_identity_credential" "environments" {
  for_each = toset(var.environments)
  application_id = azuread_application.this.object_id
  display_name = "github-${var.github_organization_name}.${var.github_repository_name}-${each.value}"
  description = "Credenziali di identità federata GitHub"
  subject = "repo:${var.github_organization_name}/${var.github_repository_name}:environment:${each.value}"
  audiences = ["api://AzureADTokenExchange"]
  issuer = "https://token.actions.githubusercontent.com"
}

resource "azuread_application_federated_identity_credential" "pull_request" {
  count = var.pull_request ? 1 : 0
  application_id = azuread_application.this.object_id
  display_name = "github-${var.github_organization_name}.${var.github_repository_name}-pr"
  description = "Credenziali di identità federata GitHub"
  subject = "repo:${var.github_organization_name}/${var.github_repository_name}:pull_request"
  audiences = ["api://AzureADTokenExchange"]
  issuer = "https://token.actions.githubusercontent.com"
}

data "github_repository" "this" {
  name = var.github_repository_name
}

resource "github_actions_secret" "azure_client_id" {
  repository = data.github_repository.this.name
  secret_name = "AZURE_CLIENT_ID"
  plaintext_value = azuread_application.this.client_id
}

resource "github_actions_secret" "azure_tenant_id" {
  repository = data.github_repository.this.name
  secret_name = "AZURE_TENANT_ID"
  plaintext_value = data.azurerm_subscription.current.tenant_id
}

resource "github_actions_secret" "azure_subscription_id" {
  repository = data.github_repository.this.name
  secret_name = "AZURE_SUBSCRIPTION_ID"
  plaintext_value = data.azurerm_subscription.current.subscription_id
}