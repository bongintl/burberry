precision highp float;

uniform vec4 gridColor1;
uniform vec4 gridColor2;
uniform float gridScale;

uniform vec2 resolution;
uniform sampler2D texture;
uniform sampler2D bleed;
uniform sampler2D uv;
uniform vec2 textureSize;
uniform vec4 line;
uniform vec4 background;


#pragma glslify: comp = require('./lib/comp')

vec4 grid ( vec4 uv ) {
    vec2 p = gl_FragCoord.xy;
    p.y = resolution.y - p.y;
    float g = fract( uv.r * gridScale );
    float g1 = smoothstep( .4, 1., g );
    float g2 = 1. - smoothstep( 0., .6, g );
    float mask = 1. - 
        step( line.z, gl_FragCoord.x ) * 
        step( line.w, resolution.y - gl_FragCoord.y ) * 
        step( gl_FragCoord.x, line.z + textureSize.x ) *
        step( resolution.y - gl_FragCoord.y, line.w + textureSize.y );
    return vec4( g1 * gridColor1 + g2 * gridColor2 ) * mask;//( gridColor1 * g1 + gridColor2 * g2 ) * mask;
}

vec4 invert ( vec4 color ) {
    return vec4( vec3( 1. ) - color.rgb, color.a );
}

vec4 bw ( vec4 color ) {
    return vec4( vec3( length( color ) / 3. ), color.a );
}

void main () {
    vec2 p = gl_FragCoord.xy / resolution;
    vec4 map = texture2D( uv, p );
    vec4 color = comp( texture2D( bleed, p ), grid( map ) * map.r );
    // color = invert( color );
    // gl_FragColor = vec4( map.r );
    // vec4 bg = mix( color, texture2D( texture, p ), 1. - smoothstep( 0., .2, map.r ) );
    gl_FragColor = color;
    // gl_FragColor = comp( bg, color );
}