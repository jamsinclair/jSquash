let fs = require('fs');
let jpegxr = require('./jpegxr.js');

jpegxr().then((codec) => {
    console.log(codec);
    let bytes = fs.readFileSync('samples/panel-hdr.jxr');
    let image = codec.decode(bytes);
    console.log(image);

    let floats = new Float32Array(image.bytes.buffer);
    let red_sum = 0.0;
    let green_sum = 0.0;
    let blue_sum = 0.0;
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            let i = x * 4 + y * image.width * 4;
            red_sum += floats[i];
            green_sum += floats[i + 1];
            blue_sum += floats[i + 2];
        }
    }
    let count = (image.width * image.height);
    let red_avg = red_sum / count;
    let green_avg = green_sum / count;
    let blue_avg = blue_sum / count;
    console.log('average red brightness: ' + red_avg);
    console.log('average green brightness: ' + green_avg);
    console.log('average blue brightness: ' + blue_avg);
});
