module "ecr_web" {
  source          = "./modules/ecr"
  repository_name = "sample-app-web"
}

module "ecr_api" {
  source          = "./modules/ecr"
  repository_name = "sample-app-api"
}

module "network" {
  source = "./modules/network"
}

module "database" {
  source     = "./modules/database"
  vpc_id     = module.network.vpc_id
  subnet_ids = module.network.public_subnet_ids
  vpc_cidr   = "10.0.0.0/16"
}

module "iam" {
  source = "./modules/iam"
}

module "log_web" {
  source            = "./modules/logs"
  name              = "/ecs/sample-app-web"
  retention_in_days = 7
}

module "log_api" {
  source            = "./modules/logs"
  name              = "/ecs/sample-app-api"
  retention_in_days = 7
}

module "log_keycloak" {
  source            = "./modules/logs"
  name              = "/ecs/sample-app-keycloak"
  retention_in_days = 7
}

module "ecs_cluster" {
  source = "./modules/ecs-cluster"
  name   = "sample-app-cluster"
}

module "security" {
  source = "./modules/security"
  vpc_id = module.network.vpc_id
}
