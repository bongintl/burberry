module.exports = `

precision highp float;

uniform sampler2D prev;
uniform vec2 resolution;
uniform vec2 textureSize;
uniform vec2 textureOffset;

const float PI = 3.145926536;

vec4 comp ( vec4 a, vec4 b ) {
    return ( 1.0 - b.a ) * a + b.a * b;
}

vec4 box () {
    vec2 p = gl_FragCoord.xy;
    p.y = resolution.y - p.y;
    p /= resolution;
    p -= ( textureOffset - textureSize / 2. ) / resolution;
    p /= textureSize / resolution;
    // float color = mod( step( p.x, p.y ) + step( 1. - p.y, p.x ), 2.);
    float mask = step( 0., p.x ) * step( 0., p.y ) * step( p.x, 1. ) * step( p.y, 1. );
    float edge = mix( min( p.x, p.y ), max( p.x, p.y ), step( p.x, 1. - p.y ) );
    float side = floor( mod( ( ( atan( p.y - .5, p.x - .5 ) - PI / 4. ) / ( PI / 2. ) ) + 2., 4. ) ) / 3.;
    return vec4( vec3( 1., edge, side ) * mask, mask );
}

void main () {
    vec2 p = gl_FragCoord.xy / resolution;
    p -= .5;
    p /= 1.01;
    p += .5;
    vec4 feedback = texture2D( prev, p );
    feedback.r -= 1. / 256.;
    gl_FragColor = comp( feedback, box() );
}

`