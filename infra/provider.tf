terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    http = {
      source  = "hashicorp/http"
      version = "~> 3.0"
    }
    postgresql = {
      source  = "cyrilgdn/postgresql"
      version = "~> 1.0"
    }
  }
}

provider "aws" {
  region = "ap-northeast-1"
}

provider "postgresql" {
  host      = module.database.db_address
  port      = 5432
  username  = "postgres"
  password  = module.database.db_master_password
  sslmode   = "require"
  superuser = false
}
