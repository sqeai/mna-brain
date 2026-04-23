output "mna_devops_user_names" {
  description = "Usernames added to mna_devops group (must exist in IAM)"
  value       = local.current_config.mna_devops_users
}

output "mna_maintainers_user_names" {
  description = "Usernames added to mna_maintainers group when not dev (must exist in IAM)"
  value       = local.current_config.mna_maintainers_users
}

output "rds_iam_db_connect_policy_arn_from_rds_state" {
  description = "Policy ARN from terraform/rds remote state (null if RDS not applied, IAM DB auth off, or attach_rds_iam_db_connect_policy=false)"
  value       = local.rds_iam_db_connect_policy_arn
}

output "rds_iam_db_connect_group_attachments_enabled" {
  description = "Whether mna_devops and mna_maintainers get the RDS IAM DB connect policy attachment (non-dev only)"
  value = (
    var.attach_rds_iam_db_connect_policy &&
    local.environment != "dev" &&
    local.rds_iam_db_connect_policy_arn != null
  )
}
