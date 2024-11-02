variable "github_organization_name" {
  description = "Nome dell'organizzazione GitHub"
  type        = string
}

variable "azure_subscription_id" {
  description = "ID della sottoscrizione Azure"
  type        = string
}

variable "github_repository_name" {
  description = "Nome del repository GitHub"
  type        = string
}

variable "azure_roles" {
  description = "Ruoli da assegnare all'identità in Azure"
  type        = list(string)
}

variable "branches" {
  description = "Elenco dei rami git da aggiungere come identificatori soggetto"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Elenco dei tag git da aggiungere come identificatori soggetto"
  type        = list(string)
  default     = []
}

variable "environments" {
  description = "Elenco degli ambienti GitHub da aggiungere come identificatori soggetto"
  type        = list(string)
  default     = []
}

variable "pull_request" {
  description = "Aggiungere l'identificatore soggetto 'pull request'?"
  type        = bool
  default     = false
}