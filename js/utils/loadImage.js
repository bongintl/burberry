/* global Image */

module.exports = src => new Promise( resolve => {
    var img = new Image();
    img.onload = () => resolve( img );
    img.src = src;
});