#!/bin/bash

# run photo booth and restart for the case it crashes
while true; do
	sudo startx ~/photo-booth/node_modules/.bin/electron ~/photo-booth/ -- -nocursor
done
