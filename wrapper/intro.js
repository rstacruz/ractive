(function ( global ) {

// Some of the modules herein have circular dependencies. This isn't a
// huge problem with AMD, because you can do
//
//     require([ 'some/circular/dependency' ], function ( dep ) {
//       dependency = dep;
//     });
//
// However we're using amdclean to get rid of define() and require()
// calls in the distributed file, and circular dependencies break
// amdclean. So we're collecting those require calls (which amdclean
// rewrites) and executing them at the end, once modules have been defined.
var loadCircularDependency = function ( callback ) {
	loadCircularDependency.callbacks.push( callback );
};

loadCircularDependency.callbacks = [];

// Internet Explorer derp. Methods that should be attached to Node.prototype
// are instead attached to HTMLElement.prototype, which means SVG elements
// can't use them. Remember kids, friends don't let friends use IE.
// 
// This is here, rather than in legacy.js, because it affects IE9.
if ( global.Node && !global.Node.prototype.contains && global.HTMLElement && global.HTMLElement.prototype.contains ) {
	global.Node.prototype.contains = global.HTMLElement.prototype.contains;
}