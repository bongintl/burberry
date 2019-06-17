var DEPTH = 3;
var DEPTH_BUFFER_SIZE = 512;

var {
    BufferGeometry,
    BufferAttribute,
    MeshBasicMaterial,
    BackSide,
    DoubleSide,
    GreaterDepth,
    Mesh,
    TextureLoader,
    PerspectiveCamera,
    WebGLRenderer,
    Scene
} = require('three');

var camera = new PerspectiveCamera( 70, window.innerWidth / window.innerHeight, .1, 1000 );
var scene = new Scene();
var renderer = new WebGLRenderer();
// var gl = renderer.getContext();
// gl.clearDepth( 0 );
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
var loader = new TextureLoader();


var geometry = new BufferGeometry();
var verts = new Float32Array([
    -.5, .5, 0,
    .5, .5, 0,
    .5, -.5, 0
])
var norms = new Float32Array([
    0, 0, 1,
    0, 0, 1,
    0, 0, 1
])
var colors = new Float32Array([
    1, 1, 1,
    1, 1, 1,
    1, 1, 1
])
geometry.addAttribute( 'position', new BufferAttribute( verts, 3 ) );
geometry.addAttribute( 'normal', new BufferAttribute( norms, 3 ) );
geometry.addAttribute( 'color', new BufferAttribute( colors, 3 ) );
// var geometry = new BoxBufferGeometry( 1, 1, DEPTH, 1, 1, DEPTH_BUFFER_SIZE );

var material1 = new MeshBasicMaterial({
    // map: loader.load( '/img/lad.jpg' ),
    color: 0xffffff,
    side: DoubleSide,
    // depthFunc: GreaterDepth
});
var material2 = new MeshBasicMaterial({
    color: 0xff0000,
    side: BackSide,
    depthFunc: GreaterDepth
})
var cube = new Mesh( geometry, material1 );

// var basePositions = new Float32Array( geometry.getAttribute('position').array );

var eachBuffer = ( buffer, stride, fn ) => {
    var i, j, v = new buffer.constructor( stride );
    for ( i = 0; i < buffer.length; i += stride ) {
        for ( j = 0; j < stride; j++ ) {
            v[ j ] = buffer[ i + j ];
        }
        fn( v, i );
    }
}
var writeBuffer = ( buffer, offset, v ) => {
    for ( var i = 0, l = v.length; i < l; i++ ) buffer[ offset + i ] = v[ i ];
}
var mapBuffer = ( buffer, stride, fn ) => {
    eachBuffer( buffer, stride, ( v, i ) => {
        writeBuffer( buffer, i, fn( v, i ) );
    })
}
var fill = ( Type, len, stride, fn ) => {
    var arr = new Type( len );
    if ( fn ) mapBuffer( arr, stride, fn );
    return arr;
}
var Queue = ( Type, len, stride, fn ) => {
    var buf = fill( Type, len, stride, fn );
    var idx = 0;
    return {
        push: v => {
            idx = ( idx + stride ) % buf.length;
            writeBuffer( buf, idx, v );
        },
        get: ( i = 0 ) => {
            var from = ( idx + i * stride ) % len;
            return buf.slice( from, from + stride );
        }
    }
}
var map = ( x, inMin, inMax, outMin, outMax ) => {
    return outMin + ( x - inMin ) / ( inMax - inMin ) * ( outMax - outMin );
}

camera.position.z = 5;

var mouse = [ 0, 0 ];
var mouses = [];
for ( var i = 0; i < DEPTH_BUFFER_SIZE; i++ ) mouses.push( [ 0, 0 ] );

window.addEventListener( 'mousemove', e => mouse = [ e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight ] );

console.log(geometry)

var tick = () => {
    // mouses.unshift( mouse );
    // mouses.pop();
    // var now = Date.now() / 1000;
    // var ps = geometry.getAttribute('position');
    // mapBuffer( ps.array, 3, ([ x, y, z ], i ) => {
    //     var baseX = basePositions[ i ];
    //     var baseY = basePositions[ i + 1 ];
    //     var idx = Math.floor( map( z, -DEPTH / 2, DEPTH / 2, 0, DEPTH_BUFFER_SIZE - 1 ) );
    //     var [ dx, dy ] = mouses[ idx ]
    //     return [ baseX + dx, baseY + dy, z ];
    // })
    // ps.needsUpdate = true;
    renderer.render( scene, camera );
    requestAnimationFrame( tick );
}
tick();