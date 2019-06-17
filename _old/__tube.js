var {
    Vector2,
    PlaneBufferGeometry,
    BufferGeometry,
    Texture,
    MirroredRepeatWrapping,
    MeshBasicMaterial,
    GreaterDepth,
    BufferAttribute,
    Object3D,
    Mesh
} = require('three');

var wall = ( depth, uvFromFn, uvToFn ) => {
    var geometry = new BufferGeometry();
    var verts = [
        0, 0, 0,
        0, 0, 0
    ];
    var uvs = [
        ...uvFromFn( 0 ),
        ...uvToFn( 0 )
    ];
    var indexes = [];
    for ( var z = 1; z <= depth; z++ ) {
        var offset = z * 2;
        verts.push(
            0, 0, z,
            0, 0, z
        );
        uvs.push(
            ...uvFromFn( z / depth ),
            ...uvToFn( z / depth ),
        );
        indexes.push(
            offset, offset - 2, offset - 1,
            offset, offset - 1, offset + 1
        );
    }
    var positionAttribute = new BufferAttribute( new Float32Array( verts ), 3 );
    positionAttribute.dynamic = true;
    geometry.addAttribute( 'position', positionAttribute );
    geometry.setIndex( indexes );
    geometry.addAttribute( 'uv', new BufferAttribute( new Float32Array( uvs ), 2 ) );
    return geometry;
}

var create = ( depth, imgs ) => {
    var materials = imgs.map( img => {
        var tex = new Texture( img );
        tex.wrapS = tex.wrapT = MirroredRepeatWrapping;
        tex.needsUpdate = true;
        // return new MeshBasicMaterial({ color: 0x0000ff });
        return new MeshBasicMaterial({ map: tex, depthFunc: GreaterDepth });
    })
    var obj = new Object3D();
    obj.add(
        new Mesh( new PlaneBufferGeometry( 1, 1 ), materials ),
        new Mesh( wall( depth, z => [ 0, z + 1 ], z => [ 1, z + 1 ] ), materials ),
        new Mesh( wall( depth, z => [ z + 1, 1 ], z => [ z + 1, 0 ] ), materials ),
        new Mesh( wall( depth, z => [ 1, z ], z => [ 0, z ] ), materials ),
        new Mesh( wall( depth, z => [ z, 0 ], z => [ z, 1 ] ), materials ),
    );
    return obj;
}

var updateWall = ( geometry, from, to, material ) => {
    var positions = geometry.getAttribute( 'position' );
    for ( var i = positions.count - 2; i >= 2; i -= 2 ) {
        positions.setXY( i, positions.getX( i - 2 ), positions.getY( i - 2 ) );
        positions.setXY( i + 1, positions.getX( i - 1 ), positions.getY( i - 1 ) );
    }
    positions.setXY( 0, ...from );
    positions.setXY( 1, ...to );
    positions.needsUpdate = true;
    if ( geometry.groups.length && geometry.groups[ 0 ].materialIndex === material ) {
        geometry.groups[ 0 ].count += 6;
    } else {
        geometry.groups.unshift({ start: 0, count: 6, materialIndex: material });
    }
    geometry.groups.slice( 1 ).forEach( group => group.start += 6 );
}

var update = ( tube, position, size, material ) => {
    var [ back, top, right, bottom, left ] = tube.children;
    back.position.x = position.x;
    back.position.y = position.y;
    back.scale.x = size.x;
    back.scale.y = size.y;
    back.geometry.clearGroups();
    back.geometry.addGroup( 0, Infinity, material );
    var hw = size.x / 2;
    var hh = size.y / 2;
    var l = position.x - hw;
    var b = position.y - hh;
    var r = position.x + hw;
    var t = position.y + hh;
    updateWall( top.geometry, [ l, t ], [ r, t ], material );
    updateWall( right.geometry, [ r, t ], [ r, b ], material );
    updateWall( bottom.geometry, [ r, b ], [ l, b ], material );
    updateWall( left.geometry, [ l, b ], [ l, t ], material );
}

module.exports = { create, update };