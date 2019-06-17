var EventEmitter = require('events');
var { Vector2, Vector3 } = require( 'three' );
var loadImage = require('./utils/loadImage');
var loadVideo = require('./utils/loadVideo');
var sequence = require('./utils/sequence');
var tween = require('./utils/tween');

var DELAY = 1500;
var TRANSITION = 1000;
var duration = img => img.type === 'video' ? Math.max( img.element.duration * 1000, DELAY ) : DELAY

var wait = delay => new Promise( resolve => setTimeout( resolve, delay ) );
var nextEvent = ( emitter, event ) => new Promise( resolve => emitter.once( event, resolve ) );

var fit = ( size, viewport, x = 1 ) => {
    var scale = Math.min( viewport.x / size.x, viewport.y / size.y );
    return size.clone().multiplyScalar( scale * x );
}

var pathGet = ( obj, path ) => path.split('.').reduce( ( obj, key ) => obj[ key ], obj );
var pathSetter = ( obj, path ) => {
    var parts = path.split('.');
    var ref = parts.length === 1 ? obj : pathGet( obj, parts.slice( 0, -1 ).join('.') );
    var key = parts[ parts.length - 1 ];
    return value => ref[ key ] = value;
}

var loadAsset = asset => asset.type === 'video' ? loadVideo( asset.src ) : loadImage( asset.src )

var getSize = element => {
    if ( element instanceof HTMLVideoElement ) {
        return new Vector2( element.videoWidth, element.videoHeight );
    } else if ( element instanceof HTMLImageElement ) {
        return new Vector2( element.naturalWidth, element.naturalHeight );
    }
}

var zero = new Vector2();

module.exports = () => {
    
    var tweenState = ( props, duration ) => {
        Object.keys( props ).map( path => {
            tween({
                name: `state:${ path }`,
                from: pathGet( state, path ),
                to: props[ path ],
                duration,
                onProgress: pathSetter( state, path )
            })
        })
    }
    
    var state = {
        route: null,
        viewport: null,
        position: new Vector2(),
        size: new Vector2(),
        image: -1,
        scale: new Vector3( 1, 1, 1 ),
        cameraPosition: new Vector3( 0, 0, 1 ),
        speed: 1,
        mouse: new Vector2(),
        mouseInfluence: 0
    };
    var emitter = new EventEmitter();
    
    emitter.on( 'resize', vp => state.viewport = vp );
    emitter.on( 'load', imgs => {
        state.images = imgs.map( img => ({
            src: img.src,
            element: null,
            loaded: false,
            type: img.src.endsWith( '.mp4' ) ? 'video' : 'image',
            size: new Vector2( 2, 3 )//img.size ? new Vector2( ...img.size ) : null
        }));
        sequence( state.images.map( ( img, i ) => () => loadAsset( img )
            .then( element => {
                img.element = element;
                if ( img.size === null ) img.size = getSize( element );
                img.loaded = true;
                emitter.emit( 'imageLoaded', i );
            })
        ))
    });
    emitter.on( 'start', () => {
        emitter.emit( 'route', 'home' );
        var updateMouse = ({ x, y }) => state.mouse.set( x, y ).multiply( state.viewport ).multiplyScalar( .5 )
        emitter.on( 'mousemove', updateMouse );
        emitter.on( 'touchmove', updateMouse );
    })
    emitter.on( 'route', ( name, ...args ) => {
        if ( state.route ) emitter.emit( state.route + ':exit', ...args );
        state.route = name;
        emitter.emit( name + ':enter', ...args );
    })
    var running;
    emitter.on( 'home:enter', () => {
        if ( !running ) emitter.emit( 'nextImage' );
        emitter.once( 'click', () => emitter.emit( 'route', 'single', state.image ) );
        emitter.once( 'touchstart', () => emitter.emit( 'route', 'single', state.image ) );
        tweenState( { mouseInfluence: 0, 'scale.z': 1 }, TRANSITION );
    })
    emitter.on( 'nextImage', () => {
        if ( state.route !== 'home' ) {
            running = false;
            return;
        };
        running = true;
        state.image = ( state.image + 1 ) % state.images.length;
        state.size = fit( state.images[ state.image ].size, state.viewport, .6 );
        var next = ( state.image + 1 ) % state.images.length;
        Promise.all([
            wait( duration( state.images[ state.image ] ) ),
            !state.images[ next ].loaded && nextEvent( emitter, 'imageLoaded' )
        ]).then( () => emitter.emit( 'nextImage' ) )
    });
    emitter.on( 'single:enter', i => {
        state.image = i;
        tweenState( { mouseInfluence: 1, 'scale.z': 1 }, TRANSITION );
        emitter.once( 'touchend', () => emitter.emit( 'route', 'home' ) );
        emitter.once( 'click', () => emitter.emit( 'route', 'home' ) );
    })
    emitter.on( 'tick', () => {
        state.position.lerpVectors( zero, state.mouse, state.mouseInfluence );
        // state.cameraPosition.x = state.mouse.x * .5;
        // state.cameraPosition.y = state.mouse.y * .5;
    })
    
    return { state, emitter };
    
}