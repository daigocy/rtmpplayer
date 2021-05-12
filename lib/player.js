class RtmpPlayer{
    constructor(dom) {
        this.border = dom;
        this.video = document.createElement("video");
        this.border.appendChild(this.video);
    }
    play(videoSource) {
        var flvjs = require("flv.js");
        let flvPlayer = this.flvPlayer = flvjs.createPlayer({
            type: 'flv',
            url: 'http://127.0.0.1:8888/start?videoSource=' + encodeURIComponent(videoSource)
        });
        flvPlayer.attachMediaElement(this.video);
        flvPlayer.load();
        this.video.play();
    }

    destroy() {
        if(this.flvPlayer) {
            this.flvPlayer.unload();
            this.flvPlayer.detachMediaElement();
            this.flvPlayer.destroy();
            this.flvPlayer = undefined;
        }
        if(this.video) {
            this.border.removeChild(this.video);
            this.video = undefined;
        }
    }
}

module.exports = {
    RtmpPlayer
}