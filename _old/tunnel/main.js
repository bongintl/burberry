var updateFrag = require('./update.glsl')
var drawFrag = require('./draw.glsl');

var createShell = require("gl-now");
var createShader = require("gl-shader")
var createTexture = require("gl-texture2d")
var createFBO = require("gl-fbo")
var drawTriangle = require("a-big-triangle")

var vert = `
    attribute vec2 position;
    varying vec2 texCoord;
    void main() {
        gl_Position = vec4( position, 0., 1. );
        texCoord = vec2( 0.0, 1.0 ) + vec2( 0.5, -0.5 ) * ( position + 1.0 );
    }
`

var textureSizes = [ [ window.innerWidth * .25, window.innerWidth * .25 * 1.5 ], [ 667, 440 ], [ 300, 450] ];

var shell,
    drawShader,
    updateShader,
    textures,
    texIdx = 0,
    fbos,
    fbo = 0,
    mouse = [ 657, 498 ];

var img = document.querySelector('img');
img.style.position = 'fixed';
img.style.width = '20%';
img.style.zIndex = 2000;

window.addEventListener( 'mousemove', e => {
    mouse[ 0 ] = e.clientX;
    mouse[ 1 ] = e.clientY;
    img.style.transform = `translate(${ window.innerWidth - mouse[ 0 ] }px, ${ window.innerHeight - mouse[ 1 ] }px) translate(-50%, -50%)`
})

window.addEventListener( 'touchmove', e => {
    mouse[ 0 ] = e.touches[ 0 ].clientX;
    mouse[ 1 ] = e.touches[ 0 ].clientY;
})

// setInterval(() => {
//     texIdx = ( texIdx + 1 ) % textures.length;
// }, 3000 )

var size = () => [ shell.gl.drawingBufferWidth, shell.gl.drawingBufferHeight ];
var setLinearFilter = gl => texture => texture.minFilter = texture.magFilter = gl.LINEAR;

var init = images => {
    var gl = shell.gl;
    textures = images.map( image => createTexture( gl, image ) );
    textures.forEach( setLinearFilter( gl ) );
    fbos = [ createFBO( gl, size() ), createFBO( gl, size() ) ];
    fbos.map( fbo => fbo.color[ 0 ] ).forEach( setLinearFilter( gl ) );
    updateShader = createShader( gl, vert, updateFrag );
    drawShader = createShader( gl, vert, drawFrag );
    shell.on( 'tick', tick );
    shell.on( 'gl-render', render );
}

var tick = () => {
    var prevFBO = fbos[ fbo ];
    var currFBO = fbos[ fbo ^= 1 ];
    currFBO.bind();
    updateShader.bind();
    updateShader.uniforms.prev = prevFBO.color[0].bind()
    updateShader.uniforms.resolution = size();
    updateShader.uniforms.textureSize = textureSizes[ texIdx ];
    updateShader.uniforms.textureOffset = mouse;
    drawTriangle( shell.gl );
}

var render = () => {
    var gl = shell.gl;
    drawShader.bind();
    drawShader.uniforms.resolution = size();
    drawShader.uniforms.texture = textures[ texIdx ].bind( 0 )
    drawShader.uniforms.textureSize = textureSizes[ texIdx ];
    drawShader.uniforms.textureOffset = mouse;
    drawShader.uniforms.map = fbos[ fbo ].color[0].bind( 1 )
    drawTriangle( gl );
}

var loadImage = src => new Promise( resolve => {
    var img = new Image();
    img.onload = () => resolve( img );
    img.src = src;
});

Promise.all([
        loadImage('./lad.jpg'),
        loadImage('./cats.jpg'),
        loadImage('./lads.jpg')
    ])
    .then( images => {
        shell = createShell();
        shell.on("gl-init", () => init( images ) );
    })