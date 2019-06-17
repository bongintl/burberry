( async () => {

	var fs = require('fs');
	var path = require('path');
	var Jimp = require('jimp');
	var tinycolor = require('tinycolor2');

	var pixels = [];
	
	var files = fs.readdirSync(__dirname + '/imgs').filter( file => !file.startsWith('.') );

	for ( var i = 0; i < files.length; i++ ) {
	
		var file = files[ i ];

		console.log('reading ' + file );

		var img = await Jimp.read( path.join( __dirname, 'imgs', file ) );

		img.scan( 0, 0, img.bitmap.width, img.bitmap.height, ( x, y, idx ) => {

			var r = img.bitmap.data[ idx ];
			var g = img.bitmap.data[ idx + 1 ];
			var b = img.bitmap.data[ idx + 2 ];
			var { h, s, l } = tinycolor({ r, g, b }).toHsl();

			pixels.push([ h, s, l, i ]);

		});

	}
	
	var size = Math.floor( Math.sqrt( pixels.length ) );
	
	pixels = pixels.slice( 0, size * size );
	
	console.log( pixels.length + ' pixels' );

	var compare = ( a, b ) => a === b ? 0 : a > b ? 1 : -1;
	var compareIdx = i => ( a, b ) => compare( a[ i ], b[ i ] );
	
	console.log('sorting');
	
	var sort2d = ( arr, xFn, yFn ) => {
		var side = Math.sqrt( arr.length );
		if ( Math.round( side ) !== side ) throw new Error('Not square');
		var ySorted = arr.slice().sort( yFn );
		var ret = [];
		for ( var i = 0; i < side; i++ ) {
			ret = ret.concat( ySorted.slice( side * i, side * ( i + 1 ) ).sort( xFn ) );
		}
		return ret;
	}
	
	pixels = sort2d( pixels, compareIdx( 2 ), compareIdx( 0 ) );
	
	// pixels.sort( ( a, b ) => {
	// 	// return compare( a[ 0 ], b[ 0 ] );
	// 	var h = compare( Math.floor( a[ 0 ] / 7 ), Math.floor( b[ 0 ] / 7 ) );
	// 	if ( h !== 0 ) return h;
	// 	return compare( a[2], b[2] );
	// });
	
	console.log('writing');

	var out = new Jimp( size, size );
	var index = new Jimp( size, size );
	var indexColors = files
		.map( ( _, i ) => tinycolor('#f00').spin( ( i / files.length ) * 360 ).toRgb() )
		.map( ({ r, g, b }) => Jimp.rgbaToInt( r, g, b, 255 ) );
	
	out.scan( 0, 0, out.bitmap.width, out.bitmap.height, ( x, y, i ) => {
		if ( i / 4 >= pixels.length ) return;
		var [ h, s, l, idx ] = pixels[ i / 4 ];
		var { r, g, b } = tinycolor({ h, s, l }).toRgb();
		out.setPixelColor( Jimp.rgbaToInt( r, g, b, 255 ), x, y );
		index.setPixelColor( indexColors[ idx ], x, y );
	})

	await out.write( __dirname + '/out.png');
	await index.write( __dirname  + '/indexes.png');

	console.log('wrote');

})()