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

module "service_discovery" {
  source = "./modules/service-discovery"
  vpc_id = module.network.vpc_id
}

module "ecs_api" {
  source               = "./modules/ecs-service"
  name                 = "sample-app-api"
  cluster_id           = module.ecs_cluster.cluster_id
  image                = "${module.ecr_api.repository_url}:latest"
  cpu                  = 256
  memory               = 512
  container_port       = 3001
  execution_role_arn   = module.iam.execution_role_arn
  task_role_arn        = module.iam.task_role_arn
  log_group_name       = module.log_api.name
  region               = "ap-northeast-1"
  subnet_ids           = module.network.public_subnet_ids
  security_group_ids   = [module.security.api_sg_id]
  service_registry_arn = module.service_discovery.api_service_arn

  environment = [
    { name = "KEYCLOAK_ISSUER", value = "http://keycloak.sample-app.local:8080/realms/sample-app" },
  ]
}

module "alb_web" {
  source             = "./modules/alb"
  name               = "sample-app-web-alb"
  vpc_id             = module.network.vpc_id
  subnet_ids         = module.network.public_subnet_ids
  security_group_ids = [module.security.alb_sg_id]
  target_port        = 3000
  health_check_path  = "/"
}

module "alb_keycloak" {
  source             = "./modules/alb"
  name               = "sample-app-keycloak-alb"
  vpc_id             = module.network.vpc_id
  subnet_ids         = module.network.public_subnet_ids
  security_group_ids = [module.security.alb_sg_id]
  target_port        = 8080
  health_check_path  = "/realms/sample-app/.well-known/openid-configuration"
}
