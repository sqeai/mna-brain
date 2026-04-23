variable "aws_region" {
  type    = string
  default = "ap-southeast-3"
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "db_name" {
  type    = string
  default = "mna"
}

variable "db_username" {
  type    = string
  default = "mnaapp"
}

variable "instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "allocated_storage" {
  type    = number
  default = 20
}

variable "rds_publicly_accessible" {
  description = "When true, RDS uses public subnets only in the DB subnet group so the ENI has an Internet Gateway route (required for internet clients like DBeaver). When false, only private subnets are used."
  type        = bool
  default     = true
}

variable "rds_public_ingress_cidrs" {
  description = "IPv4 CIDRs allowed to reach RDS on 5432 from the internet when rds_publicly_accessible is true. Use narrow /32 lists (e.g. Vercel Static IPs) when possible."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "rds_iam_database_authentication_enabled" {
  description = "When true, enables RDS IAM DB authentication (password + IAM). Engineers use AWS CLI/SDK to generate a ~15m auth token for DBeaver; create the DB user and GRANT rds_iam once (see output iam_db_auth_bootstrap_sql)."
  type        = bool
  default     = true
}

variable "iam_db_auth_username" {
  description = "PostgreSQL role name used only for IAM DB auth (must match --username when generating the token). Do not use the RDS master user unless you intend IAM to take precedence over password for that user."
  type        = string
  default     = "mna_iam"
}

variable "iam_db_auth_attach_users" {
  description = "Optional: attach rds-db:connect policy directly to these IAM usernames. Prefer attaching via terraform/iam (mna_devops + mna_maintainers groups) using remote state; leave empty when using that path."
  type        = list(string)
  default     = []
}

variable "iam_db_auth_attach_roles" {
  description = "IAM role names to attach the rds-db:connect policy to (e.g. app task role)."
  type        = list(string)
  default     = []
}

data "aws_caller_identity" "current" {}

locals {
  tfstate_bucket = "mna-tfstate-${terraform.workspace}-${data.aws_caller_identity.current.account_id}"

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

  # Official RDS global CA bundle (download into your app or CI; too large for SSM).
  rds_global_tls_ca_bundle_url = "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem"
}

data "terraform_remote_state" "vpc" {
  backend = "s3"
  config = {
    bucket = local.tfstate_bucket
    key    = "env:/${terraform.workspace}/mna/vpc"
    region = var.aws_region
  }
}
