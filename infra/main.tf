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
