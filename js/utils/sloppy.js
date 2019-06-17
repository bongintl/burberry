// x = value
// y = time

var TAU = Math.PI * 2;
var crt = x => x < 0 ? -Math.pow( -x, 1/3 ) : Math.pow( x, 1/3 );
var clamp = ( x, min, max ) => Math.max( Math.min( x, max ), min );
var minIndex = xs => xs.indexOf( Math.min( ...xs ) );
var closest = ( xs, to ) => xs[ minIndex( xs.map( x => Math.abs( x - to ) ) ) ]

var intersect = ( curve, t ) => {
    var pa = curve[ 0 ].y - t,
        pb = curve[ 1 ].y - t,
        pc = curve[ 2 ].y - t,
        pd = curve[ 3 ].y - t,
        d = ( -pa + 3 * pb - 3 * pc + pd ),
        a = ( 3 * pa - 6 * pb + 3 * pc) / d,
        b = ( -3 * pa + 3 * pb ) / d,
        c = pa / d,
        p = ( 3 * b - a * a ) / 3,
        p3 = p / 3,
        q = ( 2 * a * a * a - 9 * a * b + 27 * c ) / 27,
        q2 = q / 2,
        discriminant = q2 * q2 + p3 * p3 * p3;
    if ( discriminant < 0 ) {
        var mp3 = -p / 3,
            mp33 = mp3 * mp3 * mp3,
            r = Math.sqrt( mp33 ),
            t0 = -q / ( 2 * r ),
            cosphi = clamp( t0, -1, 1 ),
            phi = Math.acos( cosphi ),
            crtr = crt( r ),
            t1 = 2 * crtr,
            ts = [
                t1 * Math.cos( phi / 3 ) - a / 3,
                t1 * Math.cos( ( phi + TAU ) / 3 ) - a / 3,
                t1 * Math.cos( ( phi + 2 * TAU ) / 3 ) - a / 3
            ];
        return closest( ts, .5 );
    } else {
        var sd = Math.sqrt( discriminant ),
            u1 = crt( -q2 + sd ),
            v1 = crt( q2 + sd );
        return u1 - v1 - a / 3;
    }
}

var compute = ( curve, t ) => {
    var mt = 1 - t,
        mt2 = mt * mt,
        t2 = t * t,
        a = mt2 * mt,
        b = mt2 * t * 3,
        c = mt * t2 * 3,
        d = t * t2;
    return {
        x: a * curve[ 0 ].x + b * curve[ 1 ].x + c * curve[ 2 ].x + d * curve[ 3 ].x,
        y: a * curve[ 0 ].y + b * curve[ 1 ].y + c * curve[ 2 ].y + d * curve[ 3 ].y
    }
}

var lerp = ( a, b, t ) => a + ( b - a ) * t;
var lerpVectors = ( v1, v2, t ) => ({ x: lerp( v1.x, v2.x, t ), y: lerp( v1.y, v2.y, t ) });
var pairwise = ( arr, fn ) => {
    for ( var i = 0, l = arr.length - 1; i < l; i++ )
        fn( arr[ i ], arr[ i + 1 ] );
}
var hull = ( pts, t ) => {
    if ( pts.length === 1 ) return pts;
    var h = [];
    pairwise( pts, ( p1, p2 ) => h.push( lerpVectors( p1, p2, t ) ) );
    return h.concat( hull( h, t ) );
}

var Sloppy = ( initialValue, { smoothing = 0, speed = 1 } = {} ) => {
    
    var curve = [
        { x: initialValue, y: 0 },
        { x: initialValue, y: 0 },
        { x: initialValue, y: 0 }, 
        { x: initialValue, y: 0 }
    ];
    
    var startTime = Date.now();
    
    var get = ( t = Date.now() - startTime ) => {
        var t0 = curve[ 0 ];
        var t1 = curve[ 3 ];
        if ( t >= t1.y ) return t1.x;
        if ( t >= t0.y ) return compute( curve, intersect( curve, t ) ).x;
        return t0.x;
    }
    
    var to = ( value, duration ) => {
        if ( duration === undefined ) duration = Math.abs( value - get() ) / speed;
        var t = Date.now() - startTime;
        var t0 = curve[ 0 ];
        var t1 = curve[ 3 ];
        var p0, cp0,
            cp1 = { x: value, y: t + duration * ( 1 - smoothing ) },
            p1 = { x: value, y: t + duration };
        if ( t >= t0.y && t < t1.y ) {
            var h = hull( curve, intersect( curve, t ) )
            p0 = h[ 5 ];
            cp0 = h[ 4 ];
        } else {
            p0 = { x: curve[ 3 ].x, y: t };
            cp0 = { x: p0.x, y: t + duration * smoothing };
        }
        curve = [ p0, cp0, cp1, p1 ];
    }
    
    var c = () => curve
    
    return { get, to, c };
    
}

var Sloppy2D = ( x, y, speed = .5 ) => {
    x = Sloppy( x );
    y = Sloppy( y );
    var get = t => ({ x: x.get( t ), y: y.get( t ) });
    var to = ( vx, vy, duration ) => {
        if ( duration === undefined ) {
            duration = Math.max(
                Math.abs( vx - x.get() ) / speed,
                Math.abs( vy - y.get() ) / speed
            );
        }
        return {
            x: x.to( vx, duration ),
            y: y.to( vy, duration )
        }
    }
    return { get, to };
}

module.exports = { Sloppy, Sloppy2D };

var canvas = document.createElement('canvas')
var ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild( canvas );
var startTime = Date.now();
var mouse = Sloppy2D( 0, 0 );
var paths = [];
window.addEventListener( 'mousemove', e => {
    mouse.to( e.clientX, e.clientY );
    var now = Date.now() - startTime;
    var path = [];
    for ( var i = now; i < now + 2000; i += 10 ) {
        path.push([ mouse.get( i ).x, mouse.get( i ).y ]);
    }
    // paths.push( path );
});
var drawCurve = curve => {
    var [ p0, cp0, cp1, p1 ] = curve;
    ctx.beginPath();
    ctx.moveTo( p0.x, p0.y / 20 );
    ctx.bezierCurveTo( cp0.x, cp0.y / 20, cp1.x, cp1.y / 20, p1.x, p1.y / 20 );
    ctx.moveTo( p0.x, p0.y / 20 );
    ctx.lineTo( cp0.x, cp0.y / 20 );
    ctx.moveTo( cp1.x, cp1.y / 20 );
    ctx.lineTo( p1.x, p1.y / 20 );
    ctx.stroke();
}
var drawPaths = () => {
    ctx.beginPath();
    paths.forEach( points => {
        ctx.moveTo( points[ 0 ][ 0 ], points[ 0 ][ 1 ] )
        points.slice( 1 ).forEach( ([ x, y ], i ) => {
            i % 2 ? ctx.moveTo( x, y ) : ctx.lineTo( x, y );
            
        })
    })
    ctx.stroke();
}
var drawTime = t => {
    ctx.moveTo( 0, t / 20 );
    ctx.lineTo( 2000, t / 20 );
    ctx.stroke();
}
var tick = () => {
    var now = Date.now();
    ctx.clearRect( 0, 0, canvas.width, canvas.height );
    drawPaths();
    var { x, y } = mouse.get();
    ctx.fillRect( x, y, 10, 10 );
    requestAnimationFrame( tick );
}
tick();
