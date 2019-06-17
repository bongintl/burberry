var { BufferGeometry, BufferAttribute } = require('three');

var SIZE = .5;

var quad = ( ...verts ) => {
    var stride = verts.length / 4;
    var tl = verts.slice( 0, stride );
    var tr = verts.slice( stride, stride * 2 );
    var br = verts.slice( stride * 2, stride * 3 );
    var bl = verts.slice( stride * 3, stride * 4 );
    return [
        ...tr, ...tl, ...bl,
        ...tr, ...bl, ...br
    ];
}

var create = ( length, uvScale = length ) => {
    var geometry = new BufferGeometry();
    // back
    var verts = quad(
        -SIZE, SIZE, 0,
        SIZE, SIZE, 0,
        SIZE, -SIZE, 0,
        -SIZE, -SIZE, 0
    );
    var uvs = quad(
        0, 1,
        1, 1,
        1, 0,
        0, 0
    );
    for ( var i = 0; i < length; i++ ) {
        var far = i;
        var near = i + 1;
        var uvFar = far / uvScale;
        var uvNear = near / uvScale;
        // top
        verts.push( ...quad(
            -SIZE, SIZE, near,
            SIZE, SIZE, near,
            SIZE, SIZE, far,
            -SIZE, SIZE, far,
        ));
        uvs.push( ...quad(
            0, uvNear + 1,
            1, uvNear + 1,
            1, uvFar + 1,
            0, uvFar + 1
        ))
        // right
        verts.push( ...quad(
            SIZE, SIZE, far,
            SIZE, SIZE, near,
            SIZE, -SIZE, near,
            SIZE, -SIZE, far
        ));
        uvs.push( ...quad(
            uvFar + 1, 1,
            uvNear + 1, 1,
            uvNear + 1, 0,
            uvFar + 1, 0
        ))
        // bottom
        verts.push( ...quad(
            -SIZE, -SIZE, far,
            SIZE, -SIZE, far,
            SIZE, -SIZE, near,
            -SIZE, -SIZE, near
        ));
        uvs.push( ...quad(
            0, uvFar,
            1, uvFar,
            1, uvNear,
            0, uvNear
        ))
        // left
        verts.push( ...quad(
            -SIZE, -SIZE, far,
            -SIZE, -SIZE, near,
            -SIZE, SIZE, near,
            -SIZE, SIZE, far
        ));
        uvs.push( ...quad(
            uvFar, 0,
            uvNear, 0,
            uvNear, 1,
            uvFar, 1
        ));
    }
    var positionAttribute = new BufferAttribute( new Float32Array( verts ), 3 );
    positionAttribute.dynamic = true;
    geometry.addAttribute( 'position', positionAttribute );
    geometry.addAttribute( 'uv', new BufferAttribute( new Float32Array( uvs ), 2 ) );
    return geometry;
}

var setPositions = ( positions, depth, x, y, r, b ) => {
    var offset = 6 + depth * 24;
    // top
    positions.setXY( offset + 2, x, y );
    positions.setXY( offset + 4, x, y );
    positions.setXY( offset + 5, r, y );
    // right
    offset += 6;
    positions.setXY( offset + 1, r, y );
}

var update = ( tube, [ x, y ], [ w, h ], material ) => {
    // var positions = tube.getAttribute( 'position' );
    // var hw = w / 2;
    // var hh = h / 2;
    // var r = x + hw;
    // x = x - hw;
    // var b = y - hh;
    // y = y + hh;
    // // back face
    // positions.setXY( 0, r, y );
    // positions.setXY( 1, x, y );
    // positions.setXY( 2, x, b );
    // positions.setXY( 3, r, y );
    // positions.setXY( 4, x, b );
    // positions.setXY( 5, r, b );
    // setPositions( positions, 0, x, y, r, b );
    // positions.needsUpdate = true;
}

module.exports = { create, update };