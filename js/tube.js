var {
    PlaneBufferGeometry,
    BufferGeometry,
    Texture,
    VideoTexture,
    RGBFormat,
    LinearFilter,
    MeshBasicMaterial,
    GreaterDepth,
    BufferAttribute,
    Object3D,
    Mesh
} = require('three');

/*
        -z

      0     1
       +---+
       |  /|
       | / |
       |/  |
       +---+
      2     3

        +z
*/

var mirroredRepeat = x => x % 2 < 1 ? x % 1 : 1 - ( x % 1 );

var wall = ( depth, uv0, uv1 ) => {
    var geometry = new BufferGeometry();
    var verts = [];
    var uvs = [];
    var indexes = [];
    for ( var z = 0; z < depth; z++ ) {
        var far = z / depth;
        var near = ( z + 1 ) / depth;
        verts.push(
            0, 0, far,
            0, 0, far,
            0, 0, near,
            0, 0, near
        );
        uvs.push(
            ...uv0( far ),
            ...uv1( far ),
            ...uv0( near ),
            ...uv1( near )
        );
        var offset = z * 4;
        indexes.push(
            offset + 0, offset + 1, offset + 2,
            offset + 2, offset + 1, offset + 3
        );
    }
    var positionAttribute = new BufferAttribute( new Float32Array( verts ), 3 );
    positionAttribute.dynamic = true;
    geometry.addAttribute( 'position', positionAttribute );
    geometry.setIndex( indexes );
    geometry.addAttribute( 'uv', new BufferAttribute( new Float32Array( uvs ), 2 ) );
    return geometry;
}

var materials = [];
var materialIndexes = {};
var materialIndex = img => {
    if ( !( img.src in materialIndexes ) ) {
        var isVideo = img instanceof HTMLVideoElement;
        var tex = isVideo ? new VideoTexture( img ) : new Texture( img );
        if ( isVideo ) tex.update = function () {
            if ( this.image.paused ) this.image.play();
            this.needsUpdate = true;
        }
        tex.minFilter = tex.magFilter = LinearFilter;
        tex.needsUpdate = true;
        tex.format = RGBFormat;
        materials.push( new MeshBasicMaterial({ map: tex, depthFunc: GreaterDepth }) );
        materialIndexes[ img.src ] = materials.length - 1;
    }
    return materialIndexes[ img.src ];
}

var create = depth => {
    var obj = new Object3D();
    obj.add(
        new Mesh( new PlaneBufferGeometry( 1, 1 ), materials ),
        new Mesh( wall( depth, z => [ 0, mirroredRepeat( z + 1 ) ], z => [ 1, mirroredRepeat( z + 1 ) ] ), materials ),
        new Mesh( wall( depth, z => [ mirroredRepeat( z + 1 ), 1 ], z => [ mirroredRepeat( z + 1 ), 0 ] ), materials ),
        new Mesh( wall( depth, z => [ 1, mirroredRepeat( z ) ], z => [ 0, mirroredRepeat( z ) ] ), materials ),
        new Mesh( wall( depth, z => [ mirroredRepeat( z ), 0 ], z => [ mirroredRepeat( z ), 1 ] ), materials ),
    );
    return obj;
}

var copyXY = ( positions, iFrom, iTo ) => positions.setXY( iTo, positions.getX( iFrom ), positions.getY( iFrom ) );

var updateWall = ( wall, from, to, image ) => {
    var mat = materialIndex( image );
    var { geometry } = wall;
    var isNewMaterial = !geometry.groups.length || geometry.groups[ 0 ].materialIndex !== mat;
    var positions = geometry.getAttribute( 'position' );
    for ( var i = positions.count - 4; i >= 4; i -= 4 ) {
        copyXY( positions, i - 4 + 0, i + 0 );
        copyXY( positions, i - 4 + 1, i + 1 );
        copyXY( positions, i - 4 + 2, i + 2 );
        copyXY( positions, i - 4 + 3, i + 3 );
    }
    positions.setXY( 0, from[ 0 ], from[ 1 ] );
    positions.setXY( 1, to[ 0 ], to[ 1 ] );
    if ( isNewMaterial ) {
        positions.setXY( 2, from[ 0 ], from[ 1 ] );
        positions.setXY( 3, to[ 0 ], to[ 1 ] );
        geometry.groups.unshift({ start: 0, count: 6, materialIndex: mat });
    } else {
        copyXY( positions, 4, 2 );
        copyXY( positions, 5, 3 );
        geometry.groups[ 0 ].count += 6;
    }
    geometry.groups.slice( 1 ).forEach( group => group.start += 6 );
    while ( true ) {
        if ( geometry.groups[ geometry.groups.length - 1 ].start > geometry.index.count ) {
            var grp = geometry.groups.pop();
            var img = materials[ grp.materialIndex ].map.image;
            if ( img instanceof HTMLVideoElement && !img.paused ) img.pause();
        } else {
            break;
        }
    }
    positions.needsUpdate = true;
}

var update = ( tube, position, size, image ) => {
    var [ back, top, right, bottom, left ] = tube.children;
    back.position.x = position.x;
    back.position.y = position.y;
    back.scale.x = size.x;
    back.scale.y = size.y;
    back.material = materials[ materialIndex( image ) ];
    var hw = size.x / 2;
    var hh = size.y / 2;
    var l = position.x - hw;
    var b = position.y - hh;
    var r = position.x + hw;
    var t = position.y + hh;
    updateWall( top, [ l, t ], [ r, t ], image );
    updateWall( right, [ r, t ], [ r, b ], image );
    updateWall( bottom, [ r, b ], [ l, b ], image );
    updateWall( left, [ l, b ], [ l, t ], image );
}

module.exports = { create, update };