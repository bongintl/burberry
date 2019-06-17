var Renderer = require('./renderer');
var State = require('./state');
var tween = require('./utils/tween');

var DEPTH = 200;

var element = document.querySelector( '.burberry-hero' );

var renderer = Renderer( element, DEPTH );
var { state, emitter } = State();

var bind = event => {
    element.addEventListener( event, e => {
        if ( e.target !== element ) return;
        e.preventDefault();
        var { clientX: x, clientY: y } = e.touches && e.touches.length ? e.touches[ 0 ] : e;
        x = ( x / window.innerWidth * 2 ) - 1;
        y = -( ( y / window.innerHeight * 2 ) - 1 );
        emitter.emit( event, { x, y });
    })
}

bind( 'click' );
bind( 'mousemove' );
bind( 'touchmove' );
bind( 'touchstart' );
bind( 'touchend' );

var DPR = window.innerWidth < 1024 ? window.devicePixelRatio || 1 : 1;
var onResize = () => {
    var { width, height } = element.getBoundingClientRect();
    emitter.emit( 'resize', renderer.resize( width * DPR, height * DPR ) );
}

window.addEventListener( 'resize', onResize )

var tick = () => {
    emitter.emit( 'tick' );
    renderer.render( state );
    requestAnimationFrame( tick );
}

emitter.emit( 'load', [ ...element.querySelectorAll('img') ].map( ({ src }) => ({ src })) );
emitter.once( 'imageLoaded', () => {
    // document.body.appendChild( renderer.element );
    onResize();
    emitter.emit('start');
    tick();
});

var link = element.querySelector('.burberry-hero__link');
link.addEventListener( 'click', () => tween({
    name: 'scroll',
    from: window.pageYOffset,
    to: window.pageYOffset + element.getBoundingClientRect().bottom,
    duration: 500,
    onProgress: x => window.scrollTo( 0, x )
}))

// var list = [ ...document.querySelectorAll('li') ].slice( 1 );
// var img = 0;
// list.forEach( ( li, i ) => {
//     li.addEventListener( 'click', e => {
//         e.stopPropagation();
//         emitter.emit('route', 'single', i )
//     })
// })
// emitter.on('nextImage', () => {
//     list[ img ].classList.remove('active');
//     list[ state.image ].classList.add('active');
//     img = state.image;
// })