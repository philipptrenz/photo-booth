#!/bin/bash
# /etc/init.d/photo-booth
### BEGIN INIT INFO
# Provides:          photo-booth
# Required-Start:    $ALL
# Required-Stop:     
# Default-Start:     2 3 4
# Default-Stop:      
# Short-Description: Start daemon at boot time
# Description:       Run photo booth at startup
### END INIT INFO

# run photo booth
#while true; do
xset -dpms ; xset s off # turn display power management off which causes display sleep
sudo startx /home/pi/photo-booth/node_modules/.bin/electron /home/pi/photo-booth/ -- -nocursor
#done
