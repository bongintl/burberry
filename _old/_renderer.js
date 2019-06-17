var glslify = require('glslify');
var createShell = require("gl-now");
var createShader = require("gl-shader")
var createTexture = require("gl-texture2d")
var createFBO = require("gl-fbo")
var fillScreen = require("a-big-triangle")

var vert = glslify.file('./shaders/vert.glsl');
var bleedFrag = glslify.file('./shaders/bleed.glsl');
var uvFrag = glslify.file('./shaders/uv.glsl');
var drawFrag = glslify.file('./shaders/draw.glsl');

var shell = createShell();
shell.preventDefaults = false;
shell.on('gl-init', () => {
    shell.element.removeAttribute('style');
    shell.element.classList.add('shell');
})

var size = () => [ shell.gl.drawingBufferWidth, shell.gl.drawingBufferHeight ];

var isObject = x => x !== null && typeof x === 'object';

var textures = new WeakMap();
var getTexture = img => {
    if ( !textures.has( img ) ) {
        var texture = createTexture( shell.gl, img );
        texture.minFilter = texture.magFilter = shell.gl.LINEAR;
        textures.set( img, texture );
        console.log( textures.get( img ) );
    }
    return textures.get( img );
}
var isTexture = x => isObject( x ) && x.handle instanceof WebGLTexture;
var ensureTexture = uniform => {
    if ( uniform instanceof HTMLImageElement ) return getTexture( uniform );
    if ( isFBO( uniform ) ) return uniform.color[ 0 ];
    return uniform;
}

var shaders = {};
var getShader = frag => {
    if ( !shaders[ frag ] ) {
        shaders[ frag ] = createShader( shell.gl, vert, frag );
    }
    return shaders[ frag ];
}

var draw = ( frag, uniforms, fbo ) => {
    if ( fbo ) {
        fbo.bind();
    } else {
        shell.gl.bindFramebuffer( shell.gl.FRAMEBUFFER, null );
    }
    var shader = getShader( frag );
    shader.bind();
    for ( var key in uniforms ) {
        uniforms[ key ] = ensureTexture( uniforms[ key ] );
    }
    var textures = 0;
    for ( var key in uniforms ) {
        var u = uniforms[ key ];
        shader.uniforms[ key ] = isTexture( u ) ? u.bind( textures++ ) : u;
    }
    fillScreen( shell.gl );
}

var fbos = {};
var initFBO = key => {
    var fbo = createFBO( shell.gl, size() );
    var tex = fbo.color[ 0 ];
    tex.magFilter = tex.minFilter = shell.gl.LINEAR;
    fbos[ key ] = fbo;
    console.log( fbos[ key ] );
}
var isFBO = x => isObject( x ) && x.handle instanceof WebGLFramebuffer;

shell.on( 'gl-init', () => initFBO( 'free' ) );
shell.on( 'resize', ( w, h ) => {
    Object.keys( fbos ).forEach( key => fbos[ key ].shape = [ w, h ] )
})
var drawFBO = ( shader, uniforms ) => {
    if ( !fbos[ shader ] ) initFBO( shader );
    var prev = fbos[ shader ];
    var dest = fbos.free;
    draw( shader, Object.assign( { prev }, uniforms ), dest );
    fbos[ shader ] = dest;
    fbos.free = prev;
    return dest;
}

var render = uniforms => {
    var bleed = drawFBO( bleedFrag, uniforms );
    var uv = drawFBO( uvFrag, uniforms );
    draw( drawFrag, Object.assign({ bleed, uv }, uniforms ));
}

// shell.on('gl-init')

module.exports = { shell, render };