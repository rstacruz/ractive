define([
	'config/isClient',
	'config/errors',
	'utils/warn',
	'utils/create',
	'utils/extend',
	'utils/defineProperties',
	'utils/getElement',
	'utils/isObject',
	'shared/render',
	'Ractive/prototype/get/magicAdaptor'
], function (
	isClient,
	errors,
	warn,
	create,
	extend,
	defineProperties,
	getElement,
	isObject,
	render,
	magicAdaptor
) {
	
	'use strict';

	var getObject, getArray, defaultOptions, extendable;

	getObject = function () { return {}; };
	getArray = function () { return []; };

	defaultOptions = create( null );

	defineProperties( defaultOptions, {
		preserveWhitespace: { enumerable: true, value: false     },
		append:             { enumerable: true, value: false     },
		twoway:             { enumerable: true, value: true      },
		modifyArrays:       { enumerable: true, value: true      },
		data:               { enumerable: true, value: getObject },
		lazy:               { enumerable: true, value: false     },
		debug:              { enumerable: true, value: false     },
		transitions:        { enumerable: true, value: getObject },
		decorators:         { enumerable: true, value: getObject },
		events:             { enumerable: true, value: getObject },
		noIntro:            { enumerable: true, value: false     },
		transitionsEnabled: { enumerable: true, value: true      },
		magic:              { enumerable: true, value: false     },
		adaptors:           { enumerable: true, value: getArray  }
	});

	extendable = [ 'adaptors', 'components', 'decorators', 'events', 'transitions' ];

	return function ( ractive, options, Ractive ) {

		var key, template, templateEl, parsedTemplate;

		// Options
		// -------
		for ( key in defaultOptions ) {
			if ( options[ key ] === undefined ) {
				options[ key ] = ( typeof defaultOptions[ key ] === 'function' ? defaultOptions[ key ]() : defaultOptions[ key ] );
			}
		}


		// Initialization
		// --------------

		// We use Object.defineProperties (where possible) as these should be read-only
		defineProperties( ractive, {
			// Generate a unique identifier, for places where you'd use a weak map if it
			// existed
			_guid: {
				value: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
					var r, v;

					r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
					return v.toString(16);
				})
			},

			// events
			_subs: { value: create( null ) },

			// cache
			_cache: { value: {} }, // we need to be able to use hasOwnProperty, so can't inherit from null
			_cacheMap: { value: create( null ) },

			// dependency graph
			_deps: { value: [] },
			_depsMap: { value: create( null ) },

			// unresolved dependants
			_pendingResolution: { value: [] },

			// Create arrays for deferred attributes and evaluators etc
			_defAttrs: { value: [] },
			_defEvals: { value: [] },
			_defSelectValues: { value: [] },
			_defCheckboxes: { value: [] },
			_defRadios: { value: [] },
			_defObservers: { value: [] },
			_defTransitions: { value: [] },

			// Keep a list of used evaluators, so we don't duplicate them
			_evaluators: { value: create( null ) },

			// two-way bindings
			_twowayBindings: { value: {} },

			// transition manager
			_transitionManager: { value: null, writable: true },

			// animations (so we can stop any in progress at teardown)
			_animations: { value: [] },

			// nodes registry
			nodes: { value: {} },

			// property wrappers
			_wrapped: { value: create( null ) }
		});

		// options
		ractive.data = options.data;

		ractive.modifyArrays = options.modifyArrays;
		ractive.magic = options.magic;
		ractive.twoway = options.twoway;
		ractive.lazy = options.lazy;
		ractive.debug = options.debug;

		if ( ractive.magic && !magicAdaptor ) {
			throw new Error( 'Getters and setters (magic mode) are not supported in this browser' );
		}

		if ( options.el ) {
			ractive.el = getElement( options.el );
			if ( !ractive.el && ractive.debug ) {
				throw new Error( 'Could not find container element' );
			}
		}

		// Create local registry objects, with the global registries as prototypes
		if ( options.eventDefinitions ) {
			// TODO remove support
			warn( 'ractive.eventDefinitions has been deprecated in favour of ractive.events. Support will be removed in future versions' );
			options.events = options.eventDefinitions;
		}

		extendable.forEach( function ( registry ) {
			ractive[ registry ] = extend( create( Ractive[ registry ] ), options[ registry ] );
		});
		


		// Parse template, if necessary
		template = options.template;
		
		if ( typeof template === 'string' ) {
			if ( !Ractive.parse ) {
				throw new Error( errors.missingParser );
			}

			if ( template.charAt( 0 ) === '#' && isClient ) {
				// assume this is an ID of a <script type='text/ractive'> tag
				templateEl = document.getElementById( template.substring( 1 ) );
				if ( templateEl ) {
					parsedTemplate = Ractive.parse( templateEl.innerHTML, options );
				}

				else {
					throw new Error( 'Could not find template element (' + template + ')' );
				}
			}

			else {
				parsedTemplate = Ractive.parse( template, options );
			}
		} else {
			parsedTemplate = template;
		}

		ractive.partials = create( Ractive.partials );

		// deal with compound template
		if ( isObject( parsedTemplate ) ) {
			extend( ractive.partials, parsedTemplate.partials );
			parsedTemplate = parsedTemplate.main;
		}

		// If the template was an array with a single string member, that means
		// we can use innerHTML - we just need to unpack it
		if ( parsedTemplate && ( parsedTemplate.length === 1 ) && ( typeof parsedTemplate[0] === 'string' ) ) {
			parsedTemplate = parsedTemplate[0];
		}

		ractive.template = parsedTemplate;

		// Add partials to our registry
		extend( ractive.partials, options.partials );

		ractive.parseOptions = {
			preserveWhitespace: options.preserveWhitespace,
			sanitize: options.sanitize
		};
		
		// temporarily disable transitions, if noIntro flag is set
		ractive.transitionsEnabled = ( options.noIntro ? false : options.transitionsEnabled );

		render( ractive, { el: ractive.el, append: options.append, complete: options.complete });

		// reset transitionsEnabled
		ractive.transitionsEnabled = options.transitionsEnabled;

	};

});