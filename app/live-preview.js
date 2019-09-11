import FS, { WriteStream } from "fs";
import { Writable } from "stream";

class LivePreview{
	constructor(cam, root, framerate = 20){
		this.cam = cam;
		this.root = root;
		this.run = false;
		this.timePerImg = 1000/framerate;

		let canvasElem = document.createElement('canvas');
		this.root.innerHTML = "";
		this.root.appendChild(canvasElem);
		this.ctx = canvasElem.getContext("2d");
		this.tmpImage = document.createElement('img');
	}
	takePreview(){
		return new Promise((res,rej)=>this.cam.takePicture ({ keep: true, preview: true, targetPath: "/tmp/liveimg.XXXXXX" }, function (error, data) {
			if(error)
				rej(error); 
			else
				res(data);
		}));
	}
	async previewInterval(){
		if(this.run){
			let timePrev = process.hrtime();
			
			let fpath = await this.takePreview();
			FS.readFile(fpath, (err,d)=>{
				if(err)
					return console.log(err);
				FS.unlink(fpath, ()=>{});
				let blob = new Blob([d], {type: "image/jpeg"});
				let url = URL.createObjectURL(blob);
				this.tmpImage.src = url
				this.tmpImage.onload = ()=>{
					this.ctx.drawImage(this.tmpImage,0,0)
					let timeDiff = process.hrtime(timePrev);
					let waitTime = this.timePerImg-(timeDiff[0]*1000+timeDiff[1]/1000000);
					if(waitTime <= 0)
						this.previewInterval()
					else
						setTimeout(()=>this.previewInterval(), waitTime);
				};
			});

		}
	}
	
	start(){
		this.run = true;
		this.ctx.canvas.width  = window.innerWidth;
  		this.ctx.canvas.height = window.innerHeight;
		this.previewInterval();
	}
	stop(){
		this.run = false;
	}
}

module.exports = LivePreview;
