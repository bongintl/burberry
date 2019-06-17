precision highp float;

uniform float decay;

uniform vec2 resolution;
uniform vec4 line;
uniform vec2 textureSize;
uniform sampler2D prev;
uniform sampler2D texture;

const float PI = 3.145926536;

vec4 fill ( vec2 p ) {
    float edge = mix( min( p.x, p.y ), max( p.x, p.y ), step( p.x, 1. - p.y ) );
    float side = floor( mod( ( ( atan( p.y - .5, p.x - .5 ) - PI / 4. ) / ( PI / 2. ) ) + 2., 4. ) ) / 3.;
    return vec4( 1., edge, side, 1. );
}

#pragma glslify: trail = require('./lib/trail',fill=fill);
#pragma glslify: feedback = require('./lib/feedback')
#pragma glslify: comp = require('./lib/comp')

void main () {
    vec4 color = trail( line, textureSize, resolution );
    vec4 fb = feedback( prev, resolution );
    fb.r -= 1. / 256.;
    gl_FragColor = comp( fb, color );
}