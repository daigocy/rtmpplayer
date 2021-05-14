const http = require('http');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const os = require('os');
var OSType = os.platform();
const ffmpegPath =  path.join(__dirname, OSType == 'darwin' ? "../ffmpeg" : "../ffmpeg.exe");

http.createServer((request, response) => {
    response.setHeader('access-control-allow-origin', '*');
    var url = request.url;
    var params = {};
    let i = url.indexOf("?");
    if(i>=0) {
        let query = url.substring(i+1);
        query.split("&").forEach(keyValue => {
            let result = keyValue.split("=");
            if(result.length==2) {
                let [ key, value ] = result;
                value = decodeURIComponent(value);
                params[key] = value;
            }
        })
    }
    if(url.indexOf("/start")==0 && params.videoSource) {
        console.log("start pull",params.videoSource);
        let startTime = Date.now();
        let firstDataCome;
        let ffmpegCmd = ffmpeg()
        .input(params.videoSource)
        .setFfmpegPath(ffmpegPath)
        .nativeFramerate()
        .videoCodec('libx264')
        .size('640x360')
        .noAudio()
        // .audioCodec('aac')
        .format('flv')
        // .format('mp4')
        .fps(15)
        // .outputOptions('-movflags', 'frag_keyframe+empty_moov')
        let videoStream = ffmpegCmd.pipe();
        videoStream.on('data', (chunk) => {
            if(!firstDataCome) {
                console.log("firstDataCome after ", Date.now() - startTime);
                firstDataCome = true;
            }
        });
        videoStream.pipe(response);
        ffmpegCmd.on('error', function(err) {
            console.log('Ffmpeg has been killed',err);
        });
        request.on("close", () => {
            console.log('request closed');
            ffmpegCmd.kill();
        })
    }
    else {
        response.end("ok");
    }
}).listen(8888);


