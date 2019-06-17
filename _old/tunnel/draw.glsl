module.exports = `

precision highp float;

uniform vec2 resolution;
uniform sampler2D texture;
uniform sampler2D map;
uniform sampler2D feedback;
uniform vec2 textureSize;
uniform vec2 textureOffset;

const vec3 gridSize = vec3( 10., 10., 10. );
const float lineWidth = .05;

float between( float x, float edge0, float edge1 ) {
    return step( edge0, x ) * step( x, edge1 );
}

vec4 getSide ( vec3 map ) {
    return vec4(
        between( map.b, 0., 1. / 6. ),
        between( map.b, 1. / 6., 3. / 6. ),
        between( map.b, 3. / 6., 5. / 6. ),
        between( map.b, 5. / 6., 1. )
    );
}

float maskSide ( vec4 side, float top, float right, float bottom, float left ) {
    return ( top * side.x ) + ( right * side.y ) + ( bottom * side.z ) + ( left * side.w );
}

vec2 maskSide ( vec4 side, vec2 top, vec2 right, vec2 bottom, vec2 left ) {
    return ( top * side.x ) + ( right * side.y ) + ( bottom * side.z ) + ( left * side.w );
}

vec3 location ( vec3 map, vec4 side ) {
    vec2 xy = maskSide(
        side,
        vec2( map.g, 0. ),
        vec2( 1., map.g ),
        vec2( map.g, 1. ),
        vec2( 0., map.g )
    );
    return vec3( xy, map.r );
}

vec4 walls ( vec3 loc ) {
    return texture2D( texture, loc.xy ) * loc.z;
}

vec4 center () {
    vec2 p = gl_FragCoord.xy;
    p.y = resolution.y - p.y;
    p /= resolution;
    p -= ( textureOffset - textureSize / 2. ) / resolution;
    p /= textureSize / resolution;
    float mask = step( 0., p.x ) * step( 0., p.y ) * step( p.x, 1. ) * step( p.y, 1. );
    return vec4( texture2D( texture, p ).rgb, mask );
}

vec4 comp ( vec4 a, vec4 b ) {
    return ( 1.0 - b.a ) * a + b.a * b;
}

float gridline ( float x, float z ) {
    return step( fract( x ), lineWidth );
    x = fract( x );
    return smoothstep( 1. - z, 1., x ) + ( 1. - smoothstep( 0., z, x ) );
}

vec4 grid ( vec3 loc, vec4 side ) {
    float gridX = gridline( loc.x * gridSize.x, 1. - loc.z );
    float gridY = gridline( loc.y * gridSize.y, 1. - loc.z );
    float gridZ = gridline( loc.z * gridSize.z, 1. - loc.z );
    float horizontal = max( gridX, gridZ );
    float vertical = max( gridY, gridZ );
    float grid = maskSide( side, horizontal, vertical, horizontal, vertical );
    return vec4( grid ) * step( .1, loc.z );
}

void main () {
    
    vec2 p = gl_FragCoord.xy / resolution;
    
    vec3 sample = texture2D( map, p ).rgb;
    
    gl_FragColor = texture2D( map, p );
    
    vec4 side = getSide( sample );
    
    vec3 loc = location( sample, side );
    
    gl_FragColor = comp( comp( comp( vec4( 0., 0., 0., 1. ), walls( loc ) ), grid( loc, side ) ), center() );
    
    // gl_FragColor = comp( grid( loc ), tex() );
    
}

`