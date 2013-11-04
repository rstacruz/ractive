define([ 'parse/getStub/utils/stringifyStubs' ], function ( stringifyStubs ) {

	'use strict';

	return function ( items, noStringify ) {
		var str, json;

		if ( !noStringify ) {
			str = stringifyStubs( items );
			if ( str !== false ) {
				return str;
			}
		}

		json = items.map( function ( item ) {
			return item.toJSON( noStringify );
		});

		return json;
	};

});