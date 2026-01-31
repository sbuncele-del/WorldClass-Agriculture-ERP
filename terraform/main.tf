terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "worldclass-erp-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "eu-north-1"
  }
}

provider "aws" {
  region = "eu-north-1"
  default_tags {
    tags = {
      Project     = "WorldClass-ERP"
      Environment = "Production"
      ManagedBy   = "Terraform"
    }
  }
}
