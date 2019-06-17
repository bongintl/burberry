var loadImage = require('./utils/loadImage');
var { shell, render } = require('./renderer');

var line = [ window.innerWidth * .1, window.innerHeight * .1, window.innerWidth * .1, window.innerHeight * .1 ];
var mouse = [ window.innerWidth * .5, window.innerHeight * .5 ];

var defaults = {
    decay: 0,
    gridOpacity: 1,
    gridScale: 10
}

var lerp = ( a, b, t ) => ( b - a ) * t + a;

var lerpLine = point => [
    line[ 2 ],
    line[ 3 ],
    lerp( line[ 2 ], point[ 0 ], .1 ),
    lerp( line[ 3 ], point[ 1 ], .1 )
];

window.addEventListener('mousemove', e => {
    mouse = [ e.clientX, e.clientY ];
})

var BORDER_SIZE = .1;
var border = imgs => new Promise( resolve => {
    var main = document.querySelector('main');
    var tick = () => {
        line = lerpLine( mouse.map( x => x * BORDER_SIZE * 2 ) );
        main.style.transform = `translate(${ line[ 2 ] }px, ${ line[ 3 ] }px)`
        var ww = window.innerWidth;
        var wh = window.innerHeight;
        var w = ww * ( 1 - BORDER_SIZE * 2 );
        var h = wh * ( 1 - BORDER_SIZE * 2 );
        render( Object.assign( {}, defaults, {
            zoom: 1.005,
            texture: imgs[ 0 ],
            textureSize: [ w, h ],
            textureOpacity: 0,
            center: [ line[ 2 ] / ww * 5, 1 - line[ 3 ] / wh * 5 ],
            gridColor1: [ 0, 0, 0, 1 ],
            gridColor2: [ 1, 1, 0, 1 ],
            line,
            resolution: [ ww, wh ]
        }))
    }
    shell.on( 'gl-render', tick );
    window.addEventListener( 'click', () => {
        shell.removeListener('gl-render', tick );
        main.style.display = 'none';
        resolve( imgs )
    });
})

var clamp = ( x, min, max ) => Math.min( Math.max( x, min ), max );

var cycle = imgs => {
    var i = 0;
    var tick = () => {
        var ww = window.innerWidth;
        var wh = window.innerHeight;
        var img = imgs[ i ];
        var w = img.naturalWidth;
        var h = img.naturalHeight;
        line = lerpLine([
            clamp( mouse[ 0 ], w / 2, ww - w / 2 ),
            clamp( mouse[ 1 ], h / 2, wh - h / 2 ),
        ]);
        render( Object.assign( {}, defaults, {
            zoom: 1.0005,
            texture: img,
            textureSize: [ w, h ],
            textureOpacity: 1,
            center: [ .5, .5 ],
            gridColor1: [ 0, 0, 0, 0 ],
            gridColor2: [ 0, 0, 0, 0 ],
            line: line.map( ( x, i ) => i % 2 ? x - h / 2 : x - w / 2 ),
            resolution: [ ww, wh ]
        }))
    }
    window.addEventListener('click', e => i = ++i % imgs.length )
    shell.on( 'gl-render', tick );
}

Promise.all([
    './img/lad.jpg',
    './img/ladies.jpeg',
    './img/cats.jpg'
].map( loadImage ))
    .then( border )
    .then( cycle )