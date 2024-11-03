resource "azurerm_resource_group" "rg_common" {
  name     = "${local.project}-common-rg"
  location = var.location
}