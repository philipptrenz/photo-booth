#!/usr/bin/env python

from __future__ import print_function

import os
import sys
import time
from os.path import expanduser

import gphoto2 as gp
from PIL import Image

def main():

     # open camera connection
    context = gp.gp_context_new()
    camera = gp.check_result(gp.gp_camera_new())
    gp.check_result(gp.gp_camera_init(camera, context))

    file_path = gp.check_result(gp.gp_camera_capture(
        camera, gp.GP_CAPTURE_IMAGE, context))
    now = time.localtime()

    home = expanduser("~")
    myfolder = 'photo-booth-images'
    mysubfolder = filename = time.strftime("%Y%m%d", now)
    filename = time.strftime("%Y%m%d-%H:%M:%S", now)

    mypath = os.path.join(home, myfolder, mysubfolder)
    if not os.path.exists(mypath):
        os.makedirs(mypath)
    target = os.path.join(mypath, filename)
    
    camera_file = gp.check_result(gp.gp_camera_file_get(
            camera, file_path.folder, file_path.name,
            gp.GP_FILE_TYPE_NORMAL, context))
    gp.check_result(gp.gp_file_save(camera_file, target+'.jpg'))
    gp.check_result(gp.gp_camera_exit(camera, context))


    # scale image
    basewidth = 1500 #px
    img = Image.open(target+'.jpg')
    wpercent = (basewidth / float(img.size[0]))
    hsize = int((float(img.size[1]) * float(wpercent)))
    img = img.resize((basewidth, hsize), Image.ANTIALIAS)
    img.save(target+'_small.jpg')

    print(target+'_small.jpg')
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

