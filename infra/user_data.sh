#!/bin/bash
set -eux

apt-get update -y
apt-get install -y docker.io docker-compose-plugin

systemctl enable docker
systemctl start docker

usermod -aG docker ubuntu