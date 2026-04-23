resource "aws_iam_group" "mna_maintainers" {
  count = local.environment == "dev" ? 0 : 1
  name  = "mna_maintainers"
}

resource "aws_iam_group_membership" "mna_maintainers" {
  count = local.environment == "dev" ? 0 : 1
  name  = "mna_maintainers_membership"
  group = aws_iam_group.mna_maintainers[0].name
  users = local.current_config.mna_maintainers_users
}

resource "aws_iam_group_policy" "mna_maintainer_policy" {
  count = local.environment == "dev" ? 0 : 1
  name  = "mna_maintainer_policy"
  group = aws_iam_group.mna_maintainers[0].name
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "ec2:*",
          "elasticloadbalancing:*",
          "cloudwatch:*",
          "cloudshell:*",
          "ecr:*",
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "bedrock:*",
          "ecs:*",
          "events:*",
          "iam:ListAttachedRolePolicies",
          "iam:ListInstanceProfiles",
          "iam:ListRoles",
          "lambda:*",
          "logs:*",
          "rds:*",
          "sns:*",
          "wafv2:*",
          "waf:*",
          "ec2:*",
          "s3:*",
          "backup:*",
          "textract:*",
          "iam:CreateUser",
          "iam:CreateAccessKey",
          "iam:CreatePolicy",
          "iam:GetPolicy",
          "iam:GetPolicyVersion",
          "iam:ListPolicyVersions",
          "iam:DeletePolicy",
          "iam:AttachUserPolicy",
          "iam:ListAttachedUserPolicies",
          "iam:DetachUserPolicy",
          "ses:SendEmail",
          "ses:SendRawEmail",
          "ssm:StartSession",
          "ssm:DescribeInstanceInformation",
          "ssm:TerminateSession",
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "xray:GetTraceSummaries",
          "xray:BatchGetTraces",
          "xray:GetTraceGraph",
          "xray:GetServiceGraph",
          "tag:GetResources",
          "appconfig:ListApplications",
          "appconfig:CreateApplication",
          "appconfig:CreateEnvironment",
          "appconfig:GetApplication",
          "appconfig:ListEnvironments",
          "appconfig:GetEnvironment",
          "appconfig:ListConfigurationProfiles",
          "appconfig:GetConfigurationProfile",
          "appconfig:ListDeployments",
          "appconfig:GetDeployment",
          "appconfig:GetHostedConfigurationVersion",
          "appconfig:CreateHostedConfigurationVersion",
          "appconfig:StartDeployment",
          "appconfig:StopDeployment",
          "appconfig:ValidateConfiguration",
          "appconfig:StartConfigurationSession",
          "appconfig:GetLatestConfiguration"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_group_policy" "mna_maintainer_lambda_development_access" {
  count = local.environment == "dev" ? 0 : 1
  name  = "mna_maintainer_lambda_development_access"
  group = aws_iam_group.mna_maintainers[0].name
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "cloudformation:DescribeStacks",
          "cloudformation:ListStackResources",
          "cloudwatch:ListMetrics",
          "cloudwatch:GetMetricData",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSubnets",
          "ec2:DescribeVpcs",
          "kms:ListAliases",
          "iam:GetPolicy",
          "iam:GetPolicyVersion",
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:ListAttachedRolePolicies",
          "iam:ListRolePolicies",
          "iam:ListRoles",
          "lambda:*",
          "logs:DescribeLogGroups",
          "states:DescribeStateMachine",
          "states:ListStateMachines",
          "tag:GetResources",
          "xray:GetTraceSummaries",
          "xray:BatchGetTraces"
        ],
        Resource = "*"
      },
      {
        Effect   = "Allow",
        Action   = "iam:PassRole",
        Resource = "*",
        Condition = {
          StringEquals = {
            "iam:PassedToService" = "lambda.amazonaws.com"
          }
        }
      },
      {
        Effect = "Allow",
        Action = [
          "logs:DescribeLogStreams",
          "logs:GetLogEvents",
          "logs:FilterLogEvents",
          "logs:StartLiveTail",
          "logs:StopLiveTail"
        ],
        Resource = "arn:aws:logs:*:*:log-group:/aws/lambda/*"
      }
    ]
  })
}
