uniform float zoom;

uniform vec2 center;

vec4 feedback ( sampler2D tex, vec2 resolution ) {
    vec2 p = gl_FragCoord.xy / resolution;
    p -= center;
    p /= zoom;
    p += center;
    return texture2D( tex, p );
}

#pragma glslify: export(feedback)