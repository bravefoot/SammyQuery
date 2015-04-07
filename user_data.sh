#!/bin/bash

# Setup environment variables
USER="ec2-user"; export USER
HOME="/home/$USER"; export HOME
REPO_DIR="${HOME}/SammyQuery"
BOOTSTRAP_SCRIPT="${REPO_DIR}/bootstrap.sh"

cd $HOME
yum install -y git

# grab github code and bootstrap from it
git clone https://github.com/bravefoot/SammyQuery.git $REPO_DIR
chmod +x $BOOTSTRAP_SCRIPT

# Bootstrap server
$BOOTSTRAP_SCRIPT > /tmp/bootstrap.log 2>&1

exit 0
