#!/bin/bash

# run photo booth and restart for the case it crashes
#while true; do
sudo startx /home/pi/photo-booth/node_modules/.bin/electron /home/pi/photo-booth/ -- -nocursor
#done
