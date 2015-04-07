#!/bin/bash
# TODO: I get a permission denied when the cron tries to run this script in the ec2-instance
# Setup environment variables
USER="ec2-user"; export USER
HOME="/home/$USER"; export HOME
REPO_DIR="${HOME}/SammyQuery"
SRC_DIR="${REPO_DIR}/src"
OPT_DIR="${HOME}/opt"
NVM_DIR="${OPT_DIR}/nvm"
REBOOT_SCRIPT="${REPO_DIR}/reboot.sh"
UPDATE_SCRIPT="${REPO_DIR}/update.sh"

QUERIER_PORT="3080"
COORDINATOR_PORT="3081"
AMAZON_PORT="3082"
SPOTIFY_PORT="3083"

COORDINATOR_SCRIPT="${SRC_DIR}/coordinator/coordinator.js"
QUERIER_SCRIPT="${SRC_DIR}/querier/app.js"
AMAZON_SCRIPT="${SRC_DIR}/amazon/module.js"
SPOTIFY_SCRIPT="${SRC_DIR}/spotify/module.js"


NOW=$(date)
printf "%s\n" "$NOW"

INITIAL_LAUNCH=$1

cd $REPO_DIR

# Fetch and compare with remote repository
git fetch --all
NEEDS_UPDATE=$(git diff origin master)

if [ -n "$NEEDS_UPDATE" ] || [ -n "$INITIAL_LAUNCH" ]; then
	# kill running node.js processes
	/sbin/fuser -k "${COORDINATOR_PORT}/tcp"
	/sbin/fuser -k "${QUERIER_PORT}/tcp"
	/sbin/fuser -k "${AMAZON_PORT}/tcp"
	/sbin/fuser -k "${SPOTIFY_PORT}/tcp"

	# Update repository
	git reset --hard origin/master
	chmod +x $REBOOT_SCRIPT
	chmod +x $UPDATE_SCRIPT

	# Switch to non-root user
	su $USER

	# Init node
	source $NVM_DIR/nvm.sh
	nvm use 0.10

	# Launch server
	npm install
	node $COORDINATOR_SCRIPT $COORDINATOR_PORT &
	node $QUERIER_SCRIPT $QUERIER_PORT &
	node $AMAZON_SCRIPT $AMAZON_PORT &
	node $SPOTIFY_SCRIPT $SPOTIFY_PORT &
fi
