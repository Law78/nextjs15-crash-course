variable "prefix" {
  type    = string
  default = "lf"
  validation {
    condition = (
      length(var.prefix) < 6
    )
    error_message = "Max length is 6 chars."
  }
}

variable "location" {
  type    = string
  default = "italynorth"
}

variable "environment" {
  type    = string
}

variable "location_short" {
  type    = string
  default = "itn"
}

variable "tags" {
  type = map(any)
  default = {
    CreatedBy = "Terraform"
  }
}