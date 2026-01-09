locals {
  private_subnet_ids = data.terraform_remote_state.core.outputs.private_subnet_ids
  backend_sg_id      = data.terraform_remote_state.core.outputs.backend_security_group_id
  alb_listener_arn   = data.terraform_remote_state.core.outputs.alb_listener_http_arn
  cluster_name       = data.terraform_remote_state.core.outputs.ecs_cluster_name
  db_secret_arn      = data.terraform_remote_state.core.outputs.db_secret_arn
  vpc_id             = data.terraform_remote_state.core.outputs.vpc_id
}