var Tube = require('./tube');
var {
    Vector2,
    Vector3,
    PerspectiveCamera,
    WebGLRenderer,
    Scene
} = require('three');

var rad = deg => deg / 360 * Math.PI * 2;
var deg = rad => ( rad / ( Math.PI * 2 ) ) * 360;
var FOV = rad( 70 );

module.exports = ( element, depth ) => {
    
    element.classList.toggle( 'burberry-hero_touch', 'ontouchstart' in window );
    
    var canvas = element.querySelector( 'canvas' );
    var camera = new PerspectiveCamera( deg( FOV ), 1, .1, 1000 );
    var scene = new Scene();
    var renderer = new WebGLRenderer({ canvas });
    renderer.setClearColor( 0xffffff );
    var gl = renderer.getContext();
    gl.clearDepth( 0 );
    var tube = Tube.create( depth );
    scene.add( tube );
    
    var resize = ( width, height ) => {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize( width, height, false );
        var fovY = 1 / Math.tan( FOV / 2 );
        return new Vector2( ( width / height ) * fovY, fovY );
    }
    
    var center = new Vector3();
    
    var render = ({
        route,
        position,
        size,
        images,
        image,
        scale,
        cameraPosition,
        speed
    }) => {
        element.classList.toggle( 'burberry-hero_dragging', route === 'single' );
        tube.scale.copy( scale );
        camera.position.copy( cameraPosition );
        camera.lookAt( center );
        for ( var i = 0; i < speed; i++ ) Tube.update( tube, position, size, images[ image ].element );
        renderer.render( scene, camera );
    }
    
    return { resize, render, element: renderer.domElement };
}