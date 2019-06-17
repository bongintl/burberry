precision highp float;

uniform float decay;

uniform vec2 resolution;
uniform vec4 line;
uniform vec2 textureSize;
uniform float textureOpacity;
uniform sampler2D prev;
uniform sampler2D texture;

vec4 fill ( vec2 p ) {
    return texture2D( texture, p ) * textureOpacity;
}

#pragma glslify: trail = require('./lib/trail',fill=fill);
#pragma glslify: feedback = require('./lib/feedback')
#pragma glslify: comp = require('./lib/comp')

void main () {
    vec4 color = trail( line, textureSize, resolution );
    vec4 fb = feedback( prev, resolution ) - decay;
    gl_FragColor = comp( fb, color );
}