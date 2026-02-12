resource "aws_s3_bucket" "mna_files" {
  bucket = "mna-files"

  tags = {
    Name        = "mna-files"
    Environment = "dev"
    Project     = "MnA"
    ManagedBy   = "Terraform"
  }
}

resource "aws_s3_bucket_versioning" "mna_files_versioning" {
  bucket = aws_s3_bucket.mna_files.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "mna_files_encryption" {
  bucket = aws_s3_bucket.mna_files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "mna_files_public_access" {
  bucket = aws_s3_bucket.mna_files.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "mna_files_cors" {
  bucket = aws_s3_bucket.mna_files.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = [
      "http://localhost:3000",
      "https://mna-tracker.vercel.app",
      "https://mna.sqe.co.id"
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
