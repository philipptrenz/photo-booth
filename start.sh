#!/bin/bash

# run photo booth and restart for the case it crashes
#while true; do
xset -dpms ; xset s off # turn display power management off which causes display sleep
sudo startx /home/pi/photo-booth/node_modules/.bin/electron /home/pi/photo-booth/ -- -nocursor
#done
