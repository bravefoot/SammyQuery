#!/bin/bash

# Setup environment variables
USER="ec2-user"
HOME="/home/$USER"
SERVER_PORT="3080"
SECURE_PORT="3443"
REPO_DIR="${HOME}/SammyQuery"
UPDATE_SCRIPT="${REPO_DIR}/update.sh"

cd $HOME

NOW=$(date)
printf "%s\n" "$NOW"

# update system
yum update -y

git config core.fileMode false

# Set iptables routing so I don't have to run my web server with sudo
/sbin/iptables -t nat -I PREROUTING -p tcp --dport 80 -j REDIRECT --to-port $SERVER_PORT
/sbin/iptables -t nat -I PREROUTING -p tcp --dport 443 -j REDIRECT --to-port $SECURE_PORT

chmod +x $UPDATE_SCRIPT

$UPDATE_SCRIPT initial >> /tmp/update.log 2>&1
