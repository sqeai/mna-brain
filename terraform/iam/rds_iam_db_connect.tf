
variable "attach_rds_iam_db_connect_policy" {
  description = "Read RDS remote state and attach iam_db_connect_policy_arn to mna_devops and mna_maintainers. Set false if RDS state does not exist yet for this workspace."
  type        = bool
  default     = true
}

data "terraform_remote_state" "rds" {
  count = var.attach_rds_iam_db_connect_policy ? 1 : 0

  backend = "s3"
  config = {
    bucket = local.tfstate_bucket
    key    = "env:/${terraform.workspace}/mna/rds"
    region = var.aws_region
  }
}

locals {
  rds_iam_db_connect_policy_arn = (
    var.attach_rds_iam_db_connect_policy
    ? lookup(data.terraform_remote_state.rds[0].outputs, "iam_db_connect_policy_arn", null)
    : null
  )
}

resource "aws_iam_group_policy_attachment" "mna_devops_rds_iam_db_connect" {
  count = (
    var.attach_rds_iam_db_connect_policy &&
    local.environment != "dev" &&
    local.rds_iam_db_connect_policy_arn != null
  ) ? 1 : 0

  group      = aws_iam_group.mna_devops[0].name
  policy_arn = local.rds_iam_db_connect_policy_arn
}

resource "aws_iam_group_policy_attachment" "mna_maintainers_rds_iam_db_connect" {
  count = (
    var.attach_rds_iam_db_connect_policy &&
    local.environment != "dev" &&
    local.rds_iam_db_connect_policy_arn != null
  ) ? 1 : 0

  group      = aws_iam_group.mna_maintainers[0].name
  policy_arn = local.rds_iam_db_connect_policy_arn
}
