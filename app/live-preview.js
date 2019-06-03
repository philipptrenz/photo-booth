import FS from "fs";

class LivePreview{
	constructor(cam, root, framerate = 20){
		this.cam = cam;
		this.root = root;
		/*this.root1 = document.createElement("div");
		this.root1.className = "live";
		this.root2 = document.createElement("div");
		this.root2.className = "live";
		root.appendChild(this.root1);
		root.appendChild(this.root2);
		*/
		this.run = false;
		this.canvas = null;
		this.lastImgPath = null;
		this.timePerImg = 1000/framerate;
		this.count = 0;
	}
	setNewPic(data){
		// Use two divs to display image, this prevents flickering.
		let el = document.createElement("div");
		//el.src = "file://"+data;
		el.className = "live";
		el.style.backgroundImage = "url(file://"+data+")";
		this.root.prepend(el);
		this.count++;
		if(this.count > 2){
			this.root.removeChild(this.root.lastChild);
		}
	}
	takePreview(){
		return new Promise((res,rej)=>this.cam.takePicture ({ keep: true, preview: true, targetPath: "/tmp/liveimg.XXXXXX" }, function (error, data) {
			if(error)
				rej(error); 
			else
				res(data);
		}));
	}
	async refreshPreview(){
		try{
			let path = await this.takePreview();
			if(this.lastImgPath)
				FS.unlink(this.lastImgPath, ()=>{});
			this.lastImgPath = path;
			this.setNewPic(path);
		}catch(e){
			console.error(e)
		}
	}
	async previewInterval(){
		if(this.run){
			let timePrev = process.hrtime();
			await this.refreshPreview();
			let timeDiff = process.hrtime(timePrev);
			let waitTime = this.timePerImg-(timeDiff[0]*1000+timeDiff[1]/1000000);
			setTimeout(()=>{
				this.previewInterval()
			}, waitTime);
		}
	}
	start(){
		this.run = true;
		this.previewInterval();
	}
	stop(){
		this.run = false;
	}
}

module.exports = LivePreview;