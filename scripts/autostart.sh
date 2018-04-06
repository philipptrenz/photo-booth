#!/bin/bash
# /etc/init.d/photo-booth
### BEGIN INIT INFO
# Provides:          photo-booth
# Required-Start:    $ALL
# Required-Stop:     
# Default-Start:     2 3 4
# Default-Stop:      
# Short-Description: A photo-booth software
# Description:       Run photo-booth at startup
### END INIT INFO

# run photo-booth
sudo /home/pi/photo-booth/node_modules/.bin/electron /home/pi/photo-booth/
