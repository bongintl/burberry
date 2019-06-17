module.exports = src => new Promise( resolve => {
    var video = document.createElement( 'video' );
    video.addEventListener( 'canplaythrough', () => {
        resolve( video )
    });
    video.src = src;
    video.loop = true;
    video.muted = true;
    video.setAttribute('playsinline', 'playsinline');
    video.setAttribute('webkit-playsinline', 'webkit-playsinline');
    video.load();
    // video.play();
})