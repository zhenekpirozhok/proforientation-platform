data "terraform_remote_state" "core" {
  backend = "s3"
  config = {
    bucket         = "alenatsibets-tf-state-eu-north-1"
    key            = "core/terraform.tfstate"
    region         = "eu-north-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}