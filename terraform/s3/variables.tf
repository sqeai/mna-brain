variable "aws_region" {
  type    = string
  default = "ap-southeast-3"
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "cors_allowed_origins" {
  description = "Origins allowed for browser uploads/downloads"
  type        = list(string)
  default = [
    "http://localhost:3000",
    "http://localhost:5173"
  ]
}

data "aws_caller_identity" "current" {}

locals {
  workspace_config = {
    dev = {
      environment = "dev"
      tags = {
        Environment = "dev"
        Project     = "MnA"
        ManagedBy   = "Terraform"
      }
    }
    staging = {
      environment = "staging"
      tags = {
        Environment = "staging"
        Project     = "MnA"
        ManagedBy   = "Terraform"
      }
    }
    production = {
      environment = "production"
      tags = {
        Environment = "production"
        Project     = "MnA"
        ManagedBy   = "Terraform"
      }
    }
  }

  current_config   = lookup(local.workspace_config, terraform.workspace, local.workspace_config["dev"])
  environment_tags = merge(local.current_config.tags, var.tags)
  bucket_name      = "mna-app-data-${local.current_config.environment}"
}
