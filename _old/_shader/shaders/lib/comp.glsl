vec4 comp ( vec4 a, vec4 b ) {
    return clamp( 1.0 - b.a, 0., 1. ) * a + b.a * b;
}

#pragma glslify: export(comp)