provider "azurerm" {
  features {}
  subscription_id = "5558cf66-bc80-4533-9a0b-7d5b2ad03d38"
}

resource "azurerm_resource_group" "example" {
  name     = "example-resources"
  location = "East US" # Cambia con la tua regione preferita
}

resource "azurerm_user_assigned_identity" "example" {
  name                = "example-identity"
  resource_group_name = azurerm_resource_group.example.name
  location            = azurerm_resource_group.example.location
}