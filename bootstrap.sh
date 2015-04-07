#!/bin/bash

USER="ec2-user"; export USER
HOME="/home/$USER"; export HOME
OPT_DIR="${HOME}/opt"
NVM_DIR="${OPT_DIR}/nvm"
REPO_DIR="${HOME}/SammyQuery"
REBOOT_SCRIPT="${REPO_DIR}/reboot.sh"
UPDATE_SCRIPT="${REPO_DIR}/update.sh"
REBOOT_CRON="@reboot ${REBOOT_SCRIPT} >> /tmp/reboot.log 2>&1"
UPDATE_CRON="* * * * * ${UPDATE_SCRIPT} >> /tmp/update.log 2>&1"

# install dependencies
yum install -y make gcc-c++ openssl-devel
mkdir $OPT_DIR

# update system
yum update -y

# user crontab to run this script on all startups
(crontab -u root -l; echo "$REBOOT_CRON" ) | crontab -u root -
(crontab -u root -l; echo "$UPDATE_CRON" ) | crontab -u root -

# install nvm
git clone https://github.com/creationix/nvm.git $NVM_DIR
source $NVM_DIR/nvm.sh
nvm install 0.10

# Launch server
chmod +x $REBOOT_SCRIPT

$REBOOT_SCRIPT >> /tmp/reboot.log 2>&1
