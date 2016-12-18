#!/bin/bash

# This script copies files from my homedirectory into the webserver directory.
# (use scp and SSH keys for a remote directory)
# A new directory is created every hour.

BOOTH=~/photo-booth

while true; do
	/home/pi/photo-booth/node_modules/.bin/electron /home/pi/photo-booth
	sleep 1
done
