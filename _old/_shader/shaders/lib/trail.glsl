#pragma glslify: map = require('glsl-map')

vec2 boxCoord ( vec2 p, vec2 offset, vec2 size ) {
    return map( p, offset, offset + size, vec2( 0. ), vec2( 1. ) );
}

vec2 trailCoord ( vec2 p, vec4 line, vec2 size ) {
    vec2 from = line.xy;
    vec2 to = line.zw;
    vec2 d = to - from;
    float x, y;
    if ( d.y == 0. ) {
        x = map( p.x, to.x, to.x + size.x, 0., 1. );
    } else if ( d.y > 0. ) {
        float ty = map( p.y, from.y, to.y, 0., 1. );
        float edge = from.x + d.x * ty;
        x = map( p.x, edge, edge + size.x, 0., 1. );
    } else {
        float ty = map( p.y, from.y + size.y, to.y + size.y, 0., 1. );
        float edge = from.x + d.x * ty;
        x = map( p.x, edge, edge + size.x, 0., 1. );
    }
    if ( d.x == 0. ) {
        y = map( p.y, to.y, to.y + size.y, 0., 1. );
    } else if ( d.x > 0. ) {
        float tx = map( p.x, from.x, to.x, 0., 1. );
        float edge = from.y + d.y * tx;
        y = map( p.y, edge, edge + size.y, 0., 1. );
    } else {
        float tx = map( p.x, from.x + size.x, to.x + size.x, 0., 1. );
        float edge = from.y + d.y * tx;
        y = map( p.y, edge, edge + size.y, 0., 1. );
    }
    return vec2( x, y );
}

float clipBox ( vec2 p ) {
    return step( 0., p.x ) * step( 0., p.y ) * step( p.x, 1. ) * step( p.y, 1. );
}

float clipTrail ( vec2 p, vec4 line, vec2 size, vec2 texCoord ) {
    float bounds = (
        step( min( line.x, line.z ), p.x ) *
        step( min( line.y, line.w ), p.y ) *
        step( p.x, max( line.x, line.z ) + size.x ) *
        step( p.y, max( line.y, line.w ) + size.y )
    );
    float diagonal = clamp(
        (
            step( 0., texCoord.x ) *
            step( texCoord.x, 1. )
        ) +
        (
            step( 0., texCoord.y ) *
            step( texCoord.y, 1. )
        )
    , 0., 1. );
    return bounds * diagonal;
}

vec2 _mix ( vec2 a, vec2 b, float x ) {
    return a * ( 1. - x ) + b * x;
}

vec4 trail ( vec4 line, vec2 size, vec2 resolution ) {
    vec2 p = gl_FragCoord.xy;
    p.y = resolution.y - p.y;
    vec2 pBox = boxCoord( p, line.zw, size );
    vec2 pTrail = trailCoord( p, line, size );
    vec2 coord = _mix( pTrail, pBox, clipBox( pBox ) );
    float mask = clipTrail( p, line, size, coord );
    return fill( coord ) * mask;
}

#pragma glslify: export(trail)