locals {
  env_short    =  var.environment == "DEV" ? "d" : "p"
  project      = "${var.prefix}-${local.env_short}-${var.location_short}"
  # application_basename = "learning"
}