var Elm = Elm || { Native: {} };
Elm.Native.Basics = {};
Elm.Native.Basics.make = function(localRuntime) {
	localRuntime.Native = localRuntime.Native || {};
	localRuntime.Native.Basics = localRuntime.Native.Basics || {};
	if (localRuntime.Native.Basics.values)
	{
		return localRuntime.Native.Basics.values;
	}

	var Utils = Elm.Native.Utils.make(localRuntime);

	function div(a, b)
	{
		return (a / b) | 0;
	}
	function rem(a, b)
	{
		return a % b;
	}
	function mod(a, b)
	{
		if (b === 0)
		{
			throw new Error('Cannot perform mod 0. Division by zero error.');
		}
		var r = a % b;
		var m = a === 0 ? 0 : (b > 0 ? (a >= 0 ? r : r + b) : -mod(-a, -b));

		return m === b ? 0 : m;
	}
	function logBase(base, n)
	{
		return Math.log(n) / Math.log(base);
	}
	function negate(n)
	{
		return -n;
	}
	function abs(n)
	{
		return n < 0 ? -n : n;
	}

	function min(a, b)
	{
		return Utils.cmp(a, b) < 0 ? a : b;
	}
	function max(a, b)
	{
		return Utils.cmp(a, b) > 0 ? a : b;
	}
	function clamp(lo, hi, n)
	{
		return Utils.cmp(n, lo) < 0 ? lo : Utils.cmp(n, hi) > 0 ? hi : n;
	}

	function xor(a, b)
	{
		return a !== b;
	}
	function not(b)
	{
		return !b;
	}
	function isInfinite(n)
	{
		return n === Infinity || n === -Infinity;
	}

	function truncate(n)
	{
		return n | 0;
	}

	function degrees(d)
	{
		return d * Math.PI / 180;
	}
	function turns(t)
	{
		return 2 * Math.PI * t;
	}
	function fromPolar(point)
	{
		var r = point._0;
		var t = point._1;
		return Utils.Tuple2(r * Math.cos(t), r * Math.sin(t));
	}
	function toPolar(point)
	{
		var x = point._0;
		var y = point._1;
		return Utils.Tuple2(Math.sqrt(x * x + y * y), Math.atan2(y, x));
	}

	return localRuntime.Native.Basics.values = {
		div: F2(div),
		rem: F2(rem),
		mod: F2(mod),

		pi: Math.PI,
		e: Math.E,
		cos: Math.cos,
		sin: Math.sin,
		tan: Math.tan,
		acos: Math.acos,
		asin: Math.asin,
		atan: Math.atan,
		atan2: F2(Math.atan2),

		degrees: degrees,
		turns: turns,
		fromPolar: fromPolar,
		toPolar: toPolar,

		sqrt: Math.sqrt,
		logBase: F2(logBase),
		negate: negate,
		abs: abs,
		min: F2(min),
		max: F2(max),
		clamp: F3(clamp),
		compare: Utils.compare,

		xor: F2(xor),
		not: not,

		truncate: truncate,
		ceiling: Math.ceil,
		floor: Math.floor,
		round: Math.round,
		toFloat: function(x) { return x; },
		isNaN: isNaN,
		isInfinite: isInfinite
	};
};

Elm.Native.Port = {};

Elm.Native.Port.make = function(localRuntime) {
	localRuntime.Native = localRuntime.Native || {};
	localRuntime.Native.Port = localRuntime.Native.Port || {};
	if (localRuntime.Native.Port.values)
	{
		return localRuntime.Native.Port.values;
	}

	var NS;

	// INBOUND

	function inbound(name, type, converter)
	{
		if (!localRuntime.argsTracker[name])
		{
			throw new Error(
				'Port Error:\n' +
				'No argument was given for the port named \'' + name + '\' with type:\n\n' +
				'    ' + type.split('\n').join('\n        ') + '\n\n' +
				'You need to provide an initial value!\n\n' +
				'Find out more about ports here <http://elm-lang.org/learn/Ports.elm>'
			);
		}
		var arg = localRuntime.argsTracker[name];
		arg.used = true;

		return jsToElm(name, type, converter, arg.value);
	}


	function inboundSignal(name, type, converter)
	{
		var initialValue = inbound(name, type, converter);

		if (!NS)
		{
			NS = Elm.Native.Signal.make(localRuntime);
		}
		var signal = NS.input('inbound-port-' + name, initialValue);

		function send(jsValue)
		{
			var elmValue = jsToElm(name, type, converter, jsValue);
			setTimeout(function() {
				localRuntime.notify(signal.id, elmValue);
			}, 0);
		}

		localRuntime.ports[name] = { send: send };

		return signal;
	}


	function jsToElm(name, type, converter, value)
	{
		try
		{
			return converter(value);
		}
		catch(e)
		{
			throw new Error(
				'Port Error:\n' +
				'Regarding the port named \'' + name + '\' with type:\n\n' +
				'    ' + type.split('\n').join('\n        ') + '\n\n' +
				'You just sent the value:\n\n' +
				'    ' + JSON.stringify(value) + '\n\n' +
				'but it cannot be converted to the necessary type.\n' +
				e.message
			);
		}
	}


	// OUTBOUND

	function outbound(name, converter, elmValue)
	{
		localRuntime.ports[name] = converter(elmValue);
	}


	function outboundSignal(name, converter, signal)
	{
		var subscribers = [];

		function subscribe(handler)
		{
			subscribers.push(handler);
		}
		function unsubscribe(handler)
		{
			subscribers.pop(subscribers.indexOf(handler));
		}

		function notify(elmValue)
		{
			var jsValue = converter(elmValue);
			var len = subscribers.length;
			for (var i = 0; i < len; ++i)
			{
				subscribers[i](jsValue);
			}
		}

		if (!NS)
		{
			NS = Elm.Native.Signal.make(localRuntime);
		}
		NS.output('outbound-port-' + name, notify, signal);

		localRuntime.ports[name] = {
			subscribe: subscribe,
			unsubscribe: unsubscribe
		};

		return signal;
	}


	return localRuntime.Native.Port.values = {
		inbound: inbound,
		outbound: outbound,
		inboundSignal: inboundSignal,
		outboundSignal: outboundSignal
	};
};

if (!Elm.fullscreen) {
	(function() {
		'use strict';

		var Display = {
			FULLSCREEN: 0,
			COMPONENT: 1,
			NONE: 2
		};

		Elm.fullscreen = function(module, args)
		{
			var container = document.createElement('div');
			document.body.appendChild(container);
			return init(Display.FULLSCREEN, container, module, args || {});
		};

		Elm.embed = function(module, container, args)
		{
			var tag = container.tagName;
			if (tag !== 'DIV')
			{
				throw new Error('Elm.node must be given a DIV, not a ' + tag + '.');
			}
			return init(Display.COMPONENT, container, module, args || {});
		};

		Elm.worker = function(module, args)
		{
			return init(Display.NONE, {}, module, args || {});
		};

		function init(display, container, module, args, moduleToReplace)
		{
			// defining state needed for an instance of the Elm RTS
			var inputs = [];

			/* OFFSET
			 * Elm's time traveling debugger lets you pause time. This means
			 * "now" may be shifted a bit into the past. By wrapping Date.now()
			 * we can manage this.
			 */
			var timer = {
				programStart: Date.now(),
				now: function()
				{
					return Date.now();
				}
			};

			var updateInProgress = false;
			function notify(id, v)
			{
				if (updateInProgress)
				{
					throw new Error(
						'The notify function has been called synchronously!\n' +
						'This can lead to frames being dropped.\n' +
						'Definitely report this to <https://github.com/elm-lang/Elm/issues>\n');
				}
				updateInProgress = true;
				var timestep = timer.now();
				for (var i = inputs.length; i--; )
				{
					inputs[i].notify(timestep, id, v);
				}
				updateInProgress = false;
			}
			function setTimeout(func, delay)
			{
				return window.setTimeout(func, delay);
			}

			var listeners = [];
			function addListener(relevantInputs, domNode, eventName, func)
			{
				domNode.addEventListener(eventName, func);
				var listener = {
					relevantInputs: relevantInputs,
					domNode: domNode,
					eventName: eventName,
					func: func
				};
				listeners.push(listener);
			}

			var argsTracker = {};
			for (var name in args)
			{
				argsTracker[name] = {
					value: args[name],
					used: false
				};
			}

			// create the actual RTS. Any impure modules will attach themselves to this
			// object. This permits many Elm programs to be embedded per document.
			var elm = {
				notify: notify,
				setTimeout: setTimeout,
				node: container,
				addListener: addListener,
				inputs: inputs,
				timer: timer,
				argsTracker: argsTracker,
				ports: {},

				isFullscreen: function() { return display === Display.FULLSCREEN; },
				isEmbed: function() { return display === Display.COMPONENT; },
				isWorker: function() { return display === Display.NONE; }
			};

			function swap(newModule)
			{
				removeListeners(listeners);
				var div = document.createElement('div');
				var newElm = init(display, div, newModule, args, elm);
				inputs = [];

				return newElm;
			}

			function dispose()
			{
				removeListeners(listeners);
				inputs = [];
			}

			var Module = {};
			try
			{
				Module = module.make(elm);
				checkInputs(elm);
			}
			catch (error)
			{
				if (typeof container.appendChild === "function")
				{
					container.appendChild(errorNode(error.message));
				}
				else
				{
					console.error(error.message);
				}
				throw error;
			}

			if (display !== Display.NONE)
			{
				var graphicsNode = initGraphics(elm, Module);
			}

			var rootNode = { kids: inputs };
			trimDeadNodes(rootNode);
			inputs = rootNode.kids;
			filterListeners(inputs, listeners);

			addReceivers(elm.ports);

			if (typeof moduleToReplace !== 'undefined')
			{
				hotSwap(moduleToReplace, elm);

				// rerender scene if graphics are enabled.
				if (typeof graphicsNode !== 'undefined')
				{
					graphicsNode.notify(0, true, 0);
				}
			}

			return {
				swap: swap,
				ports: elm.ports,
				dispose: dispose
			};
		}

		function checkInputs(elm)
		{
			var argsTracker = elm.argsTracker;
			for (var name in argsTracker)
			{
				if (!argsTracker[name].used)
				{
					throw new Error(
						"Port Error:\nYou provided an argument named '" + name +
						"' but there is no corresponding port!\n\n" +
						"Maybe add a port '" + name + "' to your Elm module?\n" +
						"Maybe remove the '" + name + "' argument from your initialization code in JS?"
					);
				}
			}
		}

		function errorNode(message)
		{
			var code = document.createElement('code');

			var lines = message.split('\n');
			code.appendChild(document.createTextNode(lines[0]));
			code.appendChild(document.createElement('br'));
			code.appendChild(document.createElement('br'));
			for (var i = 1; i < lines.length; ++i)
			{
				code.appendChild(document.createTextNode('\u00A0 \u00A0 ' + lines[i].replace(/  /g, '\u00A0 ')));
				code.appendChild(document.createElement('br'));
			}
			code.appendChild(document.createElement('br'));
			code.appendChild(document.createTextNode('Open the developer console for more details.'));
			return code;
		}


		//// FILTER SIGNALS ////

		// TODO: move this code into the signal module and create a function
		// Signal.initializeGraph that actually instantiates everything.

		function filterListeners(inputs, listeners)
		{
			loop:
			for (var i = listeners.length; i--; )
			{
				var listener = listeners[i];
				for (var j = inputs.length; j--; )
				{
					if (listener.relevantInputs.indexOf(inputs[j].id) >= 0)
					{
						continue loop;
					}
				}
				listener.domNode.removeEventListener(listener.eventName, listener.func);
			}
		}

		function removeListeners(listeners)
		{
			for (var i = listeners.length; i--; )
			{
				var listener = listeners[i];
				listener.domNode.removeEventListener(listener.eventName, listener.func);
			}
		}

		// add receivers for built-in ports if they are defined
		function addReceivers(ports)
		{
			if ('title' in ports)
			{
				if (typeof ports.title === 'string')
				{
					document.title = ports.title;
				}
				else
				{
					ports.title.subscribe(function(v) { document.title = v; });
				}
			}
			if ('redirect' in ports)
			{
				ports.redirect.subscribe(function(v) {
					if (v.length > 0)
					{
						window.location = v;
					}
				});
			}
		}


		// returns a boolean representing whether the node is alive or not.
		function trimDeadNodes(node)
		{
			if (node.isOutput)
			{
				return true;
			}

			var liveKids = [];
			for (var i = node.kids.length; i--; )
			{
				var kid = node.kids[i];
				if (trimDeadNodes(kid))
				{
					liveKids.push(kid);
				}
			}
			node.kids = liveKids;

			return liveKids.length > 0;
		}


		////  RENDERING  ////

		function initGraphics(elm, Module)
		{
			if (!('main' in Module))
			{
				throw new Error("'main' is missing! What do I display?!");
			}

			var signalGraph = Module.main;

			// make sure the signal graph is actually a signal & extract the visual model
			if (!('notify' in signalGraph))
			{
				signalGraph = Elm.Signal.make(elm).constant(signalGraph);
			}
			var initialScene = signalGraph.value;

			// Figure out what the render functions should be
			var render;
			var update;
			if (initialScene.ctor === 'Element_elm_builtin')
			{
				var Element = Elm.Native.Graphics.Element.make(elm);
				render = Element.render;
				update = Element.updateAndReplace;
			}
			else
			{
				var VirtualDom = Elm.Native.VirtualDom.make(elm);
				render = VirtualDom.render;
				update = VirtualDom.updateAndReplace;
			}

			// Add the initialScene to the DOM
			var container = elm.node;
			var node = render(initialScene);
			while (container.firstChild)
			{
				container.removeChild(container.firstChild);
			}
			container.appendChild(node);

			var _requestAnimationFrame =
				typeof requestAnimationFrame !== 'undefined'
					? requestAnimationFrame
					: function(cb) { setTimeout(cb, 1000 / 60); }
					;

			// domUpdate is called whenever the main Signal changes.
			//
			// domUpdate and drawCallback implement a small state machine in order
			// to schedule only 1 draw per animation frame. This enforces that
			// once draw has been called, it will not be called again until the
			// next frame.
			//
			// drawCallback is scheduled whenever
			// 1. The state transitions from PENDING_REQUEST to EXTRA_REQUEST, or
			// 2. The state transitions from NO_REQUEST to PENDING_REQUEST
			//
			// Invariants:
			// 1. In the NO_REQUEST state, there is never a scheduled drawCallback.
			// 2. In the PENDING_REQUEST and EXTRA_REQUEST states, there is always exactly 1
			//    scheduled drawCallback.
			var NO_REQUEST = 0;
			var PENDING_REQUEST = 1;
			var EXTRA_REQUEST = 2;
			var state = NO_REQUEST;
			var savedScene = initialScene;
			var scheduledScene = initialScene;

			function domUpdate(newScene)
			{
				scheduledScene = newScene;

				switch (state)
				{
					case NO_REQUEST:
						_requestAnimationFrame(drawCallback);
						state = PENDING_REQUEST;
						return;
					case PENDING_REQUEST:
						state = PENDING_REQUEST;
						return;
					case EXTRA_REQUEST:
						state = PENDING_REQUEST;
						return;
				}
			}

			function drawCallback()
			{
				switch (state)
				{
					case NO_REQUEST:
						// This state should not be possible. How can there be no
						// request, yet somehow we are actively fulfilling a
						// request?
						throw new Error(
							'Unexpected draw callback.\n' +
							'Please report this to <https://github.com/elm-lang/core/issues>.'
						);

					case PENDING_REQUEST:
						// At this point, we do not *know* that another frame is
						// needed, but we make an extra request to rAF just in
						// case. It's possible to drop a frame if rAF is called
						// too late, so we just do it preemptively.
						_requestAnimationFrame(drawCallback);
						state = EXTRA_REQUEST;

						// There's also stuff we definitely need to draw.
						draw();
						return;

					case EXTRA_REQUEST:
						// Turns out the extra request was not needed, so we will
						// stop calling rAF. No reason to call it all the time if
						// no one needs it.
						state = NO_REQUEST;
						return;
				}
			}

			function draw()
			{
				update(elm.node.firstChild, savedScene, scheduledScene);
				if (elm.Native.Window)
				{
					elm.Native.Window.values.resizeIfNeeded();
				}
				savedScene = scheduledScene;
			}

			var renderer = Elm.Native.Signal.make(elm).output('main', domUpdate, signalGraph);

			// must check for resize after 'renderer' is created so
			// that changes show up.
			if (elm.Native.Window)
			{
				elm.Native.Window.values.resizeIfNeeded();
			}

			return renderer;
		}

		//// HOT SWAPPING ////

		// Returns boolean indicating if the swap was successful.
		// Requires that the two signal graphs have exactly the same
		// structure.
		function hotSwap(from, to)
		{
			function similar(nodeOld, nodeNew)
			{
				if (nodeOld.id !== nodeNew.id)
				{
					return false;
				}
				if (nodeOld.isOutput)
				{
					return nodeNew.isOutput;
				}
				return nodeOld.kids.length === nodeNew.kids.length;
			}
			function swap(nodeOld, nodeNew)
			{
				nodeNew.value = nodeOld.value;
				return true;
			}
			var canSwap = depthFirstTraversals(similar, from.inputs, to.inputs);
			if (canSwap)
			{
				depthFirstTraversals(swap, from.inputs, to.inputs);
			}
			from.node.parentNode.replaceChild(to.node, from.node);

			return canSwap;
		}

		// Returns false if the node operation f ever fails.
		function depthFirstTraversals(f, queueOld, queueNew)
		{
			if (queueOld.length !== queueNew.length)
			{
				return false;
			}
			queueOld = queueOld.slice(0);
			queueNew = queueNew.slice(0);

			var seen = [];
			while (queueOld.length > 0 && queueNew.length > 0)
			{
				var nodeOld = queueOld.pop();
				var nodeNew = queueNew.pop();
				if (seen.indexOf(nodeOld.id) < 0)
				{
					if (!f(nodeOld, nodeNew))
					{
						return false;
					}
					queueOld = queueOld.concat(nodeOld.kids || []);
					queueNew = queueNew.concat(nodeNew.kids || []);
					seen.push(nodeOld.id);
				}
			}
			return true;
		}
	}());

	function F2(fun)
	{
		function wrapper(a) { return function(b) { return fun(a,b); }; }
		wrapper.arity = 2;
		wrapper.func = fun;
		return wrapper;
	}

	function F3(fun)
	{
		function wrapper(a) {
			return function(b) { return function(c) { return fun(a, b, c); }; };
		}
		wrapper.arity = 3;
		wrapper.func = fun;
		return wrapper;
	}

	function F4(fun)
	{
		function wrapper(a) { return function(b) { return function(c) {
			return function(d) { return fun(a, b, c, d); }; }; };
		}
		wrapper.arity = 4;
		wrapper.func = fun;
		return wrapper;
	}

	function F5(fun)
	{
		function wrapper(a) { return function(b) { return function(c) {
			return function(d) { return function(e) { return fun(a, b, c, d, e); }; }; }; };
		}
		wrapper.arity = 5;
		wrapper.func = fun;
		return wrapper;
	}

	function F6(fun)
	{
		function wrapper(a) { return function(b) { return function(c) {
			return function(d) { return function(e) { return function(f) {
			return fun(a, b, c, d, e, f); }; }; }; }; };
		}
		wrapper.arity = 6;
		wrapper.func = fun;
		return wrapper;
	}

	function F7(fun)
	{
		function wrapper(a) { return function(b) { return function(c) {
			return function(d) { return function(e) { return function(f) {
			return function(g) { return fun(a, b, c, d, e, f, g); }; }; }; }; }; };
		}
		wrapper.arity = 7;
		wrapper.func = fun;
		return wrapper;
	}

	function F8(fun)
	{
		function wrapper(a) { return function(b) { return function(c) {
			return function(d) { return function(e) { return function(f) {
			return function(g) { return function(h) {
			return fun(a, b, c, d, e, f, g, h); }; }; }; }; }; }; };
		}
		wrapper.arity = 8;
		wrapper.func = fun;
		return wrapper;
	}

	function F9(fun)
	{
		function wrapper(a) { return function(b) { return function(c) {
			return function(d) { return function(e) { return function(f) {
			return function(g) { return function(h) { return function(i) {
			return fun(a, b, c, d, e, f, g, h, i); }; }; }; }; }; }; }; };
		}
		wrapper.arity = 9;
		wrapper.func = fun;
		return wrapper;
	}

	function A2(fun, a, b)
	{
		return fun.arity === 2
			? fun.func(a, b)
			: fun(a)(b);
	}
	function A3(fun, a, b, c)
	{
		return fun.arity === 3
			? fun.func(a, b, c)
			: fun(a)(b)(c);
	}
	function A4(fun, a, b, c, d)
	{
		return fun.arity === 4
			? fun.func(a, b, c, d)
			: fun(a)(b)(c)(d);
	}
	function A5(fun, a, b, c, d, e)
	{
		return fun.arity === 5
			? fun.func(a, b, c, d, e)
			: fun(a)(b)(c)(d)(e);
	}
	function A6(fun, a, b, c, d, e, f)
	{
		return fun.arity === 6
			? fun.func(a, b, c, d, e, f)
			: fun(a)(b)(c)(d)(e)(f);
	}
	function A7(fun, a, b, c, d, e, f, g)
	{
		return fun.arity === 7
			? fun.func(a, b, c, d, e, f, g)
			: fun(a)(b)(c)(d)(e)(f)(g);
	}
	function A8(fun, a, b, c, d, e, f, g, h)
	{
		return fun.arity === 8
			? fun.func(a, b, c, d, e, f, g, h)
			: fun(a)(b)(c)(d)(e)(f)(g)(h);
	}
	function A9(fun, a, b, c, d, e, f, g, h, i)
	{
		return fun.arity === 9
			? fun.func(a, b, c, d, e, f, g, h, i)
			: fun(a)(b)(c)(d)(e)(f)(g)(h)(i);
	}
}

Elm.Native = Elm.Native || {};
Elm.Native.Utils = {};
Elm.Native.Utils.make = function(localRuntime) {
	localRuntime.Native = localRuntime.Native || {};
	localRuntime.Native.Utils = localRuntime.Native.Utils || {};
	if (localRuntime.Native.Utils.values)
	{
		return localRuntime.Native.Utils.values;
	}


	// COMPARISONS

	function eq(l, r)
	{
		var stack = [{'x': l, 'y': r}];
		while (stack.length > 0)
		{
			var front = stack.pop();
			var x = front.x;
			var y = front.y;
			if (x === y)
			{
				continue;
			}
			if (typeof x === 'object')
			{
				var c = 0;
				for (var i in x)
				{
					++c;
					if (i in y)
					{
						if (i !== 'ctor')
						{
							stack.push({ 'x': x[i], 'y': y[i] });
						}
					}
					else
					{
						return false;
					}
				}
				if ('ctor' in x)
				{
					stack.push({'x': x.ctor, 'y': y.ctor});
				}
				if (c !== Object.keys(y).length)
				{
					return false;
				}
			}
			else if (typeof x === 'function')
			{
				throw new Error('Equality error: general function equality is ' +
								'undecidable, and therefore, unsupported');
			}
			else
			{
				return false;
			}
		}
		return true;
	}

	// code in Generate/JavaScript.hs depends on the particular
	// integer values assigned to LT, EQ, and GT
	var LT = -1, EQ = 0, GT = 1, ord = ['LT', 'EQ', 'GT'];

	function compare(x, y)
	{
		return {
			ctor: ord[cmp(x, y) + 1]
		};
	}

	function cmp(x, y) {
		var ord;
		if (typeof x !== 'object')
		{
			return x === y ? EQ : x < y ? LT : GT;
		}
		else if (x.isChar)
		{
			var a = x.toString();
			var b = y.toString();
			return a === b
				? EQ
				: a < b
					? LT
					: GT;
		}
		else if (x.ctor === '::' || x.ctor === '[]')
		{
			while (true)
			{
				if (x.ctor === '[]' && y.ctor === '[]')
				{
					return EQ;
				}
				if (x.ctor !== y.ctor)
				{
					return x.ctor === '[]' ? LT : GT;
				}
				ord = cmp(x._0, y._0);
				if (ord !== EQ)
				{
					return ord;
				}
				x = x._1;
				y = y._1;
			}
		}
		else if (x.ctor.slice(0, 6) === '_Tuple')
		{
			var n = x.ctor.slice(6) - 0;
			var err = 'cannot compare tuples with more than 6 elements.';
			if (n === 0) return EQ;
			if (n >= 1) { ord = cmp(x._0, y._0); if (ord !== EQ) return ord;
			if (n >= 2) { ord = cmp(x._1, y._1); if (ord !== EQ) return ord;
			if (n >= 3) { ord = cmp(x._2, y._2); if (ord !== EQ) return ord;
			if (n >= 4) { ord = cmp(x._3, y._3); if (ord !== EQ) return ord;
			if (n >= 5) { ord = cmp(x._4, y._4); if (ord !== EQ) return ord;
			if (n >= 6) { ord = cmp(x._5, y._5); if (ord !== EQ) return ord;
			if (n >= 7) throw new Error('Comparison error: ' + err); } } } } } }
			return EQ;
		}
		else
		{
			throw new Error('Comparison error: comparison is only defined on ints, ' +
							'floats, times, chars, strings, lists of comparable values, ' +
							'and tuples of comparable values.');
		}
	}


	// TUPLES

	var Tuple0 = {
		ctor: '_Tuple0'
	};

	function Tuple2(x, y)
	{
		return {
			ctor: '_Tuple2',
			_0: x,
			_1: y
		};
	}


	// LITERALS

	function chr(c)
	{
		var x = new String(c);
		x.isChar = true;
		return x;
	}

	function txt(str)
	{
		var t = new String(str);
		t.text = true;
		return t;
	}


	// GUID

	var count = 0;
	function guid(_)
	{
		return count++;
	}


	// RECORDS

	function update(oldRecord, updatedFields)
	{
		var newRecord = {};
		for (var key in oldRecord)
		{
			var value = (key in updatedFields) ? updatedFields[key] : oldRecord[key];
			newRecord[key] = value;
		}
		return newRecord;
	}


	// MOUSE COORDINATES

	function getXY(e)
	{
		var posx = 0;
		var posy = 0;
		if (e.pageX || e.pageY)
		{
			posx = e.pageX;
			posy = e.pageY;
		}
		else if (e.clientX || e.clientY)
		{
			posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}

		if (localRuntime.isEmbed())
		{
			var rect = localRuntime.node.getBoundingClientRect();
			var relx = rect.left + document.body.scrollLeft + document.documentElement.scrollLeft;
			var rely = rect.top + document.body.scrollTop + document.documentElement.scrollTop;
			// TODO: figure out if there is a way to avoid rounding here
			posx = posx - Math.round(relx) - localRuntime.node.clientLeft;
			posy = posy - Math.round(rely) - localRuntime.node.clientTop;
		}
		return Tuple2(posx, posy);
	}


	//// LIST STUFF ////

	var Nil = { ctor: '[]' };

	function Cons(hd, tl)
	{
		return {
			ctor: '::',
			_0: hd,
			_1: tl
		};
	}

	function list(arr)
	{
		var out = Nil;
		for (var i = arr.length; i--; )
		{
			out = Cons(arr[i], out);
		}
		return out;
	}

	function range(lo, hi)
	{
		var list = Nil;
		if (lo <= hi)
		{
			do
			{
				list = Cons(hi, list);
			}
			while (hi-- > lo);
		}
		return list;
	}

	function append(xs, ys)
	{
		// append Strings
		if (typeof xs === 'string')
		{
			return xs + ys;
		}

		// append Text
		if (xs.ctor.slice(0, 5) === 'Text:')
		{
			return {
				ctor: 'Text:Append',
				_0: xs,
				_1: ys
			};
		}


		// append Lists
		if (xs.ctor === '[]')
		{
			return ys;
		}
		var root = Cons(xs._0, Nil);
		var curr = root;
		xs = xs._1;
		while (xs.ctor !== '[]')
		{
			curr._1 = Cons(xs._0, Nil);
			xs = xs._1;
			curr = curr._1;
		}
		curr._1 = ys;
		return root;
	}


	// CRASHES

	function crash(moduleName, region)
	{
		return function(message) {
			throw new Error(
				'Ran into a `Debug.crash` in module `' + moduleName + '` ' + regionToString(region) + '\n'
				+ 'The message provided by the code author is:\n\n    '
				+ message
			);
		};
	}

	function crashCase(moduleName, region, value)
	{
		return function(message) {
			throw new Error(
				'Ran into a `Debug.crash` in module `' + moduleName + '`\n\n'
				+ 'This was caused by the `case` expression ' + regionToString(region) + '.\n'
				+ 'One of the branches ended with a crash and the following value got through:\n\n    ' + toString(value) + '\n\n'
				+ 'The message provided by the code author is:\n\n    '
				+ message
			);
		};
	}

	function regionToString(region)
	{
		if (region.start.line == region.end.line)
		{
			return 'on line ' + region.start.line;
		}
		return 'between lines ' + region.start.line + ' and ' + region.end.line;
	}


	// BAD PORTS

	function badPort(expected, received)
	{
		throw new Error(
			'Runtime error when sending values through a port.\n\n'
			+ 'Expecting ' + expected + ' but was given ' + formatValue(received)
		);
	}

	function formatValue(value)
	{
		// Explicity format undefined values as "undefined"
		// because JSON.stringify(undefined) unhelpfully returns ""
		return (value === undefined) ? "undefined" : JSON.stringify(value);
	}


	// TO STRING

	var _Array;
	var Dict;
	var List;

	var toString = function(v)
	{
		var type = typeof v;
		if (type === 'function')
		{
			var name = v.func ? v.func.name : v.name;
			return '<function' + (name === '' ? '' : ': ') + name + '>';
		}
		else if (type === 'boolean')
		{
			return v ? 'True' : 'False';
		}
		else if (type === 'number')
		{
			return v + '';
		}
		else if ((v instanceof String) && v.isChar)
		{
			return '\'' + addSlashes(v, true) + '\'';
		}
		else if (type === 'string')
		{
			return '"' + addSlashes(v, false) + '"';
		}
		else if (type === 'object' && 'ctor' in v)
		{
			if (v.ctor.substring(0, 6) === '_Tuple')
			{
				var output = [];
				for (var k in v)
				{
					if (k === 'ctor') continue;
					output.push(toString(v[k]));
				}
				return '(' + output.join(',') + ')';
			}
			else if (v.ctor === '_Array')
			{
				if (!_Array)
				{
					_Array = Elm.Array.make(localRuntime);
				}
				var list = _Array.toList(v);
				return 'Array.fromList ' + toString(list);
			}
			else if (v.ctor === '::')
			{
				var output = '[' + toString(v._0);
				v = v._1;
				while (v.ctor === '::')
				{
					output += ',' + toString(v._0);
					v = v._1;
				}
				return output + ']';
			}
			else if (v.ctor === '[]')
			{
				return '[]';
			}
			else if (v.ctor === 'RBNode_elm_builtin' || v.ctor === 'RBEmpty_elm_builtin' || v.ctor === 'Set_elm_builtin')
			{
				if (!Dict)
				{
					Dict = Elm.Dict.make(localRuntime);
				}
				var list;
				var name;
				if (v.ctor === 'Set_elm_builtin')
				{
					if (!List)
					{
						List = Elm.List.make(localRuntime);
					}
					name = 'Set';
					list = A2(List.map, function(x) {return x._0; }, Dict.toList(v._0));
				}
				else
				{
					name = 'Dict';
					list = Dict.toList(v);
				}
				return name + '.fromList ' + toString(list);
			}
			else if (v.ctor.slice(0, 5) === 'Text:')
			{
				return '<text>';
			}
			else if (v.ctor === 'Element_elm_builtin')
			{
				return '<element>'
			}
			else if (v.ctor === 'Form_elm_builtin')
			{
				return '<form>'
			}
			else
			{
				var output = '';
				for (var i in v)
				{
					if (i === 'ctor') continue;
					var str = toString(v[i]);
					var parenless = str[0] === '{' || str[0] === '<' || str.indexOf(' ') < 0;
					output += ' ' + (parenless ? str : '(' + str + ')');
				}
				return v.ctor + output;
			}
		}
		else if (type === 'object' && 'notify' in v && 'id' in v)
		{
			return '<signal>';
		}
		else if (type === 'object')
		{
			var output = [];
			for (var k in v)
			{
				output.push(k + ' = ' + toString(v[k]));
			}
			if (output.length === 0)
			{
				return '{}';
			}
			return '{ ' + output.join(', ') + ' }';
		}
		return '<internal structure>';
	};

	function addSlashes(str, isChar)
	{
		var s = str.replace(/\\/g, '\\\\')
				  .replace(/\n/g, '\\n')
				  .replace(/\t/g, '\\t')
				  .replace(/\r/g, '\\r')
				  .replace(/\v/g, '\\v')
				  .replace(/\0/g, '\\0');
		if (isChar)
		{
			return s.replace(/\'/g, '\\\'');
		}
		else
		{
			return s.replace(/\"/g, '\\"');
		}
	}


	return localRuntime.Native.Utils.values = {
		eq: eq,
		cmp: cmp,
		compare: F2(compare),
		Tuple0: Tuple0,
		Tuple2: Tuple2,
		chr: chr,
		txt: txt,
		update: update,
		guid: guid,
		getXY: getXY,

		Nil: Nil,
		Cons: Cons,
		list: list,
		range: range,
		append: F2(append),

		crash: crash,
		crashCase: crashCase,
		badPort: badPort,

		toString: toString
	};
};

Elm.Basics = Elm.Basics || {};
Elm.Basics.make = function (_elm) {
   "use strict";
   _elm.Basics = _elm.Basics || {};
   if (_elm.Basics.values) return _elm.Basics.values;
   var _U = Elm.Native.Utils.make(_elm),$Native$Basics = Elm.Native.Basics.make(_elm),$Native$Utils = Elm.Native.Utils.make(_elm);
   var _op = {};
   var uncurry = F2(function (f,_p0) {    var _p1 = _p0;return A2(f,_p1._0,_p1._1);});
   var curry = F3(function (f,a,b) {    return f({ctor: "_Tuple2",_0: a,_1: b});});
   var flip = F3(function (f,b,a) {    return A2(f,a,b);});
   var snd = function (_p2) {    var _p3 = _p2;return _p3._1;};
   var fst = function (_p4) {    var _p5 = _p4;return _p5._0;};
   var always = F2(function (a,_p6) {    return a;});
   var identity = function (x) {    return x;};
   _op["<|"] = F2(function (f,x) {    return f(x);});
   _op["|>"] = F2(function (x,f) {    return f(x);});
   _op[">>"] = F3(function (f,g,x) {    return g(f(x));});
   _op["<<"] = F3(function (g,f,x) {    return g(f(x));});
   _op["++"] = $Native$Utils.append;
   var toString = $Native$Utils.toString;
   var isInfinite = $Native$Basics.isInfinite;
   var isNaN = $Native$Basics.isNaN;
   var toFloat = $Native$Basics.toFloat;
   var ceiling = $Native$Basics.ceiling;
   var floor = $Native$Basics.floor;
   var truncate = $Native$Basics.truncate;
   var round = $Native$Basics.round;
   var not = $Native$Basics.not;
   var xor = $Native$Basics.xor;
   _op["||"] = $Native$Basics.or;
   _op["&&"] = $Native$Basics.and;
   var max = $Native$Basics.max;
   var min = $Native$Basics.min;
   var GT = {ctor: "GT"};
   var EQ = {ctor: "EQ"};
   var LT = {ctor: "LT"};
   var compare = $Native$Basics.compare;
   _op[">="] = $Native$Basics.ge;
   _op["<="] = $Native$Basics.le;
   _op[">"] = $Native$Basics.gt;
   _op["<"] = $Native$Basics.lt;
   _op["/="] = $Native$Basics.neq;
   _op["=="] = $Native$Basics.eq;
   var e = $Native$Basics.e;
   var pi = $Native$Basics.pi;
   var clamp = $Native$Basics.clamp;
   var logBase = $Native$Basics.logBase;
   var abs = $Native$Basics.abs;
   var negate = $Native$Basics.negate;
   var sqrt = $Native$Basics.sqrt;
   var atan2 = $Native$Basics.atan2;
   var atan = $Native$Basics.atan;
   var asin = $Native$Basics.asin;
   var acos = $Native$Basics.acos;
   var tan = $Native$Basics.tan;
   var sin = $Native$Basics.sin;
   var cos = $Native$Basics.cos;
   _op["^"] = $Native$Basics.exp;
   _op["%"] = $Native$Basics.mod;
   var rem = $Native$Basics.rem;
   _op["//"] = $Native$Basics.div;
   _op["/"] = $Native$Basics.floatDiv;
   _op["*"] = $Native$Basics.mul;
   _op["-"] = $Native$Basics.sub;
   _op["+"] = $Native$Basics.add;
   var toPolar = $Native$Basics.toPolar;
   var fromPolar = $Native$Basics.fromPolar;
   var turns = $Native$Basics.turns;
   var degrees = $Native$Basics.degrees;
   var radians = function (t) {    return t;};
   return _elm.Basics.values = {_op: _op
                               ,max: max
                               ,min: min
                               ,compare: compare
                               ,not: not
                               ,xor: xor
                               ,rem: rem
                               ,negate: negate
                               ,abs: abs
                               ,sqrt: sqrt
                               ,clamp: clamp
                               ,logBase: logBase
                               ,e: e
                               ,pi: pi
                               ,cos: cos
                               ,sin: sin
                               ,tan: tan
                               ,acos: acos
                               ,asin: asin
                               ,atan: atan
                               ,atan2: atan2
                               ,round: round
                               ,floor: floor
                               ,ceiling: ceiling
                               ,truncate: truncate
                               ,toFloat: toFloat
                               ,degrees: degrees
                               ,radians: radians
                               ,turns: turns
                               ,toPolar: toPolar
                               ,fromPolar: fromPolar
                               ,isNaN: isNaN
                               ,isInfinite: isInfinite
                               ,toString: toString
                               ,fst: fst
                               ,snd: snd
                               ,identity: identity
                               ,always: always
                               ,flip: flip
                               ,curry: curry
                               ,uncurry: uncurry
                               ,LT: LT
                               ,EQ: EQ
                               ,GT: GT};
};
Elm.Maybe = Elm.Maybe || {};
Elm.Maybe.make = function (_elm) {
   "use strict";
   _elm.Maybe = _elm.Maybe || {};
   if (_elm.Maybe.values) return _elm.Maybe.values;
   var _U = Elm.Native.Utils.make(_elm);
   var _op = {};
   var withDefault = F2(function ($default,maybe) {    var _p0 = maybe;if (_p0.ctor === "Just") {    return _p0._0;} else {    return $default;}});
   var Nothing = {ctor: "Nothing"};
   var oneOf = function (maybes) {
      oneOf: while (true) {
         var _p1 = maybes;
         if (_p1.ctor === "[]") {
               return Nothing;
            } else {
               var _p3 = _p1._0;
               var _p2 = _p3;
               if (_p2.ctor === "Nothing") {
                     var _v3 = _p1._1;
                     maybes = _v3;
                     continue oneOf;
                  } else {
                     return _p3;
                  }
            }
      }
   };
   var andThen = F2(function (maybeValue,callback) {
      var _p4 = maybeValue;
      if (_p4.ctor === "Just") {
            return callback(_p4._0);
         } else {
            return Nothing;
         }
   });
   var Just = function (a) {    return {ctor: "Just",_0: a};};
   var map = F2(function (f,maybe) {    var _p5 = maybe;if (_p5.ctor === "Just") {    return Just(f(_p5._0));} else {    return Nothing;}});
   var map2 = F3(function (func,ma,mb) {
      var _p6 = {ctor: "_Tuple2",_0: ma,_1: mb};
      if (_p6.ctor === "_Tuple2" && _p6._0.ctor === "Just" && _p6._1.ctor === "Just") {
            return Just(A2(func,_p6._0._0,_p6._1._0));
         } else {
            return Nothing;
         }
   });
   var map3 = F4(function (func,ma,mb,mc) {
      var _p7 = {ctor: "_Tuple3",_0: ma,_1: mb,_2: mc};
      if (_p7.ctor === "_Tuple3" && _p7._0.ctor === "Just" && _p7._1.ctor === "Just" && _p7._2.ctor === "Just") {
            return Just(A3(func,_p7._0._0,_p7._1._0,_p7._2._0));
         } else {
            return Nothing;
         }
   });
   var map4 = F5(function (func,ma,mb,mc,md) {
      var _p8 = {ctor: "_Tuple4",_0: ma,_1: mb,_2: mc,_3: md};
      if (_p8.ctor === "_Tuple4" && _p8._0.ctor === "Just" && _p8._1.ctor === "Just" && _p8._2.ctor === "Just" && _p8._3.ctor === "Just") {
            return Just(A4(func,_p8._0._0,_p8._1._0,_p8._2._0,_p8._3._0));
         } else {
            return Nothing;
         }
   });
   var map5 = F6(function (func,ma,mb,mc,md,me) {
      var _p9 = {ctor: "_Tuple5",_0: ma,_1: mb,_2: mc,_3: md,_4: me};
      if (_p9.ctor === "_Tuple5" && _p9._0.ctor === "Just" && _p9._1.ctor === "Just" && _p9._2.ctor === "Just" && _p9._3.ctor === "Just" && _p9._4.ctor === "Just")
      {
            return Just(A5(func,_p9._0._0,_p9._1._0,_p9._2._0,_p9._3._0,_p9._4._0));
         } else {
            return Nothing;
         }
   });
   return _elm.Maybe.values = {_op: _op
                              ,andThen: andThen
                              ,map: map
                              ,map2: map2
                              ,map3: map3
                              ,map4: map4
                              ,map5: map5
                              ,withDefault: withDefault
                              ,oneOf: oneOf
                              ,Just: Just
                              ,Nothing: Nothing};
};
Elm.Native.List = {};
Elm.Native.List.make = function(localRuntime) {
	localRuntime.Native = localRuntime.Native || {};
	localRuntime.Native.List = localRuntime.Native.List || {};
	if (localRuntime.Native.List.values)
	{
		return localRuntime.Native.List.values;
	}
	if ('values' in Elm.Native.List)
	{
		return localRuntime.Native.List.values = Elm.Native.List.values;
	}

	var Utils = Elm.Native.Utils.make(localRuntime);

	var Nil = Utils.Nil;
	var Cons = Utils.Cons;

	var fromArray = Utils.list;

	function toArray(xs)
	{
		var out = [];
		while (xs.ctor !== '[]')
		{
			out.push(xs._0);
			xs = xs._1;
		}
		return out;
	}

	// f defined similarly for both foldl and foldr (NB: different from Haskell)
	// ie, foldl : (a -> b -> b) -> b -> [a] -> b
	function foldl(f, b, xs)
	{
		var acc = b;
		while (xs.ctor !== '[]')
		{
			acc = A2(f, xs._0, acc);
			xs = xs._1;
		}
		return acc;
	}

	function foldr(f, b, xs)
	{
		var arr = toArray(xs);
		var acc = b;
		for (var i = arr.length; i--; )
		{
			acc = A2(f, arr[i], acc);
		}
		return acc;
	}

	function map2(f, xs, ys)
	{
		var arr = [];
		while (xs.ctor !== '[]' && ys.ctor !== '[]')
		{
			arr.push(A2(f, xs._0, ys._0));
			xs = xs._1;
			ys = ys._1;
		}
		return fromArray(arr);
	}

	function map3(f, xs, ys, zs)
	{
		var arr = [];
		while (xs.ctor !== '[]' && ys.ctor !== '[]' && zs.ctor !== '[]')
		{
			arr.push(A3(f, xs._0, ys._0, zs._0));
			xs = xs._1;
			ys = ys._1;
			zs = zs._1;
		}
		return fromArray(arr);
	}

	function map4(f, ws, xs, ys, zs)
	{
		var arr = [];
		while (   ws.ctor !== '[]'
			   && xs.ctor !== '[]'
			   && ys.ctor !== '[]'
			   && zs.ctor !== '[]')
		{
			arr.push(A4(f, ws._0, xs._0, ys._0, zs._0));
			ws = ws._1;
			xs = xs._1;
			ys = ys._1;
			zs = zs._1;
		}
		return fromArray(arr);
	}

	function map5(f, vs, ws, xs, ys, zs)
	{
		var arr = [];
		while (   vs.ctor !== '[]'
			   && ws.ctor !== '[]'
			   && xs.ctor !== '[]'
			   && ys.ctor !== '[]'
			   && zs.ctor !== '[]')
		{
			arr.push(A5(f, vs._0, ws._0, xs._0, ys._0, zs._0));
			vs = vs._1;
			ws = ws._1;
			xs = xs._1;
			ys = ys._1;
			zs = zs._1;
		}
		return fromArray(arr);
	}

	function sortBy(f, xs)
	{
		return fromArray(toArray(xs).sort(function(a, b) {
			return Utils.cmp(f(a), f(b));
		}));
	}

	function sortWith(f, xs)
	{
		return fromArray(toArray(xs).sort(function(a, b) {
			var ord = f(a)(b).ctor;
			return ord === 'EQ' ? 0 : ord === 'LT' ? -1 : 1;
		}));
	}

	function take(n, xs)
	{
		var arr = [];
		while (xs.ctor !== '[]' && n > 0)
		{
			arr.push(xs._0);
			xs = xs._1;
			--n;
		}
		return fromArray(arr);
	}


	Elm.Native.List.values = {
		Nil: Nil,
		Cons: Cons,
		cons: F2(Cons),
		toArray: toArray,
		fromArray: fromArray,

		foldl: F3(foldl),
		foldr: F3(foldr),

		map2: F3(map2),
		map3: F4(map3),
		map4: F5(map4),
		map5: F6(map5),
		sortBy: F2(sortBy),
		sortWith: F2(sortWith),
		take: F2(take)
	};
	return localRuntime.Native.List.values = Elm.Native.List.values;
};

Elm.List = Elm.List || {};
Elm.List.make = function (_elm) {
   "use strict";
   _elm.List = _elm.List || {};
   if (_elm.List.values) return _elm.List.values;
   var _U = Elm.Native.Utils.make(_elm),$Basics = Elm.Basics.make(_elm),$Maybe = Elm.Maybe.make(_elm),$Native$List = Elm.Native.List.make(_elm);
   var _op = {};
   var sortWith = $Native$List.sortWith;
   var sortBy = $Native$List.sortBy;
   var sort = function (xs) {    return A2(sortBy,$Basics.identity,xs);};
   var drop = F2(function (n,list) {
      drop: while (true) if (_U.cmp(n,0) < 1) return list; else {
            var _p0 = list;
            if (_p0.ctor === "[]") {
                  return list;
               } else {
                  var _v1 = n - 1,_v2 = _p0._1;
                  n = _v1;
                  list = _v2;
                  continue drop;
               }
         }
   });
   var take = $Native$List.take;
   var map5 = $Native$List.map5;
   var map4 = $Native$List.map4;
   var map3 = $Native$List.map3;
   var map2 = $Native$List.map2;
   var any = F2(function (isOkay,list) {
      any: while (true) {
         var _p1 = list;
         if (_p1.ctor === "[]") {
               return false;
            } else {
               if (isOkay(_p1._0)) return true; else {
                     var _v4 = isOkay,_v5 = _p1._1;
                     isOkay = _v4;
                     list = _v5;
                     continue any;
                  }
            }
      }
   });
   var all = F2(function (isOkay,list) {    return $Basics.not(A2(any,function (_p2) {    return $Basics.not(isOkay(_p2));},list));});
   var foldr = $Native$List.foldr;
   var foldl = $Native$List.foldl;
   var length = function (xs) {    return A3(foldl,F2(function (_p3,i) {    return i + 1;}),0,xs);};
   var sum = function (numbers) {    return A3(foldl,F2(function (x,y) {    return x + y;}),0,numbers);};
   var product = function (numbers) {    return A3(foldl,F2(function (x,y) {    return x * y;}),1,numbers);};
   var maximum = function (list) {
      var _p4 = list;
      if (_p4.ctor === "::") {
            return $Maybe.Just(A3(foldl,$Basics.max,_p4._0,_p4._1));
         } else {
            return $Maybe.Nothing;
         }
   };
   var minimum = function (list) {
      var _p5 = list;
      if (_p5.ctor === "::") {
            return $Maybe.Just(A3(foldl,$Basics.min,_p5._0,_p5._1));
         } else {
            return $Maybe.Nothing;
         }
   };
   var indexedMap = F2(function (f,xs) {    return A3(map2,f,_U.range(0,length(xs) - 1),xs);});
   var member = F2(function (x,xs) {    return A2(any,function (a) {    return _U.eq(a,x);},xs);});
   var isEmpty = function (xs) {    var _p6 = xs;if (_p6.ctor === "[]") {    return true;} else {    return false;}};
   var tail = function (list) {    var _p7 = list;if (_p7.ctor === "::") {    return $Maybe.Just(_p7._1);} else {    return $Maybe.Nothing;}};
   var head = function (list) {    var _p8 = list;if (_p8.ctor === "::") {    return $Maybe.Just(_p8._0);} else {    return $Maybe.Nothing;}};
   _op["::"] = $Native$List.cons;
   var map = F2(function (f,xs) {    return A3(foldr,F2(function (x,acc) {    return A2(_op["::"],f(x),acc);}),_U.list([]),xs);});
   var filter = F2(function (pred,xs) {
      var conditionalCons = F2(function (x,xs$) {    return pred(x) ? A2(_op["::"],x,xs$) : xs$;});
      return A3(foldr,conditionalCons,_U.list([]),xs);
   });
   var maybeCons = F3(function (f,mx,xs) {    var _p9 = f(mx);if (_p9.ctor === "Just") {    return A2(_op["::"],_p9._0,xs);} else {    return xs;}});
   var filterMap = F2(function (f,xs) {    return A3(foldr,maybeCons(f),_U.list([]),xs);});
   var reverse = function (list) {    return A3(foldl,F2(function (x,y) {    return A2(_op["::"],x,y);}),_U.list([]),list);};
   var scanl = F3(function (f,b,xs) {
      var scan1 = F2(function (x,accAcc) {
         var _p10 = accAcc;
         if (_p10.ctor === "::") {
               return A2(_op["::"],A2(f,x,_p10._0),accAcc);
            } else {
               return _U.list([]);
            }
      });
      return reverse(A3(foldl,scan1,_U.list([b]),xs));
   });
   var append = F2(function (xs,ys) {
      var _p11 = ys;
      if (_p11.ctor === "[]") {
            return xs;
         } else {
            return A3(foldr,F2(function (x,y) {    return A2(_op["::"],x,y);}),ys,xs);
         }
   });
   var concat = function (lists) {    return A3(foldr,append,_U.list([]),lists);};
   var concatMap = F2(function (f,list) {    return concat(A2(map,f,list));});
   var partition = F2(function (pred,list) {
      var step = F2(function (x,_p12) {
         var _p13 = _p12;
         var _p15 = _p13._0;
         var _p14 = _p13._1;
         return pred(x) ? {ctor: "_Tuple2",_0: A2(_op["::"],x,_p15),_1: _p14} : {ctor: "_Tuple2",_0: _p15,_1: A2(_op["::"],x,_p14)};
      });
      return A3(foldr,step,{ctor: "_Tuple2",_0: _U.list([]),_1: _U.list([])},list);
   });
   var unzip = function (pairs) {
      var step = F2(function (_p17,_p16) {
         var _p18 = _p17;
         var _p19 = _p16;
         return {ctor: "_Tuple2",_0: A2(_op["::"],_p18._0,_p19._0),_1: A2(_op["::"],_p18._1,_p19._1)};
      });
      return A3(foldr,step,{ctor: "_Tuple2",_0: _U.list([]),_1: _U.list([])},pairs);
   };
   var intersperse = F2(function (sep,xs) {
      var _p20 = xs;
      if (_p20.ctor === "[]") {
            return _U.list([]);
         } else {
            var step = F2(function (x,rest) {    return A2(_op["::"],sep,A2(_op["::"],x,rest));});
            var spersed = A3(foldr,step,_U.list([]),_p20._1);
            return A2(_op["::"],_p20._0,spersed);
         }
   });
   var repeatHelp = F3(function (result,n,value) {
      repeatHelp: while (true) if (_U.cmp(n,0) < 1) return result; else {
            var _v18 = A2(_op["::"],value,result),_v19 = n - 1,_v20 = value;
            result = _v18;
            n = _v19;
            value = _v20;
            continue repeatHelp;
         }
   });
   var repeat = F2(function (n,value) {    return A3(repeatHelp,_U.list([]),n,value);});
   return _elm.List.values = {_op: _op
                             ,isEmpty: isEmpty
                             ,length: length
                             ,reverse: reverse
                             ,member: member
                             ,head: head
                             ,tail: tail
                             ,filter: filter
                             ,take: take
                             ,drop: drop
                             ,repeat: repeat
                             ,append: append
                             ,concat: concat
                             ,intersperse: intersperse
                             ,partition: partition
                             ,unzip: unzip
                             ,map: map
                             ,map2: map2
                             ,map3: map3
                             ,map4: map4
                             ,map5: map5
                             ,filterMap: filterMap
                             ,concatMap: concatMap
                             ,indexedMap: indexedMap
                             ,foldr: foldr
                             ,foldl: foldl
                             ,sum: sum
                             ,product: product
                             ,maximum: maximum
                             ,minimum: minimum
                             ,all: all
                             ,any: any
                             ,scanl: scanl
                             ,sort: sort
                             ,sortBy: sortBy
                             ,sortWith: sortWith};
};
Elm.Native.Transform2D = {};
Elm.Native.Transform2D.make = function(localRuntime) {
	localRuntime.Native = localRuntime.Native || {};
	localRuntime.Native.Transform2D = localRuntime.Native.Transform2D || {};
	if (localRuntime.Native.Transform2D.values)
	{
		return localRuntime.Native.Transform2D.values;
	}

	var A;
	if (typeof Float32Array === 'undefined')
	{
		A = function(arr)
		{
			this.length = arr.length;
			this[0] = arr[0];
			this[1] = arr[1];
			this[2] = arr[2];
			this[3] = arr[3];
			this[4] = arr[4];
			this[5] = arr[5];
		};
	}
	else
	{
		A = Float32Array;
	}

	// layout of matrix in an array is
	//
	//   | m11 m12 dx |
	//   | m21 m22 dy |
	//   |  0   0   1 |
	//
	//  new A([ m11, m12, dx, m21, m22, dy ])

	var identity = new A([1, 0, 0, 0, 1, 0]);
	function matrix(m11, m12, m21, m22, dx, dy)
	{
		return new A([m11, m12, dx, m21, m22, dy]);
	}

	function rotation(t)
	{
		var c = Math.cos(t);
		var s = Math.sin(t);
		return new A([c, -s, 0, s, c, 0]);
	}

	function rotate(t, m)
	{
		var c = Math.cos(t);
		var s = Math.sin(t);
		var m11 = m[0], m12 = m[1], m21 = m[3], m22 = m[4];
		return new A([m11 * c + m12 * s, -m11 * s + m12 * c, m[2],
					  m21 * c + m22 * s, -m21 * s + m22 * c, m[5]]);
	}
	/*
	function move(xy,m) {
		var x = xy._0;
		var y = xy._1;
		var m11 = m[0], m12 = m[1], m21 = m[3], m22 = m[4];
		return new A([m11, m12, m11*x + m12*y + m[2],
					  m21, m22, m21*x + m22*y + m[5]]);
	}
	function scale(s,m) { return new A([m[0]*s, m[1]*s, m[2], m[3]*s, m[4]*s, m[5]]); }
	function scaleX(x,m) { return new A([m[0]*x, m[1], m[2], m[3]*x, m[4], m[5]]); }
	function scaleY(y,m) { return new A([m[0], m[1]*y, m[2], m[3], m[4]*y, m[5]]); }
	function reflectX(m) { return new A([-m[0], m[1], m[2], -m[3], m[4], m[5]]); }
	function reflectY(m) { return new A([m[0], -m[1], m[2], m[3], -m[4], m[5]]); }

	function transform(m11, m21, m12, m22, mdx, mdy, n) {
		var n11 = n[0], n12 = n[1], n21 = n[3], n22 = n[4], ndx = n[2], ndy = n[5];
		return new A([m11*n11 + m12*n21,
					  m11*n12 + m12*n22,
					  m11*ndx + m12*ndy + mdx,
					  m21*n11 + m22*n21,
					  m21*n12 + m22*n22,
					  m21*ndx + m22*ndy + mdy]);
	}
	*/
	function multiply(m, n)
	{
		var m11 = m[0], m12 = m[1], m21 = m[3], m22 = m[4], mdx = m[2], mdy = m[5];
		var n11 = n[0], n12 = n[1], n21 = n[3], n22 = n[4], ndx = n[2], ndy = n[5];
		return new A([m11 * n11 + m12 * n21,
					  m11 * n12 + m12 * n22,
					  m11 * ndx + m12 * ndy + mdx,
					  m21 * n11 + m22 * n21,
					  m21 * n12 + m22 * n22,
					  m21 * ndx + m22 * ndy + mdy]);
	}

	return localRuntime.Native.Transform2D.values = {
		identity: identity,
		matrix: F6(matrix),
		rotation: rotation,
		multiply: F2(multiply)
		/*
		transform: F7(transform),
		rotate: F2(rotate),
		move: F2(move),
		scale: F2(scale),
		scaleX: F2(scaleX),
		scaleY: F2(scaleY),
		reflectX: reflectX,
		reflectY: reflectY
		*/
	};
};

Elm.Transform2D = Elm.Transform2D || {};
Elm.Transform2D.make = function (_elm) {
   "use strict";
   _elm.Transform2D = _elm.Transform2D || {};
   if (_elm.Transform2D.values) return _elm.Transform2D.values;
   var _U = Elm.Native.Utils.make(_elm),$Native$Transform2D = Elm.Native.Transform2D.make(_elm);
   var _op = {};
   var multiply = $Native$Transform2D.multiply;
   var rotation = $Native$Transform2D.rotation;
   var matrix = $Native$Transform2D.matrix;
   var translation = F2(function (x,y) {    return A6(matrix,1,0,0,1,x,y);});
   var scale = function (s) {    return A6(matrix,s,0,0,s,0,0);};
   var scaleX = function (x) {    return A6(matrix,x,0,0,1,0,0);};
   var scaleY = function (y) {    return A6(matrix,1,0,0,y,0,0);};
   var identity = $Native$Transform2D.identity;
   var Transform2D = {ctor: "Transform2D"};
   return _elm.Transform2D.values = {_op: _op
                                    ,identity: identity
                                    ,matrix: matrix
                                    ,multiply: multiply
                                    ,rotation: rotation
                                    ,translation: translation
                                    ,scale: scale
                                    ,scaleX: scaleX
                                    ,scaleY: scaleY};
};

// setup
Elm.Native = Elm.Native || {};
Elm.Native.Graphics = Elm.Native.Graphics || {};
Elm.Native.Graphics.Collage = Elm.Native.Graphics.Collage || {};

// definition
Elm.Native.Graphics.Collage.make = function(localRuntime) {
	'use strict';

	// attempt to short-circuit
	localRuntime.Native = localRuntime.Native || {};
	localRuntime.Native.Graphics = localRuntime.Native.Graphics || {};
	localRuntime.Native.Graphics.Collage = localRuntime.Native.Graphics.Collage || {};
	if ('values' in localRuntime.Native.Graphics.Collage)
	{
		return localRuntime.Native.Graphics.Collage.values;
	}

	// okay, we cannot short-ciruit, so now we define everything
	var Color = Elm.Native.Color.make(localRuntime);
	var List = Elm.Native.List.make(localRuntime);
	var NativeElement = Elm.Native.Graphics.Element.make(localRuntime);
	var Transform = Elm.Transform2D.make(localRuntime);
	var Utils = Elm.Native.Utils.make(localRuntime);

	function setStrokeStyle(ctx, style)
	{
		ctx.lineWidth = style.width;

		var cap = style.cap.ctor;
		ctx.lineCap = cap === 'Flat'
			? 'butt'
			: cap === 'Round'
				? 'round'
				: 'square';

		var join = style.join.ctor;
		ctx.lineJoin = join === 'Smooth'
			? 'round'
			: join === 'Sharp'
				? 'miter'
				: 'bevel';

		ctx.miterLimit = style.join._0 || 10;
		ctx.strokeStyle = Color.toCss(style.color);
	}

	function setFillStyle(redo, ctx, style)
	{
		var sty = style.ctor;
		ctx.fillStyle = sty === 'Solid'
			? Color.toCss(style._0)
			: sty === 'Texture'
				? texture(redo, ctx, style._0)
				: gradient(ctx, style._0);
	}

	function trace(ctx, path)
	{
		var points = List.toArray(path);
		var i = points.length - 1;
		if (i <= 0)
		{
			return;
		}
		ctx.moveTo(points[i]._0, points[i]._1);
		while (i--)
		{
			ctx.lineTo(points[i]._0, points[i]._1);
		}
		if (path.closed)
		{
			i = points.length - 1;
			ctx.lineTo(points[i]._0, points[i]._1);
		}
	}

	function line(ctx, style, path)
	{
		if (style.dashing.ctor === '[]')
		{
			trace(ctx, path);
		}
		else
		{
			customLineHelp(ctx, style, path);
		}
		ctx.scale(1, -1);
		ctx.stroke();
	}

	function customLineHelp(ctx, style, path)
	{
		var points = List.toArray(path);
		if (path.closed)
		{
			points.push(points[0]);
		}
		var pattern = List.toArray(style.dashing);
		var i = points.length - 1;
		if (i <= 0)
		{
			return;
		}
		var x0 = points[i]._0, y0 = points[i]._1;
		var x1 = 0, y1 = 0, dx = 0, dy = 0, remaining = 0;
		var pindex = 0, plen = pattern.length;
		var draw = true, segmentLength = pattern[0];
		ctx.moveTo(x0, y0);
		while (i--)
		{
			x1 = points[i]._0;
			y1 = points[i]._1;
			dx = x1 - x0;
			dy = y1 - y0;
			remaining = Math.sqrt(dx * dx + dy * dy);
			while (segmentLength <= remaining)
			{
				x0 += dx * segmentLength / remaining;
				y0 += dy * segmentLength / remaining;
				ctx[draw ? 'lineTo' : 'moveTo'](x0, y0);
				// update starting position
				dx = x1 - x0;
				dy = y1 - y0;
				remaining = Math.sqrt(dx * dx + dy * dy);
				// update pattern
				draw = !draw;
				pindex = (pindex + 1) % plen;
				segmentLength = pattern[pindex];
			}
			if (remaining > 0)
			{
				ctx[draw ? 'lineTo' : 'moveTo'](x1, y1);
				segmentLength -= remaining;
			}
			x0 = x1;
			y0 = y1;
		}
	}

	function drawLine(ctx, style, path)
	{
		setStrokeStyle(ctx, style);
		return line(ctx, style, path);
	}

	function texture(redo, ctx, src)
	{
		var img = new Image();
		img.src = src;
		img.onload = redo;
		return ctx.createPattern(img, 'repeat');
	}

	function gradient(ctx, grad)
	{
		var g;
		var stops = [];
		if (grad.ctor === 'Linear')
		{
			var p0 = grad._0, p1 = grad._1;
			g = ctx.createLinearGradient(p0._0, -p0._1, p1._0, -p1._1);
			stops = List.toArray(grad._2);
		}
		else
		{
			var p0 = grad._0, p2 = grad._2;
			g = ctx.createRadialGradient(p0._0, -p0._1, grad._1, p2._0, -p2._1, grad._3);
			stops = List.toArray(grad._4);
		}
		var len = stops.length;
		for (var i = 0; i < len; ++i)
		{
			var stop = stops[i];
			g.addColorStop(stop._0, Color.toCss(stop._1));
		}
		return g;
	}

	function drawShape(redo, ctx, style, path)
	{
		trace(ctx, path);
		setFillStyle(redo, ctx, style);
		ctx.scale(1, -1);
		ctx.fill();
	}


	// TEXT RENDERING

	function fillText(redo, ctx, text)
	{
		drawText(ctx, text, ctx.fillText);
	}

	function strokeText(redo, ctx, style, text)
	{
		setStrokeStyle(ctx, style);
		// Use native canvas API for dashes only for text for now
		// Degrades to non-dashed on IE 9 + 10
		if (style.dashing.ctor !== '[]' && ctx.setLineDash)
		{
			var pattern = List.toArray(style.dashing);
			ctx.setLineDash(pattern);
		}
		drawText(ctx, text, ctx.strokeText);
	}

	function drawText(ctx, text, canvasDrawFn)
	{
		var textChunks = chunkText(defaultContext, text);

		var totalWidth = 0;
		var maxHeight = 0;
		var numChunks = textChunks.length;

		ctx.scale(1,-1);

		for (var i = numChunks; i--; )
		{
			var chunk = textChunks[i];
			ctx.font = chunk.font;
			var metrics = ctx.measureText(chunk.text);
			chunk.width = metrics.width;
			totalWidth += chunk.width;
			if (chunk.height > maxHeight)
			{
				maxHeight = chunk.height;
			}
		}

		var x = -totalWidth / 2.0;
		for (var i = 0; i < numChunks; ++i)
		{
			var chunk = textChunks[i];
			ctx.font = chunk.font;
			ctx.fillStyle = chunk.color;
			canvasDrawFn.call(ctx, chunk.text, x, maxHeight / 2);
			x += chunk.width;
		}
	}

	function toFont(props)
	{
		return [
			props['font-style'],
			props['font-variant'],
			props['font-weight'],
			props['font-size'],
			props['font-family']
		].join(' ');
	}


	// Convert the object returned by the text module
	// into something we can use for styling canvas text
	function chunkText(context, text)
	{
		var tag = text.ctor;
		if (tag === 'Text:Append')
		{
			var leftChunks = chunkText(context, text._0);
			var rightChunks = chunkText(context, text._1);
			return leftChunks.concat(rightChunks);
		}
		if (tag === 'Text:Text')
		{
			return [{
				text: text._0,
				color: context.color,
				height: context['font-size'].slice(0, -2) | 0,
				font: toFont(context)
			}];
		}
		if (tag === 'Text:Meta')
		{
			var newContext = freshContext(text._0, context);
			return chunkText(newContext, text._1);
		}
	}

	function freshContext(props, ctx)
	{
		return {
			'font-style': props['font-style'] || ctx['font-style'],
			'font-variant': props['font-variant'] || ctx['font-variant'],
			'font-weight': props['font-weight'] || ctx['font-weight'],
			'font-size': props['font-size'] || ctx['font-size'],
			'font-family': props['font-family'] || ctx['font-family'],
			'color': props['color'] || ctx['color']
		};
	}

	var defaultContext = {
		'font-style': 'normal',
		'font-variant': 'normal',
		'font-weight': 'normal',
		'font-size': '12px',
		'font-family': 'sans-serif',
		'color': 'black'
	};


	// IMAGES

	function drawImage(redo, ctx, form)
	{
		var img = new Image();
		img.onload = redo;
		img.src = form._3;
		var w = form._0,
			h = form._1,
			pos = form._2,
			srcX = pos._0,
			srcY = pos._1,
			srcW = w,
			srcH = h,
			destX = -w / 2,
			destY = -h / 2,
			destW = w,
			destH = h;

		ctx.scale(1, -1);
		ctx.drawImage(img, srcX, srcY, srcW, srcH, destX, destY, destW, destH);
	}

	function renderForm(redo, ctx, form)
	{
		ctx.save();

		var x = form.x,
			y = form.y,
			theta = form.theta,
			scale = form.scale;

		if (x !== 0 || y !== 0)
		{
			ctx.translate(x, y);
		}
		if (theta !== 0)
		{
			ctx.rotate(theta % (Math.PI * 2));
		}
		if (scale !== 1)
		{
			ctx.scale(scale, scale);
		}
		if (form.alpha !== 1)
		{
			ctx.globalAlpha = ctx.globalAlpha * form.alpha;
		}

		ctx.beginPath();
		var f = form.form;
		switch (f.ctor)
		{
			case 'FPath':
				drawLine(ctx, f._0, f._1);
				break;

			case 'FImage':
				drawImage(redo, ctx, f);
				break;

			case 'FShape':
				if (f._0.ctor === 'Line')
				{
					f._1.closed = true;
					drawLine(ctx, f._0._0, f._1);
				}
				else
				{
					drawShape(redo, ctx, f._0._0, f._1);
				}
				break;

			case 'FText':
				fillText(redo, ctx, f._0);
				break;

			case 'FOutlinedText':
				strokeText(redo, ctx, f._0, f._1);
				break;
		}
		ctx.restore();
	}

	function formToMatrix(form)
	{
	   var scale = form.scale;
	   var matrix = A6( Transform.matrix, scale, 0, 0, scale, form.x, form.y );

	   var theta = form.theta;
	   if (theta !== 0)
	   {
		   matrix = A2( Transform.multiply, matrix, Transform.rotation(theta) );
	   }

	   return matrix;
	}

	function str(n)
	{
		if (n < 0.00001 && n > -0.00001)
		{
			return 0;
		}
		return n;
	}

	function makeTransform(w, h, form, matrices)
	{
		var props = form.form._0._0.props;
		var m = A6( Transform.matrix, 1, 0, 0, -1,
					(w - props.width ) / 2,
					(h - props.height) / 2 );
		var len = matrices.length;
		for (var i = 0; i < len; ++i)
		{
			m = A2( Transform.multiply, m, matrices[i] );
		}
		m = A2( Transform.multiply, m, formToMatrix(form) );

		return 'matrix(' +
			str( m[0]) + ', ' + str( m[3]) + ', ' +
			str(-m[1]) + ', ' + str(-m[4]) + ', ' +
			str( m[2]) + ', ' + str( m[5]) + ')';
	}

	function stepperHelp(list)
	{
		var arr = List.toArray(list);
		var i = 0;
		function peekNext()
		{
			return i < arr.length ? arr[i]._0.form.ctor : '';
		}
		// assumes that there is a next element
		function next()
		{
			var out = arr[i]._0;
			++i;
			return out;
		}
		return {
			peekNext: peekNext,
			next: next
		};
	}

	function formStepper(forms)
	{
		var ps = [stepperHelp(forms)];
		var matrices = [];
		var alphas = [];
		function peekNext()
		{
			var len = ps.length;
			var formType = '';
			for (var i = 0; i < len; ++i )
			{
				if (formType = ps[i].peekNext()) return formType;
			}
			return '';
		}
		// assumes that there is a next element
		function next(ctx)
		{
			while (!ps[0].peekNext())
			{
				ps.shift();
				matrices.pop();
				alphas.shift();
				if (ctx)
				{
					ctx.restore();
				}
			}
			var out = ps[0].next();
			var f = out.form;
			if (f.ctor === 'FGroup')
			{
				ps.unshift(stepperHelp(f._1));
				var m = A2(Transform.multiply, f._0, formToMatrix(out));
				ctx.save();
				ctx.transform(m[0], m[3], m[1], m[4], m[2], m[5]);
				matrices.push(m);

				var alpha = (alphas[0] || 1) * out.alpha;
				alphas.unshift(alpha);
				ctx.globalAlpha = alpha;
			}
			return out;
		}
		function transforms()
		{
			return matrices;
		}
		function alpha()
		{
			return alphas[0] || 1;
		}
		return {
			peekNext: peekNext,
			next: next,
			transforms: transforms,
			alpha: alpha
		};
	}

	function makeCanvas(w, h)
	{
		var canvas = NativeElement.createNode('canvas');
		canvas.style.width  = w + 'px';
		canvas.style.height = h + 'px';
		canvas.style.display = 'block';
		canvas.style.position = 'absolute';
		var ratio = window.devicePixelRatio || 1;
		canvas.width  = w * ratio;
		canvas.height = h * ratio;
		return canvas;
	}

	function render(model)
	{
		var div = NativeElement.createNode('div');
		div.style.overflow = 'hidden';
		div.style.position = 'relative';
		update(div, model, model);
		return div;
	}

	function nodeStepper(w, h, div)
	{
		var kids = div.childNodes;
		var i = 0;
		var ratio = window.devicePixelRatio || 1;

		function transform(transforms, ctx)
		{
			ctx.translate( w / 2 * ratio, h / 2 * ratio );
			ctx.scale( ratio, -ratio );
			var len = transforms.length;
			for (var i = 0; i < len; ++i)
			{
				var m = transforms[i];
				ctx.save();
				ctx.transform(m[0], m[3], m[1], m[4], m[2], m[5]);
			}
			return ctx;
		}
		function nextContext(transforms)
		{
			while (i < kids.length)
			{
				var node = kids[i];
				if (node.getContext)
				{
					node.width = w * ratio;
					node.height = h * ratio;
					node.style.width = w + 'px';
					node.style.height = h + 'px';
					++i;
					return transform(transforms, node.getContext('2d'));
				}
				div.removeChild(node);
			}
			var canvas = makeCanvas(w, h);
			div.appendChild(canvas);
			// we have added a new node, so we must step our position
			++i;
			return transform(transforms, canvas.getContext('2d'));
		}
		function addElement(matrices, alpha, form)
		{
			var kid = kids[i];
			var elem = form.form._0;

			var node = (!kid || kid.getContext)
				? NativeElement.render(elem)
				: NativeElement.update(kid, kid.oldElement, elem);

			node.style.position = 'absolute';
			node.style.opacity = alpha * form.alpha * elem._0.props.opacity;
			NativeElement.addTransform(node.style, makeTransform(w, h, form, matrices));
			node.oldElement = elem;
			++i;
			if (!kid)
			{
				div.appendChild(node);
			}
			else
			{
				div.insertBefore(node, kid);
			}
		}
		function clearRest()
		{
			while (i < kids.length)
			{
				div.removeChild(kids[i]);
			}
		}
		return {
			nextContext: nextContext,
			addElement: addElement,
			clearRest: clearRest
		};
	}


	function update(div, _, model)
	{
		var w = model.w;
		var h = model.h;

		var forms = formStepper(model.forms);
		var nodes = nodeStepper(w, h, div);
		var ctx = null;
		var formType = '';

		while (formType = forms.peekNext())
		{
			// make sure we have context if we need it
			if (ctx === null && formType !== 'FElement')
			{
				ctx = nodes.nextContext(forms.transforms());
				ctx.globalAlpha = forms.alpha();
			}

			var form = forms.next(ctx);
			// if it is FGroup, all updates are made within formStepper when next is called.
			if (formType === 'FElement')
			{
				// update or insert an element, get a new context
				nodes.addElement(forms.transforms(), forms.alpha(), form);
				ctx = null;
			}
			else if (formType !== 'FGroup')
			{
				renderForm(function() { update(div, model, model); }, ctx, form);
			}
		}
		nodes.clearRest();
		return div;
	}


	function collage(w, h, forms)
	{
		return A3(NativeElement.newElement, w, h, {
			ctor: 'Custom',
			type: 'Collage',
			render: render,
			update: update,
			model: {w: w, h: h, forms: forms}
		});
	}

	return localRuntime.Native.Graphics.Collage.values = {
		collage: F3(collage)
	};
};

Elm.Native.Color = {};
Elm.Native.Color.make = function(localRuntime) {
	localRuntime.Native = localRuntime.Native || {};
	localRuntime.Native.Color = localRuntime.Native.Color || {};
	if (localRuntime.Native.Color.values)
	{
		return localRuntime.Native.Color.values;
	}

	function toCss(c)
	{
		var format = '';
		var colors = '';
		if (c.ctor === 'RGBA')
		{
			format = 'rgb';
			colors = c._0 + ', ' + c._1 + ', ' + c._2;
		}
		else
		{
			format = 'hsl';
			colors = (c._0 * 180 / Math.PI) + ', ' +
					 (c._1 * 100) + '%, ' +
					 (c._2 * 100) + '%';
		}
		if (c._3 === 1)
		{
			return format + '(' + colors + ')';
		}
		else
		{
			return format + 'a(' + colors + ', ' + c._3 + ')';
		}
	}

	return localRuntime.Native.Color.values = {
		toCss: toCss
	};
};

Elm.Color = Elm.Color || {};
Elm.Color.make = function (_elm) {
   "use strict";
   _elm.Color = _elm.Color || {};
   if (_elm.Color.values) return _elm.Color.values;
   var _U = Elm.Native.Utils.make(_elm),$Basics = Elm.Basics.make(_elm);
   var _op = {};
   var Radial = F5(function (a,b,c,d,e) {    return {ctor: "Radial",_0: a,_1: b,_2: c,_3: d,_4: e};});
   var radial = Radial;
   var Linear = F3(function (a,b,c) {    return {ctor: "Linear",_0: a,_1: b,_2: c};});
   var linear = Linear;
   var fmod = F2(function (f,n) {    var integer = $Basics.floor(f);return $Basics.toFloat(A2($Basics._op["%"],integer,n)) + f - $Basics.toFloat(integer);});
   var rgbToHsl = F3(function (red,green,blue) {
      var b = $Basics.toFloat(blue) / 255;
      var g = $Basics.toFloat(green) / 255;
      var r = $Basics.toFloat(red) / 255;
      var cMax = A2($Basics.max,A2($Basics.max,r,g),b);
      var cMin = A2($Basics.min,A2($Basics.min,r,g),b);
      var c = cMax - cMin;
      var lightness = (cMax + cMin) / 2;
      var saturation = _U.eq(lightness,0) ? 0 : c / (1 - $Basics.abs(2 * lightness - 1));
      var hue = $Basics.degrees(60) * (_U.eq(cMax,r) ? A2(fmod,(g - b) / c,6) : _U.eq(cMax,g) ? (b - r) / c + 2 : (r - g) / c + 4);
      return {ctor: "_Tuple3",_0: hue,_1: saturation,_2: lightness};
   });
   var hslToRgb = F3(function (hue,saturation,lightness) {
      var hue$ = hue / $Basics.degrees(60);
      var chroma = (1 - $Basics.abs(2 * lightness - 1)) * saturation;
      var x = chroma * (1 - $Basics.abs(A2(fmod,hue$,2) - 1));
      var _p0 = _U.cmp(hue$,0) < 0 ? {ctor: "_Tuple3",_0: 0,_1: 0,_2: 0} : _U.cmp(hue$,1) < 0 ? {ctor: "_Tuple3",_0: chroma,_1: x,_2: 0} : _U.cmp(hue$,
      2) < 0 ? {ctor: "_Tuple3",_0: x,_1: chroma,_2: 0} : _U.cmp(hue$,3) < 0 ? {ctor: "_Tuple3",_0: 0,_1: chroma,_2: x} : _U.cmp(hue$,4) < 0 ? {ctor: "_Tuple3"
                                                                                                                                               ,_0: 0
                                                                                                                                               ,_1: x
                                                                                                                                               ,_2: chroma} : _U.cmp(hue$,
      5) < 0 ? {ctor: "_Tuple3",_0: x,_1: 0,_2: chroma} : _U.cmp(hue$,6) < 0 ? {ctor: "_Tuple3",_0: chroma,_1: 0,_2: x} : {ctor: "_Tuple3",_0: 0,_1: 0,_2: 0};
      var r = _p0._0;
      var g = _p0._1;
      var b = _p0._2;
      var m = lightness - chroma / 2;
      return {ctor: "_Tuple3",_0: r + m,_1: g + m,_2: b + m};
   });
   var toRgb = function (color) {
      var _p1 = color;
      if (_p1.ctor === "RGBA") {
            return {red: _p1._0,green: _p1._1,blue: _p1._2,alpha: _p1._3};
         } else {
            var _p2 = A3(hslToRgb,_p1._0,_p1._1,_p1._2);
            var r = _p2._0;
            var g = _p2._1;
            var b = _p2._2;
            return {red: $Basics.round(255 * r),green: $Basics.round(255 * g),blue: $Basics.round(255 * b),alpha: _p1._3};
         }
   };
   var toHsl = function (color) {
      var _p3 = color;
      if (_p3.ctor === "HSLA") {
            return {hue: _p3._0,saturation: _p3._1,lightness: _p3._2,alpha: _p3._3};
         } else {
            var _p4 = A3(rgbToHsl,_p3._0,_p3._1,_p3._2);
            var h = _p4._0;
            var s = _p4._1;
            var l = _p4._2;
            return {hue: h,saturation: s,lightness: l,alpha: _p3._3};
         }
   };
   var HSLA = F4(function (a,b,c,d) {    return {ctor: "HSLA",_0: a,_1: b,_2: c,_3: d};});
   var hsla = F4(function (hue,saturation,lightness,alpha) {
      return A4(HSLA,hue - $Basics.turns($Basics.toFloat($Basics.floor(hue / (2 * $Basics.pi)))),saturation,lightness,alpha);
   });
   var hsl = F3(function (hue,saturation,lightness) {    return A4(hsla,hue,saturation,lightness,1);});
   var complement = function (color) {
      var _p5 = color;
      if (_p5.ctor === "HSLA") {
            return A4(hsla,_p5._0 + $Basics.degrees(180),_p5._1,_p5._2,_p5._3);
         } else {
            var _p6 = A3(rgbToHsl,_p5._0,_p5._1,_p5._2);
            var h = _p6._0;
            var s = _p6._1;
            var l = _p6._2;
            return A4(hsla,h + $Basics.degrees(180),s,l,_p5._3);
         }
   };
   var grayscale = function (p) {    return A4(HSLA,0,0,1 - p,1);};
   var greyscale = function (p) {    return A4(HSLA,0,0,1 - p,1);};
   var RGBA = F4(function (a,b,c,d) {    return {ctor: "RGBA",_0: a,_1: b,_2: c,_3: d};});
   var rgba = RGBA;
   var rgb = F3(function (r,g,b) {    return A4(RGBA,r,g,b,1);});
   var lightRed = A4(RGBA,239,41,41,1);
   var red = A4(RGBA,204,0,0,1);
   var darkRed = A4(RGBA,164,0,0,1);
   var lightOrange = A4(RGBA,252,175,62,1);
   var orange = A4(RGBA,245,121,0,1);
   var darkOrange = A4(RGBA,206,92,0,1);
   var lightYellow = A4(RGBA,255,233,79,1);
   var yellow = A4(RGBA,237,212,0,1);
   var darkYellow = A4(RGBA,196,160,0,1);
   var lightGreen = A4(RGBA,138,226,52,1);
   var green = A4(RGBA,115,210,22,1);
   var darkGreen = A4(RGBA,78,154,6,1);
   var lightBlue = A4(RGBA,114,159,207,1);
   var blue = A4(RGBA,52,101,164,1);
   var darkBlue = A4(RGBA,32,74,135,1);
   var lightPurple = A4(RGBA,173,127,168,1);
   var purple = A4(RGBA,117,80,123,1);
   var darkPurple = A4(RGBA,92,53,102,1);
   var lightBrown = A4(RGBA,233,185,110,1);
   var brown = A4(RGBA,193,125,17,1);
   var darkBrown = A4(RGBA,143,89,2,1);
   var black = A4(RGBA,0,0,0,1);
   var white = A4(RGBA,255,255,255,1);
   var lightGrey = A4(RGBA,238,238,236,1);
   var grey = A4(RGBA,211,215,207,1);
   var darkGrey = A4(RGBA,186,189,182,1);
   var lightGray = A4(RGBA,238,238,236,1);
   var gray = A4(RGBA,211,215,207,1);
   var darkGray = A4(RGBA,186,189,182,1);
   var lightCharcoal = A4(RGBA,136,138,133,1);
   var charcoal = A4(RGBA,85,87,83,1);
   var darkCharcoal = A4(RGBA,46,52,54,1);
   return _elm.Color.values = {_op: _op
                              ,rgb: rgb
                              ,rgba: rgba
                              ,hsl: hsl
                              ,hsla: hsla
                              ,greyscale: greyscale
                              ,grayscale: grayscale
                              ,complement: complement
                              ,linear: linear
                              ,radial: radial
                              ,toRgb: toRgb
                              ,toHsl: toHsl
                              ,red: red
                              ,orange: orange
                              ,yellow: yellow
                              ,green: green
                              ,blue: blue
                              ,purple: purple
                              ,brown: brown
                              ,lightRed: lightRed
                              ,lightOrange: lightOrange
                              ,lightYellow: lightYellow
                              ,lightGreen: lightGreen
                              ,lightBlue: lightBlue
                              ,lightPurple: lightPurple
                              ,lightBrown: lightBrown
                              ,darkRed: darkRed
                              ,darkOrange: darkOrange
                              ,darkYellow: darkYellow
                              ,darkGreen: darkGreen
                              ,darkBlue: darkBlue
                              ,darkPurple: darkPurple
                              ,darkBrown: darkBrown
                              ,white: white
                              ,lightGrey: lightGrey
                              ,grey: grey
                              ,darkGrey: darkGrey
                              ,lightCharcoal: lightCharcoal
                              ,charcoal: charcoal
                              ,darkCharcoal: darkCharcoal
                              ,black: black
                              ,lightGray: lightGray
                              ,gray: gray
                              ,darkGray: darkGray};
};

// setup
Elm.Native = Elm.Native || {};
Elm.Native.Graphics = Elm.Native.Graphics || {};
Elm.Native.Graphics.Element = Elm.Native.Graphics.Element || {};

// definition
Elm.Native.Graphics.Element.make = function(localRuntime) {
	'use strict';

	// attempt to short-circuit
	localRuntime.Native = localRuntime.Native || {};
	localRuntime.Native.Graphics = localRuntime.Native.Graphics || {};
	localRuntime.Native.Graphics.Element = localRuntime.Native.Graphics.Element || {};
	if ('values' in localRuntime.Native.Graphics.Element)
	{
		return localRuntime.Native.Graphics.Element.values;
	}

	var Color = Elm.Native.Color.make(localRuntime);
	var List = Elm.Native.List.make(localRuntime);
	var Maybe = Elm.Maybe.make(localRuntime);
	var Text = Elm.Native.Text.make(localRuntime);
	var Utils = Elm.Native.Utils.make(localRuntime);


	// CREATION

	var createNode =
		typeof document === 'undefined'
			?
				function(_)
				{
					return {
						style: {},
						appendChild: function() {}
					};
				}
			:
				function(elementType)
				{
					var node = document.createElement(elementType);
					node.style.padding = '0';
					node.style.margin = '0';
					return node;
				}
			;


	function newElement(width, height, elementPrim)
	{
		return {
			ctor: 'Element_elm_builtin',
			_0: {
				element: elementPrim,
				props: {
					id: Utils.guid(),
					width: width,
					height: height,
					opacity: 1,
					color: Maybe.Nothing,
					href: '',
					tag: '',
					hover: Utils.Tuple0,
					click: Utils.Tuple0
				}
			}
		};
	}


	// PROPERTIES

	function setProps(elem, node)
	{
		var props = elem.props;

		var element = elem.element;
		var width = props.width - (element.adjustWidth || 0);
		var height = props.height - (element.adjustHeight || 0);
		node.style.width  = (width | 0) + 'px';
		node.style.height = (height | 0) + 'px';

		if (props.opacity !== 1)
		{
			node.style.opacity = props.opacity;
		}

		if (props.color.ctor === 'Just')
		{
			node.style.backgroundColor = Color.toCss(props.color._0);
		}

		if (props.tag !== '')
		{
			node.id = props.tag;
		}

		if (props.hover.ctor !== '_Tuple0')
		{
			addHover(node, props.hover);
		}

		if (props.click.ctor !== '_Tuple0')
		{
			addClick(node, props.click);
		}

		if (props.href !== '')
		{
			var anchor = createNode('a');
			anchor.href = props.href;
			anchor.style.display = 'block';
			anchor.style.pointerEvents = 'auto';
			anchor.appendChild(node);
			node = anchor;
		}

		return node;
	}

	function addClick(e, handler)
	{
		e.style.pointerEvents = 'auto';
		e.elm_click_handler = handler;
		function trigger(ev)
		{
			e.elm_click_handler(Utils.Tuple0);
			ev.stopPropagation();
		}
		e.elm_click_trigger = trigger;
		e.addEventListener('click', trigger);
	}

	function removeClick(e, handler)
	{
		if (e.elm_click_trigger)
		{
			e.removeEventListener('click', e.elm_click_trigger);
			e.elm_click_trigger = null;
			e.elm_click_handler = null;
		}
	}

	function addHover(e, handler)
	{
		e.style.pointerEvents = 'auto';
		e.elm_hover_handler = handler;
		e.elm_hover_count = 0;

		function over(evt)
		{
			if (e.elm_hover_count++ > 0) return;
			e.elm_hover_handler(true);
			evt.stopPropagation();
		}
		function out(evt)
		{
			if (e.contains(evt.toElement || evt.relatedTarget)) return;
			e.elm_hover_count = 0;
			e.elm_hover_handler(false);
			evt.stopPropagation();
		}
		e.elm_hover_over = over;
		e.elm_hover_out = out;
		e.addEventListener('mouseover', over);
		e.addEventListener('mouseout', out);
	}

	function removeHover(e)
	{
		e.elm_hover_handler = null;
		if (e.elm_hover_over)
		{
			e.removeEventListener('mouseover', e.elm_hover_over);
			e.elm_hover_over = null;
		}
		if (e.elm_hover_out)
		{
			e.removeEventListener('mouseout', e.elm_hover_out);
			e.elm_hover_out = null;
		}
	}


	// IMAGES

	function image(props, img)
	{
		switch (img._0.ctor)
		{
			case 'Plain':
				return plainImage(img._3);

			case 'Fitted':
				return fittedImage(props.width, props.height, img._3);

			case 'Cropped':
				return croppedImage(img, props.width, props.height, img._3);

			case 'Tiled':
				return tiledImage(img._3);
		}
	}

	function plainImage(src)
	{
		var img = createNode('img');
		img.src = src;
		img.name = src;
		img.style.display = 'block';
		return img;
	}

	function tiledImage(src)
	{
		var div = createNode('div');
		div.style.backgroundImage = 'url(' + src + ')';
		return div;
	}

	function fittedImage(w, h, src)
	{
		var div = createNode('div');
		div.style.background = 'url(' + src + ') no-repeat center';
		div.style.webkitBackgroundSize = 'cover';
		div.style.MozBackgroundSize = 'cover';
		div.style.OBackgroundSize = 'cover';
		div.style.backgroundSize = 'cover';
		return div;
	}

	function croppedImage(elem, w, h, src)
	{
		var pos = elem._0._0;
		var e = createNode('div');
		e.style.overflow = 'hidden';

		var img = createNode('img');
		img.onload = function() {
			var sw = w / elem._1, sh = h / elem._2;
			img.style.width = ((this.width * sw) | 0) + 'px';
			img.style.height = ((this.height * sh) | 0) + 'px';
			img.style.marginLeft = ((- pos._0 * sw) | 0) + 'px';
			img.style.marginTop = ((- pos._1 * sh) | 0) + 'px';
		};
		img.src = src;
		img.name = src;
		e.appendChild(img);
		return e;
	}


	// FLOW

	function goOut(node)
	{
		node.style.position = 'absolute';
		return node;
	}
	function goDown(node)
	{
		return node;
	}
	function goRight(node)
	{
		node.style.styleFloat = 'left';
		node.style.cssFloat = 'left';
		return node;
	}

	var directionTable = {
		DUp: goDown,
		DDown: goDown,
		DLeft: goRight,
		DRight: goRight,
		DIn: goOut,
		DOut: goOut
	};
	function needsReversal(dir)
	{
		return dir === 'DUp' || dir === 'DLeft' || dir === 'DIn';
	}

	function flow(dir, elist)
	{
		var array = List.toArray(elist);
		var container = createNode('div');
		var goDir = directionTable[dir];
		if (goDir === goOut)
		{
			container.style.pointerEvents = 'none';
		}
		if (needsReversal(dir))
		{
			array.reverse();
		}
		var len = array.length;
		for (var i = 0; i < len; ++i)
		{
			container.appendChild(goDir(render(array[i])));
		}
		return container;
	}


	// CONTAINER

	function toPos(pos)
	{
		return pos.ctor === 'Absolute'
			? pos._0 + 'px'
			: (pos._0 * 100) + '%';
	}

	// must clear right, left, top, bottom, and transform
	// before calling this function
	function setPos(pos, wrappedElement, e)
	{
		var elem = wrappedElement._0;
		var element = elem.element;
		var props = elem.props;
		var w = props.width + (element.adjustWidth ? element.adjustWidth : 0);
		var h = props.height + (element.adjustHeight ? element.adjustHeight : 0);

		e.style.position = 'absolute';
		e.style.margin = 'auto';
		var transform = '';

		switch (pos.horizontal.ctor)
		{
			case 'P':
				e.style.right = toPos(pos.x);
				e.style.removeProperty('left');
				break;

			case 'Z':
				transform = 'translateX(' + ((-w / 2) | 0) + 'px) ';

			case 'N':
				e.style.left = toPos(pos.x);
				e.style.removeProperty('right');
				break;
		}
		switch (pos.vertical.ctor)
		{
			case 'N':
				e.style.bottom = toPos(pos.y);
				e.style.removeProperty('top');
				break;

			case 'Z':
				transform += 'translateY(' + ((-h / 2) | 0) + 'px)';

			case 'P':
				e.style.top = toPos(pos.y);
				e.style.removeProperty('bottom');
				break;
		}
		if (transform !== '')
		{
			addTransform(e.style, transform);
		}
		return e;
	}

	function addTransform(style, transform)
	{
		style.transform       = transform;
		style.msTransform     = transform;
		style.MozTransform    = transform;
		style.webkitTransform = transform;
		style.OTransform      = transform;
	}

	function container(pos, elem)
	{
		var e = render(elem);
		setPos(pos, elem, e);
		var div = createNode('div');
		div.style.position = 'relative';
		div.style.overflow = 'hidden';
		div.appendChild(e);
		return div;
	}


	function rawHtml(elem)
	{
		var html = elem.html;
		var align = elem.align;

		var div = createNode('div');
		div.innerHTML = html;
		div.style.visibility = 'hidden';
		if (align)
		{
			div.style.textAlign = align;
		}
		div.style.visibility = 'visible';
		div.style.pointerEvents = 'auto';
		return div;
	}


	// RENDER

	function render(wrappedElement)
	{
		var elem = wrappedElement._0;
		return setProps(elem, makeElement(elem));
	}

	function makeElement(e)
	{
		var elem = e.element;
		switch (elem.ctor)
		{
			case 'Image':
				return image(e.props, elem);

			case 'Flow':
				return flow(elem._0.ctor, elem._1);

			case 'Container':
				return container(elem._0, elem._1);

			case 'Spacer':
				return createNode('div');

			case 'RawHtml':
				return rawHtml(elem);

			case 'Custom':
				return elem.render(elem.model);
		}
	}

	function updateAndReplace(node, curr, next)
	{
		var newNode = update(node, curr, next);
		if (newNode !== node)
		{
			node.parentNode.replaceChild(newNode, node);
		}
		return newNode;
	}


	// UPDATE

	function update(node, wrappedCurrent, wrappedNext)
	{
		var curr = wrappedCurrent._0;
		var next = wrappedNext._0;
		var rootNode = node;
		if (node.tagName === 'A')
		{
			node = node.firstChild;
		}
		if (curr.props.id === next.props.id)
		{
			updateProps(node, curr, next);
			return rootNode;
		}
		if (curr.element.ctor !== next.element.ctor)
		{
			return render(wrappedNext);
		}
		var nextE = next.element;
		var currE = curr.element;
		switch (nextE.ctor)
		{
			case 'Spacer':
				updateProps(node, curr, next);
				return rootNode;

			case 'RawHtml':
				if(currE.html.valueOf() !== nextE.html.valueOf())
				{
					node.innerHTML = nextE.html;
				}
				updateProps(node, curr, next);
				return rootNode;

			case 'Image':
				if (nextE._0.ctor === 'Plain')
				{
					if (nextE._3 !== currE._3)
					{
						node.src = nextE._3;
					}
				}
				else if (!Utils.eq(nextE, currE)
					|| next.props.width !== curr.props.width
					|| next.props.height !== curr.props.height)
				{
					return render(wrappedNext);
				}
				updateProps(node, curr, next);
				return rootNode;

			case 'Flow':
				var arr = List.toArray(nextE._1);
				for (var i = arr.length; i--; )
				{
					arr[i] = arr[i]._0.element.ctor;
				}
				if (nextE._0.ctor !== currE._0.ctor)
				{
					return render(wrappedNext);
				}
				var nexts = List.toArray(nextE._1);
				var kids = node.childNodes;
				if (nexts.length !== kids.length)
				{
					return render(wrappedNext);
				}
				var currs = List.toArray(currE._1);
				var dir = nextE._0.ctor;
				var goDir = directionTable[dir];
				var toReverse = needsReversal(dir);
				var len = kids.length;
				for (var i = len; i--; )
				{
					var subNode = kids[toReverse ? len - i - 1 : i];
					goDir(updateAndReplace(subNode, currs[i], nexts[i]));
				}
				updateProps(node, curr, next);
				return rootNode;

			case 'Container':
				var subNode = node.firstChild;
				var newSubNode = updateAndReplace(subNode, currE._1, nextE._1);
				setPos(nextE._0, nextE._1, newSubNode);
				updateProps(node, curr, next);
				return rootNode;

			case 'Custom':
				if (currE.type === nextE.type)
				{
					var updatedNode = nextE.update(node, currE.model, nextE.model);
					updateProps(updatedNode, curr, next);
					return updatedNode;
				}
				return render(wrappedNext);
		}
	}

	function updateProps(node, curr, next)
	{
		var nextProps = next.props;
		var currProps = curr.props;

		var element = next.element;
		var width = nextProps.width - (element.adjustWidth || 0);
		var height = nextProps.height - (element.adjustHeight || 0);
		if (width !== currProps.width)
		{
			node.style.width = (width | 0) + 'px';
		}
		if (height !== currProps.height)
		{
			node.style.height = (height | 0) + 'px';
		}

		if (nextProps.opacity !== currProps.opacity)
		{
			node.style.opacity = nextProps.opacity;
		}

		var nextColor = nextProps.color.ctor === 'Just'
			? Color.toCss(nextProps.color._0)
			: '';
		if (node.style.backgroundColor !== nextColor)
		{
			node.style.backgroundColor = nextColor;
		}

		if (nextProps.tag !== currProps.tag)
		{
			node.id = nextProps.tag;
		}

		if (nextProps.href !== currProps.href)
		{
			if (currProps.href === '')
			{
				// add a surrounding href
				var anchor = createNode('a');
				anchor.href = nextProps.href;
				anchor.style.display = 'block';
				anchor.style.pointerEvents = 'auto';

				node.parentNode.replaceChild(anchor, node);
				anchor.appendChild(node);
			}
			else if (nextProps.href === '')
			{
				// remove the surrounding href
				var anchor = node.parentNode;
				anchor.parentNode.replaceChild(node, anchor);
			}
			else
			{
				// just update the link
				node.parentNode.href = nextProps.href;
			}
		}

		// update click and hover handlers
		var removed = false;

		// update hover handlers
		if (currProps.hover.ctor === '_Tuple0')
		{
			if (nextProps.hover.ctor !== '_Tuple0')
			{
				addHover(node, nextProps.hover);
			}
		}
		else
		{
			if (nextProps.hover.ctor === '_Tuple0')
			{
				removed = true;
				removeHover(node);
			}
			else
			{
				node.elm_hover_handler = nextProps.hover;
			}
		}

		// update click handlers
		if (currProps.click.ctor === '_Tuple0')
		{
			if (nextProps.click.ctor !== '_Tuple0')
			{
				addClick(node, nextProps.click);
			}
		}
		else
		{
			if (nextProps.click.ctor === '_Tuple0')
			{
				removed = true;
				removeClick(node);
			}
			else
			{
				node.elm_click_handler = nextProps.click;
			}
		}

		// stop capturing clicks if
		if (removed
			&& nextProps.hover.ctor === '_Tuple0'
			&& nextProps.click.ctor === '_Tuple0')
		{
			node.style.pointerEvents = 'none';
		}
	}


	// TEXT

	function block(align)
	{
		return function(text)
		{
			var raw = {
				ctor: 'RawHtml',
				html: Text.renderHtml(text),
				align: align
			};
			var pos = htmlHeight(0, raw);
			return newElement(pos._0, pos._1, raw);
		};
	}

	function markdown(text)
	{
		var raw = {
			ctor: 'RawHtml',
			html: text,
			align: null
		};
		var pos = htmlHeight(0, raw);
		return newElement(pos._0, pos._1, raw);
	}

	var htmlHeight =
		typeof document !== 'undefined'
			? realHtmlHeight
			: function(a, b) { return Utils.Tuple2(0, 0); };

	function realHtmlHeight(width, rawHtml)
	{
		// create dummy node
		var temp = document.createElement('div');
		temp.innerHTML = rawHtml.html;
		if (width > 0)
		{
			temp.style.width = width + 'px';
		}
		temp.style.visibility = 'hidden';
		temp.style.styleFloat = 'left';
		temp.style.cssFloat = 'left';

		document.body.appendChild(temp);

		// get dimensions
		var style = window.getComputedStyle(temp, null);
		var w = Math.ceil(style.getPropertyValue('width').slice(0, -2) - 0);
		var h = Math.ceil(style.getPropertyValue('height').slice(0, -2) - 0);
		document.body.removeChild(temp);
		return Utils.Tuple2(w, h);
	}


	return localRuntime.Native.Graphics.Element.values = {
		render: render,
		update: update,
		updateAndReplace: updateAndReplace,

		createNode: createNode,
		newElement: F3(newElement),
		addTransform: addTransform,
		htmlHeight: F2(htmlHeight),
		guid: Utils.guid,

		block: block,
		markdown: markdown
	};
};

Elm.Native.Text = {};
Elm.Native.Text.make = function(localRuntime) {
	localRuntime.Native = localRuntime.Native || {};
	localRuntime.Native.Text = localRuntime.Native.Text || {};
	if (localRuntime.Native.Text.values)
	{
		return localRuntime.Native.Text.values;
	}

	var toCss = Elm.Native.Color.make(localRuntime).toCss;
	var List = Elm.Native.List.make(localRuntime);


	// CONSTRUCTORS

	function fromString(str)
	{
		return {
			ctor: 'Text:Text',
			_0: str
		};
	}

	function append(a, b)
	{
		return {
			ctor: 'Text:Append',
			_0: a,
			_1: b
		};
	}

	function addMeta(field, value, text)
	{
		var newProps = {};
		var newText = {
			ctor: 'Text:Meta',
			_0: newProps,
			_1: text
		};

		if (text.ctor === 'Text:Meta')
		{
			newText._1 = text._1;
			var props = text._0;
			for (var i = metaKeys.length; i--; )
			{
				var key = metaKeys[i];
				var val = props[key];
				if (val)
				{
					newProps[key] = val;
				}
			}
		}
		newProps[field] = value;
		return newText;
	}

	var metaKeys = [
		'font-size',
		'font-family',
		'font-style',
		'font-weight',
		'href',
		'text-decoration',
		'color'
	];


	// conversions from Elm values to CSS

	function toTypefaces(list)
	{
		var typefaces = List.toArray(list);
		for (var i = typefaces.length; i--; )
		{
			var typeface = typefaces[i];
			if (typeface.indexOf(' ') > -1)
			{
				typefaces[i] = "'" + typeface + "'";
			}
		}
		return typefaces.join(',');
	}

	function toLine(line)
	{
		var ctor = line.ctor;
		return ctor === 'Under'
			? 'underline'
			: ctor === 'Over'
				? 'overline'
				: 'line-through';
	}

	// setting styles of Text

	function style(style, text)
	{
		var newText = addMeta('color', toCss(style.color), text);
		var props = newText._0;

		if (style.typeface.ctor !== '[]')
		{
			props['font-family'] = toTypefaces(style.typeface);
		}
		if (style.height.ctor !== 'Nothing')
		{
			props['font-size'] = style.height._0 + 'px';
		}
		if (style.bold)
		{
			props['font-weight'] = 'bold';
		}
		if (style.italic)
		{
			props['font-style'] = 'italic';
		}
		if (style.line.ctor !== 'Nothing')
		{
			props['text-decoration'] = toLine(style.line._0);
		}
		return newText;
	}

	function height(px, text)
	{
		return addMeta('font-size', px + 'px', text);
	}

	function typeface(names, text)
	{
		return addMeta('font-family', toTypefaces(names), text);
	}

	function monospace(text)
	{
		return addMeta('font-family', 'monospace', text);
	}

	function italic(text)
	{
		return addMeta('font-style', 'italic', text);
	}

	function bold(text)
	{
		return addMeta('font-weight', 'bold', text);
	}

	function link(href, text)
	{
		return addMeta('href', href, text);
	}

	function line(line, text)
	{
		return addMeta('text-decoration', toLine(line), text);
	}

	function color(color, text)
	{
		return addMeta('color', toCss(color), text);
	}


	// RENDER

	function renderHtml(text)
	{
		var tag = text.ctor;
		if (tag === 'Text:Append')
		{
			return renderHtml(text._0) + renderHtml(text._1);
		}
		if (tag === 'Text:Text')
		{
			return properEscape(text._0);
		}
		if (tag === 'Text:Meta')
		{
			return renderMeta(text._0, renderHtml(text._1));
		}
	}

	function renderMeta(metas, string)
	{
		var href = metas.href;
		if (href)
		{
			string = '<a href="' + href + '">' + string + '</a>';
		}
		var styles = '';
		for (var key in metas)
		{
			if (key === 'href')
			{
				continue;
			}
			styles += key + ':' + metas[key] + ';';
		}
		if (styles)
		{
			string = '<span style="' + styles + '">' + string + '</span>';
		}
		return string;
	}

	function properEscape(str)
	{
		if (str.length === 0)
		{
			return str;
		}
		str = str //.replace(/&/g,  '&#38;')
			.replace(/"/g,  '&#34;')
			.replace(/'/g,  '&#39;')
			.replace(/</g,  '&#60;')
			.replace(/>/g,  '&#62;');
		var arr = str.split('\n');
		for (var i = arr.length; i--; )
		{
			arr[i] = makeSpaces(arr[i]);
		}
		return arr.join('<br/>');
	}

	function makeSpaces(s)
	{
		if (s.length === 0)
		{
			return s;
		}
		var arr = s.split('');
		if (arr[0] === ' ')
		{
			arr[0] = '&nbsp;';
		}
		for (var i = arr.length; --i; )
		{
			if (arr[i][0] === ' ' && arr[i - 1] === ' ')
			{
				arr[i - 1] = arr[i - 1] + arr[i];
				arr[i] = '';
			}
		}
		for (var i = arr.length; i--; )
		{
			if (arr[i].length > 1 && arr[i][0] === ' ')
			{
				var spaces = arr[i].split('');
				for (var j = spaces.length - 2; j >= 0; j -= 2)
				{
					spaces[j] = '&nbsp;';
				}
				arr[i] = spaces.join('');
			}
		}
		arr = arr.join('');
		if (arr[arr.length - 1] === ' ')
		{
			return arr.slice(0, -1) + '&nbsp;';
		}
		return arr;
	}


	return localRuntime.Native.Text.values = {
		fromString: fromString,
		append: F2(append),

		height: F2(height),
		italic: italic,
		bold: bold,
		line: F2(line),
		monospace: monospace,
		typeface: F2(typeface),
		color: F2(color),
		link: F2(link),
		style: F2(style),

		toTypefaces: toTypefaces,
		toLine: toLine,
		renderHtml: renderHtml
	};
};

Elm.Text = Elm.Text || {};
Elm.Text.make = function (_elm) {
   "use strict";
   _elm.Text = _elm.Text || {};
   if (_elm.Text.values) return _elm.Text.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Color = Elm.Color.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Native$Text = Elm.Native.Text.make(_elm);
   var _op = {};
   var line = $Native$Text.line;
   var italic = $Native$Text.italic;
   var bold = $Native$Text.bold;
   var color = $Native$Text.color;
   var height = $Native$Text.height;
   var link = $Native$Text.link;
   var monospace = $Native$Text.monospace;
   var typeface = $Native$Text.typeface;
   var style = $Native$Text.style;
   var append = $Native$Text.append;
   var fromString = $Native$Text.fromString;
   var empty = fromString("");
   var concat = function (texts) {    return A3($List.foldr,append,empty,texts);};
   var join = F2(function (seperator,texts) {    return concat(A2($List.intersperse,seperator,texts));});
   var defaultStyle = {typeface: _U.list([]),height: $Maybe.Nothing,color: $Color.black,bold: false,italic: false,line: $Maybe.Nothing};
   var Style = F6(function (a,b,c,d,e,f) {    return {typeface: a,height: b,color: c,bold: d,italic: e,line: f};});
   var Through = {ctor: "Through"};
   var Over = {ctor: "Over"};
   var Under = {ctor: "Under"};
   var Text = {ctor: "Text"};
   return _elm.Text.values = {_op: _op
                             ,fromString: fromString
                             ,empty: empty
                             ,append: append
                             ,concat: concat
                             ,join: join
                             ,link: link
                             ,style: style
                             ,defaultStyle: defaultStyle
                             ,typeface: typeface
                             ,monospace: monospace
                             ,height: height
                             ,color: color
                             ,bold: bold
                             ,italic: italic
                             ,line: line
                             ,Style: Style
                             ,Under: Under
                             ,Over: Over
                             ,Through: Through};
};
Elm.Graphics = Elm.Graphics || {};
Elm.Graphics.Element = Elm.Graphics.Element || {};
Elm.Graphics.Element.make = function (_elm) {
   "use strict";
   _elm.Graphics = _elm.Graphics || {};
   _elm.Graphics.Element = _elm.Graphics.Element || {};
   if (_elm.Graphics.Element.values) return _elm.Graphics.Element.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Color = Elm.Color.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Native$Graphics$Element = Elm.Native.Graphics.Element.make(_elm),
   $Text = Elm.Text.make(_elm);
   var _op = {};
   var DOut = {ctor: "DOut"};
   var outward = DOut;
   var DIn = {ctor: "DIn"};
   var inward = DIn;
   var DRight = {ctor: "DRight"};
   var right = DRight;
   var DLeft = {ctor: "DLeft"};
   var left = DLeft;
   var DDown = {ctor: "DDown"};
   var down = DDown;
   var DUp = {ctor: "DUp"};
   var up = DUp;
   var RawPosition = F4(function (a,b,c,d) {    return {horizontal: a,vertical: b,x: c,y: d};});
   var Position = function (a) {    return {ctor: "Position",_0: a};};
   var Relative = function (a) {    return {ctor: "Relative",_0: a};};
   var relative = Relative;
   var Absolute = function (a) {    return {ctor: "Absolute",_0: a};};
   var absolute = Absolute;
   var N = {ctor: "N"};
   var bottomLeft = Position({horizontal: N,vertical: N,x: Absolute(0),y: Absolute(0)});
   var bottomLeftAt = F2(function (x,y) {    return Position({horizontal: N,vertical: N,x: x,y: y});});
   var Z = {ctor: "Z"};
   var middle = Position({horizontal: Z,vertical: Z,x: Relative(0.5),y: Relative(0.5)});
   var midLeft = Position({horizontal: N,vertical: Z,x: Absolute(0),y: Relative(0.5)});
   var midBottom = Position({horizontal: Z,vertical: N,x: Relative(0.5),y: Absolute(0)});
   var middleAt = F2(function (x,y) {    return Position({horizontal: Z,vertical: Z,x: x,y: y});});
   var midLeftAt = F2(function (x,y) {    return Position({horizontal: N,vertical: Z,x: x,y: y});});
   var midBottomAt = F2(function (x,y) {    return Position({horizontal: Z,vertical: N,x: x,y: y});});
   var P = {ctor: "P"};
   var topLeft = Position({horizontal: N,vertical: P,x: Absolute(0),y: Absolute(0)});
   var topRight = Position({horizontal: P,vertical: P,x: Absolute(0),y: Absolute(0)});
   var bottomRight = Position({horizontal: P,vertical: N,x: Absolute(0),y: Absolute(0)});
   var midRight = Position({horizontal: P,vertical: Z,x: Absolute(0),y: Relative(0.5)});
   var midTop = Position({horizontal: Z,vertical: P,x: Relative(0.5),y: Absolute(0)});
   var topLeftAt = F2(function (x,y) {    return Position({horizontal: N,vertical: P,x: x,y: y});});
   var topRightAt = F2(function (x,y) {    return Position({horizontal: P,vertical: P,x: x,y: y});});
   var bottomRightAt = F2(function (x,y) {    return Position({horizontal: P,vertical: N,x: x,y: y});});
   var midRightAt = F2(function (x,y) {    return Position({horizontal: P,vertical: Z,x: x,y: y});});
   var midTopAt = F2(function (x,y) {    return Position({horizontal: Z,vertical: P,x: x,y: y});});
   var justified = $Native$Graphics$Element.block("justify");
   var centered = $Native$Graphics$Element.block("center");
   var rightAligned = $Native$Graphics$Element.block("right");
   var leftAligned = $Native$Graphics$Element.block("left");
   var show = function (value) {    return leftAligned($Text.monospace($Text.fromString($Basics.toString(value))));};
   var Tiled = {ctor: "Tiled"};
   var Cropped = function (a) {    return {ctor: "Cropped",_0: a};};
   var Fitted = {ctor: "Fitted"};
   var Plain = {ctor: "Plain"};
   var Custom = {ctor: "Custom"};
   var RawHtml = {ctor: "RawHtml"};
   var Spacer = {ctor: "Spacer"};
   var Flow = F2(function (a,b) {    return {ctor: "Flow",_0: a,_1: b};});
   var Container = F2(function (a,b) {    return {ctor: "Container",_0: a,_1: b};});
   var Image = F4(function (a,b,c,d) {    return {ctor: "Image",_0: a,_1: b,_2: c,_3: d};});
   var newElement = $Native$Graphics$Element.newElement;
   var image = F3(function (w,h,src) {    return A3(newElement,w,h,A4(Image,Plain,w,h,src));});
   var fittedImage = F3(function (w,h,src) {    return A3(newElement,w,h,A4(Image,Fitted,w,h,src));});
   var croppedImage = F4(function (pos,w,h,src) {    return A3(newElement,w,h,A4(Image,Cropped(pos),w,h,src));});
   var tiledImage = F3(function (w,h,src) {    return A3(newElement,w,h,A4(Image,Tiled,w,h,src));});
   var container = F4(function (w,h,_p0,e) {    var _p1 = _p0;return A3(newElement,w,h,A2(Container,_p1._0,e));});
   var spacer = F2(function (w,h) {    return A3(newElement,w,h,Spacer);});
   var sizeOf = function (_p2) {    var _p3 = _p2;var _p4 = _p3._0;return {ctor: "_Tuple2",_0: _p4.props.width,_1: _p4.props.height};};
   var heightOf = function (_p5) {    var _p6 = _p5;return _p6._0.props.height;};
   var widthOf = function (_p7) {    var _p8 = _p7;return _p8._0.props.width;};
   var above = F2(function (hi,lo) {
      return A3(newElement,A2($Basics.max,widthOf(hi),widthOf(lo)),heightOf(hi) + heightOf(lo),A2(Flow,DDown,_U.list([hi,lo])));
   });
   var below = F2(function (lo,hi) {
      return A3(newElement,A2($Basics.max,widthOf(hi),widthOf(lo)),heightOf(hi) + heightOf(lo),A2(Flow,DDown,_U.list([hi,lo])));
   });
   var beside = F2(function (lft,rht) {
      return A3(newElement,widthOf(lft) + widthOf(rht),A2($Basics.max,heightOf(lft),heightOf(rht)),A2(Flow,right,_U.list([lft,rht])));
   });
   var layers = function (es) {
      var hs = A2($List.map,heightOf,es);
      var ws = A2($List.map,widthOf,es);
      return A3(newElement,A2($Maybe.withDefault,0,$List.maximum(ws)),A2($Maybe.withDefault,0,$List.maximum(hs)),A2(Flow,DOut,es));
   };
   var empty = A2(spacer,0,0);
   var flow = F2(function (dir,es) {
      var newFlow = F2(function (w,h) {    return A3(newElement,w,h,A2(Flow,dir,es));});
      var maxOrZero = function (list) {    return A2($Maybe.withDefault,0,$List.maximum(list));};
      var hs = A2($List.map,heightOf,es);
      var ws = A2($List.map,widthOf,es);
      if (_U.eq(es,_U.list([]))) return empty; else {
            var _p9 = dir;
            switch (_p9.ctor)
            {case "DUp": return A2(newFlow,maxOrZero(ws),$List.sum(hs));
               case "DDown": return A2(newFlow,maxOrZero(ws),$List.sum(hs));
               case "DLeft": return A2(newFlow,$List.sum(ws),maxOrZero(hs));
               case "DRight": return A2(newFlow,$List.sum(ws),maxOrZero(hs));
               case "DIn": return A2(newFlow,maxOrZero(ws),maxOrZero(hs));
               default: return A2(newFlow,maxOrZero(ws),maxOrZero(hs));}
         }
   });
   var Properties = F9(function (a,b,c,d,e,f,g,h,i) {    return {id: a,width: b,height: c,opacity: d,color: e,href: f,tag: g,hover: h,click: i};});
   var Element_elm_builtin = function (a) {    return {ctor: "Element_elm_builtin",_0: a};};
   var width = F2(function (newWidth,_p10) {
      var _p11 = _p10;
      var _p14 = _p11._0.props;
      var _p13 = _p11._0.element;
      var newHeight = function () {
         var _p12 = _p13;
         switch (_p12.ctor)
         {case "Image": return $Basics.round($Basics.toFloat(_p12._2) / $Basics.toFloat(_p12._1) * $Basics.toFloat(newWidth));
            case "RawHtml": return $Basics.snd(A2($Native$Graphics$Element.htmlHeight,newWidth,_p13));
            default: return _p14.height;}
      }();
      return Element_elm_builtin({element: _p13,props: _U.update(_p14,{width: newWidth,height: newHeight})});
   });
   var height = F2(function (newHeight,_p15) {
      var _p16 = _p15;
      return Element_elm_builtin({element: _p16._0.element,props: _U.update(_p16._0.props,{height: newHeight})});
   });
   var size = F3(function (w,h,e) {    return A2(height,h,A2(width,w,e));});
   var opacity = F2(function (givenOpacity,_p17) {
      var _p18 = _p17;
      return Element_elm_builtin({element: _p18._0.element,props: _U.update(_p18._0.props,{opacity: givenOpacity})});
   });
   var color = F2(function (clr,_p19) {
      var _p20 = _p19;
      return Element_elm_builtin({element: _p20._0.element,props: _U.update(_p20._0.props,{color: $Maybe.Just(clr)})});
   });
   var tag = F2(function (name,_p21) {    var _p22 = _p21;return Element_elm_builtin({element: _p22._0.element,props: _U.update(_p22._0.props,{tag: name})});});
   var link = F2(function (href,_p23) {
      var _p24 = _p23;
      return Element_elm_builtin({element: _p24._0.element,props: _U.update(_p24._0.props,{href: href})});
   });
   return _elm.Graphics.Element.values = {_op: _op
                                         ,image: image
                                         ,fittedImage: fittedImage
                                         ,croppedImage: croppedImage
                                         ,tiledImage: tiledImage
                                         ,leftAligned: leftAligned
                                         ,rightAligned: rightAligned
                                         ,centered: centered
                                         ,justified: justified
                                         ,show: show
                                         ,width: width
                                         ,height: height
                                         ,size: size
                                         ,color: color
                                         ,opacity: opacity
                                         ,link: link
                                         ,tag: tag
                                         ,widthOf: widthOf
                                         ,heightOf: heightOf
                                         ,sizeOf: sizeOf
                                         ,flow: flow
                                         ,up: up
                                         ,down: down
                                         ,left: left
                                         ,right: right
                                         ,inward: inward
                                         ,outward: outward
                                         ,layers: layers
                                         ,above: above
                                         ,below: below
                                         ,beside: beside
                                         ,empty: empty
                                         ,spacer: spacer
                                         ,container: container
                                         ,middle: middle
                                         ,midTop: midTop
                                         ,midBottom: midBottom
                                         ,midLeft: midLeft
                                         ,midRight: midRight
                                         ,topLeft: topLeft
                                         ,topRight: topRight
                                         ,bottomLeft: bottomLeft
                                         ,bottomRight: bottomRight
                                         ,absolute: absolute
                                         ,relative: relative
                                         ,middleAt: middleAt
                                         ,midTopAt: midTopAt
                                         ,midBottomAt: midBottomAt
                                         ,midLeftAt: midLeftAt
                                         ,midRightAt: midRightAt
                                         ,topLeftAt: topLeftAt
                                         ,topRightAt: topRightAt
                                         ,bottomLeftAt: bottomLeftAt
                                         ,bottomRightAt: bottomRightAt};
};
Elm.Graphics = Elm.Graphics || {};
Elm.Graphics.Collage = Elm.Graphics.Collage || {};
Elm.Graphics.Collage.make = function (_elm) {
   "use strict";
   _elm.Graphics = _elm.Graphics || {};
   _elm.Graphics.Collage = _elm.Graphics.Collage || {};
   if (_elm.Graphics.Collage.values) return _elm.Graphics.Collage.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Color = Elm.Color.make(_elm),
   $Graphics$Element = Elm.Graphics.Element.make(_elm),
   $List = Elm.List.make(_elm),
   $Native$Graphics$Collage = Elm.Native.Graphics.Collage.make(_elm),
   $Text = Elm.Text.make(_elm),
   $Transform2D = Elm.Transform2D.make(_elm);
   var _op = {};
   var Shape = function (a) {    return {ctor: "Shape",_0: a};};
   var polygon = function (points) {    return Shape(points);};
   var rect = F2(function (w,h) {
      var hh = h / 2;
      var hw = w / 2;
      return Shape(_U.list([{ctor: "_Tuple2",_0: 0 - hw,_1: 0 - hh}
                           ,{ctor: "_Tuple2",_0: 0 - hw,_1: hh}
                           ,{ctor: "_Tuple2",_0: hw,_1: hh}
                           ,{ctor: "_Tuple2",_0: hw,_1: 0 - hh}]));
   });
   var square = function (n) {    return A2(rect,n,n);};
   var oval = F2(function (w,h) {
      var hh = h / 2;
      var hw = w / 2;
      var n = 50;
      var t = 2 * $Basics.pi / n;
      var f = function (i) {    return {ctor: "_Tuple2",_0: hw * $Basics.cos(t * i),_1: hh * $Basics.sin(t * i)};};
      return Shape(A2($List.map,f,_U.range(0,n - 1)));
   });
   var circle = function (r) {    return A2(oval,2 * r,2 * r);};
   var ngon = F2(function (n,r) {
      var m = $Basics.toFloat(n);
      var t = 2 * $Basics.pi / m;
      var f = function (i) {    return {ctor: "_Tuple2",_0: r * $Basics.cos(t * i),_1: r * $Basics.sin(t * i)};};
      return Shape(A2($List.map,f,_U.range(0,m - 1)));
   });
   var Path = function (a) {    return {ctor: "Path",_0: a};};
   var path = function (ps) {    return Path(ps);};
   var segment = F2(function (p1,p2) {    return Path(_U.list([p1,p2]));});
   var collage = $Native$Graphics$Collage.collage;
   var Fill = function (a) {    return {ctor: "Fill",_0: a};};
   var Line = function (a) {    return {ctor: "Line",_0: a};};
   var FGroup = F2(function (a,b) {    return {ctor: "FGroup",_0: a,_1: b};});
   var FElement = function (a) {    return {ctor: "FElement",_0: a};};
   var FImage = F4(function (a,b,c,d) {    return {ctor: "FImage",_0: a,_1: b,_2: c,_3: d};});
   var FText = function (a) {    return {ctor: "FText",_0: a};};
   var FOutlinedText = F2(function (a,b) {    return {ctor: "FOutlinedText",_0: a,_1: b};});
   var FShape = F2(function (a,b) {    return {ctor: "FShape",_0: a,_1: b};});
   var FPath = F2(function (a,b) {    return {ctor: "FPath",_0: a,_1: b};});
   var LineStyle = F6(function (a,b,c,d,e,f) {    return {color: a,width: b,cap: c,join: d,dashing: e,dashOffset: f};});
   var Clipped = {ctor: "Clipped"};
   var Sharp = function (a) {    return {ctor: "Sharp",_0: a};};
   var Smooth = {ctor: "Smooth"};
   var Padded = {ctor: "Padded"};
   var Round = {ctor: "Round"};
   var Flat = {ctor: "Flat"};
   var defaultLine = {color: $Color.black,width: 1,cap: Flat,join: Sharp(10),dashing: _U.list([]),dashOffset: 0};
   var solid = function (clr) {    return _U.update(defaultLine,{color: clr});};
   var dashed = function (clr) {    return _U.update(defaultLine,{color: clr,dashing: _U.list([8,4])});};
   var dotted = function (clr) {    return _U.update(defaultLine,{color: clr,dashing: _U.list([3,3])});};
   var Grad = function (a) {    return {ctor: "Grad",_0: a};};
   var Texture = function (a) {    return {ctor: "Texture",_0: a};};
   var Solid = function (a) {    return {ctor: "Solid",_0: a};};
   var Form_elm_builtin = function (a) {    return {ctor: "Form_elm_builtin",_0: a};};
   var form = function (f) {    return Form_elm_builtin({theta: 0,scale: 1,x: 0,y: 0,alpha: 1,form: f});};
   var fill = F2(function (style,_p0) {    var _p1 = _p0;return form(A2(FShape,Fill(style),_p1._0));});
   var filled = F2(function (color,shape) {    return A2(fill,Solid(color),shape);});
   var textured = F2(function (src,shape) {    return A2(fill,Texture(src),shape);});
   var gradient = F2(function (grad,shape) {    return A2(fill,Grad(grad),shape);});
   var outlined = F2(function (style,_p2) {    var _p3 = _p2;return form(A2(FShape,Line(style),_p3._0));});
   var traced = F2(function (style,_p4) {    var _p5 = _p4;return form(A2(FPath,style,_p5._0));});
   var sprite = F4(function (w,h,pos,src) {    return form(A4(FImage,w,h,pos,src));});
   var toForm = function (e) {    return form(FElement(e));};
   var group = function (fs) {    return form(A2(FGroup,$Transform2D.identity,fs));};
   var groupTransform = F2(function (matrix,fs) {    return form(A2(FGroup,matrix,fs));});
   var text = function (t) {    return form(FText(t));};
   var outlinedText = F2(function (ls,t) {    return form(A2(FOutlinedText,ls,t));});
   var move = F2(function (_p7,_p6) {
      var _p8 = _p7;
      var _p9 = _p6;
      var _p10 = _p9._0;
      return Form_elm_builtin(_U.update(_p10,{x: _p10.x + _p8._0,y: _p10.y + _p8._1}));
   });
   var moveX = F2(function (x,_p11) {    var _p12 = _p11;var _p13 = _p12._0;return Form_elm_builtin(_U.update(_p13,{x: _p13.x + x}));});
   var moveY = F2(function (y,_p14) {    var _p15 = _p14;var _p16 = _p15._0;return Form_elm_builtin(_U.update(_p16,{y: _p16.y + y}));});
   var scale = F2(function (s,_p17) {    var _p18 = _p17;var _p19 = _p18._0;return Form_elm_builtin(_U.update(_p19,{scale: _p19.scale * s}));});
   var rotate = F2(function (t,_p20) {    var _p21 = _p20;var _p22 = _p21._0;return Form_elm_builtin(_U.update(_p22,{theta: _p22.theta + t}));});
   var alpha = F2(function (a,_p23) {    var _p24 = _p23;return Form_elm_builtin(_U.update(_p24._0,{alpha: a}));});
   return _elm.Graphics.Collage.values = {_op: _op
                                         ,collage: collage
                                         ,toForm: toForm
                                         ,filled: filled
                                         ,textured: textured
                                         ,gradient: gradient
                                         ,outlined: outlined
                                         ,traced: traced
                                         ,text: text
                                         ,outlinedText: outlinedText
                                         ,move: move
                                         ,moveX: moveX
                                         ,moveY: moveY
                                         ,scale: scale
                                         ,rotate: rotate
                                         ,alpha: alpha
                                         ,group: group
                                         ,groupTransform: groupTransform
                                         ,rect: rect
                                         ,oval: oval
                                         ,square: square
                                         ,circle: circle
                                         ,ngon: ngon
                                         ,polygon: polygon
                                         ,segment: segment
                                         ,path: path
                                         ,solid: solid
                                         ,dashed: dashed
                                         ,dotted: dotted
                                         ,defaultLine: defaultLine
                                         ,LineStyle: LineStyle
                                         ,Flat: Flat
                                         ,Round: Round
                                         ,Padded: Padded
                                         ,Smooth: Smooth
                                         ,Sharp: Sharp
                                         ,Clipped: Clipped};
};
Elm.Native.Debug = {};
Elm.Native.Debug.make = function(localRuntime) {
	localRuntime.Native = localRuntime.Native || {};
	localRuntime.Native.Debug = localRuntime.Native.Debug || {};
	if (localRuntime.Native.Debug.values)
	{
		return localRuntime.Native.Debug.values;
	}

	var toString = Elm.Native.Utils.make(localRuntime).toString;

	function log(tag, value)
	{
		var msg = tag + ': ' + toString(value);
		var process = process || {};
		if (process.stdout)
		{
			process.stdout.write(msg);
		}
		else
		{
			console.log(msg);
		}
		return value;
	}

	function crash(message)
	{
		throw new Error(message);
	}

	function tracePath(tag, form)
	{
		if (localRuntime.debug)
		{
			return localRuntime.debug.trace(tag, form);
		}
		return form;
	}

	function watch(tag, value)
	{
		if (localRuntime.debug)
		{
			localRuntime.debug.watch(tag, value);
		}
		return value;
	}

	function watchSummary(tag, summarize, value)
	{
		if (localRuntime.debug)
		{
			localRuntime.debug.watch(tag, summarize(value));
		}
		return value;
	}

	return localRuntime.Native.Debug.values = {
		crash: crash,
		tracePath: F2(tracePath),
		log: F2(log),
		watch: F2(watch),
		watchSummary: F3(watchSummary)
	};
};

Elm.Debug = Elm.Debug || {};
Elm.Debug.make = function (_elm) {
   "use strict";
   _elm.Debug = _elm.Debug || {};
   if (_elm.Debug.values) return _elm.Debug.values;
   var _U = Elm.Native.Utils.make(_elm),$Graphics$Collage = Elm.Graphics.Collage.make(_elm),$Native$Debug = Elm.Native.Debug.make(_elm);
   var _op = {};
   var trace = $Native$Debug.tracePath;
   var watchSummary = $Native$Debug.watchSummary;
   var watch = $Native$Debug.watch;
   var crash = $Native$Debug.crash;
   var log = $Native$Debug.log;
   return _elm.Debug.values = {_op: _op,log: log,crash: crash,watch: watch,watchSummary: watchSummary,trace: trace};
};
Elm.Result = Elm.Result || {};
Elm.Result.make = function (_elm) {
   "use strict";
   _elm.Result = _elm.Result || {};
   if (_elm.Result.values) return _elm.Result.values;
   var _U = Elm.Native.Utils.make(_elm),$Maybe = Elm.Maybe.make(_elm);
   var _op = {};
   var toMaybe = function (result) {    var _p0 = result;if (_p0.ctor === "Ok") {    return $Maybe.Just(_p0._0);} else {    return $Maybe.Nothing;}};
   var withDefault = F2(function (def,result) {    var _p1 = result;if (_p1.ctor === "Ok") {    return _p1._0;} else {    return def;}});
   var Err = function (a) {    return {ctor: "Err",_0: a};};
   var andThen = F2(function (result,callback) {    var _p2 = result;if (_p2.ctor === "Ok") {    return callback(_p2._0);} else {    return Err(_p2._0);}});
   var Ok = function (a) {    return {ctor: "Ok",_0: a};};
   var map = F2(function (func,ra) {    var _p3 = ra;if (_p3.ctor === "Ok") {    return Ok(func(_p3._0));} else {    return Err(_p3._0);}});
   var map2 = F3(function (func,ra,rb) {
      var _p4 = {ctor: "_Tuple2",_0: ra,_1: rb};
      if (_p4._0.ctor === "Ok") {
            if (_p4._1.ctor === "Ok") {
                  return Ok(A2(func,_p4._0._0,_p4._1._0));
               } else {
                  return Err(_p4._1._0);
               }
         } else {
            return Err(_p4._0._0);
         }
   });
   var map3 = F4(function (func,ra,rb,rc) {
      var _p5 = {ctor: "_Tuple3",_0: ra,_1: rb,_2: rc};
      if (_p5._0.ctor === "Ok") {
            if (_p5._1.ctor === "Ok") {
                  if (_p5._2.ctor === "Ok") {
                        return Ok(A3(func,_p5._0._0,_p5._1._0,_p5._2._0));
                     } else {
                        return Err(_p5._2._0);
                     }
               } else {
                  return Err(_p5._1._0);
               }
         } else {
            return Err(_p5._0._0);
         }
   });
   var map4 = F5(function (func,ra,rb,rc,rd) {
      var _p6 = {ctor: "_Tuple4",_0: ra,_1: rb,_2: rc,_3: rd};
      if (_p6._0.ctor === "Ok") {
            if (_p6._1.ctor === "Ok") {
                  if (_p6._2.ctor === "Ok") {
                        if (_p6._3.ctor === "Ok") {
                              return Ok(A4(func,_p6._0._0,_p6._1._0,_p6._2._0,_p6._3._0));
                           } else {
                              return Err(_p6._3._0);
                           }
                     } else {
                        return Err(_p6._2._0);
                     }
               } else {
                  return Err(_p6._1._0);
               }
         } else {
            return Err(_p6._0._0);
         }
   });
   var map5 = F6(function (func,ra,rb,rc,rd,re) {
      var _p7 = {ctor: "_Tuple5",_0: ra,_1: rb,_2: rc,_3: rd,_4: re};
      if (_p7._0.ctor === "Ok") {
            if (_p7._1.ctor === "Ok") {
                  if (_p7._2.ctor === "Ok") {
                        if (_p7._3.ctor === "Ok") {
                              if (_p7._4.ctor === "Ok") {
                                    return Ok(A5(func,_p7._0._0,_p7._1._0,_p7._2._0,_p7._3._0,_p7._4._0));
                                 } else {
                                    return Err(_p7._4._0);
                                 }
                           } else {
                              return Err(_p7._3._0);
                           }
                     } else {
                        return Err(_p7._2._0);
                     }
               } else {
                  return Err(_p7._1._0);
               }
         } else {
            return Err(_p7._0._0);
         }
   });
   var formatError = F2(function (f,result) {    var _p8 = result;if (_p8.ctor === "Ok") {    return Ok(_p8._0);} else {    return Err(f(_p8._0));}});
   var fromMaybe = F2(function (err,maybe) {    var _p9 = maybe;if (_p9.ctor === "Just") {    return Ok(_p9._0);} else {    return Err(err);}});
   return _elm.Result.values = {_op: _op
                               ,withDefault: withDefault
                               ,map: map
                               ,map2: map2
                               ,map3: map3
                               ,map4: map4
                               ,map5: map5
                               ,andThen: andThen
                               ,toMaybe: toMaybe
                               ,fromMaybe: fromMaybe
                               ,formatError: formatError
                               ,Ok: Ok
                               ,Err: Err};
};
Elm.Native.Signal = {};

Elm.Native.Signal.make = function(localRuntime) {
	localRuntime.Native = localRuntime.Native || {};
	localRuntime.Native.Signal = localRuntime.Native.Signal || {};
	if (localRuntime.Native.Signal.values)
	{
		return localRuntime.Native.Signal.values;
	}


	var Task = Elm.Native.Task.make(localRuntime);
	var Utils = Elm.Native.Utils.make(localRuntime);


	function broadcastToKids(node, timestamp, update)
	{
		var kids = node.kids;
		for (var i = kids.length; i--; )
		{
			kids[i].notify(timestamp, update, node.id);
		}
	}


	// INPUT

	function input(name, base)
	{
		var node = {
			id: Utils.guid(),
			name: 'input-' + name,
			value: base,
			parents: [],
			kids: []
		};

		node.notify = function(timestamp, targetId, value) {
			var update = targetId === node.id;
			if (update)
			{
				node.value = value;
			}
			broadcastToKids(node, timestamp, update);
			return update;
		};

		localRuntime.inputs.push(node);

		return node;
	}

	function constant(value)
	{
		return input('constant', value);
	}


	// MAILBOX

	function mailbox(base)
	{
		var signal = input('mailbox', base);

		function send(value) {
			return Task.asyncFunction(function(callback) {
				localRuntime.setTimeout(function() {
					localRuntime.notify(signal.id, value);
				}, 0);
				callback(Task.succeed(Utils.Tuple0));
			});
		}

		return {
			signal: signal,
			address: {
				ctor: 'Address',
				_0: send
			}
		};
	}

	function sendMessage(message)
	{
		Task.perform(message._0);
	}


	// OUTPUT

	function output(name, handler, parent)
	{
		var node = {
			id: Utils.guid(),
			name: 'output-' + name,
			parents: [parent],
			isOutput: true
		};

		node.notify = function(timestamp, parentUpdate, parentID)
		{
			if (parentUpdate)
			{
				handler(parent.value);
			}
		};

		parent.kids.push(node);

		return node;
	}


	// MAP

	function mapMany(refreshValue, args)
	{
		var node = {
			id: Utils.guid(),
			name: 'map' + args.length,
			value: refreshValue(),
			parents: args,
			kids: []
		};

		var numberOfParents = args.length;
		var count = 0;
		var update = false;

		node.notify = function(timestamp, parentUpdate, parentID)
		{
			++count;

			update = update || parentUpdate;

			if (count === numberOfParents)
			{
				if (update)
				{
					node.value = refreshValue();
				}
				broadcastToKids(node, timestamp, update);
				update = false;
				count = 0;
			}
		};

		for (var i = numberOfParents; i--; )
		{
			args[i].kids.push(node);
		}

		return node;
	}


	function map(func, a)
	{
		function refreshValue()
		{
			return func(a.value);
		}
		return mapMany(refreshValue, [a]);
	}


	function map2(func, a, b)
	{
		function refreshValue()
		{
			return A2( func, a.value, b.value );
		}
		return mapMany(refreshValue, [a, b]);
	}


	function map3(func, a, b, c)
	{
		function refreshValue()
		{
			return A3( func, a.value, b.value, c.value );
		}
		return mapMany(refreshValue, [a, b, c]);
	}


	function map4(func, a, b, c, d)
	{
		function refreshValue()
		{
			return A4( func, a.value, b.value, c.value, d.value );
		}
		return mapMany(refreshValue, [a, b, c, d]);
	}


	function map5(func, a, b, c, d, e)
	{
		function refreshValue()
		{
			return A5( func, a.value, b.value, c.value, d.value, e.value );
		}
		return mapMany(refreshValue, [a, b, c, d, e]);
	}


	// FOLD

	function foldp(update, state, signal)
	{
		var node = {
			id: Utils.guid(),
			name: 'foldp',
			parents: [signal],
			kids: [],
			value: state
		};

		node.notify = function(timestamp, parentUpdate, parentID)
		{
			if (parentUpdate)
			{
				node.value = A2( update, signal.value, node.value );
			}
			broadcastToKids(node, timestamp, parentUpdate);
		};

		signal.kids.push(node);

		return node;
	}


	// TIME

	function timestamp(signal)
	{
		var node = {
			id: Utils.guid(),
			name: 'timestamp',
			value: Utils.Tuple2(localRuntime.timer.programStart, signal.value),
			parents: [signal],
			kids: []
		};

		node.notify = function(timestamp, parentUpdate, parentID)
		{
			if (parentUpdate)
			{
				node.value = Utils.Tuple2(timestamp, signal.value);
			}
			broadcastToKids(node, timestamp, parentUpdate);
		};

		signal.kids.push(node);

		return node;
	}


	function delay(time, signal)
	{
		var delayed = input('delay-input-' + time, signal.value);

		function handler(value)
		{
			setTimeout(function() {
				localRuntime.notify(delayed.id, value);
			}, time);
		}

		output('delay-output-' + time, handler, signal);

		return delayed;
	}


	// MERGING

	function genericMerge(tieBreaker, leftStream, rightStream)
	{
		var node = {
			id: Utils.guid(),
			name: 'merge',
			value: A2(tieBreaker, leftStream.value, rightStream.value),
			parents: [leftStream, rightStream],
			kids: []
		};

		var left = { touched: false, update: false, value: null };
		var right = { touched: false, update: false, value: null };

		node.notify = function(timestamp, parentUpdate, parentID)
		{
			if (parentID === leftStream.id)
			{
				left.touched = true;
				left.update = parentUpdate;
				left.value = leftStream.value;
			}
			if (parentID === rightStream.id)
			{
				right.touched = true;
				right.update = parentUpdate;
				right.value = rightStream.value;
			}

			if (left.touched && right.touched)
			{
				var update = false;
				if (left.update && right.update)
				{
					node.value = A2(tieBreaker, left.value, right.value);
					update = true;
				}
				else if (left.update)
				{
					node.value = left.value;
					update = true;
				}
				else if (right.update)
				{
					node.value = right.value;
					update = true;
				}
				left.touched = false;
				right.touched = false;

				broadcastToKids(node, timestamp, update);
			}
		};

		leftStream.kids.push(node);
		rightStream.kids.push(node);

		return node;
	}


	// FILTERING

	function filterMap(toMaybe, base, signal)
	{
		var maybe = toMaybe(signal.value);
		var node = {
			id: Utils.guid(),
			name: 'filterMap',
			value: maybe.ctor === 'Nothing' ? base : maybe._0,
			parents: [signal],
			kids: []
		};

		node.notify = function(timestamp, parentUpdate, parentID)
		{
			var update = false;
			if (parentUpdate)
			{
				var maybe = toMaybe(signal.value);
				if (maybe.ctor === 'Just')
				{
					update = true;
					node.value = maybe._0;
				}
			}
			broadcastToKids(node, timestamp, update);
		};

		signal.kids.push(node);

		return node;
	}


	// SAMPLING

	function sampleOn(ticker, signal)
	{
		var node = {
			id: Utils.guid(),
			name: 'sampleOn',
			value: signal.value,
			parents: [ticker, signal],
			kids: []
		};

		var signalTouch = false;
		var tickerTouch = false;
		var tickerUpdate = false;

		node.notify = function(timestamp, parentUpdate, parentID)
		{
			if (parentID === ticker.id)
			{
				tickerTouch = true;
				tickerUpdate = parentUpdate;
			}
			if (parentID === signal.id)
			{
				signalTouch = true;
			}

			if (tickerTouch && signalTouch)
			{
				if (tickerUpdate)
				{
					node.value = signal.value;
				}
				tickerTouch = false;
				signalTouch = false;

				broadcastToKids(node, timestamp, tickerUpdate);
			}
		};

		ticker.kids.push(node);
		signal.kids.push(node);

		return node;
	}


	// DROP REPEATS

	function dropRepeats(signal)
	{
		var node = {
			id: Utils.guid(),
			name: 'dropRepeats',
			value: signal.value,
			parents: [signal],
			kids: []
		};

		node.notify = function(timestamp, parentUpdate, parentID)
		{
			var update = false;
			if (parentUpdate && !Utils.eq(node.value, signal.value))
			{
				node.value = signal.value;
				update = true;
			}
			broadcastToKids(node, timestamp, update);
		};

		signal.kids.push(node);

		return node;
	}


	return localRuntime.Native.Signal.values = {
		input: input,
		constant: constant,
		mailbox: mailbox,
		sendMessage: sendMessage,
		output: output,
		map: F2(map),
		map2: F3(map2),
		map3: F4(map3),
		map4: F5(map4),
		map5: F6(map5),
		foldp: F3(foldp),
		genericMerge: F3(genericMerge),
		filterMap: F3(filterMap),
		sampleOn: F2(sampleOn),
		dropRepeats: dropRepeats,
		timestamp: timestamp,
		delay: F2(delay)
	};
};

Elm.Native.Task = {};

Elm.Native.Task.make = function(localRuntime) {
	localRuntime.Native = localRuntime.Native || {};
	localRuntime.Native.Task = localRuntime.Native.Task || {};
	if (localRuntime.Native.Task.values)
	{
		return localRuntime.Native.Task.values;
	}

	var Result = Elm.Result.make(localRuntime);
	var Signal;
	var Utils = Elm.Native.Utils.make(localRuntime);


	// CONSTRUCTORS

	function succeed(value)
	{
		return {
			tag: 'Succeed',
			value: value
		};
	}

	function fail(error)
	{
		return {
			tag: 'Fail',
			value: error
		};
	}

	function asyncFunction(func)
	{
		return {
			tag: 'Async',
			asyncFunction: func
		};
	}

	function andThen(task, callback)
	{
		return {
			tag: 'AndThen',
			task: task,
			callback: callback
		};
	}

	function catch_(task, callback)
	{
		return {
			tag: 'Catch',
			task: task,
			callback: callback
		};
	}


	// RUNNER

	function perform(task) {
		runTask({ task: task }, function() {});
	}

	function performSignal(name, signal)
	{
		var workQueue = [];

		function onComplete()
		{
			workQueue.shift();

			if (workQueue.length > 0)
			{
				var task = workQueue[0];

				setTimeout(function() {
					runTask(task, onComplete);
				}, 0);
			}
		}

		function register(task)
		{
			var root = { task: task };
			workQueue.push(root);
			if (workQueue.length === 1)
			{
				runTask(root, onComplete);
			}
		}

		if (!Signal)
		{
			Signal = Elm.Native.Signal.make(localRuntime);
		}
		Signal.output('perform-tasks-' + name, register, signal);

		register(signal.value);

		return signal;
	}

	function mark(status, task)
	{
		return { status: status, task: task };
	}

	function runTask(root, onComplete)
	{
		var result = mark('runnable', root.task);
		while (result.status === 'runnable')
		{
			result = stepTask(onComplete, root, result.task);
		}

		if (result.status === 'done')
		{
			root.task = result.task;
			onComplete();
		}

		if (result.status === 'blocked')
		{
			root.task = result.task;
		}
	}

	function stepTask(onComplete, root, task)
	{
		var tag = task.tag;

		if (tag === 'Succeed' || tag === 'Fail')
		{
			return mark('done', task);
		}

		if (tag === 'Async')
		{
			var placeHolder = {};
			var couldBeSync = true;
			var wasSync = false;

			task.asyncFunction(function(result) {
				placeHolder.tag = result.tag;
				placeHolder.value = result.value;
				if (couldBeSync)
				{
					wasSync = true;
				}
				else
				{
					runTask(root, onComplete);
				}
			});
			couldBeSync = false;
			return mark(wasSync ? 'done' : 'blocked', placeHolder);
		}

		if (tag === 'AndThen' || tag === 'Catch')
		{
			var result = mark('runnable', task.task);
			while (result.status === 'runnable')
			{
				result = stepTask(onComplete, root, result.task);
			}

			if (result.status === 'done')
			{
				var activeTask = result.task;
				var activeTag = activeTask.tag;

				var succeedChain = activeTag === 'Succeed' && tag === 'AndThen';
				var failChain = activeTag === 'Fail' && tag === 'Catch';

				return (succeedChain || failChain)
					? mark('runnable', task.callback(activeTask.value))
					: mark('runnable', activeTask);
			}
			if (result.status === 'blocked')
			{
				return mark('blocked', {
					tag: tag,
					task: result.task,
					callback: task.callback
				});
			}
		}
	}


	// THREADS

	function sleep(time) {
		return asyncFunction(function(callback) {
			setTimeout(function() {
				callback(succeed(Utils.Tuple0));
			}, time);
		});
	}

	function spawn(task) {
		return asyncFunction(function(callback) {
			var id = setTimeout(function() {
				perform(task);
			}, 0);
			callback(succeed(id));
		});
	}


	return localRuntime.Native.Task.values = {
		succeed: succeed,
		fail: fail,
		asyncFunction: asyncFunction,
		andThen: F2(andThen),
		catch_: F2(catch_),
		perform: perform,
		performSignal: performSignal,
		spawn: spawn,
		sleep: sleep
	};
};

Elm.Task = Elm.Task || {};
Elm.Task.make = function (_elm) {
   "use strict";
   _elm.Task = _elm.Task || {};
   if (_elm.Task.values) return _elm.Task.values;
   var _U = Elm.Native.Utils.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Native$Task = Elm.Native.Task.make(_elm),
   $Result = Elm.Result.make(_elm);
   var _op = {};
   var sleep = $Native$Task.sleep;
   var spawn = $Native$Task.spawn;
   var ThreadID = function (a) {    return {ctor: "ThreadID",_0: a};};
   var onError = $Native$Task.catch_;
   var andThen = $Native$Task.andThen;
   var fail = $Native$Task.fail;
   var mapError = F2(function (f,task) {    return A2(onError,task,function (err) {    return fail(f(err));});});
   var succeed = $Native$Task.succeed;
   var map = F2(function (func,taskA) {    return A2(andThen,taskA,function (a) {    return succeed(func(a));});});
   var map2 = F3(function (func,taskA,taskB) {
      return A2(andThen,taskA,function (a) {    return A2(andThen,taskB,function (b) {    return succeed(A2(func,a,b));});});
   });
   var map3 = F4(function (func,taskA,taskB,taskC) {
      return A2(andThen,
      taskA,
      function (a) {
         return A2(andThen,taskB,function (b) {    return A2(andThen,taskC,function (c) {    return succeed(A3(func,a,b,c));});});
      });
   });
   var map4 = F5(function (func,taskA,taskB,taskC,taskD) {
      return A2(andThen,
      taskA,
      function (a) {
         return A2(andThen,
         taskB,
         function (b) {
            return A2(andThen,taskC,function (c) {    return A2(andThen,taskD,function (d) {    return succeed(A4(func,a,b,c,d));});});
         });
      });
   });
   var map5 = F6(function (func,taskA,taskB,taskC,taskD,taskE) {
      return A2(andThen,
      taskA,
      function (a) {
         return A2(andThen,
         taskB,
         function (b) {
            return A2(andThen,
            taskC,
            function (c) {
               return A2(andThen,taskD,function (d) {    return A2(andThen,taskE,function (e) {    return succeed(A5(func,a,b,c,d,e));});});
            });
         });
      });
   });
   var andMap = F2(function (taskFunc,taskValue) {
      return A2(andThen,taskFunc,function (func) {    return A2(andThen,taskValue,function (value) {    return succeed(func(value));});});
   });
   var sequence = function (tasks) {
      var _p0 = tasks;
      if (_p0.ctor === "[]") {
            return succeed(_U.list([]));
         } else {
            return A3(map2,F2(function (x,y) {    return A2($List._op["::"],x,y);}),_p0._0,sequence(_p0._1));
         }
   };
   var toMaybe = function (task) {    return A2(onError,A2(map,$Maybe.Just,task),function (_p1) {    return succeed($Maybe.Nothing);});};
   var fromMaybe = F2(function ($default,maybe) {    var _p2 = maybe;if (_p2.ctor === "Just") {    return succeed(_p2._0);} else {    return fail($default);}});
   var toResult = function (task) {    return A2(onError,A2(map,$Result.Ok,task),function (msg) {    return succeed($Result.Err(msg));});};
   var fromResult = function (result) {    var _p3 = result;if (_p3.ctor === "Ok") {    return succeed(_p3._0);} else {    return fail(_p3._0);}};
   var Task = {ctor: "Task"};
   return _elm.Task.values = {_op: _op
                             ,succeed: succeed
                             ,fail: fail
                             ,map: map
                             ,map2: map2
                             ,map3: map3
                             ,map4: map4
                             ,map5: map5
                             ,andMap: andMap
                             ,sequence: sequence
                             ,andThen: andThen
                             ,onError: onError
                             ,mapError: mapError
                             ,toMaybe: toMaybe
                             ,fromMaybe: fromMaybe
                             ,toResult: toResult
                             ,fromResult: fromResult
                             ,spawn: spawn
                             ,sleep: sleep};
};
Elm.Signal = Elm.Signal || {};
Elm.Signal.make = function (_elm) {
   "use strict";
   _elm.Signal = _elm.Signal || {};
   if (_elm.Signal.values) return _elm.Signal.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Native$Signal = Elm.Native.Signal.make(_elm),
   $Task = Elm.Task.make(_elm);
   var _op = {};
   var send = F2(function (_p0,value) {
      var _p1 = _p0;
      return A2($Task.onError,_p1._0(value),function (_p2) {    return $Task.succeed({ctor: "_Tuple0"});});
   });
   var Message = function (a) {    return {ctor: "Message",_0: a};};
   var message = F2(function (_p3,value) {    var _p4 = _p3;return Message(_p4._0(value));});
   var mailbox = $Native$Signal.mailbox;
   var Address = function (a) {    return {ctor: "Address",_0: a};};
   var forwardTo = F2(function (_p5,f) {    var _p6 = _p5;return Address(function (x) {    return _p6._0(f(x));});});
   var Mailbox = F2(function (a,b) {    return {address: a,signal: b};});
   var sampleOn = $Native$Signal.sampleOn;
   var dropRepeats = $Native$Signal.dropRepeats;
   var filterMap = $Native$Signal.filterMap;
   var filter = F3(function (isOk,base,signal) {
      return A3(filterMap,function (value) {    return isOk(value) ? $Maybe.Just(value) : $Maybe.Nothing;},base,signal);
   });
   var merge = F2(function (left,right) {    return A3($Native$Signal.genericMerge,$Basics.always,left,right);});
   var mergeMany = function (signalList) {
      var _p7 = $List.reverse(signalList);
      if (_p7.ctor === "[]") {
            return _U.crashCase("Signal",{start: {line: 184,column: 3},end: {line: 189,column: 40}},_p7)("mergeMany was given an empty list!");
         } else {
            return A3($List.foldl,merge,_p7._0,_p7._1);
         }
   };
   var foldp = $Native$Signal.foldp;
   var map5 = $Native$Signal.map5;
   var map4 = $Native$Signal.map4;
   var map3 = $Native$Signal.map3;
   var map2 = $Native$Signal.map2;
   var map = $Native$Signal.map;
   var constant = $Native$Signal.constant;
   var Signal = {ctor: "Signal"};
   return _elm.Signal.values = {_op: _op
                               ,merge: merge
                               ,mergeMany: mergeMany
                               ,map: map
                               ,map2: map2
                               ,map3: map3
                               ,map4: map4
                               ,map5: map5
                               ,constant: constant
                               ,dropRepeats: dropRepeats
                               ,filter: filter
                               ,filterMap: filterMap
                               ,sampleOn: sampleOn
                               ,foldp: foldp
                               ,mailbox: mailbox
                               ,send: send
                               ,message: message
                               ,forwardTo: forwardTo
                               ,Mailbox: Mailbox};
};
Elm.Native.Array = {};
Elm.Native.Array.make = function(localRuntime) {

	localRuntime.Native = localRuntime.Native || {};
	localRuntime.Native.Array = localRuntime.Native.Array || {};
	if (localRuntime.Native.Array.values)
	{
		return localRuntime.Native.Array.values;
	}
	if ('values' in Elm.Native.Array)
	{
		return localRuntime.Native.Array.values = Elm.Native.Array.values;
	}

	var List = Elm.Native.List.make(localRuntime);

	// A RRB-Tree has two distinct data types.
	// Leaf -> "height"  is always 0
	//         "table"   is an array of elements
	// Node -> "height"  is always greater than 0
	//         "table"   is an array of child nodes
	//         "lengths" is an array of accumulated lengths of the child nodes

	// M is the maximal table size. 32 seems fast. E is the allowed increase
	// of search steps when concatting to find an index. Lower values will
	// decrease balancing, but will increase search steps.
	var M = 32;
	var E = 2;

	// An empty array.
	var empty = {
		ctor: '_Array',
		height: 0,
		table: []
	};


	function get(i, array)
	{
		if (i < 0 || i >= length(array))
		{
			throw new Error(
				'Index ' + i + ' is out of range. Check the length of ' +
				'your array first or use getMaybe or getWithDefault.');
		}
		return unsafeGet(i, array);
	}


	function unsafeGet(i, array)
	{
		for (var x = array.height; x > 0; x--)
		{
			var slot = i >> (x * 5);
			while (array.lengths[slot] <= i)
			{
				slot++;
			}
			if (slot > 0)
			{
				i -= array.lengths[slot - 1];
			}
			array = array.table[slot];
		}
		return array.table[i];
	}


	// Sets the value at the index i. Only the nodes leading to i will get
	// copied and updated.
	function set(i, item, array)
	{
		if (i < 0 || length(array) <= i)
		{
			return array;
		}
		return unsafeSet(i, item, array);
	}


	function unsafeSet(i, item, array)
	{
		array = nodeCopy(array);

		if (array.height === 0)
		{
			array.table[i] = item;
		}
		else
		{
			var slot = getSlot(i, array);
			if (slot > 0)
			{
				i -= array.lengths[slot - 1];
			}
			array.table[slot] = unsafeSet(i, item, array.table[slot]);
		}
		return array;
	}


	function initialize(len, f)
	{
		if (len <= 0)
		{
			return empty;
		}
		var h = Math.floor( Math.log(len) / Math.log(M) );
		return initialize_(f, h, 0, len);
	}

	function initialize_(f, h, from, to)
	{
		if (h === 0)
		{
			var table = new Array((to - from) % (M + 1));
			for (var i = 0; i < table.length; i++)
			{
			  table[i] = f(from + i);
			}
			return {
				ctor: '_Array',
				height: 0,
				table: table
			};
		}

		var step = Math.pow(M, h);
		var table = new Array(Math.ceil((to - from) / step));
		var lengths = new Array(table.length);
		for (var i = 0; i < table.length; i++)
		{
			table[i] = initialize_(f, h - 1, from + (i * step), Math.min(from + ((i + 1) * step), to));
			lengths[i] = length(table[i]) + (i > 0 ? lengths[i-1] : 0);
		}
		return {
			ctor: '_Array',
			height: h,
			table: table,
			lengths: lengths
		};
	}

	function fromList(list)
	{
		if (list === List.Nil)
		{
			return empty;
		}

		// Allocate M sized blocks (table) and write list elements to it.
		var table = new Array(M);
		var nodes = [];
		var i = 0;

		while (list.ctor !== '[]')
		{
			table[i] = list._0;
			list = list._1;
			i++;

			// table is full, so we can push a leaf containing it into the
			// next node.
			if (i === M)
			{
				var leaf = {
					ctor: '_Array',
					height: 0,
					table: table
				};
				fromListPush(leaf, nodes);
				table = new Array(M);
				i = 0;
			}
		}

		// Maybe there is something left on the table.
		if (i > 0)
		{
			var leaf = {
				ctor: '_Array',
				height: 0,
				table: table.splice(0, i)
			};
			fromListPush(leaf, nodes);
		}

		// Go through all of the nodes and eventually push them into higher nodes.
		for (var h = 0; h < nodes.length - 1; h++)
		{
			if (nodes[h].table.length > 0)
			{
				fromListPush(nodes[h], nodes);
			}
		}

		var head = nodes[nodes.length - 1];
		if (head.height > 0 && head.table.length === 1)
		{
			return head.table[0];
		}
		else
		{
			return head;
		}
	}

	// Push a node into a higher node as a child.
	function fromListPush(toPush, nodes)
	{
		var h = toPush.height;

		// Maybe the node on this height does not exist.
		if (nodes.length === h)
		{
			var node = {
				ctor: '_Array',
				height: h + 1,
				table: [],
				lengths: []
			};
			nodes.push(node);
		}

		nodes[h].table.push(toPush);
		var len = length(toPush);
		if (nodes[h].lengths.length > 0)
		{
			len += nodes[h].lengths[nodes[h].lengths.length - 1];
		}
		nodes[h].lengths.push(len);

		if (nodes[h].table.length === M)
		{
			fromListPush(nodes[h], nodes);
			nodes[h] = {
				ctor: '_Array',
				height: h + 1,
				table: [],
				lengths: []
			};
		}
	}

	// Pushes an item via push_ to the bottom right of a tree.
	function push(item, a)
	{
		var pushed = push_(item, a);
		if (pushed !== null)
		{
			return pushed;
		}

		var newTree = create(item, a.height);
		return siblise(a, newTree);
	}

	// Recursively tries to push an item to the bottom-right most
	// tree possible. If there is no space left for the item,
	// null will be returned.
	function push_(item, a)
	{
		// Handle resursion stop at leaf level.
		if (a.height === 0)
		{
			if (a.table.length < M)
			{
				var newA = {
					ctor: '_Array',
					height: 0,
					table: a.table.slice()
				};
				newA.table.push(item);
				return newA;
			}
			else
			{
			  return null;
			}
		}

		// Recursively push
		var pushed = push_(item, botRight(a));

		// There was space in the bottom right tree, so the slot will
		// be updated.
		if (pushed !== null)
		{
			var newA = nodeCopy(a);
			newA.table[newA.table.length - 1] = pushed;
			newA.lengths[newA.lengths.length - 1]++;
			return newA;
		}

		// When there was no space left, check if there is space left
		// for a new slot with a tree which contains only the item
		// at the bottom.
		if (a.table.length < M)
		{
			var newSlot = create(item, a.height - 1);
			var newA = nodeCopy(a);
			newA.table.push(newSlot);
			newA.lengths.push(newA.lengths[newA.lengths.length - 1] + length(newSlot));
			return newA;
		}
		else
		{
			return null;
		}
	}

	// Converts an array into a list of elements.
	function toList(a)
	{
		return toList_(List.Nil, a);
	}

	function toList_(list, a)
	{
		for (var i = a.table.length - 1; i >= 0; i--)
		{
			list =
				a.height === 0
					? List.Cons(a.table[i], list)
					: toList_(list, a.table[i]);
		}
		return list;
	}

	// Maps a function over the elements of an array.
	function map(f, a)
	{
		var newA = {
			ctor: '_Array',
			height: a.height,
			table: new Array(a.table.length)
		};
		if (a.height > 0)
		{
			newA.lengths = a.lengths;
		}
		for (var i = 0; i < a.table.length; i++)
		{
			newA.table[i] =
				a.height === 0
					? f(a.table[i])
					: map(f, a.table[i]);
		}
		return newA;
	}

	// Maps a function over the elements with their index as first argument.
	function indexedMap(f, a)
	{
		return indexedMap_(f, a, 0);
	}

	function indexedMap_(f, a, from)
	{
		var newA = {
			ctor: '_Array',
			height: a.height,
			table: new Array(a.table.length)
		};
		if (a.height > 0)
		{
			newA.lengths = a.lengths;
		}
		for (var i = 0; i < a.table.length; i++)
		{
			newA.table[i] =
				a.height === 0
					? A2(f, from + i, a.table[i])
					: indexedMap_(f, a.table[i], i == 0 ? from : from + a.lengths[i - 1]);
		}
		return newA;
	}

	function foldl(f, b, a)
	{
		if (a.height === 0)
		{
			for (var i = 0; i < a.table.length; i++)
			{
				b = A2(f, a.table[i], b);
			}
		}
		else
		{
			for (var i = 0; i < a.table.length; i++)
			{
				b = foldl(f, b, a.table[i]);
			}
		}
		return b;
	}

	function foldr(f, b, a)
	{
		if (a.height === 0)
		{
			for (var i = a.table.length; i--; )
			{
				b = A2(f, a.table[i], b);
			}
		}
		else
		{
			for (var i = a.table.length; i--; )
			{
				b = foldr(f, b, a.table[i]);
			}
		}
		return b;
	}

	// TODO: currently, it slices the right, then the left. This can be
	// optimized.
	function slice(from, to, a)
	{
		if (from < 0)
		{
			from += length(a);
		}
		if (to < 0)
		{
			to += length(a);
		}
		return sliceLeft(from, sliceRight(to, a));
	}

	function sliceRight(to, a)
	{
		if (to === length(a))
		{
			return a;
		}

		// Handle leaf level.
		if (a.height === 0)
		{
			var newA = { ctor:'_Array', height:0 };
			newA.table = a.table.slice(0, to);
			return newA;
		}

		// Slice the right recursively.
		var right = getSlot(to, a);
		var sliced = sliceRight(to - (right > 0 ? a.lengths[right - 1] : 0), a.table[right]);

		// Maybe the a node is not even needed, as sliced contains the whole slice.
		if (right === 0)
		{
			return sliced;
		}

		// Create new node.
		var newA = {
			ctor: '_Array',
			height: a.height,
			table: a.table.slice(0, right),
			lengths: a.lengths.slice(0, right)
		};
		if (sliced.table.length > 0)
		{
			newA.table[right] = sliced;
			newA.lengths[right] = length(sliced) + (right > 0 ? newA.lengths[right - 1] : 0);
		}
		return newA;
	}

	function sliceLeft(from, a)
	{
		if (from === 0)
		{
			return a;
		}

		// Handle leaf level.
		if (a.height === 0)
		{
			var newA = { ctor:'_Array', height:0 };
			newA.table = a.table.slice(from, a.table.length + 1);
			return newA;
		}

		// Slice the left recursively.
		var left = getSlot(from, a);
		var sliced = sliceLeft(from - (left > 0 ? a.lengths[left - 1] : 0), a.table[left]);

		// Maybe the a node is not even needed, as sliced contains the whole slice.
		if (left === a.table.length - 1)
		{
			return sliced;
		}

		// Create new node.
		var newA = {
			ctor: '_Array',
			height: a.height,
			table: a.table.slice(left, a.table.length + 1),
			lengths: new Array(a.table.length - left)
		};
		newA.table[0] = sliced;
		var len = 0;
		for (var i = 0; i < newA.table.length; i++)
		{
			len += length(newA.table[i]);
			newA.lengths[i] = len;
		}

		return newA;
	}

	// Appends two trees.
	function append(a,b)
	{
		if (a.table.length === 0)
		{
			return b;
		}
		if (b.table.length === 0)
		{
			return a;
		}

		var c = append_(a, b);

		// Check if both nodes can be crunshed together.
		if (c[0].table.length + c[1].table.length <= M)
		{
			if (c[0].table.length === 0)
			{
				return c[1];
			}
			if (c[1].table.length === 0)
			{
				return c[0];
			}

			// Adjust .table and .lengths
			c[0].table = c[0].table.concat(c[1].table);
			if (c[0].height > 0)
			{
				var len = length(c[0]);
				for (var i = 0; i < c[1].lengths.length; i++)
				{
					c[1].lengths[i] += len;
				}
				c[0].lengths = c[0].lengths.concat(c[1].lengths);
			}

			return c[0];
		}

		if (c[0].height > 0)
		{
			var toRemove = calcToRemove(a, b);
			if (toRemove > E)
			{
				c = shuffle(c[0], c[1], toRemove);
			}
		}

		return siblise(c[0], c[1]);
	}

	// Returns an array of two nodes; right and left. One node _may_ be empty.
	function append_(a, b)
	{
		if (a.height === 0 && b.height === 0)
		{
			return [a, b];
		}

		if (a.height !== 1 || b.height !== 1)
		{
			if (a.height === b.height)
			{
				a = nodeCopy(a);
				b = nodeCopy(b);
				var appended = append_(botRight(a), botLeft(b));

				insertRight(a, appended[1]);
				insertLeft(b, appended[0]);
			}
			else if (a.height > b.height)
			{
				a = nodeCopy(a);
				var appended = append_(botRight(a), b);

				insertRight(a, appended[0]);
				b = parentise(appended[1], appended[1].height + 1);
			}
			else
			{
				b = nodeCopy(b);
				var appended = append_(a, botLeft(b));

				var left = appended[0].table.length === 0 ? 0 : 1;
				var right = left === 0 ? 1 : 0;
				insertLeft(b, appended[left]);
				a = parentise(appended[right], appended[right].height + 1);
			}
		}

		// Check if balancing is needed and return based on that.
		if (a.table.length === 0 || b.table.length === 0)
		{
			return [a, b];
		}

		var toRemove = calcToRemove(a, b);
		if (toRemove <= E)
		{
			return [a, b];
		}
		return shuffle(a, b, toRemove);
	}

	// Helperfunctions for append_. Replaces a child node at the side of the parent.
	function insertRight(parent, node)
	{
		var index = parent.table.length - 1;
		parent.table[index] = node;
		parent.lengths[index] = length(node);
		parent.lengths[index] += index > 0 ? parent.lengths[index - 1] : 0;
	}

	function insertLeft(parent, node)
	{
		if (node.table.length > 0)
		{
			parent.table[0] = node;
			parent.lengths[0] = length(node);

			var len = length(parent.table[0]);
			for (var i = 1; i < parent.lengths.length; i++)
			{
				len += length(parent.table[i]);
				parent.lengths[i] = len;
			}
		}
		else
		{
			parent.table.shift();
			for (var i = 1; i < parent.lengths.length; i++)
			{
				parent.lengths[i] = parent.lengths[i] - parent.lengths[0];
			}
			parent.lengths.shift();
		}
	}

	// Returns the extra search steps for E. Refer to the paper.
	function calcToRemove(a, b)
	{
		var subLengths = 0;
		for (var i = 0; i < a.table.length; i++)
		{
			subLengths += a.table[i].table.length;
		}
		for (var i = 0; i < b.table.length; i++)
		{
			subLengths += b.table[i].table.length;
		}

		var toRemove = a.table.length + b.table.length;
		return toRemove - (Math.floor((subLengths - 1) / M) + 1);
	}

	// get2, set2 and saveSlot are helpers for accessing elements over two arrays.
	function get2(a, b, index)
	{
		return index < a.length
			? a[index]
			: b[index - a.length];
	}

	function set2(a, b, index, value)
	{
		if (index < a.length)
		{
			a[index] = value;
		}
		else
		{
			b[index - a.length] = value;
		}
	}

	function saveSlot(a, b, index, slot)
	{
		set2(a.table, b.table, index, slot);

		var l = (index === 0 || index === a.lengths.length)
			? 0
			: get2(a.lengths, a.lengths, index - 1);

		set2(a.lengths, b.lengths, index, l + length(slot));
	}

	// Creates a node or leaf with a given length at their arrays for perfomance.
	// Is only used by shuffle.
	function createNode(h, length)
	{
		if (length < 0)
		{
			length = 0;
		}
		var a = {
			ctor: '_Array',
			height: h,
			table: new Array(length)
		};
		if (h > 0)
		{
			a.lengths = new Array(length);
		}
		return a;
	}

	// Returns an array of two balanced nodes.
	function shuffle(a, b, toRemove)
	{
		var newA = createNode(a.height, Math.min(M, a.table.length + b.table.length - toRemove));
		var newB = createNode(a.height, newA.table.length - (a.table.length + b.table.length - toRemove));

		// Skip the slots with size M. More precise: copy the slot references
		// to the new node
		var read = 0;
		while (get2(a.table, b.table, read).table.length % M === 0)
		{
			set2(newA.table, newB.table, read, get2(a.table, b.table, read));
			set2(newA.lengths, newB.lengths, read, get2(a.lengths, b.lengths, read));
			read++;
		}

		// Pulling items from left to right, caching in a slot before writing
		// it into the new nodes.
		var write = read;
		var slot = new createNode(a.height - 1, 0);
		var from = 0;

		// If the current slot is still containing data, then there will be at
		// least one more write, so we do not break this loop yet.
		while (read - write - (slot.table.length > 0 ? 1 : 0) < toRemove)
		{
			// Find out the max possible items for copying.
			var source = get2(a.table, b.table, read);
			var to = Math.min(M - slot.table.length, source.table.length);

			// Copy and adjust size table.
			slot.table = slot.table.concat(source.table.slice(from, to));
			if (slot.height > 0)
			{
				var len = slot.lengths.length;
				for (var i = len; i < len + to - from; i++)
				{
					slot.lengths[i] = length(slot.table[i]);
					slot.lengths[i] += (i > 0 ? slot.lengths[i - 1] : 0);
				}
			}

			from += to;

			// Only proceed to next slots[i] if the current one was
			// fully copied.
			if (source.table.length <= to)
			{
				read++; from = 0;
			}

			// Only create a new slot if the current one is filled up.
			if (slot.table.length === M)
			{
				saveSlot(newA, newB, write, slot);
				slot = createNode(a.height - 1, 0);
				write++;
			}
		}

		// Cleanup after the loop. Copy the last slot into the new nodes.
		if (slot.table.length > 0)
		{
			saveSlot(newA, newB, write, slot);
			write++;
		}

		// Shift the untouched slots to the left
		while (read < a.table.length + b.table.length )
		{
			saveSlot(newA, newB, write, get2(a.table, b.table, read));
			read++;
			write++;
		}

		return [newA, newB];
	}

	// Navigation functions
	function botRight(a)
	{
		return a.table[a.table.length - 1];
	}
	function botLeft(a)
	{
		return a.table[0];
	}

	// Copies a node for updating. Note that you should not use this if
	// only updating only one of "table" or "lengths" for performance reasons.
	function nodeCopy(a)
	{
		var newA = {
			ctor: '_Array',
			height: a.height,
			table: a.table.slice()
		};
		if (a.height > 0)
		{
			newA.lengths = a.lengths.slice();
		}
		return newA;
	}

	// Returns how many items are in the tree.
	function length(array)
	{
		if (array.height === 0)
		{
			return array.table.length;
		}
		else
		{
			return array.lengths[array.lengths.length - 1];
		}
	}

	// Calculates in which slot of "table" the item probably is, then
	// find the exact slot via forward searching in  "lengths". Returns the index.
	function getSlot(i, a)
	{
		var slot = i >> (5 * a.height);
		while (a.lengths[slot] <= i)
		{
			slot++;
		}
		return slot;
	}

	// Recursively creates a tree with a given height containing
	// only the given item.
	function create(item, h)
	{
		if (h === 0)
		{
			return {
				ctor: '_Array',
				height: 0,
				table: [item]
			};
		}
		return {
			ctor: '_Array',
			height: h,
			table: [create(item, h - 1)],
			lengths: [1]
		};
	}

	// Recursively creates a tree that contains the given tree.
	function parentise(tree, h)
	{
		if (h === tree.height)
		{
			return tree;
		}

		return {
			ctor: '_Array',
			height: h,
			table: [parentise(tree, h - 1)],
			lengths: [length(tree)]
		};
	}

	// Emphasizes blood brotherhood beneath two trees.
	function siblise(a, b)
	{
		return {
			ctor: '_Array',
			height: a.height + 1,
			table: [a, b],
			lengths: [length(a), length(a) + length(b)]
		};
	}

	function toJSArray(a)
	{
		var jsArray = new Array(length(a));
		toJSArray_(jsArray, 0, a);
		return jsArray;
	}

	function toJSArray_(jsArray, i, a)
	{
		for (var t = 0; t < a.table.length; t++)
		{
			if (a.height === 0)
			{
				jsArray[i + t] = a.table[t];
			}
			else
			{
				var inc = t === 0 ? 0 : a.lengths[t - 1];
				toJSArray_(jsArray, i + inc, a.table[t]);
			}
		}
	}

	function fromJSArray(jsArray)
	{
		if (jsArray.length === 0)
		{
			return empty;
		}
		var h = Math.floor(Math.log(jsArray.length) / Math.log(M));
		return fromJSArray_(jsArray, h, 0, jsArray.length);
	}

	function fromJSArray_(jsArray, h, from, to)
	{
		if (h === 0)
		{
			return {
				ctor: '_Array',
				height: 0,
				table: jsArray.slice(from, to)
			};
		}

		var step = Math.pow(M, h);
		var table = new Array(Math.ceil((to - from) / step));
		var lengths = new Array(table.length);
		for (var i = 0; i < table.length; i++)
		{
			table[i] = fromJSArray_(jsArray, h - 1, from + (i * step), Math.min(from + ((i + 1) * step), to));
			lengths[i] = length(table[i]) + (i > 0 ? lengths[i - 1] : 0);
		}
		return {
			ctor: '_Array',
			height: h,
			table: table,
			lengths: lengths
		};
	}

	Elm.Native.Array.values = {
		empty: empty,
		fromList: fromList,
		toList: toList,
		initialize: F2(initialize),
		append: F2(append),
		push: F2(push),
		slice: F3(slice),
		get: F2(get),
		set: F3(set),
		map: F2(map),
		indexedMap: F2(indexedMap),
		foldl: F3(foldl),
		foldr: F3(foldr),
		length: length,

		toJSArray: toJSArray,
		fromJSArray: fromJSArray
	};

	return localRuntime.Native.Array.values = Elm.Native.Array.values;
};

Elm.Array = Elm.Array || {};
Elm.Array.make = function (_elm) {
   "use strict";
   _elm.Array = _elm.Array || {};
   if (_elm.Array.values) return _elm.Array.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Native$Array = Elm.Native.Array.make(_elm);
   var _op = {};
   var append = $Native$Array.append;
   var length = $Native$Array.length;
   var isEmpty = function (array) {    return _U.eq(length(array),0);};
   var slice = $Native$Array.slice;
   var set = $Native$Array.set;
   var get = F2(function (i,array) {
      return _U.cmp(0,i) < 1 && _U.cmp(i,$Native$Array.length(array)) < 0 ? $Maybe.Just(A2($Native$Array.get,i,array)) : $Maybe.Nothing;
   });
   var push = $Native$Array.push;
   var empty = $Native$Array.empty;
   var filter = F2(function (isOkay,arr) {
      var update = F2(function (x,xs) {    return isOkay(x) ? A2($Native$Array.push,x,xs) : xs;});
      return A3($Native$Array.foldl,update,$Native$Array.empty,arr);
   });
   var foldr = $Native$Array.foldr;
   var foldl = $Native$Array.foldl;
   var indexedMap = $Native$Array.indexedMap;
   var map = $Native$Array.map;
   var toIndexedList = function (array) {
      return A3($List.map2,
      F2(function (v0,v1) {    return {ctor: "_Tuple2",_0: v0,_1: v1};}),
      _U.range(0,$Native$Array.length(array) - 1),
      $Native$Array.toList(array));
   };
   var toList = $Native$Array.toList;
   var fromList = $Native$Array.fromList;
   var initialize = $Native$Array.initialize;
   var repeat = F2(function (n,e) {    return A2(initialize,n,$Basics.always(e));});
   var Array = {ctor: "Array"};
   return _elm.Array.values = {_op: _op
                              ,empty: empty
                              ,repeat: repeat
                              ,initialize: initialize
                              ,fromList: fromList
                              ,isEmpty: isEmpty
                              ,length: length
                              ,push: push
                              ,append: append
                              ,get: get
                              ,set: set
                              ,slice: slice
                              ,toList: toList
                              ,toIndexedList: toIndexedList
                              ,map: map
                              ,indexedMap: indexedMap
                              ,filter: filter
                              ,foldl: foldl
                              ,foldr: foldr};
};
Elm.Random = Elm.Random || {};
Elm.Random.make = function (_elm) {
   "use strict";
   _elm.Random = _elm.Random || {};
   if (_elm.Random.values) return _elm.Random.values;
   var _U = Elm.Native.Utils.make(_elm),$Basics = Elm.Basics.make(_elm),$List = Elm.List.make(_elm);
   var _op = {};
   var magicNum8 = 2147483562;
   var range = function (_p0) {    return {ctor: "_Tuple2",_0: 0,_1: magicNum8};};
   var magicNum7 = 2137383399;
   var magicNum6 = 2147483563;
   var magicNum5 = 3791;
   var magicNum4 = 40692;
   var magicNum3 = 52774;
   var magicNum2 = 12211;
   var magicNum1 = 53668;
   var magicNum0 = 40014;
   var generate = F2(function (_p1,seed) {    var _p2 = _p1;return _p2._0(seed);});
   var Seed = function (a) {    return {ctor: "Seed",_0: a};};
   var State = F2(function (a,b) {    return {ctor: "State",_0: a,_1: b};});
   var initState = function (s$) {
      var s = A2($Basics.max,s$,0 - s$);
      var q = s / (magicNum6 - 1) | 0;
      var s2 = A2($Basics._op["%"],q,magicNum7 - 1);
      var s1 = A2($Basics._op["%"],s,magicNum6 - 1);
      return A2(State,s1 + 1,s2 + 1);
   };
   var next = function (_p3) {
      var _p4 = _p3;
      var _p6 = _p4._1;
      var _p5 = _p4._0;
      var k$ = _p6 / magicNum3 | 0;
      var s2$ = magicNum4 * (_p6 - k$ * magicNum3) - k$ * magicNum5;
      var s2$$ = _U.cmp(s2$,0) < 0 ? s2$ + magicNum7 : s2$;
      var k = _p5 / magicNum1 | 0;
      var s1$ = magicNum0 * (_p5 - k * magicNum1) - k * magicNum2;
      var s1$$ = _U.cmp(s1$,0) < 0 ? s1$ + magicNum6 : s1$;
      var z = s1$$ - s2$$;
      var z$ = _U.cmp(z,1) < 0 ? z + magicNum8 : z;
      return {ctor: "_Tuple2",_0: z$,_1: A2(State,s1$$,s2$$)};
   };
   var split = function (_p7) {
      var _p8 = _p7;
      var _p11 = _p8._1;
      var _p10 = _p8._0;
      var _p9 = $Basics.snd(next(_p8));
      var t1 = _p9._0;
      var t2 = _p9._1;
      var new_s2 = _U.eq(_p11,1) ? magicNum7 - 1 : _p11 - 1;
      var new_s1 = _U.eq(_p10,magicNum6 - 1) ? 1 : _p10 + 1;
      return {ctor: "_Tuple2",_0: A2(State,new_s1,t2),_1: A2(State,t1,new_s2)};
   };
   var initialSeed = function (n) {    return Seed({state: initState(n),next: next,split: split,range: range});};
   var Generator = function (a) {    return {ctor: "Generator",_0: a};};
   var andThen = F2(function (_p12,callback) {
      var _p13 = _p12;
      return Generator(function (seed) {
         var _p14 = _p13._0(seed);
         var result = _p14._0;
         var newSeed = _p14._1;
         var _p15 = callback(result);
         var genB = _p15._0;
         return genB(newSeed);
      });
   });
   var map5 = F6(function (func,_p20,_p19,_p18,_p17,_p16) {
      var _p21 = _p20;
      var _p22 = _p19;
      var _p23 = _p18;
      var _p24 = _p17;
      var _p25 = _p16;
      return Generator(function (seed0) {
         var _p26 = _p21._0(seed0);
         var a = _p26._0;
         var seed1 = _p26._1;
         var _p27 = _p22._0(seed1);
         var b = _p27._0;
         var seed2 = _p27._1;
         var _p28 = _p23._0(seed2);
         var c = _p28._0;
         var seed3 = _p28._1;
         var _p29 = _p24._0(seed3);
         var d = _p29._0;
         var seed4 = _p29._1;
         var _p30 = _p25._0(seed4);
         var e = _p30._0;
         var seed5 = _p30._1;
         return {ctor: "_Tuple2",_0: A5(func,a,b,c,d,e),_1: seed5};
      });
   });
   var map4 = F5(function (func,_p34,_p33,_p32,_p31) {
      var _p35 = _p34;
      var _p36 = _p33;
      var _p37 = _p32;
      var _p38 = _p31;
      return Generator(function (seed0) {
         var _p39 = _p35._0(seed0);
         var a = _p39._0;
         var seed1 = _p39._1;
         var _p40 = _p36._0(seed1);
         var b = _p40._0;
         var seed2 = _p40._1;
         var _p41 = _p37._0(seed2);
         var c = _p41._0;
         var seed3 = _p41._1;
         var _p42 = _p38._0(seed3);
         var d = _p42._0;
         var seed4 = _p42._1;
         return {ctor: "_Tuple2",_0: A4(func,a,b,c,d),_1: seed4};
      });
   });
   var map3 = F4(function (func,_p45,_p44,_p43) {
      var _p46 = _p45;
      var _p47 = _p44;
      var _p48 = _p43;
      return Generator(function (seed0) {
         var _p49 = _p46._0(seed0);
         var a = _p49._0;
         var seed1 = _p49._1;
         var _p50 = _p47._0(seed1);
         var b = _p50._0;
         var seed2 = _p50._1;
         var _p51 = _p48._0(seed2);
         var c = _p51._0;
         var seed3 = _p51._1;
         return {ctor: "_Tuple2",_0: A3(func,a,b,c),_1: seed3};
      });
   });
   var map2 = F3(function (func,_p53,_p52) {
      var _p54 = _p53;
      var _p55 = _p52;
      return Generator(function (seed0) {
         var _p56 = _p54._0(seed0);
         var a = _p56._0;
         var seed1 = _p56._1;
         var _p57 = _p55._0(seed1);
         var b = _p57._0;
         var seed2 = _p57._1;
         return {ctor: "_Tuple2",_0: A2(func,a,b),_1: seed2};
      });
   });
   var map = F2(function (func,_p58) {
      var _p59 = _p58;
      return Generator(function (seed0) {    var _p60 = _p59._0(seed0);var a = _p60._0;var seed1 = _p60._1;return {ctor: "_Tuple2",_0: func(a),_1: seed1};});
   });
   var listHelp = F4(function (list,n,generate,seed) {
      listHelp: while (true) if (_U.cmp(n,1) < 0) return {ctor: "_Tuple2",_0: $List.reverse(list),_1: seed}; else {
            var _p61 = generate(seed);
            var value = _p61._0;
            var newSeed = _p61._1;
            var _v19 = A2($List._op["::"],value,list),_v20 = n - 1,_v21 = generate,_v22 = newSeed;
            list = _v19;
            n = _v20;
            generate = _v21;
            seed = _v22;
            continue listHelp;
         }
   });
   var list = F2(function (n,_p62) {    var _p63 = _p62;return Generator(function (seed) {    return A4(listHelp,_U.list([]),n,_p63._0,seed);});});
   var pair = F2(function (genA,genB) {    return A3(map2,F2(function (v0,v1) {    return {ctor: "_Tuple2",_0: v0,_1: v1};}),genA,genB);});
   var minInt = -2147483648;
   var maxInt = 2147483647;
   var iLogBase = F2(function (b,i) {    return _U.cmp(i,b) < 0 ? 1 : 1 + A2(iLogBase,b,i / b | 0);});
   var $int = F2(function (a,b) {
      return Generator(function (_p64) {
         var _p65 = _p64;
         var _p70 = _p65._0;
         var base = 2147483561;
         var f = F3(function (n,acc,state) {
            f: while (true) {
               var _p66 = n;
               if (_p66 === 0) {
                     return {ctor: "_Tuple2",_0: acc,_1: state};
                  } else {
                     var _p67 = _p70.next(state);
                     var x = _p67._0;
                     var state$ = _p67._1;
                     var _v26 = n - 1,_v27 = x + acc * base,_v28 = state$;
                     n = _v26;
                     acc = _v27;
                     state = _v28;
                     continue f;
                  }
            }
         });
         var _p68 = _U.cmp(a,b) < 0 ? {ctor: "_Tuple2",_0: a,_1: b} : {ctor: "_Tuple2",_0: b,_1: a};
         var lo = _p68._0;
         var hi = _p68._1;
         var k = hi - lo + 1;
         var n = A2(iLogBase,base,k);
         var _p69 = A3(f,n,1,_p70.state);
         var v = _p69._0;
         var state$ = _p69._1;
         return {ctor: "_Tuple2",_0: lo + A2($Basics._op["%"],v,k),_1: Seed(_U.update(_p70,{state: state$}))};
      });
   });
   var $float = F2(function (a,b) {
      return Generator(function (seed) {
         var _p71 = A2(generate,A2($int,minInt,maxInt),seed);
         var number = _p71._0;
         var newSeed = _p71._1;
         var negativeOneToOne = $Basics.toFloat(number) / $Basics.toFloat(maxInt - minInt);
         var _p72 = _U.cmp(a,b) < 0 ? {ctor: "_Tuple2",_0: a,_1: b} : {ctor: "_Tuple2",_0: b,_1: a};
         var lo = _p72._0;
         var hi = _p72._1;
         var scaled = (lo + hi) / 2 + (hi - lo) * negativeOneToOne;
         return {ctor: "_Tuple2",_0: scaled,_1: newSeed};
      });
   });
   var bool = A2(map,F2(function (x,y) {    return _U.eq(x,y);})(1),A2($int,0,1));
   return _elm.Random.values = {_op: _op
                               ,bool: bool
                               ,$int: $int
                               ,$float: $float
                               ,list: list
                               ,pair: pair
                               ,map: map
                               ,map2: map2
                               ,map3: map3
                               ,map4: map4
                               ,map5: map5
                               ,andThen: andThen
                               ,minInt: minInt
                               ,maxInt: maxInt
                               ,generate: generate
                               ,initialSeed: initialSeed};
};
Elm.Native.Lazy = {};
Elm.Native.Lazy.make = function(localRuntime) {

    localRuntime.Native = localRuntime.Native || {};
    localRuntime.Native.Lazy = localRuntime.Native.Lazy || {};
    if (localRuntime.Native.Lazy.values) {
        return localRuntime.Native.Lazy.values;
    }

    function memoize(thunk) {
        var value;
        var isForced = false;
        return function(tuple0) {
            if (!isForced) {
                value = thunk(tuple0);
                isForced = true;
            }
            return value;
        };
    }

    return localRuntime.Native.Lazy.values = {
        memoize: memoize
    };
};

Elm.Lazy = Elm.Lazy || {};
Elm.Lazy.make = function (_elm) {
   "use strict";
   _elm.Lazy = _elm.Lazy || {};
   if (_elm.Lazy.values) return _elm.Lazy.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Native$Lazy = Elm.Native.Lazy.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm);
   var _op = {};
   var force = function (_p0) {    var _p1 = _p0;return _p1._0({ctor: "_Tuple0"});};
   var Lazy = function (a) {    return {ctor: "Lazy",_0: a};};
   var lazy = function (thunk) {    return Lazy($Native$Lazy.memoize(thunk));};
   var map = F2(function (f,a) {    return lazy(function (_p2) {    var _p3 = _p2;return f(force(a));});});
   var map2 = F3(function (f,a,b) {    return lazy(function (_p4) {    var _p5 = _p4;return A2(f,force(a),force(b));});});
   var map3 = F4(function (f,a,b,c) {    return lazy(function (_p6) {    var _p7 = _p6;return A3(f,force(a),force(b),force(c));});});
   var map4 = F5(function (f,a,b,c,d) {    return lazy(function (_p8) {    var _p9 = _p8;return A4(f,force(a),force(b),force(c),force(d));});});
   var map5 = F6(function (f,a,b,c,d,e) {    return lazy(function (_p10) {    var _p11 = _p10;return A5(f,force(a),force(b),force(c),force(d),force(e));});});
   var apply = F2(function (f,x) {    return lazy(function (_p12) {    var _p13 = _p12;return A2(force,f,force(x));});});
   var andThen = F2(function (a,callback) {    return lazy(function (_p14) {    var _p15 = _p14;return force(callback(force(a)));});});
   return _elm.Lazy.values = {_op: _op,force: force,lazy: lazy,map: map,map2: map2,map3: map3,map4: map4,map5: map5,apply: apply,andThen: andThen};
};
Elm.Lazy = Elm.Lazy || {};
Elm.Lazy.List = Elm.Lazy.List || {};
Elm.Lazy.List.make = function (_elm) {
   "use strict";
   _elm.Lazy = _elm.Lazy || {};
   _elm.Lazy.List = _elm.Lazy.List || {};
   if (_elm.Lazy.List.values) return _elm.Lazy.List.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Array = Elm.Array.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $Lazy = Elm.Lazy.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm);
   var _op = {};
   var toArray = function (list) {
      var _p0 = $Lazy.force(list);
      if (_p0.ctor === "Nil") {
            return $Array.empty;
         } else {
            return A2($Array.append,A2($Array.push,_p0._0,$Array.empty),toArray(_p0._1));
         }
   };
   var toList = function (list) {
      var _p1 = $Lazy.force(list);
      if (_p1.ctor === "Nil") {
            return _U.list([]);
         } else {
            return A2($List._op["::"],_p1._0,toList(_p1._1));
         }
   };
   var foldr = F3(function (reducer,b,list) {    return A3($Array.foldr,reducer,b,toArray(list));});
   var reduce = F3(function (reducer,b,list) {
      reduce: while (true) {
         var _p2 = $Lazy.force(list);
         if (_p2.ctor === "Nil") {
               return b;
            } else {
               var _v3 = reducer,_v4 = A2(reducer,_p2._0,b),_v5 = _p2._1;
               reducer = _v3;
               b = _v4;
               list = _v5;
               continue reduce;
            }
      }
   });
   var foldl = reduce;
   var sum = A2(reduce,F2(function (x,y) {    return x + y;}),0);
   var product = A2(reduce,F2(function (x,y) {    return x * y;}),1);
   var length = A2(reduce,F2(function (_p3,n) {    return n + 1;}),0);
   var member = F2(function (a,list) {
      var _p4 = $Lazy.force(list);
      if (_p4.ctor === "Nil") {
            return false;
         } else {
            return _U.eq(_p4._0,a) || A2(member,a,_p4._1);
         }
   });
   var tail = function (list) {    var _p5 = $Lazy.force(list);if (_p5.ctor === "Nil") {    return $Maybe.Nothing;} else {    return $Maybe.Just(_p5._1);}};
   var head = function (list) {    var _p6 = $Lazy.force(list);if (_p6.ctor === "Nil") {    return $Maybe.Nothing;} else {    return $Maybe.Just(_p6._0);}};
   var isEmpty = function (list) {    var _p7 = $Lazy.force(list);if (_p7.ctor === "Nil") {    return true;} else {    return false;}};
   var Cons = F2(function (a,b) {    return {ctor: "Cons",_0: a,_1: b};});
   var cons = F2(function (a,list) {    return $Lazy.lazy(function (_p8) {    var _p9 = _p8;return A2(Cons,a,list);});});
   _op[":::"] = cons;
   var append = F2(function (list1,list2) {
      return $Lazy.lazy(function (_p10) {
         var _p11 = _p10;
         var _p12 = $Lazy.force(list1);
         if (_p12.ctor === "Nil") {
               return $Lazy.force(list2);
            } else {
               return $Lazy.force(A2(_op[":::"],_p12._0,A2(_op["+++"],_p12._1,list2)));
            }
      });
   });
   _op["+++"] = append;
   var cycle = function (list) {    return A2(_op["+++"],list,$Lazy.lazy(function (_p13) {    var _p14 = _p13;return $Lazy.force(cycle(list));}));};
   var interleave = F2(function (list1,list2) {
      return $Lazy.lazy(function (_p15) {
         var _p16 = _p15;
         var _p17 = $Lazy.force(list1);
         if (_p17.ctor === "Nil") {
               return $Lazy.force(list2);
            } else {
               var _p18 = $Lazy.force(list2);
               if (_p18.ctor === "Nil") {
                     return $Lazy.force(list1);
                  } else {
                     return $Lazy.force(A2(_op[":::"],_p17._0,A2(_op[":::"],_p18._0,A2(interleave,_p17._1,_p18._1))));
                  }
            }
      });
   });
   var repeat = function (a) {    return $Lazy.lazy(function (_p19) {    var _p20 = _p19;return A2(Cons,a,repeat(a));});};
   var iterate = F2(function (f,a) {    return $Lazy.lazy(function (_p21) {    var _p22 = _p21;return A2(Cons,a,A2(iterate,f,f(a)));});});
   var numbers = A2(iterate,F2(function (x,y) {    return x + y;})(1),1);
   var Nil = {ctor: "Nil"};
   var empty = $Lazy.lazy(function (_p23) {    var _p24 = _p23;return Nil;});
   var singleton = function (a) {    return A2(cons,a,empty);};
   var reverse = A2(reduce,cons,empty);
   var fromList = A2($List.foldr,cons,empty);
   var fromArray = A2($Array.foldr,cons,empty);
   var intersperse = F2(function (a,list) {
      return $Lazy.lazy(function (_p25) {
         var _p26 = _p25;
         var _p27 = $Lazy.force(list);
         if (_p27.ctor === "Nil") {
               return Nil;
            } else {
               var _p32 = _p27._0;
               var _p28 = $Lazy.force(_p27._1);
               if (_p28.ctor === "Nil") {
                     return $Lazy.force(A2(_op[":::"],_p32,empty));
                  } else {
                     var _p31 = _p28._1;
                     var _p30 = _p28._0;
                     var _p29 = $Lazy.force(_p31);
                     if (_p29.ctor === "Nil") {
                           return $Lazy.force(A2(_op[":::"],_p32,A2(_op[":::"],a,A2(_op[":::"],_p30,empty))));
                        } else {
                           return $Lazy.force(A2(_op[":::"],_p32,A2(_op[":::"],a,A2(_op[":::"],_p30,A2(_op[":::"],a,A2(intersperse,a,_p31))))));
                        }
                  }
            }
      });
   });
   var take = F2(function (n,list) {
      return $Lazy.lazy(function (_p33) {
         var _p34 = _p33;
         if (_U.cmp(n,0) < 1) return Nil; else {
               var _p35 = $Lazy.force(list);
               if (_p35.ctor === "Nil") {
                     return Nil;
                  } else {
                     return A2(Cons,_p35._0,A2(take,n - 1,_p35._1));
                  }
            }
      });
   });
   var takeWhile = F2(function (predicate,list) {
      return $Lazy.lazy(function (_p36) {
         var _p37 = _p36;
         var _p38 = $Lazy.force(list);
         if (_p38.ctor === "Nil") {
               return Nil;
            } else {
               var _p39 = _p38._0;
               return predicate(_p39) ? A2(Cons,_p39,A2(takeWhile,predicate,_p38._1)) : Nil;
            }
      });
   });
   var drop = F2(function (n,list) {
      return $Lazy.lazy(function (_p40) {
         var _p41 = _p40;
         if (_U.cmp(n,0) < 1) return $Lazy.force(list); else {
               var _p42 = $Lazy.force(list);
               if (_p42.ctor === "Nil") {
                     return Nil;
                  } else {
                     return $Lazy.force(A2(drop,n - 1,_p42._1));
                  }
            }
      });
   });
   var dropWhile = F2(function (predicate,list) {
      return $Lazy.lazy(function (_p43) {
         var _p44 = _p43;
         var _p45 = $Lazy.force(list);
         if (_p45.ctor === "Nil") {
               return Nil;
            } else {
               return predicate(_p45._0) ? $Lazy.force(A2(dropWhile,predicate,_p45._1)) : $Lazy.force(list);
            }
      });
   });
   var unique = function (list) {
      return $Lazy.lazy(function (_p46) {
         var _p47 = _p46;
         var _p48 = $Lazy.force(list);
         if (_p48.ctor === "Nil") {
               return Nil;
            } else {
               var _p50 = _p48._1;
               var _p49 = _p48._0;
               return A2(member,_p49,_p50) ? $Lazy.force(unique(_p50)) : A2(Cons,_p49,unique(_p50));
            }
      });
   };
   var keepIf = F2(function (predicate,list) {
      return $Lazy.lazy(function (_p51) {
         var _p52 = _p51;
         var _p53 = $Lazy.force(list);
         if (_p53.ctor === "Nil") {
               return Nil;
            } else {
               var _p55 = _p53._1;
               var _p54 = _p53._0;
               return predicate(_p54) ? A2(Cons,_p54,A2(keepIf,predicate,_p55)) : $Lazy.force(A2(keepIf,predicate,_p55));
            }
      });
   });
   var dropIf = function (predicate) {    return keepIf(function (n) {    return $Basics.not(predicate(n));});};
   var flatten = function (list) {
      return $Lazy.lazy(function (_p56) {
         var _p57 = _p56;
         var _p58 = $Lazy.force(list);
         if (_p58.ctor === "Nil") {
               return Nil;
            } else {
               return $Lazy.force(A2(_op["+++"],_p58._0,flatten(_p58._1)));
            }
      });
   };
   var map = F2(function (f,list) {
      return $Lazy.lazy(function (_p59) {
         var _p60 = _p59;
         var _p61 = $Lazy.force(list);
         if (_p61.ctor === "Nil") {
               return Nil;
            } else {
               return A2(Cons,f(_p61._0),A2(map,f,_p61._1));
            }
      });
   });
   var flatMap = function (f) {    return function (_p62) {    return flatten(A2(map,f,_p62));};};
   var andThen = $Basics.flip(flatMap);
   var map2 = F3(function (f,list1,list2) {
      return $Lazy.lazy(function (_p63) {
         var _p64 = _p63;
         var _p65 = $Lazy.force(list1);
         if (_p65.ctor === "Nil") {
               return Nil;
            } else {
               var _p66 = $Lazy.force(list2);
               if (_p66.ctor === "Nil") {
                     return Nil;
                  } else {
                     return A2(Cons,A2(f,_p65._0,_p66._0),A3(map2,f,_p65._1,_p66._1));
                  }
            }
      });
   });
   var andMap = map2(F2(function (x,y) {    return x(y);}));
   var map3 = F4(function (f,l1,l2,l3) {    return A2(andMap,A2(andMap,A2(map,f,l1),l2),l3);});
   var zip3 = map3(F3(function (v0,v1,v2) {    return {ctor: "_Tuple3",_0: v0,_1: v1,_2: v2};}));
   var map4 = F5(function (f,l1,l2,l3,l4) {    return A2(andMap,A2(andMap,A2(andMap,A2(map,f,l1),l2),l3),l4);});
   var zip4 = map4(F4(function (v0,v1,v2,v3) {    return {ctor: "_Tuple4",_0: v0,_1: v1,_2: v2,_3: v3};}));
   var map5 = F6(function (f,l1,l2,l3,l4,l5) {    return A2(andMap,A2(andMap,A2(andMap,A2(andMap,A2(map,f,l1),l2),l3),l4),l5);});
   var zip5 = map5(F5(function (v0,v1,v2,v3,v4) {    return {ctor: "_Tuple5",_0: v0,_1: v1,_2: v2,_3: v3,_4: v4};}));
   var zip = map2(F2(function (v0,v1) {    return {ctor: "_Tuple2",_0: v0,_1: v1};}));
   return _elm.Lazy.List.values = {_op: _op
                                  ,Nil: Nil
                                  ,Cons: Cons
                                  ,empty: empty
                                  ,singleton: singleton
                                  ,isEmpty: isEmpty
                                  ,cons: cons
                                  ,head: head
                                  ,tail: tail
                                  ,repeat: repeat
                                  ,append: append
                                  ,interleave: interleave
                                  ,intersperse: intersperse
                                  ,cycle: cycle
                                  ,iterate: iterate
                                  ,numbers: numbers
                                  ,take: take
                                  ,takeWhile: takeWhile
                                  ,drop: drop
                                  ,dropWhile: dropWhile
                                  ,member: member
                                  ,length: length
                                  ,unique: unique
                                  ,keepIf: keepIf
                                  ,dropIf: dropIf
                                  ,reduce: reduce
                                  ,foldl: foldl
                                  ,foldr: foldr
                                  ,sum: sum
                                  ,product: product
                                  ,flatten: flatten
                                  ,flatMap: flatMap
                                  ,andThen: andThen
                                  ,reverse: reverse
                                  ,map: map
                                  ,map2: map2
                                  ,andMap: andMap
                                  ,map3: map3
                                  ,map4: map4
                                  ,map5: map5
                                  ,zip: zip
                                  ,zip3: zip3
                                  ,zip4: zip4
                                  ,zip5: zip5
                                  ,toList: toList
                                  ,fromList: fromList
                                  ,toArray: toArray
                                  ,fromArray: fromArray};
};
Elm.Trampoline = Elm.Trampoline || {};
Elm.Trampoline.make = function (_elm) {
   "use strict";
   _elm.Trampoline = _elm.Trampoline || {};
   if (_elm.Trampoline.values) return _elm.Trampoline.values;
   var _U = Elm.Native.Utils.make(_elm);
   var _op = {};
   var trampoline = function (tramp) {
      trampoline: while (true) {
         var _p0 = tramp;
         if (_p0.ctor === "Done") {
               return _p0._0;
            } else {
               var _v1 = _p0._0({ctor: "_Tuple0"});
               tramp = _v1;
               continue trampoline;
            }
      }
   };
   var Continue = function (a) {    return {ctor: "Continue",_0: a};};
   var Done = function (a) {    return {ctor: "Done",_0: a};};
   return _elm.Trampoline.values = {_op: _op,trampoline: trampoline,Done: Done,Continue: Continue};
};
Elm.Utils = Elm.Utils || {};
Elm.Utils.make = function (_elm) {
   "use strict";
   _elm.Utils = _elm.Utils || {};
   if (_elm.Utils.values) return _elm.Utils.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm);
   var _op = {};
   var get = F2(function (index,list) {
      if (_U.cmp(index,0) < 0) return $Maybe.Nothing; else {
            var _p0 = A2($List.drop,index,list);
            if (_p0.ctor === "[]") {
                  return $Maybe.Nothing;
               } else {
                  return $Maybe.Just(_p0._0);
               }
         }
   });
   return _elm.Utils.values = {_op: _op,get: get};
};
Elm.Random = Elm.Random || {};
Elm.Random.Extra = Elm.Random.Extra || {};
Elm.Random.Extra.make = function (_elm) {
   "use strict";
   _elm.Random = _elm.Random || {};
   _elm.Random.Extra = _elm.Random.Extra || {};
   if (_elm.Random.Extra.values) return _elm.Random.Extra.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Random = Elm.Random.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm),
   $Utils = Elm.Utils.make(_elm);
   var _op = {};
   var mapConstraint = F2(function (constraint,generator) {
      return A2($Random.map,function (a) {    return {ctor: "_Tuple2",_0: a,_1: constraint(a)};},generator);
   });
   var quickGenerate = function (generator) {    return $Basics.fst(A2($Random.generate,generator,$Random.initialSeed(1)));};
   var cappedGenerateUntil = F4(function (maxGenerations,predicate,generator,seed) {
      if (_U.cmp(maxGenerations,0) < 1) return _U.list([]); else {
            var _p0 = A2($Random.generate,generator,seed);
            var value = _p0._0;
            var nextSeed = _p0._1;
            return predicate(value) ? A2($List._op["::"],value,A4(cappedGenerateUntil,maxGenerations - 1,predicate,generator,nextSeed)) : _U.list([]);
         }
   });
   var generateUntil = F3(function (predicate,generator,seed) {
      var _p1 = A2($Random.generate,generator,seed);
      var value = _p1._0;
      var nextSeed = _p1._1;
      return predicate(value) ? A2($List._op["::"],value,A3(generateUntil,predicate,generator,nextSeed)) : _U.list([]);
   });
   var generateIterativelyUntil = F4(function (maxLength,predicate,constructor,seed) {
      var iterate = function (index) {
         return _U.cmp(index,maxLength) > -1 ? _U.list([]) : A2($Basics._op["++"],A3(generateUntil,predicate,constructor(index),seed),iterate(index + 1));
      };
      return iterate(0);
   });
   var generateIterativelySuchThat = F2(function (maxLength,predicate) {
      return A2(generateIterativelyUntil,maxLength,function (a) {    return $Basics.not(predicate(a));});
   });
   var generateN = F3(function (n,generator,seed) {
      if (_U.cmp(n,0) < 1) return _U.list([]); else {
            var _p2 = A2($Random.generate,generator,seed);
            var value = _p2._0;
            var nextSeed = _p2._1;
            return A2($List._op["::"],value,A3(generateN,n - 1,generator,nextSeed));
         }
   });
   var map5 = $Random.map5;
   var map4 = $Random.map4;
   var map3 = $Random.map3;
   var map2 = $Random.map2;
   var map = $Random.map;
   var flatMap6 = F7(function (constructor,generatorA,generatorB,generatorC,generatorD,generatorE,generatorF) {
      return A2($Random.andThen,
      generatorA,
      function (a) {
         return A2($Random.andThen,
         generatorB,
         function (b) {
            return A2($Random.andThen,
            generatorC,
            function (c) {
               return A2($Random.andThen,
               generatorD,
               function (d) {
                  return A2($Random.andThen,
                  generatorE,
                  function (e) {
                     return A2($Random.andThen,generatorF,function (f) {    return A6(constructor,a,b,c,d,e,f);});
                  });
               });
            });
         });
      });
   });
   var flatMap5 = F6(function (constructor,generatorA,generatorB,generatorC,generatorD,generatorE) {
      return A2($Random.andThen,
      generatorA,
      function (a) {
         return A2($Random.andThen,
         generatorB,
         function (b) {
            return A2($Random.andThen,
            generatorC,
            function (c) {
               return A2($Random.andThen,
               generatorD,
               function (d) {
                  return A2($Random.andThen,generatorE,function (e) {    return A5(constructor,a,b,c,d,e);});
               });
            });
         });
      });
   });
   var flatMap4 = F5(function (constructor,generatorA,generatorB,generatorC,generatorD) {
      return A2($Random.andThen,
      generatorA,
      function (a) {
         return A2($Random.andThen,
         generatorB,
         function (b) {
            return A2($Random.andThen,generatorC,function (c) {    return A2($Random.andThen,generatorD,function (d) {    return A4(constructor,a,b,c,d);});});
         });
      });
   });
   var flatMap3 = F4(function (constructor,generatorA,generatorB,generatorC) {
      return A2($Random.andThen,
      generatorA,
      function (a) {
         return A2($Random.andThen,generatorB,function (b) {    return A2($Random.andThen,generatorC,function (c) {    return A3(constructor,a,b,c);});});
      });
   });
   var flatMap2 = F3(function (constructor,generatorA,generatorB) {
      return A2($Random.andThen,generatorA,function (a) {    return A2($Random.andThen,generatorB,function (b) {    return A2(constructor,a,b);});});
   });
   var flatMap = $Basics.flip($Random.andThen);
   var andThen = $Random.andThen;
   var zip5 = map5(F5(function (v0,v1,v2,v3,v4) {    return {ctor: "_Tuple5",_0: v0,_1: v1,_2: v2,_3: v3,_4: v4};}));
   var zip4 = map4(F4(function (v0,v1,v2,v3) {    return {ctor: "_Tuple4",_0: v0,_1: v1,_2: v2,_3: v3};}));
   var zip3 = map3(F3(function (v0,v1,v2) {    return {ctor: "_Tuple3",_0: v0,_1: v1,_2: v2};}));
   var zip = map2(F2(function (v0,v1) {    return {ctor: "_Tuple2",_0: v0,_1: v1};}));
   var reduce = F3(function (reducer,initial,generator) {    return A2($Random.map,function (a) {    return A2(reducer,a,initial);},generator);});
   var fold = reduce;
   var andMap = F2(function (funcGenerator,generator) {    return A3($Random.map2,F2(function (x,y) {    return x(y);}),funcGenerator,generator);});
   var map6 = F7(function (f,generatorA,generatorB,generatorC,generatorD,generatorE,generatorF) {
      return A2(andMap,A6($Random.map5,f,generatorA,generatorB,generatorC,generatorD,generatorE),generatorF);
   });
   var zip6 = map6(F6(function (v0,v1,v2,v3,v4,v5) {    return {ctor: "_Tuple6",_0: v0,_1: v1,_2: v2,_3: v3,_4: v4,_5: v5};}));
   var constant = function () {
      var dummy = A2($Random.$int,1,2);
      return function (value) {
         return A2($Random.map,function (_p3) {    return value;},dummy);
      };
   }();
   var select = function (list) {
      return A2($Random.map,function (index) {    return A2($Utils.get,index,list);},A2($Random.$int,0,$List.length(list) - 1));
   };
   var selectWithDefault = F2(function (defaultValue,list) {    return A2(map,$Maybe.withDefault(defaultValue),select(list));});
   var flattenList = function (generators) {
      var _p4 = generators;
      if (_p4.ctor === "[]") {
            return constant(_U.list([]));
         } else {
            return A3(flatMap2,F2(function (a,b) {    return constant(A2($List._op["::"],a,b));}),_p4._0,flattenList(_p4._1));
         }
   };
   var keepIf = F2(function (predicate,generator) {
      return A2($Random.andThen,generator,function (a) {    return predicate(a) ? constant(a) : A2(keepIf,predicate,generator);});
   });
   var dropIf = function (predicate) {    return keepIf(function (a) {    return $Basics.not(predicate(a));});};
   var generateSuchThat = F3(function (predicate,generator,seed) {    return A2($Random.generate,A2(keepIf,predicate,generator),seed);});
   var frequency = F2(function (pairs,defaultGenerator) {
      var frequencies = A2($List.map,function (_p5) {    return $Basics.abs($Basics.fst(_p5));},pairs);
      var total = $List.sum(frequencies) * $Basics.toFloat($List.length(frequencies));
      return _U.eq(total,0) ? defaultGenerator : A2($Random.andThen,
      A2($Random.$float,0,total),
      function (randIndex) {
         var index = $Basics.floor(randIndex);
         var maybePair = A2($Utils.get,index,pairs);
         var generator = function () {    var _p6 = maybePair;if (_p6.ctor === "Nothing") {    return defaultGenerator;} else {    return _p6._0._1;}}();
         return generator;
      });
   });
   var merge = F2(function (generator1,generator2) {
      return A2(frequency,_U.list([{ctor: "_Tuple2",_0: 1,_1: generator1},{ctor: "_Tuple2",_0: 1,_1: generator2}]),generator1);
   });
   return _elm.Random.Extra.values = {_op: _op
                                     ,frequency: frequency
                                     ,keepIf: keepIf
                                     ,dropIf: dropIf
                                     ,flattenList: flattenList
                                     ,select: select
                                     ,selectWithDefault: selectWithDefault
                                     ,constant: constant
                                     ,andMap: andMap
                                     ,reduce: reduce
                                     ,fold: fold
                                     ,zip: zip
                                     ,zip3: zip3
                                     ,zip4: zip4
                                     ,zip5: zip5
                                     ,zip6: zip6
                                     ,andThen: andThen
                                     ,flatMap: flatMap
                                     ,flatMap2: flatMap2
                                     ,flatMap3: flatMap3
                                     ,flatMap4: flatMap4
                                     ,flatMap5: flatMap5
                                     ,flatMap6: flatMap6
                                     ,map: map
                                     ,map2: map2
                                     ,map3: map3
                                     ,map4: map4
                                     ,map5: map5
                                     ,map6: map6
                                     ,merge: merge
                                     ,generateN: generateN
                                     ,generateSuchThat: generateSuchThat
                                     ,generateUntil: generateUntil
                                     ,generateIterativelySuchThat: generateIterativelySuchThat
                                     ,generateIterativelyUntil: generateIterativelyUntil
                                     ,cappedGenerateUntil: cappedGenerateUntil
                                     ,quickGenerate: quickGenerate
                                     ,mapConstraint: mapConstraint};
};
Elm.Native.Char = {};
Elm.Native.Char.make = function(localRuntime) {
	localRuntime.Native = localRuntime.Native || {};
	localRuntime.Native.Char = localRuntime.Native.Char || {};
	if (localRuntime.Native.Char.values)
	{
		return localRuntime.Native.Char.values;
	}

	var Utils = Elm.Native.Utils.make(localRuntime);

	return localRuntime.Native.Char.values = {
		fromCode: function(c) { return Utils.chr(String.fromCharCode(c)); },
		toCode: function(c) { return c.charCodeAt(0); },
		toUpper: function(c) { return Utils.chr(c.toUpperCase()); },
		toLower: function(c) { return Utils.chr(c.toLowerCase()); },
		toLocaleUpper: function(c) { return Utils.chr(c.toLocaleUpperCase()); },
		toLocaleLower: function(c) { return Utils.chr(c.toLocaleLowerCase()); }
	};
};

Elm.Char = Elm.Char || {};
Elm.Char.make = function (_elm) {
   "use strict";
   _elm.Char = _elm.Char || {};
   if (_elm.Char.values) return _elm.Char.values;
   var _U = Elm.Native.Utils.make(_elm),$Basics = Elm.Basics.make(_elm),$Native$Char = Elm.Native.Char.make(_elm);
   var _op = {};
   var fromCode = $Native$Char.fromCode;
   var toCode = $Native$Char.toCode;
   var toLocaleLower = $Native$Char.toLocaleLower;
   var toLocaleUpper = $Native$Char.toLocaleUpper;
   var toLower = $Native$Char.toLower;
   var toUpper = $Native$Char.toUpper;
   var isBetween = F3(function (low,high,$char) {    var code = toCode($char);return _U.cmp(code,toCode(low)) > -1 && _U.cmp(code,toCode(high)) < 1;});
   var isUpper = A2(isBetween,_U.chr("A"),_U.chr("Z"));
   var isLower = A2(isBetween,_U.chr("a"),_U.chr("z"));
   var isDigit = A2(isBetween,_U.chr("0"),_U.chr("9"));
   var isOctDigit = A2(isBetween,_U.chr("0"),_U.chr("7"));
   var isHexDigit = function ($char) {
      return isDigit($char) || (A3(isBetween,_U.chr("a"),_U.chr("f"),$char) || A3(isBetween,_U.chr("A"),_U.chr("F"),$char));
   };
   return _elm.Char.values = {_op: _op
                             ,isUpper: isUpper
                             ,isLower: isLower
                             ,isDigit: isDigit
                             ,isOctDigit: isOctDigit
                             ,isHexDigit: isHexDigit
                             ,toUpper: toUpper
                             ,toLower: toLower
                             ,toLocaleUpper: toLocaleUpper
                             ,toLocaleLower: toLocaleLower
                             ,toCode: toCode
                             ,fromCode: fromCode};
};
Elm.Native.String = {};

Elm.Native.String.make = function(localRuntime) {
	localRuntime.Native = localRuntime.Native || {};
	localRuntime.Native.String = localRuntime.Native.String || {};
	if (localRuntime.Native.String.values)
	{
		return localRuntime.Native.String.values;
	}
	if ('values' in Elm.Native.String)
	{
		return localRuntime.Native.String.values = Elm.Native.String.values;
	}


	var Char = Elm.Char.make(localRuntime);
	var List = Elm.Native.List.make(localRuntime);
	var Maybe = Elm.Maybe.make(localRuntime);
	var Result = Elm.Result.make(localRuntime);
	var Utils = Elm.Native.Utils.make(localRuntime);

	function isEmpty(str)
	{
		return str.length === 0;
	}
	function cons(chr, str)
	{
		return chr + str;
	}
	function uncons(str)
	{
		var hd = str[0];
		if (hd)
		{
			return Maybe.Just(Utils.Tuple2(Utils.chr(hd), str.slice(1)));
		}
		return Maybe.Nothing;
	}
	function append(a, b)
	{
		return a + b;
	}
	function concat(strs)
	{
		return List.toArray(strs).join('');
	}
	function length(str)
	{
		return str.length;
	}
	function map(f, str)
	{
		var out = str.split('');
		for (var i = out.length; i--; )
		{
			out[i] = f(Utils.chr(out[i]));
		}
		return out.join('');
	}
	function filter(pred, str)
	{
		return str.split('').map(Utils.chr).filter(pred).join('');
	}
	function reverse(str)
	{
		return str.split('').reverse().join('');
	}
	function foldl(f, b, str)
	{
		var len = str.length;
		for (var i = 0; i < len; ++i)
		{
			b = A2(f, Utils.chr(str[i]), b);
		}
		return b;
	}
	function foldr(f, b, str)
	{
		for (var i = str.length; i--; )
		{
			b = A2(f, Utils.chr(str[i]), b);
		}
		return b;
	}
	function split(sep, str)
	{
		return List.fromArray(str.split(sep));
	}
	function join(sep, strs)
	{
		return List.toArray(strs).join(sep);
	}
	function repeat(n, str)
	{
		var result = '';
		while (n > 0)
		{
			if (n & 1)
			{
				result += str;
			}
			n >>= 1, str += str;
		}
		return result;
	}
	function slice(start, end, str)
	{
		return str.slice(start, end);
	}
	function left(n, str)
	{
		return n < 1 ? '' : str.slice(0, n);
	}
	function right(n, str)
	{
		return n < 1 ? '' : str.slice(-n);
	}
	function dropLeft(n, str)
	{
		return n < 1 ? str : str.slice(n);
	}
	function dropRight(n, str)
	{
		return n < 1 ? str : str.slice(0, -n);
	}
	function pad(n, chr, str)
	{
		var half = (n - str.length) / 2;
		return repeat(Math.ceil(half), chr) + str + repeat(half | 0, chr);
	}
	function padRight(n, chr, str)
	{
		return str + repeat(n - str.length, chr);
	}
	function padLeft(n, chr, str)
	{
		return repeat(n - str.length, chr) + str;
	}

	function trim(str)
	{
		return str.trim();
	}
	function trimLeft(str)
	{
		return str.replace(/^\s+/, '');
	}
	function trimRight(str)
	{
		return str.replace(/\s+$/, '');
	}

	function words(str)
	{
		return List.fromArray(str.trim().split(/\s+/g));
	}
	function lines(str)
	{
		return List.fromArray(str.split(/\r\n|\r|\n/g));
	}

	function toUpper(str)
	{
		return str.toUpperCase();
	}
	function toLower(str)
	{
		return str.toLowerCase();
	}

	function any(pred, str)
	{
		for (var i = str.length; i--; )
		{
			if (pred(Utils.chr(str[i])))
			{
				return true;
			}
		}
		return false;
	}
	function all(pred, str)
	{
		for (var i = str.length; i--; )
		{
			if (!pred(Utils.chr(str[i])))
			{
				return false;
			}
		}
		return true;
	}

	function contains(sub, str)
	{
		return str.indexOf(sub) > -1;
	}
	function startsWith(sub, str)
	{
		return str.indexOf(sub) === 0;
	}
	function endsWith(sub, str)
	{
		return str.length >= sub.length &&
			str.lastIndexOf(sub) === str.length - sub.length;
	}
	function indexes(sub, str)
	{
		var subLen = sub.length;
		var i = 0;
		var is = [];
		while ((i = str.indexOf(sub, i)) > -1)
		{
			is.push(i);
			i = i + subLen;
		}
		return List.fromArray(is);
	}

	function toInt(s)
	{
		var len = s.length;
		if (len === 0)
		{
			return Result.Err("could not convert string '" + s + "' to an Int" );
		}
		var start = 0;
		if (s[0] === '-')
		{
			if (len === 1)
			{
				return Result.Err("could not convert string '" + s + "' to an Int" );
			}
			start = 1;
		}
		for (var i = start; i < len; ++i)
		{
			if (!Char.isDigit(s[i]))
			{
				return Result.Err("could not convert string '" + s + "' to an Int" );
			}
		}
		return Result.Ok(parseInt(s, 10));
	}

	function toFloat(s)
	{
		var len = s.length;
		if (len === 0)
		{
			return Result.Err("could not convert string '" + s + "' to a Float" );
		}
		var start = 0;
		if (s[0] === '-')
		{
			if (len === 1)
			{
				return Result.Err("could not convert string '" + s + "' to a Float" );
			}
			start = 1;
		}
		var dotCount = 0;
		for (var i = start; i < len; ++i)
		{
			if (Char.isDigit(s[i]))
			{
				continue;
			}
			if (s[i] === '.')
			{
				dotCount += 1;
				if (dotCount <= 1)
				{
					continue;
				}
			}
			return Result.Err("could not convert string '" + s + "' to a Float" );
		}
		return Result.Ok(parseFloat(s));
	}

	function toList(str)
	{
		return List.fromArray(str.split('').map(Utils.chr));
	}
	function fromList(chars)
	{
		return List.toArray(chars).join('');
	}

	return Elm.Native.String.values = {
		isEmpty: isEmpty,
		cons: F2(cons),
		uncons: uncons,
		append: F2(append),
		concat: concat,
		length: length,
		map: F2(map),
		filter: F2(filter),
		reverse: reverse,
		foldl: F3(foldl),
		foldr: F3(foldr),

		split: F2(split),
		join: F2(join),
		repeat: F2(repeat),

		slice: F3(slice),
		left: F2(left),
		right: F2(right),
		dropLeft: F2(dropLeft),
		dropRight: F2(dropRight),

		pad: F3(pad),
		padLeft: F3(padLeft),
		padRight: F3(padRight),

		trim: trim,
		trimLeft: trimLeft,
		trimRight: trimRight,

		words: words,
		lines: lines,

		toUpper: toUpper,
		toLower: toLower,

		any: F2(any),
		all: F2(all),

		contains: F2(contains),
		startsWith: F2(startsWith),
		endsWith: F2(endsWith),
		indexes: F2(indexes),

		toInt: toInt,
		toFloat: toFloat,
		toList: toList,
		fromList: fromList
	};
};

Elm.String = Elm.String || {};
Elm.String.make = function (_elm) {
   "use strict";
   _elm.String = _elm.String || {};
   if (_elm.String.values) return _elm.String.values;
   var _U = Elm.Native.Utils.make(_elm),$Maybe = Elm.Maybe.make(_elm),$Native$String = Elm.Native.String.make(_elm),$Result = Elm.Result.make(_elm);
   var _op = {};
   var fromList = $Native$String.fromList;
   var toList = $Native$String.toList;
   var toFloat = $Native$String.toFloat;
   var toInt = $Native$String.toInt;
   var indices = $Native$String.indexes;
   var indexes = $Native$String.indexes;
   var endsWith = $Native$String.endsWith;
   var startsWith = $Native$String.startsWith;
   var contains = $Native$String.contains;
   var all = $Native$String.all;
   var any = $Native$String.any;
   var toLower = $Native$String.toLower;
   var toUpper = $Native$String.toUpper;
   var lines = $Native$String.lines;
   var words = $Native$String.words;
   var trimRight = $Native$String.trimRight;
   var trimLeft = $Native$String.trimLeft;
   var trim = $Native$String.trim;
   var padRight = $Native$String.padRight;
   var padLeft = $Native$String.padLeft;
   var pad = $Native$String.pad;
   var dropRight = $Native$String.dropRight;
   var dropLeft = $Native$String.dropLeft;
   var right = $Native$String.right;
   var left = $Native$String.left;
   var slice = $Native$String.slice;
   var repeat = $Native$String.repeat;
   var join = $Native$String.join;
   var split = $Native$String.split;
   var foldr = $Native$String.foldr;
   var foldl = $Native$String.foldl;
   var reverse = $Native$String.reverse;
   var filter = $Native$String.filter;
   var map = $Native$String.map;
   var length = $Native$String.length;
   var concat = $Native$String.concat;
   var append = $Native$String.append;
   var uncons = $Native$String.uncons;
   var cons = $Native$String.cons;
   var fromChar = function ($char) {    return A2(cons,$char,"");};
   var isEmpty = $Native$String.isEmpty;
   return _elm.String.values = {_op: _op
                               ,isEmpty: isEmpty
                               ,length: length
                               ,reverse: reverse
                               ,repeat: repeat
                               ,cons: cons
                               ,uncons: uncons
                               ,fromChar: fromChar
                               ,append: append
                               ,concat: concat
                               ,split: split
                               ,join: join
                               ,words: words
                               ,lines: lines
                               ,slice: slice
                               ,left: left
                               ,right: right
                               ,dropLeft: dropLeft
                               ,dropRight: dropRight
                               ,contains: contains
                               ,startsWith: startsWith
                               ,endsWith: endsWith
                               ,indexes: indexes
                               ,indices: indices
                               ,toInt: toInt
                               ,toFloat: toFloat
                               ,toList: toList
                               ,fromList: fromList
                               ,toUpper: toUpper
                               ,toLower: toLower
                               ,pad: pad
                               ,padLeft: padLeft
                               ,padRight: padRight
                               ,trim: trim
                               ,trimLeft: trimLeft
                               ,trimRight: trimRight
                               ,map: map
                               ,filter: filter
                               ,foldl: foldl
                               ,foldr: foldr
                               ,any: any
                               ,all: all};
};
Elm.Shrink = Elm.Shrink || {};
Elm.Shrink.make = function (_elm) {
   "use strict";
   _elm.Shrink = _elm.Shrink || {};
   if (_elm.Shrink.values) return _elm.Shrink.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Array = Elm.Array.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Char = Elm.Char.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $Lazy = Elm.Lazy.make(_elm),
   $Lazy$List = Elm.Lazy.List.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm),
   $String = Elm.String.make(_elm);
   var _op = {};
   var seriesFloat = F2(function (low,high) {
      if (_U.cmp(low,high - 1.0e-4) > -1) return $Lazy$List.empty; else {
            var low$ = low + (high - low) / 2;
            return A2($Lazy$List._op[":::"],low,A2(seriesFloat,low$,high));
         }
   });
   var seriesInt = F2(function (low,high) {
      if (_U.cmp(low,high) > -1) return $Lazy$List.empty; else if (_U.eq(low,high - 1)) return A2($Lazy$List._op[":::"],low,$Lazy$List.empty); else {
               var low$ = low + ((high - low) / 2 | 0);
               return A2($Lazy$List._op[":::"],low,A2(seriesInt,low$,high));
            }
   });
   var andMap = $Lazy$List.andMap;
   var map = $Lazy$List.map;
   var merge = F3(function (shrink1,shrink2,a) {    return $Lazy$List.unique(A2($Lazy$List._op["+++"],shrink1(a),shrink2(a)));});
   var keepIf = F3(function (predicate,shrink,a) {    return A2($Lazy$List.keepIf,predicate,shrink(a));});
   var dropIf = function (predicate) {    return keepIf(function (_p0) {    return $Basics.not(predicate(_p0));});};
   var convert = F4(function (f,f$,shrink,b) {    return A2($Lazy$List.map,f,shrink(f$(b)));});
   var tuple5 = F2(function (_p2,_p1) {
      var _p3 = _p2;
      var _p14 = _p3._4;
      var _p13 = _p3._3;
      var _p12 = _p3._2;
      var _p11 = _p3._1;
      var _p10 = _p3._0;
      var _p4 = _p1;
      var _p9 = _p4._4;
      var _p8 = _p4._3;
      var _p7 = _p4._2;
      var _p6 = _p4._1;
      var _p5 = _p4._0;
      return A2($Lazy$List._op["+++"],
      A2($Lazy$List.map,function (e) {    return {ctor: "_Tuple5",_0: _p5,_1: _p6,_2: _p7,_3: _p8,_4: e};},_p14(_p9)),
      A2($Lazy$List._op["+++"],
      A2($Lazy$List.map,function (d) {    return {ctor: "_Tuple5",_0: _p5,_1: _p6,_2: _p7,_3: d,_4: _p9};},_p13(_p8)),
      A2($Lazy$List._op["+++"],
      A2($Lazy$List.map,function (c) {    return {ctor: "_Tuple5",_0: _p5,_1: _p6,_2: c,_3: _p8,_4: _p9};},_p12(_p7)),
      A2($Lazy$List._op["+++"],
      A2($Lazy$List.map,function (b) {    return {ctor: "_Tuple5",_0: _p5,_1: b,_2: _p7,_3: _p8,_4: _p9};},_p11(_p6)),
      A2($Lazy$List._op["+++"],
      A2($Lazy$List.map,function (a) {    return {ctor: "_Tuple5",_0: a,_1: _p6,_2: _p7,_3: _p8,_4: _p9};},_p10(_p5)),
      A2($Lazy$List._op["+++"],
      A3($Lazy$List.map2,F2(function (d,e) {    return {ctor: "_Tuple5",_0: _p5,_1: _p6,_2: _p7,_3: d,_4: e};}),_p13(_p8),_p14(_p9)),
      A2($Lazy$List._op["+++"],
      A3($Lazy$List.map2,F2(function (c,e) {    return {ctor: "_Tuple5",_0: _p5,_1: _p6,_2: c,_3: _p8,_4: e};}),_p12(_p7),_p14(_p9)),
      A2($Lazy$List._op["+++"],
      A3($Lazy$List.map2,F2(function (b,e) {    return {ctor: "_Tuple5",_0: _p5,_1: b,_2: _p7,_3: _p8,_4: e};}),_p11(_p6),_p14(_p9)),
      A2($Lazy$List._op["+++"],
      A3($Lazy$List.map2,F2(function (a,e) {    return {ctor: "_Tuple5",_0: a,_1: _p6,_2: _p7,_3: _p8,_4: e};}),_p10(_p5),_p14(_p9)),
      A2($Lazy$List._op["+++"],
      A3($Lazy$List.map2,F2(function (c,d) {    return {ctor: "_Tuple5",_0: _p5,_1: _p6,_2: c,_3: d,_4: _p9};}),_p12(_p7),_p13(_p8)),
      A2($Lazy$List._op["+++"],
      A3($Lazy$List.map2,F2(function (b,d) {    return {ctor: "_Tuple5",_0: _p5,_1: b,_2: _p7,_3: d,_4: _p9};}),_p11(_p6),_p13(_p8)),
      A2($Lazy$List._op["+++"],
      A3($Lazy$List.map2,F2(function (a,d) {    return {ctor: "_Tuple5",_0: a,_1: _p6,_2: _p7,_3: d,_4: _p9};}),_p10(_p5),_p13(_p8)),
      A2($Lazy$List._op["+++"],
      A3($Lazy$List.map2,F2(function (b,c) {    return {ctor: "_Tuple5",_0: _p5,_1: b,_2: c,_3: _p8,_4: _p9};}),_p11(_p6),_p12(_p7)),
      A2($Lazy$List._op["+++"],
      A3($Lazy$List.map2,F2(function (a,c) {    return {ctor: "_Tuple5",_0: a,_1: _p6,_2: c,_3: _p8,_4: _p9};}),_p10(_p5),_p12(_p7)),
      A2($Lazy$List._op["+++"],
      A3($Lazy$List.map2,F2(function (a,b) {    return {ctor: "_Tuple5",_0: a,_1: b,_2: _p7,_3: _p8,_4: _p9};}),_p10(_p5),_p11(_p6)),
      A2($Lazy$List._op["+++"],
      A4($Lazy$List.map3,F3(function (c,d,e) {    return {ctor: "_Tuple5",_0: _p5,_1: _p6,_2: c,_3: d,_4: e};}),_p12(_p7),_p13(_p8),_p14(_p9)),
      A2($Lazy$List._op["+++"],
      A4($Lazy$List.map3,F3(function (b,d,e) {    return {ctor: "_Tuple5",_0: _p5,_1: b,_2: _p7,_3: d,_4: e};}),_p11(_p6),_p13(_p8),_p14(_p9)),
      A2($Lazy$List._op["+++"],
      A4($Lazy$List.map3,F3(function (a,d,e) {    return {ctor: "_Tuple5",_0: a,_1: _p6,_2: _p7,_3: d,_4: e};}),_p10(_p5),_p13(_p8),_p14(_p9)),
      A2($Lazy$List._op["+++"],
      A4($Lazy$List.map3,F3(function (a,c,d) {    return {ctor: "_Tuple5",_0: a,_1: _p6,_2: c,_3: d,_4: _p9};}),_p10(_p5),_p12(_p7),_p13(_p8)),
      A2($Lazy$List._op["+++"],
      A4($Lazy$List.map3,F3(function (a,b,d) {    return {ctor: "_Tuple5",_0: a,_1: b,_2: _p7,_3: d,_4: _p9};}),_p10(_p5),_p11(_p6),_p13(_p8)),
      A2($Lazy$List._op["+++"],
      A4($Lazy$List.map3,F3(function (a,b,c) {    return {ctor: "_Tuple5",_0: a,_1: b,_2: c,_3: _p8,_4: _p9};}),_p10(_p5),_p11(_p6),_p12(_p7)),
      A2($Lazy$List._op["+++"],
      A5($Lazy$List.map4,F4(function (b,c,d,e) {    return {ctor: "_Tuple5",_0: _p5,_1: b,_2: c,_3: d,_4: e};}),_p11(_p6),_p12(_p7),_p13(_p8),_p14(_p9)),
      A2($Lazy$List._op["+++"],
      A5($Lazy$List.map4,F4(function (a,c,d,e) {    return {ctor: "_Tuple5",_0: a,_1: _p6,_2: c,_3: d,_4: e};}),_p10(_p5),_p12(_p7),_p13(_p8),_p14(_p9)),
      A2($Lazy$List._op["+++"],
      A5($Lazy$List.map4,F4(function (a,b,d,e) {    return {ctor: "_Tuple5",_0: a,_1: b,_2: _p7,_3: d,_4: e};}),_p10(_p5),_p11(_p6),_p13(_p8),_p14(_p9)),
      A2($Lazy$List._op["+++"],
      A5($Lazy$List.map4,F4(function (a,b,c,d) {    return {ctor: "_Tuple5",_0: a,_1: b,_2: c,_3: d,_4: _p9};}),_p10(_p5),_p11(_p6),_p12(_p7),_p13(_p8)),
      A6($Lazy$List.map5,
      F5(function (v0,v1,v2,v3,v4) {    return {ctor: "_Tuple5",_0: v0,_1: v1,_2: v2,_3: v3,_4: v4};}),
      _p10(_p5),
      _p11(_p6),
      _p12(_p7),
      _p13(_p8),
      _p14(_p9)))))))))))))))))))))))))));
   });
   var tuple4 = F2(function (_p16,_p15) {
      var _p17 = _p16;
      var _p26 = _p17._3;
      var _p25 = _p17._2;
      var _p24 = _p17._1;
      var _p23 = _p17._0;
      var _p18 = _p15;
      var _p22 = _p18._3;
      var _p21 = _p18._2;
      var _p20 = _p18._1;
      var _p19 = _p18._0;
      return A2($Lazy$List._op["+++"],
      A2($Lazy$List.map,function (d) {    return {ctor: "_Tuple4",_0: _p19,_1: _p20,_2: _p21,_3: d};},_p26(_p22)),
      A2($Lazy$List._op["+++"],
      A2($Lazy$List.map,function (c) {    return {ctor: "_Tuple4",_0: _p19,_1: _p20,_2: c,_3: _p22};},_p25(_p21)),
      A2($Lazy$List._op["+++"],
      A2($Lazy$List.map,function (b) {    return {ctor: "_Tuple4",_0: _p19,_1: b,_2: _p21,_3: _p22};},_p24(_p20)),
      A2($Lazy$List._op["+++"],
      A2($Lazy$List.map,function (a) {    return {ctor: "_Tuple4",_0: a,_1: _p20,_2: _p21,_3: _p22};},_p23(_p19)),
      A2($Lazy$List._op["+++"],
      A3($Lazy$List.map2,F2(function (c,d) {    return {ctor: "_Tuple4",_0: _p19,_1: _p20,_2: c,_3: d};}),_p25(_p21),_p26(_p22)),
      A2($Lazy$List._op["+++"],
      A3($Lazy$List.map2,F2(function (b,d) {    return {ctor: "_Tuple4",_0: _p19,_1: b,_2: _p21,_3: d};}),_p24(_p20),_p26(_p22)),
      A2($Lazy$List._op["+++"],
      A3($Lazy$List.map2,F2(function (a,d) {    return {ctor: "_Tuple4",_0: a,_1: _p20,_2: _p21,_3: d};}),_p23(_p19),_p26(_p22)),
      A2($Lazy$List._op["+++"],
      A3($Lazy$List.map2,F2(function (b,c) {    return {ctor: "_Tuple4",_0: _p19,_1: b,_2: c,_3: _p22};}),_p24(_p20),_p25(_p21)),
      A2($Lazy$List._op["+++"],
      A3($Lazy$List.map2,F2(function (a,c) {    return {ctor: "_Tuple4",_0: a,_1: _p20,_2: c,_3: _p22};}),_p23(_p19),_p25(_p21)),
      A2($Lazy$List._op["+++"],
      A3($Lazy$List.map2,F2(function (a,b) {    return {ctor: "_Tuple4",_0: a,_1: b,_2: _p21,_3: _p22};}),_p23(_p19),_p24(_p20)),
      A2($Lazy$List._op["+++"],
      A4($Lazy$List.map3,F3(function (b,c,d) {    return {ctor: "_Tuple4",_0: _p19,_1: b,_2: c,_3: d};}),_p24(_p20),_p25(_p21),_p26(_p22)),
      A2($Lazy$List._op["+++"],
      A4($Lazy$List.map3,F3(function (a,c,d) {    return {ctor: "_Tuple4",_0: a,_1: _p20,_2: c,_3: d};}),_p23(_p19),_p25(_p21),_p26(_p22)),
      A2($Lazy$List._op["+++"],
      A4($Lazy$List.map3,F3(function (a,b,c) {    return {ctor: "_Tuple4",_0: a,_1: b,_2: c,_3: _p22};}),_p23(_p19),_p24(_p20),_p25(_p21)),
      A5($Lazy$List.map4,
      F4(function (v0,v1,v2,v3) {    return {ctor: "_Tuple4",_0: v0,_1: v1,_2: v2,_3: v3};}),
      _p23(_p19),
      _p24(_p20),
      _p25(_p21),
      _p26(_p22)))))))))))))));
   });
   var tuple3 = F2(function (_p28,_p27) {
      var _p29 = _p28;
      var _p36 = _p29._2;
      var _p35 = _p29._1;
      var _p34 = _p29._0;
      var _p30 = _p27;
      var _p33 = _p30._2;
      var _p32 = _p30._1;
      var _p31 = _p30._0;
      return A2($Lazy$List._op["+++"],
      A2($Lazy$List.map,function (c) {    return {ctor: "_Tuple3",_0: _p31,_1: _p32,_2: c};},_p36(_p33)),
      A2($Lazy$List._op["+++"],
      A2($Lazy$List.map,function (b) {    return {ctor: "_Tuple3",_0: _p31,_1: b,_2: _p33};},_p35(_p32)),
      A2($Lazy$List._op["+++"],
      A2($Lazy$List.map,function (a) {    return {ctor: "_Tuple3",_0: a,_1: _p32,_2: _p33};},_p34(_p31)),
      A2($Lazy$List._op["+++"],
      A3($Lazy$List.map2,F2(function (b,c) {    return {ctor: "_Tuple3",_0: _p31,_1: b,_2: c};}),_p35(_p32),_p36(_p33)),
      A2($Lazy$List._op["+++"],
      A3($Lazy$List.map2,F2(function (a,c) {    return {ctor: "_Tuple3",_0: a,_1: _p32,_2: c};}),_p34(_p31),_p36(_p33)),
      A2($Lazy$List._op["+++"],
      A3($Lazy$List.map2,F2(function (a,b) {    return {ctor: "_Tuple3",_0: a,_1: b,_2: _p33};}),_p34(_p31),_p35(_p32)),
      A4($Lazy$List.map3,F3(function (v0,v1,v2) {    return {ctor: "_Tuple3",_0: v0,_1: v1,_2: v2};}),_p34(_p31),_p35(_p32),_p36(_p33))))))));
   });
   var tuple = F2(function (_p38,_p37) {
      var _p39 = _p38;
      var _p44 = _p39._1;
      var _p43 = _p39._0;
      var _p40 = _p37;
      var _p42 = _p40._1;
      var _p41 = _p40._0;
      return A2($Lazy$List._op["+++"],
      A2($Lazy$List.map,F2(function (v0,v1) {    return {ctor: "_Tuple2",_0: v0,_1: v1};})(_p41),_p44(_p42)),
      A2($Lazy$List._op["+++"],
      A2($Lazy$List.map,A2($Basics.flip,F2(function (v0,v1) {    return {ctor: "_Tuple2",_0: v0,_1: v1};}),_p42),_p43(_p41)),
      A3($Lazy$List.map2,F2(function (v0,v1) {    return {ctor: "_Tuple2",_0: v0,_1: v1};}),_p43(_p41),_p44(_p42))));
   });
   var lazylist = F2(function (shrink,l) {
      return $Lazy.lazy(function (_p45) {
         var _p46 = _p45;
         var removes = F3(function (k,n,l) {
            return $Lazy.lazy(function (_p47) {
               var _p48 = _p47;
               if (_U.cmp(k,n) > 0) return $Lazy.force($Lazy$List.empty); else if ($Lazy$List.isEmpty(l)) return $Lazy.force(A2($Lazy$List._op[":::"],
                     $Lazy$List.empty,
                     $Lazy$List.empty)); else {
                        var rest = A2($Lazy$List.drop,k,l);
                        var first = A2($Lazy$List.take,k,l);
                        return $Lazy.force(A2($Lazy$List._op[":::"],
                        rest,
                        A2($Lazy$List.map,F2(function (x,y) {    return A2($Lazy$List._op["+++"],x,y);})(first),A3(removes,k,n - k,rest))));
                     }
            });
         });
         var shrinkOne = function (l) {
            return $Lazy.lazy(function (_p49) {
               var _p50 = _p49;
               var _p51 = $Lazy.force(l);
               if (_p51.ctor === "Nil") {
                     return $Lazy.force($Lazy$List.empty);
                  } else {
                     var _p53 = _p51._1;
                     var _p52 = _p51._0;
                     return $Lazy.force(A2($Lazy$List._op["+++"],
                     A2($Lazy$List.map,A2($Basics.flip,F2(function (x,y) {    return A2($Lazy$List._op[":::"],x,y);}),_p53),shrink(_p52)),
                     A2($Lazy$List.map,F2(function (x,y) {    return A2($Lazy$List._op[":::"],x,y);})(_p52),shrinkOne(_p53))));
                  }
            });
         };
         var n = $Lazy$List.length(l);
         return $Lazy.force(A2($Lazy$List._op["+++"],
         A2($Lazy$List.flatMap,
         function (k) {
            return A3(removes,k,n,l);
         },
         A2($Lazy$List.takeWhile,function (x) {    return _U.cmp(x,0) > 0;},A2($Lazy$List.iterate,function (n) {    return n / 2 | 0;},n))),
         shrinkOne(l)));
      });
   });
   var list = function (shrink) {    return A3(convert,$Lazy$List.toList,$Lazy$List.fromList,lazylist(shrink));};
   var array = function (shrink) {    return A3(convert,$Lazy$List.toArray,$Lazy$List.fromArray,lazylist(shrink));};
   var result = F3(function (shrinkError,shrinkValue,r) {
      var _p54 = r;
      if (_p54.ctor === "Ok") {
            return A2($Lazy$List.map,$Result.Ok,shrinkValue(_p54._0));
         } else {
            return A2($Lazy$List.map,$Result.Err,shrinkError(_p54._0));
         }
   });
   var maybe = F2(function (shrink,m) {
      var _p55 = m;
      if (_p55.ctor === "Just") {
            return A2($Lazy$List._op[":::"],$Maybe.Nothing,A2($Lazy$List.map,$Maybe.Just,shrink(_p55._0)));
         } else {
            return $Lazy$List.empty;
         }
   });
   var atLeastFloat = F2(function (min,n) {
      return _U.cmp(n,0) < 0 && _U.cmp(n,min) > -1 ? A2($Lazy$List._op[":::"],
      0 - n,
      A2($Lazy$List.map,F2(function (x,y) {    return x * y;})(-1),A2(seriesFloat,0,0 - n))) : A2(seriesFloat,A2($Basics.max,0,min),n);
   });
   var $float = function (n) {
      return _U.cmp(n,0) < 0 ? A2($Lazy$List._op[":::"],
      0 - n,
      A2($Lazy$List.map,F2(function (x,y) {    return x * y;})(-1),A2(seriesFloat,0,0 - n))) : A2(seriesFloat,0,n);
   };
   var atLeastInt = F2(function (min,n) {
      return _U.cmp(n,0) < 0 && _U.cmp(n,min) > -1 ? A2($Lazy$List._op[":::"],
      0 - n,
      A2($Lazy$List.map,F2(function (x,y) {    return x * y;})(-1),A2(seriesInt,0,0 - n))) : A2(seriesInt,A2($Basics.max,0,min),n);
   });
   var atLeastChar = function ($char) {    return A3(convert,$Char.fromCode,$Char.toCode,atLeastInt($Char.toCode($char)));};
   var character = atLeastChar($Char.fromCode(32));
   var string = A3(convert,$String.fromList,$String.toList,list(character));
   var $int = function (n) {
      return _U.cmp(n,0) < 0 ? A2($Lazy$List._op[":::"],
      0 - n,
      A2($Lazy$List.map,F2(function (x,y) {    return x * y;})(-1),A2(seriesInt,0,0 - n))) : A2(seriesInt,0,n);
   };
   var $char = A3(convert,$Char.fromCode,$Char.toCode,$int);
   var order = function (o) {
      var _p56 = o;
      switch (_p56.ctor)
      {case "GT": return A2($Lazy$List._op[":::"],$Basics.EQ,A2($Lazy$List._op[":::"],$Basics.LT,$Lazy$List.empty));
         case "LT": return A2($Lazy$List._op[":::"],$Basics.EQ,$Lazy$List.empty);
         default: return $Lazy$List.empty;}
   };
   var bool = function (b) {
      var _p57 = b;
      if (_p57 === true) {
            return A2($Lazy$List._op[":::"],false,$Lazy$List.empty);
         } else {
            return $Lazy$List.empty;
         }
   };
   var noShrink = function (_p58) {    return $Lazy$List.empty;};
   var $void = noShrink;
   return _elm.Shrink.values = {_op: _op
                               ,noShrink: noShrink
                               ,$void: $void
                               ,bool: bool
                               ,order: order
                               ,$int: $int
                               ,atLeastInt: atLeastInt
                               ,$float: $float
                               ,atLeastFloat: atLeastFloat
                               ,$char: $char
                               ,atLeastChar: atLeastChar
                               ,character: character
                               ,string: string
                               ,maybe: maybe
                               ,result: result
                               ,list: list
                               ,lazylist: lazylist
                               ,array: array
                               ,tuple: tuple
                               ,tuple3: tuple3
                               ,tuple4: tuple4
                               ,tuple5: tuple5
                               ,convert: convert
                               ,keepIf: keepIf
                               ,dropIf: dropIf
                               ,merge: merge
                               ,map: map
                               ,andMap: andMap};
};
Elm.Random = Elm.Random || {};
Elm.Random.Bool = Elm.Random.Bool || {};
Elm.Random.Bool.make = function (_elm) {
   "use strict";
   _elm.Random = _elm.Random || {};
   _elm.Random.Bool = _elm.Random.Bool || {};
   if (_elm.Random.Bool.values) return _elm.Random.Bool.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Random = Elm.Random.make(_elm),
   $Random$Extra = Elm.Random.Extra.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm);
   var _op = {};
   var bool = A2($Random$Extra.frequency,
   _U.list([{ctor: "_Tuple2",_0: 1,_1: $Random$Extra.constant(true)},{ctor: "_Tuple2",_0: 1,_1: $Random$Extra.constant(false)}]),
   $Random$Extra.constant(true));
   return _elm.Random.Bool.values = {_op: _op,bool: bool};
};
Elm.Random = Elm.Random || {};
Elm.Random.Function = Elm.Random.Function || {};
Elm.Random.Function.make = function (_elm) {
   "use strict";
   _elm.Random = _elm.Random || {};
   _elm.Random.Function = _elm.Random.Function || {};
   if (_elm.Random.Function.values) return _elm.Random.Function.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Random = Elm.Random.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm);
   var _op = {};
   _op["<<<"] = F2(function (generatorBC,generatorAB) {
      return A3($Random.map2,F2(function (f,g) {    return function (_p0) {    return g(f(_p0));};}),generatorAB,generatorBC);
   });
   _op[">>>"] = F2(function (generatorAB,generatorBC) {
      return A3($Random.map2,F2(function (f,g) {    return function (_p1) {    return g(f(_p1));};}),generatorAB,generatorBC);
   });
   var func = function (generatorB) {    return A2($Random.map,F2(function (b,a) {    return b;}),generatorB);};
   var func2 = function (generatorC) {    return func(func(generatorC));};
   var func3 = function (generatorD) {    return func(func2(generatorD));};
   var func4 = function (generatorE) {    return func(func3(generatorE));};
   var func5 = function (generatorF) {    return func(func4(generatorF));};
   var func6 = function (generatorG) {    return func(func5(generatorG));};
   return _elm.Random.Function.values = {_op: _op,func: func,func2: func2,func3: func3,func4: func4,func5: func5,func6: func6};
};
Elm.Random = Elm.Random || {};
Elm.Random.Order = Elm.Random.Order || {};
Elm.Random.Order.make = function (_elm) {
   "use strict";
   _elm.Random = _elm.Random || {};
   _elm.Random.Order = _elm.Random.Order || {};
   if (_elm.Random.Order.values) return _elm.Random.Order.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Random = Elm.Random.make(_elm),
   $Random$Extra = Elm.Random.Extra.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm);
   var _op = {};
   var order = A2($Random$Extra.selectWithDefault,$Basics.EQ,_U.list([$Basics.LT,$Basics.EQ,$Basics.GT]));
   return _elm.Random.Order.values = {_op: _op,order: order};
};
Elm.Random = Elm.Random || {};
Elm.Random.Char = Elm.Random.Char || {};
Elm.Random.Char.make = function (_elm) {
   "use strict";
   _elm.Random = _elm.Random || {};
   _elm.Random.Char = _elm.Random.Char || {};
   if (_elm.Random.Char.values) return _elm.Random.Char.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Char = Elm.Char.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Random = Elm.Random.make(_elm),
   $Random$Extra = Elm.Random.Extra.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm);
   var _op = {};
   var $char = F2(function (start,end) {    return A2($Random$Extra.map,$Char.fromCode,A2($Random.$int,start,end));});
   var upperCaseLatin = A2($char,65,90);
   var lowerCaseLatin = A2($char,97,122);
   var latin = A2($Random$Extra.merge,lowerCaseLatin,upperCaseLatin);
   var english = latin;
   var ascii = A2($char,0,127);
   var unicode = A2($char,0,1114111);
   var basicLatin = A2($char,0,127);
   var latin1Supplement = A2($char,128,255);
   var latinExtendedA = A2($char,256,383);
   var latinExtendedB = A2($char,384,591);
   var ipaExtensions = A2($char,592,687);
   var spacingModifier = A2($char,688,767);
   var combiningDiacriticalMarks = A2($char,768,879);
   var greekAndCoptic = A2($char,880,1023);
   var cyrillic = A2($char,1024,1279);
   var cyrillicSupplement = A2($char,1280,1327);
   var armenian = A2($char,1328,1423);
   var hebrew = A2($char,1424,1535);
   var arabic = A2($char,1536,1791);
   var syriac = A2($char,1792,1871);
   var arabicSupplement = A2($char,1872,1919);
   var thaana = A2($char,1920,1983);
   var nko = A2($char,1984,2047);
   var samaritan = A2($char,2048,2111);
   var mandaic = A2($char,2112,2143);
   var arabicExtendedA = A2($char,2208,2303);
   var devanagari = A2($char,2304,2431);
   var bengali = A2($char,2432,2559);
   var gurmukhi = A2($char,2560,2687);
   var gujarati = A2($char,2688,2815);
   var oriya = A2($char,2816,2943);
   var tamil = A2($char,2944,3071);
   var telugu = A2($char,3072,3199);
   var kannada = A2($char,3200,3327);
   var malayalam = A2($char,3328,3455);
   var sinhala = A2($char,3456,3583);
   var thai = A2($char,3584,3711);
   var lao = A2($char,3712,3839);
   var tibetan = A2($char,3840,4095);
   var myanmar = A2($char,4096,4255);
   var georgian = A2($char,4256,4351);
   var hangulJamo = A2($char,4352,4607);
   var ethiopic = A2($char,4608,4991);
   var ethiopicSupplement = A2($char,4992,5023);
   var cherokee = A2($char,5024,5119);
   var unifiedCanadianAboriginalSyllabic = A2($char,5120,5759);
   var ogham = A2($char,5760,5791);
   var runic = A2($char,5792,5887);
   var tagalog = A2($char,5888,5919);
   var hanunoo = A2($char,5920,5951);
   var buhid = A2($char,5952,5983);
   var tagbanwa = A2($char,5984,6015);
   var khmer = A2($char,6016,6143);
   var mongolian = A2($char,6144,6319);
   var unifiedCanadianAboriginalSyllabicExtended = A2($char,6320,6399);
   var limbu = A2($char,6400,6479);
   var taiLe = A2($char,6480,6527);
   var newTaiLue = A2($char,6528,6623);
   var khmerSymbol = A2($char,6624,6655);
   var buginese = A2($char,6656,6687);
   var taiTham = A2($char,6688,6831);
   var balinese = A2($char,6912,7039);
   var sundanese = A2($char,7040,7103);
   var batak = A2($char,7104,7167);
   var lepcha = A2($char,7168,7247);
   var olChiki = A2($char,7248,7295);
   var sundaneseSupplement = A2($char,7360,7375);
   var vedicExtensions = A2($char,7376,7423);
   var phoneticExtensions = A2($char,7424,7551);
   var phoneticExtensionsSupplement = A2($char,7552,7615);
   var combiningDiacriticalMarksSupplement = A2($char,7616,7679);
   var latinExtendedAdditional = A2($char,7680,7935);
   var greekExtended = A2($char,7936,8191);
   var generalPunctuation = A2($char,8192,8303);
   var superscriptOrSubscript = A2($char,8304,8351);
   var currencySymbol = A2($char,8352,8399);
   var combiningDiacriticalMarksForSymbols = A2($char,8400,8447);
   var letterlikeSymbol = A2($char,8448,8527);
   var numberForm = A2($char,8528,8591);
   var arrow = A2($char,8592,8703);
   var mathematicalOperator = A2($char,8704,8959);
   var miscellaneousTechnical = A2($char,8960,9215);
   var controlPicture = A2($char,9216,9279);
   var opticalCharacterRecognition = A2($char,9280,9311);
   var enclosedAlphanumeric = A2($char,9312,9471);
   var boxDrawing = A2($char,9472,9599);
   var blockElement = A2($char,9600,9631);
   var geometricShape = A2($char,9632,9727);
   var miscellaneousSymbol = A2($char,9728,9983);
   var dingbat = A2($char,9984,10175);
   var miscellaneousMathematicalSymbolA = A2($char,10176,10223);
   var supplementalArrowA = A2($char,10224,10239);
   var braillePattern = A2($char,10240,10495);
   var supplementalArrowB = A2($char,10496,10623);
   var miscellaneousMathematicalSymbolB = A2($char,10624,10751);
   var supplementalMathematicalOperator = A2($char,10752,11007);
   var miscellaneousSymbolOrArrow = A2($char,11008,11263);
   var glagolitic = A2($char,11264,11359);
   var latinExtendedC = A2($char,11360,11391);
   var coptic = A2($char,11392,11519);
   var georgianSupplement = A2($char,11520,11567);
   var tifinagh = A2($char,11568,11647);
   var ethiopicExtended = A2($char,11648,11743);
   var cyrillicExtendedA = A2($char,11744,11775);
   var supplementalPunctuation = A2($char,11776,11903);
   var cjkRadicalSupplement = A2($char,11904,12031);
   var kangxiRadical = A2($char,12032,12255);
   var ideographicDescription = A2($char,12272,12287);
   var cjkSymbolOrPunctuation = A2($char,12288,12351);
   var hiragana = A2($char,12352,12447);
   var katakana = A2($char,12448,12543);
   var bopomofo = A2($char,12544,12591);
   var hangulCompatibilityJamo = A2($char,12592,12687);
   var kanbun = A2($char,12688,12703);
   var bopomofoExtended = A2($char,12704,12735);
   var cjkStroke = A2($char,12736,12783);
   var katakanaPhoneticExtension = A2($char,12784,12799);
   var enclosedCJKLetterOrMonth = A2($char,12800,13055);
   var cjkCompatibility = A2($char,13056,13311);
   var cjkUnifiedIdeographExtensionA = A2($char,13312,19903);
   var yijingHexagramSymbol = A2($char,19904,19967);
   var cjkUnifiedIdeograph = A2($char,19968,40959);
   var yiSyllable = A2($char,40960,42127);
   var yiRadical = A2($char,42128,42191);
   var lisu = A2($char,42192,42239);
   var vai = A2($char,42240,42559);
   var cyrillicExtendedB = A2($char,42560,42655);
   var bamum = A2($char,42656,42751);
   var modifierToneLetter = A2($char,42752,42783);
   var latinExtendedD = A2($char,42784,43007);
   var sylotiNagri = A2($char,43008,43055);
   var commonIndicNumberForm = A2($char,43056,43071);
   var phagsPa = A2($char,43072,43135);
   var saurashtra = A2($char,43136,43231);
   var devanagariExtended = A2($char,43232,43263);
   var kayahLi = A2($char,43264,43311);
   var rejang = A2($char,43312,43359);
   var hangulJamoExtendedA = A2($char,43360,43391);
   var javanese = A2($char,43392,43487);
   var cham = A2($char,43520,43615);
   var myanmarExtendedA = A2($char,43616,43647);
   var taiViet = A2($char,43648,43743);
   var meeteiMayekExtension = A2($char,43744,43775);
   var ethiopicExtendedA = A2($char,43776,43823);
   var meeteiMayek = A2($char,43968,44031);
   var hangulSyllable = A2($char,44032,55215);
   var hangulJamoExtendedB = A2($char,55216,55295);
   var highSurrogate = A2($char,55296,56191);
   var highPrivateUseSurrogate = A2($char,56192,56319);
   var lowSurrogate = A2($char,56320,57343);
   var privateUseArea = A2($char,57344,63743);
   var cjkCompatibilityIdeograph = A2($char,63744,64255);
   var alphabeticPresentationForm = A2($char,64256,64335);
   var arabicPresentationFormA = A2($char,64336,65023);
   var variationSelector = A2($char,65024,65039);
   var verticalForm = A2($char,65040,65055);
   var combiningHalfMark = A2($char,65056,65071);
   var cjkCompatibilityForm = A2($char,65072,65103);
   var smallFormVariant = A2($char,65104,65135);
   var arabicPresentationFormB = A2($char,65136,65279);
   var halfwidthOrFullwidthForm = A2($char,65280,65519);
   var special = A2($char,65520,65535);
   var linearBSyllable = A2($char,65536,65663);
   var linearBIdeogram = A2($char,65664,65791);
   var aegeanNumber = A2($char,65792,65855);
   var ancientGreekNumber = A2($char,65856,65935);
   var ancientSymbol = A2($char,65936,65999);
   var phaistosDisc = A2($char,66000,66047);
   var lycian = A2($char,66176,66207);
   var carian = A2($char,66208,66271);
   var oldItalic = A2($char,66304,66351);
   var gothic = A2($char,66352,66383);
   var ugaritic = A2($char,66432,66463);
   var oldPersian = A2($char,66464,66527);
   var deseret = A2($char,66560,66639);
   var shavian = A2($char,66640,66687);
   var osmanya = A2($char,66688,66735);
   var cypriotSyllable = A2($char,67584,67647);
   var imperialAramaic = A2($char,67648,67679);
   var phoenician = A2($char,67840,67871);
   var lydian = A2($char,67872,67903);
   var meroiticHieroglyph = A2($char,67968,67999);
   var meroiticCursive = A2($char,68000,68095);
   var kharoshthi = A2($char,68096,68191);
   var oldSouthArabian = A2($char,68192,68223);
   var avestan = A2($char,68352,68415);
   var inscriptionalParthian = A2($char,68416,68447);
   var inscriptionalPahlavi = A2($char,68448,68479);
   var oldTurkic = A2($char,68608,68687);
   var rumiNumericalSymbol = A2($char,69216,69247);
   var brahmi = A2($char,69632,69759);
   var kaithi = A2($char,69760,69839);
   var soraSompeng = A2($char,69840,69887);
   var chakma = A2($char,69888,69967);
   var sharada = A2($char,70016,70111);
   var takri = A2($char,71296,71375);
   var cuneiform = A2($char,73728,74751);
   var cuneiformNumberOrPunctuation = A2($char,74752,74879);
   var egyptianHieroglyph = A2($char,77824,78895);
   var bamumSupplement = A2($char,92160,92735);
   var miao = A2($char,93952,94111);
   var kanaSupplement = A2($char,110592,110847);
   var byzantineMusicalSymbol = A2($char,118784,119039);
   var musicalSymbol = A2($char,119040,119295);
   var ancientGreekMusicalNotationSymbol = A2($char,119296,119375);
   var taiXuanJingSymbol = A2($char,119552,119647);
   var countingRodNumeral = A2($char,119648,119679);
   var mathematicalAlphanumericSymbol = A2($char,119808,120831);
   var arabicMathematicalAlphabeticSymbol = A2($char,126464,126719);
   var mahjongTile = A2($char,126976,127023);
   var dominoTile = A2($char,127024,127135);
   var playingCard = A2($char,127136,127231);
   var enclosedAlphanumericSupplement = A2($char,127232,127487);
   var enclosedIdeographicSupplement = A2($char,127488,127743);
   var miscellaneousSymbolOrPictograph = A2($char,127744,128511);
   var emoticon = A2($char,128512,128591);
   var transportOrMapSymbol = A2($char,128640,128767);
   var alchemicalSymbol = A2($char,128768,128895);
   var cjkUnifiedIdeographExtensionB = A2($char,131072,173791);
   var cjkUnifiedIdeographExtensionC = A2($char,173824,177983);
   var cjkUnifiedIdeographExtensionD = A2($char,177984,178207);
   var cjkCompatibilityIdeographSupplement = A2($char,194560,195103);
   var tag = A2($char,917504,917631);
   var variationSelectorSupplement = A2($char,917760,917999);
   var supplementaryPrivateUseAreaA = A2($char,983040,1048575);
   var supplementaryPrivateUseAreaB = A2($char,1048576,1114111);
   return _elm.Random.Char.values = {_op: _op
                                    ,$char: $char
                                    ,upperCaseLatin: upperCaseLatin
                                    ,lowerCaseLatin: lowerCaseLatin
                                    ,latin: latin
                                    ,english: english
                                    ,ascii: ascii
                                    ,unicode: unicode
                                    ,basicLatin: basicLatin
                                    ,latin1Supplement: latin1Supplement
                                    ,latinExtendedA: latinExtendedA
                                    ,latinExtendedB: latinExtendedB
                                    ,ipaExtensions: ipaExtensions
                                    ,spacingModifier: spacingModifier
                                    ,combiningDiacriticalMarks: combiningDiacriticalMarks
                                    ,greekAndCoptic: greekAndCoptic
                                    ,cyrillic: cyrillic
                                    ,cyrillicSupplement: cyrillicSupplement
                                    ,armenian: armenian
                                    ,hebrew: hebrew
                                    ,arabic: arabic
                                    ,syriac: syriac
                                    ,arabicSupplement: arabicSupplement
                                    ,thaana: thaana
                                    ,nko: nko
                                    ,samaritan: samaritan
                                    ,mandaic: mandaic
                                    ,arabicExtendedA: arabicExtendedA
                                    ,devanagari: devanagari
                                    ,bengali: bengali
                                    ,gurmukhi: gurmukhi
                                    ,gujarati: gujarati
                                    ,oriya: oriya
                                    ,tamil: tamil
                                    ,telugu: telugu
                                    ,kannada: kannada
                                    ,malayalam: malayalam
                                    ,sinhala: sinhala
                                    ,thai: thai
                                    ,lao: lao
                                    ,tibetan: tibetan
                                    ,myanmar: myanmar
                                    ,georgian: georgian
                                    ,hangulJamo: hangulJamo
                                    ,ethiopic: ethiopic
                                    ,ethiopicSupplement: ethiopicSupplement
                                    ,cherokee: cherokee
                                    ,unifiedCanadianAboriginalSyllabic: unifiedCanadianAboriginalSyllabic
                                    ,ogham: ogham
                                    ,runic: runic
                                    ,tagalog: tagalog
                                    ,hanunoo: hanunoo
                                    ,buhid: buhid
                                    ,tagbanwa: tagbanwa
                                    ,khmer: khmer
                                    ,mongolian: mongolian
                                    ,unifiedCanadianAboriginalSyllabicExtended: unifiedCanadianAboriginalSyllabicExtended
                                    ,limbu: limbu
                                    ,taiLe: taiLe
                                    ,newTaiLue: newTaiLue
                                    ,khmerSymbol: khmerSymbol
                                    ,buginese: buginese
                                    ,taiTham: taiTham
                                    ,balinese: balinese
                                    ,sundanese: sundanese
                                    ,batak: batak
                                    ,lepcha: lepcha
                                    ,olChiki: olChiki
                                    ,sundaneseSupplement: sundaneseSupplement
                                    ,vedicExtensions: vedicExtensions
                                    ,phoneticExtensions: phoneticExtensions
                                    ,phoneticExtensionsSupplement: phoneticExtensionsSupplement
                                    ,combiningDiacriticalMarksSupplement: combiningDiacriticalMarksSupplement
                                    ,latinExtendedAdditional: latinExtendedAdditional
                                    ,greekExtended: greekExtended
                                    ,generalPunctuation: generalPunctuation
                                    ,superscriptOrSubscript: superscriptOrSubscript
                                    ,currencySymbol: currencySymbol
                                    ,combiningDiacriticalMarksForSymbols: combiningDiacriticalMarksForSymbols
                                    ,letterlikeSymbol: letterlikeSymbol
                                    ,numberForm: numberForm
                                    ,arrow: arrow
                                    ,mathematicalOperator: mathematicalOperator
                                    ,miscellaneousTechnical: miscellaneousTechnical
                                    ,controlPicture: controlPicture
                                    ,opticalCharacterRecognition: opticalCharacterRecognition
                                    ,enclosedAlphanumeric: enclosedAlphanumeric
                                    ,boxDrawing: boxDrawing
                                    ,blockElement: blockElement
                                    ,geometricShape: geometricShape
                                    ,miscellaneousSymbol: miscellaneousSymbol
                                    ,dingbat: dingbat
                                    ,miscellaneousMathematicalSymbolA: miscellaneousMathematicalSymbolA
                                    ,supplementalArrowA: supplementalArrowA
                                    ,braillePattern: braillePattern
                                    ,supplementalArrowB: supplementalArrowB
                                    ,miscellaneousMathematicalSymbolB: miscellaneousMathematicalSymbolB
                                    ,supplementalMathematicalOperator: supplementalMathematicalOperator
                                    ,miscellaneousSymbolOrArrow: miscellaneousSymbolOrArrow
                                    ,glagolitic: glagolitic
                                    ,latinExtendedC: latinExtendedC
                                    ,coptic: coptic
                                    ,georgianSupplement: georgianSupplement
                                    ,tifinagh: tifinagh
                                    ,ethiopicExtended: ethiopicExtended
                                    ,cyrillicExtendedA: cyrillicExtendedA
                                    ,supplementalPunctuation: supplementalPunctuation
                                    ,cjkRadicalSupplement: cjkRadicalSupplement
                                    ,kangxiRadical: kangxiRadical
                                    ,ideographicDescription: ideographicDescription
                                    ,cjkSymbolOrPunctuation: cjkSymbolOrPunctuation
                                    ,hiragana: hiragana
                                    ,katakana: katakana
                                    ,bopomofo: bopomofo
                                    ,hangulCompatibilityJamo: hangulCompatibilityJamo
                                    ,kanbun: kanbun
                                    ,bopomofoExtended: bopomofoExtended
                                    ,cjkStroke: cjkStroke
                                    ,katakanaPhoneticExtension: katakanaPhoneticExtension
                                    ,enclosedCJKLetterOrMonth: enclosedCJKLetterOrMonth
                                    ,cjkCompatibility: cjkCompatibility
                                    ,cjkUnifiedIdeographExtensionA: cjkUnifiedIdeographExtensionA
                                    ,yijingHexagramSymbol: yijingHexagramSymbol
                                    ,cjkUnifiedIdeograph: cjkUnifiedIdeograph
                                    ,yiSyllable: yiSyllable
                                    ,yiRadical: yiRadical
                                    ,lisu: lisu
                                    ,vai: vai
                                    ,cyrillicExtendedB: cyrillicExtendedB
                                    ,bamum: bamum
                                    ,modifierToneLetter: modifierToneLetter
                                    ,latinExtendedD: latinExtendedD
                                    ,sylotiNagri: sylotiNagri
                                    ,commonIndicNumberForm: commonIndicNumberForm
                                    ,phagsPa: phagsPa
                                    ,saurashtra: saurashtra
                                    ,devanagariExtended: devanagariExtended
                                    ,kayahLi: kayahLi
                                    ,rejang: rejang
                                    ,hangulJamoExtendedA: hangulJamoExtendedA
                                    ,javanese: javanese
                                    ,cham: cham
                                    ,myanmarExtendedA: myanmarExtendedA
                                    ,taiViet: taiViet
                                    ,meeteiMayekExtension: meeteiMayekExtension
                                    ,ethiopicExtendedA: ethiopicExtendedA
                                    ,meeteiMayek: meeteiMayek
                                    ,hangulSyllable: hangulSyllable
                                    ,hangulJamoExtendedB: hangulJamoExtendedB
                                    ,highSurrogate: highSurrogate
                                    ,highPrivateUseSurrogate: highPrivateUseSurrogate
                                    ,lowSurrogate: lowSurrogate
                                    ,privateUseArea: privateUseArea
                                    ,cjkCompatibilityIdeograph: cjkCompatibilityIdeograph
                                    ,alphabeticPresentationForm: alphabeticPresentationForm
                                    ,arabicPresentationFormA: arabicPresentationFormA
                                    ,variationSelector: variationSelector
                                    ,verticalForm: verticalForm
                                    ,combiningHalfMark: combiningHalfMark
                                    ,cjkCompatibilityForm: cjkCompatibilityForm
                                    ,smallFormVariant: smallFormVariant
                                    ,arabicPresentationFormB: arabicPresentationFormB
                                    ,halfwidthOrFullwidthForm: halfwidthOrFullwidthForm
                                    ,special: special
                                    ,linearBSyllable: linearBSyllable
                                    ,linearBIdeogram: linearBIdeogram
                                    ,aegeanNumber: aegeanNumber
                                    ,ancientGreekNumber: ancientGreekNumber
                                    ,ancientSymbol: ancientSymbol
                                    ,phaistosDisc: phaistosDisc
                                    ,lycian: lycian
                                    ,carian: carian
                                    ,oldItalic: oldItalic
                                    ,gothic: gothic
                                    ,ugaritic: ugaritic
                                    ,oldPersian: oldPersian
                                    ,deseret: deseret
                                    ,shavian: shavian
                                    ,osmanya: osmanya
                                    ,cypriotSyllable: cypriotSyllable
                                    ,imperialAramaic: imperialAramaic
                                    ,phoenician: phoenician
                                    ,lydian: lydian
                                    ,meroiticHieroglyph: meroiticHieroglyph
                                    ,meroiticCursive: meroiticCursive
                                    ,kharoshthi: kharoshthi
                                    ,oldSouthArabian: oldSouthArabian
                                    ,avestan: avestan
                                    ,inscriptionalParthian: inscriptionalParthian
                                    ,inscriptionalPahlavi: inscriptionalPahlavi
                                    ,oldTurkic: oldTurkic
                                    ,rumiNumericalSymbol: rumiNumericalSymbol
                                    ,brahmi: brahmi
                                    ,kaithi: kaithi
                                    ,soraSompeng: soraSompeng
                                    ,chakma: chakma
                                    ,sharada: sharada
                                    ,takri: takri
                                    ,cuneiform: cuneiform
                                    ,cuneiformNumberOrPunctuation: cuneiformNumberOrPunctuation
                                    ,egyptianHieroglyph: egyptianHieroglyph
                                    ,bamumSupplement: bamumSupplement
                                    ,miao: miao
                                    ,kanaSupplement: kanaSupplement
                                    ,byzantineMusicalSymbol: byzantineMusicalSymbol
                                    ,musicalSymbol: musicalSymbol
                                    ,ancientGreekMusicalNotationSymbol: ancientGreekMusicalNotationSymbol
                                    ,taiXuanJingSymbol: taiXuanJingSymbol
                                    ,countingRodNumeral: countingRodNumeral
                                    ,mathematicalAlphanumericSymbol: mathematicalAlphanumericSymbol
                                    ,arabicMathematicalAlphabeticSymbol: arabicMathematicalAlphabeticSymbol
                                    ,mahjongTile: mahjongTile
                                    ,dominoTile: dominoTile
                                    ,playingCard: playingCard
                                    ,enclosedAlphanumericSupplement: enclosedAlphanumericSupplement
                                    ,enclosedIdeographicSupplement: enclosedIdeographicSupplement
                                    ,miscellaneousSymbolOrPictograph: miscellaneousSymbolOrPictograph
                                    ,emoticon: emoticon
                                    ,transportOrMapSymbol: transportOrMapSymbol
                                    ,alchemicalSymbol: alchemicalSymbol
                                    ,cjkUnifiedIdeographExtensionB: cjkUnifiedIdeographExtensionB
                                    ,cjkUnifiedIdeographExtensionC: cjkUnifiedIdeographExtensionC
                                    ,cjkUnifiedIdeographExtensionD: cjkUnifiedIdeographExtensionD
                                    ,cjkCompatibilityIdeographSupplement: cjkCompatibilityIdeographSupplement
                                    ,tag: tag
                                    ,variationSelectorSupplement: variationSelectorSupplement
                                    ,supplementaryPrivateUseAreaA: supplementaryPrivateUseAreaA
                                    ,supplementaryPrivateUseAreaB: supplementaryPrivateUseAreaB};
};
Elm.Random = Elm.Random || {};
Elm.Random.String = Elm.Random.String || {};
Elm.Random.String.make = function (_elm) {
   "use strict";
   _elm.Random = _elm.Random || {};
   _elm.Random.String = _elm.Random.String || {};
   if (_elm.Random.String.values) return _elm.Random.String.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Random = Elm.Random.make(_elm),
   $Random$Char = Elm.Random.Char.make(_elm),
   $Random$Extra = Elm.Random.Extra.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm),
   $String = Elm.String.make(_elm);
   var _op = {};
   var capitalizedEnglishWord = function (wordLength) {
      return A2($Random$Extra.map,
      $String.fromList,
      A3($Random$Extra.map2,
      F2(function (x,y) {    return A2($List._op["::"],x,y);}),
      $Random$Char.upperCaseLatin,
      A2($Random.list,wordLength - 1,$Random$Char.lowerCaseLatin)));
   };
   var rangeLengthCapitalizedEnglishWord = F2(function (minLength,maxLength) {
      return A2($Random$Extra.flatMap,capitalizedEnglishWord,A2($Random.$int,minLength,maxLength));
   });
   var anyCapitalizedEnglishWord = A2(rangeLengthCapitalizedEnglishWord,1,34);
   var englishWord = function (wordLength) {    return A2($Random$Extra.map,$String.fromList,A2($Random.list,wordLength,$Random$Char.lowerCaseLatin));};
   var string = F2(function (stringLength,charGenerator) {    return A2($Random$Extra.map,$String.fromList,A2($Random.list,stringLength,charGenerator));});
   var rangeLengthString = F3(function (minLength,maxLength,charGenerator) {
      return A2($Random$Extra.flatMap,function (len) {    return A2(string,len,charGenerator);},A2($Random.$int,minLength,maxLength));
   });
   var rangeLengthWord = rangeLengthString;
   var rangeLengthEnglishWord = F2(function (minLength,maxLength) {    return A3(rangeLengthWord,minLength,maxLength,$Random$Char.lowerCaseLatin);});
   var anyEnglishWord = A2(rangeLengthEnglishWord,1,34);
   var word = string;
   return _elm.Random.String.values = {_op: _op
                                      ,string: string
                                      ,rangeLengthString: rangeLengthString
                                      ,word: word
                                      ,rangeLengthWord: rangeLengthWord
                                      ,englishWord: englishWord
                                      ,rangeLengthEnglishWord: rangeLengthEnglishWord
                                      ,anyEnglishWord: anyEnglishWord
                                      ,capitalizedEnglishWord: capitalizedEnglishWord
                                      ,rangeLengthCapitalizedEnglishWord: rangeLengthCapitalizedEnglishWord
                                      ,anyCapitalizedEnglishWord: anyCapitalizedEnglishWord};
};
Elm.Random = Elm.Random || {};
Elm.Random.Maybe = Elm.Random.Maybe || {};
Elm.Random.Maybe.make = function (_elm) {
   "use strict";
   _elm.Random = _elm.Random || {};
   _elm.Random.Maybe = _elm.Random.Maybe || {};
   if (_elm.Random.Maybe.values) return _elm.Random.Maybe.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Random = Elm.Random.make(_elm),
   $Random$Extra = Elm.Random.Extra.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm);
   var _op = {};
   var withDefault = F2(function (value,generator) {    return A2($Random$Extra.map,$Maybe.withDefault(value),generator);});
   var withDefaultGenerator = F2(function ($default,generator) {    return A2($Random$Extra.flatMap,A2($Basics.flip,withDefault,generator),$default);});
   var maybe = function (generator) {
      return A2($Random$Extra.frequency,
      _U.list([{ctor: "_Tuple2",_0: 1,_1: $Random$Extra.constant($Maybe.Nothing)},{ctor: "_Tuple2",_0: 1,_1: A2($Random$Extra.map,$Maybe.Just,generator)}]),
      $Random$Extra.constant($Maybe.Nothing));
   };
   return _elm.Random.Maybe.values = {_op: _op,maybe: maybe,withDefault: withDefault,withDefaultGenerator: withDefaultGenerator};
};
Elm.Random = Elm.Random || {};
Elm.Random.Result = Elm.Random.Result || {};
Elm.Random.Result.make = function (_elm) {
   "use strict";
   _elm.Random = _elm.Random || {};
   _elm.Random.Result = _elm.Random.Result || {};
   if (_elm.Random.Result.values) return _elm.Random.Result.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Random = Elm.Random.make(_elm),
   $Random$Extra = Elm.Random.Extra.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm);
   var _op = {};
   var error = function (generator) {    return A2($Random$Extra.map,$Result.Err,generator);};
   var ok = function (generator) {    return A2($Random$Extra.map,$Result.Ok,generator);};
   var result = F2(function (errorGenerator,okGenerator) {
      return A2($Random$Extra.frequency,
      _U.list([{ctor: "_Tuple2",_0: 1,_1: error(errorGenerator)},{ctor: "_Tuple2",_0: 1,_1: ok(okGenerator)}]),
      ok(okGenerator));
   });
   return _elm.Random.Result.values = {_op: _op,ok: ok,error: error,result: result};
};
Elm.Random = Elm.Random || {};
Elm.Random.List = Elm.Random.List || {};
Elm.Random.List.make = function (_elm) {
   "use strict";
   _elm.Random = _elm.Random || {};
   _elm.Random.List = _elm.Random.List || {};
   if (_elm.Random.List.values) return _elm.Random.List.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Random = Elm.Random.make(_elm),
   $Random$Extra = Elm.Random.Extra.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm);
   var _op = {};
   var rangeLengthList = F3(function (minLength,maxLength,generator) {
      return A2($Random$Extra.flatMap,function (len) {    return A2($Random.list,len,generator);},A2($Random.$int,minLength,maxLength));
   });
   var emptyList = $Random$Extra.constant(_U.list([]));
   return _elm.Random.List.values = {_op: _op,emptyList: emptyList,rangeLengthList: rangeLengthList};
};
Elm.Random = Elm.Random || {};
Elm.Random.Array = Elm.Random.Array || {};
Elm.Random.Array.make = function (_elm) {
   "use strict";
   _elm.Random = _elm.Random || {};
   _elm.Random.Array = _elm.Random.Array || {};
   if (_elm.Random.Array.values) return _elm.Random.Array.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Array = Elm.Array.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Random = Elm.Random.make(_elm),
   $Random$Extra = Elm.Random.Extra.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm);
   var _op = {};
   var choose = function (arr) {
      if ($Array.isEmpty(arr)) return $Random$Extra.constant({ctor: "_Tuple2",_0: $Maybe.Nothing,_1: arr}); else {
            var front = function (i) {    return A3($Array.slice,0,i,arr);};
            var lastIndex = $Array.length(arr) - 1;
            var back = function (i) {    return _U.eq(i,lastIndex) ? $Array.empty : A3($Array.slice,i + 1,lastIndex + 1,arr);};
            var gen = A2($Random.$int,0,lastIndex);
            return A2($Random.map,
            function (index) {
               return {ctor: "_Tuple2",_0: A2($Array.get,index,arr),_1: A2($Array.append,front(index),back(index))};
            },
            gen);
         }
   };
   var shuffle = function (arr) {
      if ($Array.isEmpty(arr)) return $Random$Extra.constant(arr); else {
            var helper = function (_p0) {
               var _p1 = _p0;
               var _p6 = _p1._0;
               return A2($Random.andThen,
               choose(_p1._1),
               function (_p2) {
                  var _p3 = _p2;
                  var _p5 = _p3._1;
                  var _p4 = _p3._0;
                  if (_p4.ctor === "Nothing") {
                        return $Random$Extra.constant({ctor: "_Tuple2",_0: _p6,_1: _p5});
                     } else {
                        return helper({ctor: "_Tuple2",_0: A2($List._op["::"],_p4._0,_p6),_1: _p5});
                     }
               });
            };
            return A2($Random.map,function (_p7) {    return $Array.fromList($Basics.fst(_p7));},helper({ctor: "_Tuple2",_0: _U.list([]),_1: arr}));
         }
   };
   var sample = function (arr) {
      var gen = A2($Random.$int,0,$Array.length(arr) - 1);
      return A2($Random.map,function (index) {    return A2($Array.get,index,arr);},gen);
   };
   var emptyArray = $Random$Extra.constant($Array.empty);
   var array = F2(function (arrayLength,generator) {    return A2($Random$Extra.map,$Array.fromList,A2($Random.list,arrayLength,generator));});
   var rangeLengthArray = F3(function (minLength,maxLength,generator) {
      return A2($Random$Extra.flatMap,function (len) {    return A2(array,len,generator);},A2($Random.$int,minLength,maxLength));
   });
   return _elm.Random.Array.values = {_op: _op
                                     ,array: array
                                     ,emptyArray: emptyArray
                                     ,rangeLengthArray: rangeLengthArray
                                     ,sample: sample
                                     ,choose: choose
                                     ,shuffle: shuffle};
};
Elm.Check = Elm.Check || {};
Elm.Check.Investigator = Elm.Check.Investigator || {};
Elm.Check.Investigator.make = function (_elm) {
   "use strict";
   _elm.Check = _elm.Check || {};
   _elm.Check.Investigator = _elm.Check.Investigator || {};
   if (_elm.Check.Investigator.values) return _elm.Check.Investigator.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Array = Elm.Array.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Random = Elm.Random.make(_elm),
   $Random$Array = Elm.Random.Array.make(_elm),
   $Random$Bool = Elm.Random.Bool.make(_elm),
   $Random$Char = Elm.Random.Char.make(_elm),
   $Random$Extra = Elm.Random.Extra.make(_elm),
   $Random$Function = Elm.Random.Function.make(_elm),
   $Random$List = Elm.Random.List.make(_elm),
   $Random$Maybe = Elm.Random.Maybe.make(_elm),
   $Random$Order = Elm.Random.Order.make(_elm),
   $Random$Result = Elm.Random.Result.make(_elm),
   $Random$String = Elm.Random.String.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Shrink = Elm.Shrink.make(_elm),
   $Signal = Elm.Signal.make(_elm);
   var _op = {};
   var random = function (_) {    return _.generator;};
   var shrink = function (_) {    return _.shrinker;};
   var investigator = F2(function (generator,shrinker) {    return {generator: generator,shrinker: shrinker};});
   var $void = A2(investigator,$Random$Extra.constant({ctor: "_Tuple0"}),$Shrink.$void);
   var bool = A2(investigator,$Random$Bool.bool,$Shrink.bool);
   var order = A2(investigator,$Random$Order.order,$Shrink.order);
   var $int = function () {
      var generator = A2($Random$Extra.frequency,
      _U.list([{ctor: "_Tuple2",_0: 3,_1: A2($Random.$int,-50,50)},{ctor: "_Tuple2",_0: 1,_1: A2($Random.$int,$Random.minInt,$Random.maxInt)}]),
      A2($Random.$int,-50,50));
      return A2(investigator,generator,$Shrink.$int);
   }();
   var rangeInt = F2(function (min,max) {    return A2(investigator,A2($Random.$int,min,max),$Shrink.$int);});
   var $float = function () {
      var generator = A2($Random$Extra.frequency,
      _U.list([{ctor: "_Tuple2",_0: 3,_1: A2($Random.$float,-50,50)}
              ,{ctor: "_Tuple2",_0: 1,_1: A2($Random.$float,$Basics.toFloat($Random.minInt),$Basics.toFloat($Random.maxInt))}]),
      A2($Random.$float,-50,50));
      return A2(investigator,A2($Random.$float,-50,50),$Shrink.$float);
   }();
   var percentage = function () {
      var generator = A2($Random$Extra.frequency,
      _U.list([{ctor: "_Tuple2",_0: 3,_1: A2($Random.$float,0,1)}
              ,{ctor: "_Tuple2",_0: 1,_1: $Random$Extra.constant(0)}
              ,{ctor: "_Tuple2",_0: 1,_1: $Random$Extra.constant(1)}]),
      A2($Random.$float,0,1));
      return A2(investigator,generator,$Shrink.$float);
   }();
   var ascii = A2(investigator,$Random$Char.ascii,$Shrink.$char);
   var $char = A2(investigator,A2($Random$Char.$char,32,127),$Shrink.character);
   var upperCaseChar = A2(investigator,$Random$Char.upperCaseLatin,$Shrink.character);
   var lowerCaseChar = A2(investigator,$Random$Char.lowerCaseLatin,$Shrink.character);
   var unicode = A2(investigator,$Random$Char.unicode,$Shrink.$char);
   var string = A2(investigator,A3($Random$String.rangeLengthString,0,10,$Random$Char.ascii),$Shrink.string);
   var maybe = function (inv) {    return A2(investigator,$Random$Maybe.maybe(inv.generator),$Shrink.maybe(inv.shrinker));};
   var result = F2(function (errSpec,valSpec) {
      return A2(investigator,A2($Random$Result.result,errSpec.generator,valSpec.generator),A2($Shrink.result,errSpec.shrinker,valSpec.shrinker));
   });
   var list = function (inv) {    return A2(investigator,A3($Random$List.rangeLengthList,0,10,inv.generator),$Shrink.list(inv.shrinker));};
   var array = function (inv) {    return A2(investigator,A3($Random$Array.rangeLengthArray,0,10,inv.generator),$Shrink.array(inv.shrinker));};
   var tuple = function (_p0) {
      var _p1 = _p0;
      var _p3 = _p1._1;
      var _p2 = _p1._0;
      return A2(investigator,A2($Random$Extra.zip,_p2.generator,_p3.generator),$Shrink.tuple({ctor: "_Tuple2",_0: _p2.shrinker,_1: _p3.shrinker}));
   };
   var tuple3 = function (_p4) {
      var _p5 = _p4;
      var _p8 = _p5._2;
      var _p7 = _p5._1;
      var _p6 = _p5._0;
      return A2(investigator,
      A3($Random$Extra.zip3,_p6.generator,_p7.generator,_p8.generator),
      $Shrink.tuple3({ctor: "_Tuple3",_0: _p6.shrinker,_1: _p7.shrinker,_2: _p8.shrinker}));
   };
   var tuple4 = function (_p9) {
      var _p10 = _p9;
      var _p14 = _p10._3;
      var _p13 = _p10._2;
      var _p12 = _p10._1;
      var _p11 = _p10._0;
      return A2(investigator,
      A4($Random$Extra.zip4,_p11.generator,_p12.generator,_p13.generator,_p14.generator),
      $Shrink.tuple4({ctor: "_Tuple4",_0: _p11.shrinker,_1: _p12.shrinker,_2: _p13.shrinker,_3: _p14.shrinker}));
   };
   var tuple5 = function (_p15) {
      var _p16 = _p15;
      var _p21 = _p16._4;
      var _p20 = _p16._3;
      var _p19 = _p16._2;
      var _p18 = _p16._1;
      var _p17 = _p16._0;
      return A2(investigator,
      A5($Random$Extra.zip5,_p17.generator,_p18.generator,_p19.generator,_p20.generator,_p21.generator),
      $Shrink.tuple5({ctor: "_Tuple5",_0: _p17.shrinker,_1: _p18.shrinker,_2: _p19.shrinker,_3: _p20.shrinker,_4: _p21.shrinker}));
   };
   var func = function (invB) {    return A2(investigator,$Random$Function.func(invB.generator),$Shrink.noShrink);};
   var func2 = function (invC) {    return A2(investigator,$Random$Function.func2(invC.generator),$Shrink.noShrink);};
   var func3 = function (invD) {    return A2(investigator,$Random$Function.func3(invD.generator),$Shrink.noShrink);};
   var func4 = function (invE) {    return A2(investigator,$Random$Function.func4(invE.generator),$Shrink.noShrink);};
   var func5 = function (invF) {    return A2(investigator,$Random$Function.func5(invF.generator),$Shrink.noShrink);};
   var Investigator = F2(function (a,b) {    return {generator: a,shrinker: b};});
   return _elm.Check.Investigator.values = {_op: _op
                                           ,Investigator: Investigator
                                           ,investigator: investigator
                                           ,$void: $void
                                           ,bool: bool
                                           ,order: order
                                           ,$int: $int
                                           ,rangeInt: rangeInt
                                           ,$float: $float
                                           ,percentage: percentage
                                           ,ascii: ascii
                                           ,$char: $char
                                           ,upperCaseChar: upperCaseChar
                                           ,lowerCaseChar: lowerCaseChar
                                           ,unicode: unicode
                                           ,string: string
                                           ,maybe: maybe
                                           ,result: result
                                           ,list: list
                                           ,array: array
                                           ,tuple: tuple
                                           ,tuple3: tuple3
                                           ,tuple4: tuple4
                                           ,tuple5: tuple5
                                           ,func: func
                                           ,func2: func2
                                           ,func3: func3
                                           ,func4: func4
                                           ,func5: func5
                                           ,shrink: shrink
                                           ,random: random};
};
Elm.Check = Elm.Check || {};
Elm.Check.make = function (_elm) {
   "use strict";
   _elm.Check = _elm.Check || {};
   if (_elm.Check.values) return _elm.Check.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Check$Investigator = Elm.Check.Investigator.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $Lazy$List = Elm.Lazy.List.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Random = Elm.Random.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm),
   $Trampoline = Elm.Trampoline.make(_elm);
   var _op = {};
   var $false = F2(function (f,pred) {    return A2(f,pred,$Basics.always(false));});
   var $true = F2(function (f,pred) {    return A2(f,pred,$Basics.always(true));});
   var $for = F2(function (f,x) {    return f(x);});
   var is = F2(function (f,x) {    return f(x);});
   var that = F2(function (f,x) {    return f(x);});
   var FailureOptions = F8(function (a,b,c,d,e,f,g,h) {
      return {name: a,counterExample: b,actual: c,expected: d,original: e,seed: f,numberOfChecks: g,numberOfShrinks: h};
   });
   var SuccessOptions = F3(function (a,b,c) {    return {name: a,seed: b,numberOfChecks: c};});
   var Multiple = F2(function (a,b) {    return {ctor: "Multiple",_0: a,_1: b};});
   var check = F3(function (claim,n,seed) {
      var _p0 = claim;
      if (_p0.ctor === "Claim") {
            return A2(_p0._1,n,seed);
         } else {
            return A2(Multiple,_p0._0,A2($List.map,function (c) {    return A3(check,c,n,seed);},_p0._1));
         }
   });
   var quickCheck = function (claim) {    return A3(check,claim,100,$Random.initialSeed(1));};
   var Unit = function (a) {    return {ctor: "Unit",_0: a};};
   var Suite = F2(function (a,b) {    return {ctor: "Suite",_0: a,_1: b};});
   var suite = F2(function (name,claims) {    return A2(Suite,name,claims);});
   var Claim = F2(function (a,b) {    return {ctor: "Claim",_0: a,_1: b};});
   var claim = F4(function (name,actualStatement,expectedStatement,investigator) {
      return A2(Claim,
      name,
      F2(function (numberOfChecks,seed) {
         var originalCounterExample$ = F2(function (seed,currentNumberOfChecks) {
            if (_U.cmp(currentNumberOfChecks,numberOfChecks) > -1) return $Trampoline.Done($Result.Ok(numberOfChecks)); else {
                  var _p1 = A2($Random.generate,investigator.generator,seed);
                  var value = _p1._0;
                  var nextSeed = _p1._1;
                  var actual = actualStatement(value);
                  var expected = expectedStatement(value);
                  return _U.eq(actual,expected) ? $Trampoline.Continue(function (_p2) {
                     var _p3 = _p2;
                     return A2(originalCounterExample$,nextSeed,currentNumberOfChecks + 1);
                  }) : $Trampoline.Done($Result.Err({ctor: "_Tuple5",_0: value,_1: actual,_2: expected,_3: nextSeed,_4: currentNumberOfChecks + 1}));
               }
         });
         var originalCounterExample = $Trampoline.trampoline(A2(originalCounterExample$,seed,0));
         var _p4 = originalCounterExample;
         if (_p4.ctor === "Ok") {
               return Unit($Result.Ok({name: name,seed: seed,numberOfChecks: A2($Basics.max,0,_p4._0)}));
            } else {
               var _p9 = _p4._0._0;
               var shrink = F2(function (counterExample,currentNumberOfShrinks) {
                  var shrunkenCounterExamples = investigator.shrinker(counterExample);
                  var failingShrunkenCounterExamples = A2($Lazy$List.keepIf,
                  function (shrunk) {
                     return $Basics.not(_U.eq(actualStatement(shrunk),expectedStatement(shrunk)));
                  },
                  shrunkenCounterExamples);
                  var _p5 = $Lazy$List.head(failingShrunkenCounterExamples);
                  if (_p5.ctor === "Nothing") {
                        return $Trampoline.Done({ctor: "_Tuple2",_0: counterExample,_1: currentNumberOfShrinks});
                     } else {
                        return $Trampoline.Continue(function (_p6) {    var _p7 = _p6;return A2(shrink,_p5._0,currentNumberOfShrinks + 1);});
                     }
               });
               var _p8 = $Trampoline.trampoline(A2(shrink,_p9,0));
               var minimal = _p8._0;
               var numberOfShrinks = _p8._1;
               var actual = actualStatement(minimal);
               var expected = expectedStatement(minimal);
               return Unit($Result.Err({name: name
                                       ,seed: _p4._0._3
                                       ,counterExample: $Basics.toString(minimal)
                                       ,expected: $Basics.toString(expected)
                                       ,actual: $Basics.toString(actual)
                                       ,original: {counterExample: $Basics.toString(_p9)
                                                  ,actual: $Basics.toString(_p4._0._1)
                                                  ,expected: $Basics.toString(_p4._0._2)}
                                       ,numberOfChecks: _p4._0._4
                                       ,numberOfShrinks: numberOfShrinks}));
            }
      }));
   });
   var claimTrue = F2(function (name,predicate) {    return A3(claim,name,predicate,$Basics.always(true));});
   var claimFalse = F2(function (name,predicate) {    return A3(claim,name,predicate,$Basics.always(false));});
   var claim2 = F5(function (name,actualStatement,expectedStatement,specA,specB) {
      return A4(claim,
      name,
      function (_p10) {
         var _p11 = _p10;
         return A2(actualStatement,_p11._0,_p11._1);
      },
      function (_p12) {
         var _p13 = _p12;
         return A2(expectedStatement,_p13._0,_p13._1);
      },
      $Check$Investigator.tuple({ctor: "_Tuple2",_0: specA,_1: specB}));
   });
   var claim2True = F2(function (name,predicate) {    return A3(claim2,name,predicate,F2(function (_p15,_p14) {    return true;}));});
   var claim2False = F2(function (name,predicate) {    return A3(claim2,name,predicate,F2(function (_p17,_p16) {    return false;}));});
   var claim3 = F6(function (name,actualStatement,expectedStatement,specA,specB,specC) {
      return A4(claim,
      name,
      function (_p18) {
         var _p19 = _p18;
         return A3(actualStatement,_p19._0,_p19._1,_p19._2);
      },
      function (_p20) {
         var _p21 = _p20;
         return A3(expectedStatement,_p21._0,_p21._1,_p21._2);
      },
      $Check$Investigator.tuple3({ctor: "_Tuple3",_0: specA,_1: specB,_2: specC}));
   });
   var claim3True = F2(function (name,predicate) {    return A3(claim3,name,predicate,F3(function (_p24,_p23,_p22) {    return true;}));});
   var claim3False = F2(function (name,predicate) {    return A3(claim3,name,predicate,F3(function (_p27,_p26,_p25) {    return false;}));});
   var claim4 = F7(function (name,actualStatement,expectedStatement,specA,specB,specC,specD) {
      return A4(claim,
      name,
      function (_p28) {
         var _p29 = _p28;
         return A4(actualStatement,_p29._0,_p29._1,_p29._2,_p29._3);
      },
      function (_p30) {
         var _p31 = _p30;
         return A4(expectedStatement,_p31._0,_p31._1,_p31._2,_p31._3);
      },
      $Check$Investigator.tuple4({ctor: "_Tuple4",_0: specA,_1: specB,_2: specC,_3: specD}));
   });
   var claim4True = F2(function (name,predicate) {    return A3(claim4,name,predicate,F4(function (_p35,_p34,_p33,_p32) {    return true;}));});
   var claim4False = F2(function (name,predicate) {    return A3(claim4,name,predicate,F4(function (_p39,_p38,_p37,_p36) {    return false;}));});
   var claim5 = F8(function (name,actualStatement,expectedStatement,specA,specB,specC,specD,specE) {
      return A4(claim,
      name,
      function (_p40) {
         var _p41 = _p40;
         return A5(actualStatement,_p41._0,_p41._1,_p41._2,_p41._3,_p41._4);
      },
      function (_p42) {
         var _p43 = _p42;
         return A5(expectedStatement,_p43._0,_p43._1,_p43._2,_p43._3,_p43._4);
      },
      $Check$Investigator.tuple5({ctor: "_Tuple5",_0: specA,_1: specB,_2: specC,_3: specD,_4: specE}));
   });
   var claim5True = F2(function (name,predicate) {    return A3(claim5,name,predicate,F5(function (_p48,_p47,_p46,_p45,_p44) {    return true;}));});
   var claim5False = F2(function (name,predicate) {    return A3(claim5,name,predicate,F5(function (_p53,_p52,_p51,_p50,_p49) {    return false;}));});
   return _elm.Check.values = {_op: _op
                              ,Claim: Claim
                              ,Suite: Suite
                              ,Unit: Unit
                              ,Multiple: Multiple
                              ,SuccessOptions: SuccessOptions
                              ,FailureOptions: FailureOptions
                              ,claim: claim
                              ,claimTrue: claimTrue
                              ,claimFalse: claimFalse
                              ,check: check
                              ,quickCheck: quickCheck
                              ,suite: suite
                              ,claim2: claim2
                              ,claim2True: claim2True
                              ,claim2False: claim2False
                              ,claim3: claim3
                              ,claim3True: claim3True
                              ,claim3False: claim3False
                              ,claim4: claim4
                              ,claim4True: claim4True
                              ,claim4False: claim4False
                              ,claim5: claim5
                              ,claim5True: claim5True
                              ,claim5False: claim5False
                              ,that: that
                              ,is: is
                              ,$for: $for
                              ,$true: $true
                              ,$false: $false};
};
Elm.Dict = Elm.Dict || {};
Elm.Dict.make = function (_elm) {
   "use strict";
   _elm.Dict = _elm.Dict || {};
   if (_elm.Dict.values) return _elm.Dict.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Native$Debug = Elm.Native.Debug.make(_elm),
   $String = Elm.String.make(_elm);
   var _op = {};
   var foldr = F3(function (f,acc,t) {
      foldr: while (true) {
         var _p0 = t;
         if (_p0.ctor === "RBEmpty_elm_builtin") {
               return acc;
            } else {
               var _v1 = f,_v2 = A3(f,_p0._1,_p0._2,A3(foldr,f,acc,_p0._4)),_v3 = _p0._3;
               f = _v1;
               acc = _v2;
               t = _v3;
               continue foldr;
            }
      }
   });
   var keys = function (dict) {    return A3(foldr,F3(function (key,value,keyList) {    return A2($List._op["::"],key,keyList);}),_U.list([]),dict);};
   var values = function (dict) {    return A3(foldr,F3(function (key,value,valueList) {    return A2($List._op["::"],value,valueList);}),_U.list([]),dict);};
   var toList = function (dict) {
      return A3(foldr,F3(function (key,value,list) {    return A2($List._op["::"],{ctor: "_Tuple2",_0: key,_1: value},list);}),_U.list([]),dict);
   };
   var foldl = F3(function (f,acc,dict) {
      foldl: while (true) {
         var _p1 = dict;
         if (_p1.ctor === "RBEmpty_elm_builtin") {
               return acc;
            } else {
               var _v5 = f,_v6 = A3(f,_p1._1,_p1._2,A3(foldl,f,acc,_p1._3)),_v7 = _p1._4;
               f = _v5;
               acc = _v6;
               dict = _v7;
               continue foldl;
            }
      }
   });
   var reportRemBug = F4(function (msg,c,lgot,rgot) {
      return $Native$Debug.crash($String.concat(_U.list(["Internal red-black tree invariant violated, expected "
                                                        ,msg
                                                        ," and got "
                                                        ,$Basics.toString(c)
                                                        ,"/"
                                                        ,lgot
                                                        ,"/"
                                                        ,rgot
                                                        ,"\nPlease report this bug to <https://github.com/elm-lang/core/issues>"])));
   });
   var isBBlack = function (dict) {
      var _p2 = dict;
      _v8_2: do {
         if (_p2.ctor === "RBNode_elm_builtin") {
               if (_p2._0.ctor === "BBlack") {
                     return true;
                  } else {
                     break _v8_2;
                  }
            } else {
               if (_p2._0.ctor === "LBBlack") {
                     return true;
                  } else {
                     break _v8_2;
                  }
            }
      } while (false);
      return false;
   };
   var Same = {ctor: "Same"};
   var Remove = {ctor: "Remove"};
   var Insert = {ctor: "Insert"};
   var sizeHelp = F2(function (n,dict) {
      sizeHelp: while (true) {
         var _p3 = dict;
         if (_p3.ctor === "RBEmpty_elm_builtin") {
               return n;
            } else {
               var _v10 = A2(sizeHelp,n + 1,_p3._4),_v11 = _p3._3;
               n = _v10;
               dict = _v11;
               continue sizeHelp;
            }
      }
   });
   var size = function (dict) {    return A2(sizeHelp,0,dict);};
   var get = F2(function (targetKey,dict) {
      get: while (true) {
         var _p4 = dict;
         if (_p4.ctor === "RBEmpty_elm_builtin") {
               return $Maybe.Nothing;
            } else {
               var _p5 = A2($Basics.compare,targetKey,_p4._1);
               switch (_p5.ctor)
               {case "LT": var _v14 = targetKey,_v15 = _p4._3;
                    targetKey = _v14;
                    dict = _v15;
                    continue get;
                  case "EQ": return $Maybe.Just(_p4._2);
                  default: var _v16 = targetKey,_v17 = _p4._4;
                    targetKey = _v16;
                    dict = _v17;
                    continue get;}
            }
      }
   });
   var member = F2(function (key,dict) {    var _p6 = A2(get,key,dict);if (_p6.ctor === "Just") {    return true;} else {    return false;}});
   var maxWithDefault = F3(function (k,v,r) {
      maxWithDefault: while (true) {
         var _p7 = r;
         if (_p7.ctor === "RBEmpty_elm_builtin") {
               return {ctor: "_Tuple2",_0: k,_1: v};
            } else {
               var _v20 = _p7._1,_v21 = _p7._2,_v22 = _p7._4;
               k = _v20;
               v = _v21;
               r = _v22;
               continue maxWithDefault;
            }
      }
   });
   var RBEmpty_elm_builtin = function (a) {    return {ctor: "RBEmpty_elm_builtin",_0: a};};
   var RBNode_elm_builtin = F5(function (a,b,c,d,e) {    return {ctor: "RBNode_elm_builtin",_0: a,_1: b,_2: c,_3: d,_4: e};});
   var LBBlack = {ctor: "LBBlack"};
   var LBlack = {ctor: "LBlack"};
   var empty = RBEmpty_elm_builtin(LBlack);
   var isEmpty = function (dict) {    return _U.eq(dict,empty);};
   var map = F2(function (f,dict) {
      var _p8 = dict;
      if (_p8.ctor === "RBEmpty_elm_builtin") {
            return RBEmpty_elm_builtin(LBlack);
         } else {
            var _p9 = _p8._1;
            return A5(RBNode_elm_builtin,_p8._0,_p9,A2(f,_p9,_p8._2),A2(map,f,_p8._3),A2(map,f,_p8._4));
         }
   });
   var NBlack = {ctor: "NBlack"};
   var BBlack = {ctor: "BBlack"};
   var Black = {ctor: "Black"};
   var ensureBlackRoot = function (dict) {
      var _p10 = dict;
      if (_p10.ctor === "RBNode_elm_builtin" && _p10._0.ctor === "Red") {
            return A5(RBNode_elm_builtin,Black,_p10._1,_p10._2,_p10._3,_p10._4);
         } else {
            return dict;
         }
   };
   var blackish = function (t) {
      var _p11 = t;
      if (_p11.ctor === "RBNode_elm_builtin") {
            var _p12 = _p11._0;
            return _U.eq(_p12,Black) || _U.eq(_p12,BBlack);
         } else {
            return true;
         }
   };
   var blacken = function (t) {
      var _p13 = t;
      if (_p13.ctor === "RBEmpty_elm_builtin") {
            return RBEmpty_elm_builtin(LBlack);
         } else {
            return A5(RBNode_elm_builtin,Black,_p13._1,_p13._2,_p13._3,_p13._4);
         }
   };
   var Red = {ctor: "Red"};
   var moreBlack = function (color) {
      var _p14 = color;
      switch (_p14.ctor)
      {case "Black": return BBlack;
         case "Red": return Black;
         case "NBlack": return Red;
         default: return $Native$Debug.crash("Can\'t make a double black node more black!");}
   };
   var lessBlack = function (color) {
      var _p15 = color;
      switch (_p15.ctor)
      {case "BBlack": return Black;
         case "Black": return Red;
         case "Red": return NBlack;
         default: return $Native$Debug.crash("Can\'t make a negative black node less black!");}
   };
   var lessBlackTree = function (dict) {
      var _p16 = dict;
      if (_p16.ctor === "RBNode_elm_builtin") {
            return A5(RBNode_elm_builtin,lessBlack(_p16._0),_p16._1,_p16._2,_p16._3,_p16._4);
         } else {
            return RBEmpty_elm_builtin(LBlack);
         }
   };
   var balancedTree = function (col) {
      return function (xk) {
         return function (xv) {
            return function (yk) {
               return function (yv) {
                  return function (zk) {
                     return function (zv) {
                        return function (a) {
                           return function (b) {
                              return function (c) {
                                 return function (d) {
                                    return A5(RBNode_elm_builtin,
                                    lessBlack(col),
                                    yk,
                                    yv,
                                    A5(RBNode_elm_builtin,Black,xk,xv,a,b),
                                    A5(RBNode_elm_builtin,Black,zk,zv,c,d));
                                 };
                              };
                           };
                        };
                     };
                  };
               };
            };
         };
      };
   };
   var redden = function (t) {
      var _p17 = t;
      if (_p17.ctor === "RBEmpty_elm_builtin") {
            return $Native$Debug.crash("can\'t make a Leaf red");
         } else {
            return A5(RBNode_elm_builtin,Red,_p17._1,_p17._2,_p17._3,_p17._4);
         }
   };
   var balanceHelp = function (tree) {
      var _p18 = tree;
      _v31_6: do {
         _v31_5: do {
            _v31_4: do {
               _v31_3: do {
                  _v31_2: do {
                     _v31_1: do {
                        _v31_0: do {
                           if (_p18.ctor === "RBNode_elm_builtin") {
                                 if (_p18._3.ctor === "RBNode_elm_builtin") {
                                       if (_p18._4.ctor === "RBNode_elm_builtin") {
                                             switch (_p18._3._0.ctor)
                                             {case "Red": switch (_p18._4._0.ctor)
                                                  {case "Red": if (_p18._3._3.ctor === "RBNode_elm_builtin" && _p18._3._3._0.ctor === "Red") {
                                                             break _v31_0;
                                                          } else {
                                                             if (_p18._3._4.ctor === "RBNode_elm_builtin" && _p18._3._4._0.ctor === "Red") {
                                                                   break _v31_1;
                                                                } else {
                                                                   if (_p18._4._3.ctor === "RBNode_elm_builtin" && _p18._4._3._0.ctor === "Red") {
                                                                         break _v31_2;
                                                                      } else {
                                                                         if (_p18._4._4.ctor === "RBNode_elm_builtin" && _p18._4._4._0.ctor === "Red") {
                                                                               break _v31_3;
                                                                            } else {
                                                                               break _v31_6;
                                                                            }
                                                                      }
                                                                }
                                                          }
                                                     case "NBlack": if (_p18._3._3.ctor === "RBNode_elm_builtin" && _p18._3._3._0.ctor === "Red") {
                                                             break _v31_0;
                                                          } else {
                                                             if (_p18._3._4.ctor === "RBNode_elm_builtin" && _p18._3._4._0.ctor === "Red") {
                                                                   break _v31_1;
                                                                } else {
                                                                   if (_p18._0.ctor === "BBlack" && _p18._4._3.ctor === "RBNode_elm_builtin" && _p18._4._3._0.ctor === "Black" && _p18._4._4.ctor === "RBNode_elm_builtin" && _p18._4._4._0.ctor === "Black")
                                                                   {
                                                                         break _v31_4;
                                                                      } else {
                                                                         break _v31_6;
                                                                      }
                                                                }
                                                          }
                                                     default: if (_p18._3._3.ctor === "RBNode_elm_builtin" && _p18._3._3._0.ctor === "Red") {
                                                             break _v31_0;
                                                          } else {
                                                             if (_p18._3._4.ctor === "RBNode_elm_builtin" && _p18._3._4._0.ctor === "Red") {
                                                                   break _v31_1;
                                                                } else {
                                                                   break _v31_6;
                                                                }
                                                          }}
                                                case "NBlack": switch (_p18._4._0.ctor)
                                                  {case "Red": if (_p18._4._3.ctor === "RBNode_elm_builtin" && _p18._4._3._0.ctor === "Red") {
                                                             break _v31_2;
                                                          } else {
                                                             if (_p18._4._4.ctor === "RBNode_elm_builtin" && _p18._4._4._0.ctor === "Red") {
                                                                   break _v31_3;
                                                                } else {
                                                                   if (_p18._0.ctor === "BBlack" && _p18._3._3.ctor === "RBNode_elm_builtin" && _p18._3._3._0.ctor === "Black" && _p18._3._4.ctor === "RBNode_elm_builtin" && _p18._3._4._0.ctor === "Black")
                                                                   {
                                                                         break _v31_5;
                                                                      } else {
                                                                         break _v31_6;
                                                                      }
                                                                }
                                                          }
                                                     case "NBlack": if (_p18._0.ctor === "BBlack") {
                                                             if (_p18._4._3.ctor === "RBNode_elm_builtin" && _p18._4._3._0.ctor === "Black" && _p18._4._4.ctor === "RBNode_elm_builtin" && _p18._4._4._0.ctor === "Black")
                                                             {
                                                                   break _v31_4;
                                                                } else {
                                                                   if (_p18._3._3.ctor === "RBNode_elm_builtin" && _p18._3._3._0.ctor === "Black" && _p18._3._4.ctor === "RBNode_elm_builtin" && _p18._3._4._0.ctor === "Black")
                                                                   {
                                                                         break _v31_5;
                                                                      } else {
                                                                         break _v31_6;
                                                                      }
                                                                }
                                                          } else {
                                                             break _v31_6;
                                                          }
                                                     default:
                                                     if (_p18._0.ctor === "BBlack" && _p18._3._3.ctor === "RBNode_elm_builtin" && _p18._3._3._0.ctor === "Black" && _p18._3._4.ctor === "RBNode_elm_builtin" && _p18._3._4._0.ctor === "Black")
                                                       {
                                                             break _v31_5;
                                                          } else {
                                                             break _v31_6;
                                                          }}
                                                default: switch (_p18._4._0.ctor)
                                                  {case "Red": if (_p18._4._3.ctor === "RBNode_elm_builtin" && _p18._4._3._0.ctor === "Red") {
                                                             break _v31_2;
                                                          } else {
                                                             if (_p18._4._4.ctor === "RBNode_elm_builtin" && _p18._4._4._0.ctor === "Red") {
                                                                   break _v31_3;
                                                                } else {
                                                                   break _v31_6;
                                                                }
                                                          }
                                                     case "NBlack":
                                                     if (_p18._0.ctor === "BBlack" && _p18._4._3.ctor === "RBNode_elm_builtin" && _p18._4._3._0.ctor === "Black" && _p18._4._4.ctor === "RBNode_elm_builtin" && _p18._4._4._0.ctor === "Black")
                                                       {
                                                             break _v31_4;
                                                          } else {
                                                             break _v31_6;
                                                          }
                                                     default: break _v31_6;}}
                                          } else {
                                             switch (_p18._3._0.ctor)
                                             {case "Red": if (_p18._3._3.ctor === "RBNode_elm_builtin" && _p18._3._3._0.ctor === "Red") {
                                                        break _v31_0;
                                                     } else {
                                                        if (_p18._3._4.ctor === "RBNode_elm_builtin" && _p18._3._4._0.ctor === "Red") {
                                                              break _v31_1;
                                                           } else {
                                                              break _v31_6;
                                                           }
                                                     }
                                                case "NBlack":
                                                if (_p18._0.ctor === "BBlack" && _p18._3._3.ctor === "RBNode_elm_builtin" && _p18._3._3._0.ctor === "Black" && _p18._3._4.ctor === "RBNode_elm_builtin" && _p18._3._4._0.ctor === "Black")
                                                  {
                                                        break _v31_5;
                                                     } else {
                                                        break _v31_6;
                                                     }
                                                default: break _v31_6;}
                                          }
                                    } else {
                                       if (_p18._4.ctor === "RBNode_elm_builtin") {
                                             switch (_p18._4._0.ctor)
                                             {case "Red": if (_p18._4._3.ctor === "RBNode_elm_builtin" && _p18._4._3._0.ctor === "Red") {
                                                        break _v31_2;
                                                     } else {
                                                        if (_p18._4._4.ctor === "RBNode_elm_builtin" && _p18._4._4._0.ctor === "Red") {
                                                              break _v31_3;
                                                           } else {
                                                              break _v31_6;
                                                           }
                                                     }
                                                case "NBlack":
                                                if (_p18._0.ctor === "BBlack" && _p18._4._3.ctor === "RBNode_elm_builtin" && _p18._4._3._0.ctor === "Black" && _p18._4._4.ctor === "RBNode_elm_builtin" && _p18._4._4._0.ctor === "Black")
                                                  {
                                                        break _v31_4;
                                                     } else {
                                                        break _v31_6;
                                                     }
                                                default: break _v31_6;}
                                          } else {
                                             break _v31_6;
                                          }
                                    }
                              } else {
                                 break _v31_6;
                              }
                        } while (false);
                        return balancedTree(_p18._0)(_p18._3._3._1)(_p18._3._3._2)(_p18._3._1)(_p18._3._2)(_p18._1)(_p18._2)(_p18._3._3._3)(_p18._3._3._4)(_p18._3._4)(_p18._4);
                     } while (false);
                     return balancedTree(_p18._0)(_p18._3._1)(_p18._3._2)(_p18._3._4._1)(_p18._3._4._2)(_p18._1)(_p18._2)(_p18._3._3)(_p18._3._4._3)(_p18._3._4._4)(_p18._4);
                  } while (false);
                  return balancedTree(_p18._0)(_p18._1)(_p18._2)(_p18._4._3._1)(_p18._4._3._2)(_p18._4._1)(_p18._4._2)(_p18._3)(_p18._4._3._3)(_p18._4._3._4)(_p18._4._4);
               } while (false);
               return balancedTree(_p18._0)(_p18._1)(_p18._2)(_p18._4._1)(_p18._4._2)(_p18._4._4._1)(_p18._4._4._2)(_p18._3)(_p18._4._3)(_p18._4._4._3)(_p18._4._4._4);
            } while (false);
            return A5(RBNode_elm_builtin,
            Black,
            _p18._4._3._1,
            _p18._4._3._2,
            A5(RBNode_elm_builtin,Black,_p18._1,_p18._2,_p18._3,_p18._4._3._3),
            A5(balance,Black,_p18._4._1,_p18._4._2,_p18._4._3._4,redden(_p18._4._4)));
         } while (false);
         return A5(RBNode_elm_builtin,
         Black,
         _p18._3._4._1,
         _p18._3._4._2,
         A5(balance,Black,_p18._3._1,_p18._3._2,redden(_p18._3._3),_p18._3._4._3),
         A5(RBNode_elm_builtin,Black,_p18._1,_p18._2,_p18._3._4._4,_p18._4));
      } while (false);
      return tree;
   };
   var balance = F5(function (c,k,v,l,r) {    var tree = A5(RBNode_elm_builtin,c,k,v,l,r);return blackish(tree) ? balanceHelp(tree) : tree;});
   var bubble = F5(function (c,k,v,l,r) {
      return isBBlack(l) || isBBlack(r) ? A5(balance,moreBlack(c),k,v,lessBlackTree(l),lessBlackTree(r)) : A5(RBNode_elm_builtin,c,k,v,l,r);
   });
   var removeMax = F5(function (c,k,v,l,r) {
      var _p19 = r;
      if (_p19.ctor === "RBEmpty_elm_builtin") {
            return A3(rem,c,l,r);
         } else {
            return A5(bubble,c,k,v,l,A5(removeMax,_p19._0,_p19._1,_p19._2,_p19._3,_p19._4));
         }
   });
   var rem = F3(function (c,l,r) {
      var _p20 = {ctor: "_Tuple2",_0: l,_1: r};
      if (_p20._0.ctor === "RBEmpty_elm_builtin") {
            if (_p20._1.ctor === "RBEmpty_elm_builtin") {
                  var _p21 = c;
                  switch (_p21.ctor)
                  {case "Red": return RBEmpty_elm_builtin(LBlack);
                     case "Black": return RBEmpty_elm_builtin(LBBlack);
                     default: return $Native$Debug.crash("cannot have bblack or nblack nodes at this point");}
               } else {
                  var _p24 = _p20._1._0;
                  var _p23 = _p20._0._0;
                  var _p22 = {ctor: "_Tuple3",_0: c,_1: _p23,_2: _p24};
                  if (_p22.ctor === "_Tuple3" && _p22._0.ctor === "Black" && _p22._1.ctor === "LBlack" && _p22._2.ctor === "Red") {
                        return A5(RBNode_elm_builtin,Black,_p20._1._1,_p20._1._2,_p20._1._3,_p20._1._4);
                     } else {
                        return A4(reportRemBug,"Black/LBlack/Red",c,$Basics.toString(_p23),$Basics.toString(_p24));
                     }
               }
         } else {
            if (_p20._1.ctor === "RBEmpty_elm_builtin") {
                  var _p27 = _p20._1._0;
                  var _p26 = _p20._0._0;
                  var _p25 = {ctor: "_Tuple3",_0: c,_1: _p26,_2: _p27};
                  if (_p25.ctor === "_Tuple3" && _p25._0.ctor === "Black" && _p25._1.ctor === "Red" && _p25._2.ctor === "LBlack") {
                        return A5(RBNode_elm_builtin,Black,_p20._0._1,_p20._0._2,_p20._0._3,_p20._0._4);
                     } else {
                        return A4(reportRemBug,"Black/Red/LBlack",c,$Basics.toString(_p26),$Basics.toString(_p27));
                     }
               } else {
                  var _p31 = _p20._0._2;
                  var _p30 = _p20._0._4;
                  var _p29 = _p20._0._1;
                  var l$ = A5(removeMax,_p20._0._0,_p29,_p31,_p20._0._3,_p30);
                  var _p28 = A3(maxWithDefault,_p29,_p31,_p30);
                  var k = _p28._0;
                  var v = _p28._1;
                  return A5(bubble,c,k,v,l$,r);
               }
         }
   });
   var update = F3(function (k,alter,dict) {
      var up = function (dict) {
         var _p32 = dict;
         if (_p32.ctor === "RBEmpty_elm_builtin") {
               var _p33 = alter($Maybe.Nothing);
               if (_p33.ctor === "Nothing") {
                     return {ctor: "_Tuple2",_0: Same,_1: empty};
                  } else {
                     return {ctor: "_Tuple2",_0: Insert,_1: A5(RBNode_elm_builtin,Red,k,_p33._0,empty,empty)};
                  }
            } else {
               var _p44 = _p32._2;
               var _p43 = _p32._4;
               var _p42 = _p32._3;
               var _p41 = _p32._1;
               var _p40 = _p32._0;
               var _p34 = A2($Basics.compare,k,_p41);
               switch (_p34.ctor)
               {case "EQ": var _p35 = alter($Maybe.Just(_p44));
                    if (_p35.ctor === "Nothing") {
                          return {ctor: "_Tuple2",_0: Remove,_1: A3(rem,_p40,_p42,_p43)};
                       } else {
                          return {ctor: "_Tuple2",_0: Same,_1: A5(RBNode_elm_builtin,_p40,_p41,_p35._0,_p42,_p43)};
                       }
                  case "LT": var _p36 = up(_p42);
                    var flag = _p36._0;
                    var newLeft = _p36._1;
                    var _p37 = flag;
                    switch (_p37.ctor)
                    {case "Same": return {ctor: "_Tuple2",_0: Same,_1: A5(RBNode_elm_builtin,_p40,_p41,_p44,newLeft,_p43)};
                       case "Insert": return {ctor: "_Tuple2",_0: Insert,_1: A5(balance,_p40,_p41,_p44,newLeft,_p43)};
                       default: return {ctor: "_Tuple2",_0: Remove,_1: A5(bubble,_p40,_p41,_p44,newLeft,_p43)};}
                  default: var _p38 = up(_p43);
                    var flag = _p38._0;
                    var newRight = _p38._1;
                    var _p39 = flag;
                    switch (_p39.ctor)
                    {case "Same": return {ctor: "_Tuple2",_0: Same,_1: A5(RBNode_elm_builtin,_p40,_p41,_p44,_p42,newRight)};
                       case "Insert": return {ctor: "_Tuple2",_0: Insert,_1: A5(balance,_p40,_p41,_p44,_p42,newRight)};
                       default: return {ctor: "_Tuple2",_0: Remove,_1: A5(bubble,_p40,_p41,_p44,_p42,newRight)};}}
            }
      };
      var _p45 = up(dict);
      var flag = _p45._0;
      var updatedDict = _p45._1;
      var _p46 = flag;
      switch (_p46.ctor)
      {case "Same": return updatedDict;
         case "Insert": return ensureBlackRoot(updatedDict);
         default: return blacken(updatedDict);}
   });
   var insert = F3(function (key,value,dict) {    return A3(update,key,$Basics.always($Maybe.Just(value)),dict);});
   var singleton = F2(function (key,value) {    return A3(insert,key,value,empty);});
   var union = F2(function (t1,t2) {    return A3(foldl,insert,t2,t1);});
   var fromList = function (assocs) {
      return A3($List.foldl,F2(function (_p47,dict) {    var _p48 = _p47;return A3(insert,_p48._0,_p48._1,dict);}),empty,assocs);
   };
   var filter = F2(function (predicate,dictionary) {
      var add = F3(function (key,value,dict) {    return A2(predicate,key,value) ? A3(insert,key,value,dict) : dict;});
      return A3(foldl,add,empty,dictionary);
   });
   var intersect = F2(function (t1,t2) {    return A2(filter,F2(function (k,_p49) {    return A2(member,k,t2);}),t1);});
   var partition = F2(function (predicate,dict) {
      var add = F3(function (key,value,_p50) {
         var _p51 = _p50;
         var _p53 = _p51._1;
         var _p52 = _p51._0;
         return A2(predicate,key,value) ? {ctor: "_Tuple2",_0: A3(insert,key,value,_p52),_1: _p53} : {ctor: "_Tuple2",_0: _p52,_1: A3(insert,key,value,_p53)};
      });
      return A3(foldl,add,{ctor: "_Tuple2",_0: empty,_1: empty},dict);
   });
   var remove = F2(function (key,dict) {    return A3(update,key,$Basics.always($Maybe.Nothing),dict);});
   var diff = F2(function (t1,t2) {    return A3(foldl,F3(function (k,v,t) {    return A2(remove,k,t);}),t1,t2);});
   return _elm.Dict.values = {_op: _op
                             ,empty: empty
                             ,singleton: singleton
                             ,insert: insert
                             ,update: update
                             ,isEmpty: isEmpty
                             ,get: get
                             ,remove: remove
                             ,member: member
                             ,size: size
                             ,filter: filter
                             ,partition: partition
                             ,foldl: foldl
                             ,foldr: foldr
                             ,map: map
                             ,union: union
                             ,intersect: intersect
                             ,diff: diff
                             ,keys: keys
                             ,values: values
                             ,toList: toList
                             ,fromList: fromList};
};
Elm.Native.Json = {};

Elm.Native.Json.make = function(localRuntime) {
	localRuntime.Native = localRuntime.Native || {};
	localRuntime.Native.Json = localRuntime.Native.Json || {};
	if (localRuntime.Native.Json.values) {
		return localRuntime.Native.Json.values;
	}

	var ElmArray = Elm.Native.Array.make(localRuntime);
	var List = Elm.Native.List.make(localRuntime);
	var Maybe = Elm.Maybe.make(localRuntime);
	var Result = Elm.Result.make(localRuntime);
	var Utils = Elm.Native.Utils.make(localRuntime);


	function crash(expected, actual) {
		throw new Error(
			'expecting ' + expected + ' but got ' + JSON.stringify(actual)
		);
	}


	// PRIMITIVE VALUES

	function decodeNull(successValue) {
		return function(value) {
			if (value === null) {
				return successValue;
			}
			crash('null', value);
		};
	}


	function decodeString(value) {
		if (typeof value === 'string' || value instanceof String) {
			return value;
		}
		crash('a String', value);
	}


	function decodeFloat(value) {
		if (typeof value === 'number') {
			return value;
		}
		crash('a Float', value);
	}


	function decodeInt(value) {
		if (typeof value !== 'number') {
			crash('an Int', value);
		}

		if (value < 2147483647 && value > -2147483647 && (value | 0) === value) {
			return value;
		}

		if (isFinite(value) && !(value % 1)) {
			return value;
		}

		crash('an Int', value);
	}


	function decodeBool(value) {
		if (typeof value === 'boolean') {
			return value;
		}
		crash('a Bool', value);
	}


	// ARRAY

	function decodeArray(decoder) {
		return function(value) {
			if (value instanceof Array) {
				var len = value.length;
				var array = new Array(len);
				for (var i = len; i--; ) {
					array[i] = decoder(value[i]);
				}
				return ElmArray.fromJSArray(array);
			}
			crash('an Array', value);
		};
	}


	// LIST

	function decodeList(decoder) {
		return function(value) {
			if (value instanceof Array) {
				var len = value.length;
				var list = List.Nil;
				for (var i = len; i--; ) {
					list = List.Cons( decoder(value[i]), list );
				}
				return list;
			}
			crash('a List', value);
		};
	}


	// MAYBE

	function decodeMaybe(decoder) {
		return function(value) {
			try {
				return Maybe.Just(decoder(value));
			} catch(e) {
				return Maybe.Nothing;
			}
		};
	}


	// FIELDS

	function decodeField(field, decoder) {
		return function(value) {
			var subValue = value[field];
			if (subValue !== undefined) {
				return decoder(subValue);
			}
			crash("an object with field '" + field + "'", value);
		};
	}


	// OBJECTS

	function decodeKeyValuePairs(decoder) {
		return function(value) {
			var isObject =
				typeof value === 'object'
					&& value !== null
					&& !(value instanceof Array);

			if (isObject) {
				var keyValuePairs = List.Nil;
				for (var key in value)
				{
					var elmValue = decoder(value[key]);
					var pair = Utils.Tuple2(key, elmValue);
					keyValuePairs = List.Cons(pair, keyValuePairs);
				}
				return keyValuePairs;
			}

			crash('an object', value);
		};
	}

	function decodeObject1(f, d1) {
		return function(value) {
			return f(d1(value));
		};
	}

	function decodeObject2(f, d1, d2) {
		return function(value) {
			return A2( f, d1(value), d2(value) );
		};
	}

	function decodeObject3(f, d1, d2, d3) {
		return function(value) {
			return A3( f, d1(value), d2(value), d3(value) );
		};
	}

	function decodeObject4(f, d1, d2, d3, d4) {
		return function(value) {
			return A4( f, d1(value), d2(value), d3(value), d4(value) );
		};
	}

	function decodeObject5(f, d1, d2, d3, d4, d5) {
		return function(value) {
			return A5( f, d1(value), d2(value), d3(value), d4(value), d5(value) );
		};
	}

	function decodeObject6(f, d1, d2, d3, d4, d5, d6) {
		return function(value) {
			return A6( f,
				d1(value),
				d2(value),
				d3(value),
				d4(value),
				d5(value),
				d6(value)
			);
		};
	}

	function decodeObject7(f, d1, d2, d3, d4, d5, d6, d7) {
		return function(value) {
			return A7( f,
				d1(value),
				d2(value),
				d3(value),
				d4(value),
				d5(value),
				d6(value),
				d7(value)
			);
		};
	}

	function decodeObject8(f, d1, d2, d3, d4, d5, d6, d7, d8) {
		return function(value) {
			return A8( f,
				d1(value),
				d2(value),
				d3(value),
				d4(value),
				d5(value),
				d6(value),
				d7(value),
				d8(value)
			);
		};
	}


	// TUPLES

	function decodeTuple1(f, d1) {
		return function(value) {
			if ( !(value instanceof Array) || value.length !== 1 ) {
				crash('a Tuple of length 1', value);
			}
			return f( d1(value[0]) );
		};
	}

	function decodeTuple2(f, d1, d2) {
		return function(value) {
			if ( !(value instanceof Array) || value.length !== 2 ) {
				crash('a Tuple of length 2', value);
			}
			return A2( f, d1(value[0]), d2(value[1]) );
		};
	}

	function decodeTuple3(f, d1, d2, d3) {
		return function(value) {
			if ( !(value instanceof Array) || value.length !== 3 ) {
				crash('a Tuple of length 3', value);
			}
			return A3( f, d1(value[0]), d2(value[1]), d3(value[2]) );
		};
	}


	function decodeTuple4(f, d1, d2, d3, d4) {
		return function(value) {
			if ( !(value instanceof Array) || value.length !== 4 ) {
				crash('a Tuple of length 4', value);
			}
			return A4( f, d1(value[0]), d2(value[1]), d3(value[2]), d4(value[3]) );
		};
	}


	function decodeTuple5(f, d1, d2, d3, d4, d5) {
		return function(value) {
			if ( !(value instanceof Array) || value.length !== 5 ) {
				crash('a Tuple of length 5', value);
			}
			return A5( f,
				d1(value[0]),
				d2(value[1]),
				d3(value[2]),
				d4(value[3]),
				d5(value[4])
			);
		};
	}


	function decodeTuple6(f, d1, d2, d3, d4, d5, d6) {
		return function(value) {
			if ( !(value instanceof Array) || value.length !== 6 ) {
				crash('a Tuple of length 6', value);
			}
			return A6( f,
				d1(value[0]),
				d2(value[1]),
				d3(value[2]),
				d4(value[3]),
				d5(value[4]),
				d6(value[5])
			);
		};
	}

	function decodeTuple7(f, d1, d2, d3, d4, d5, d6, d7) {
		return function(value) {
			if ( !(value instanceof Array) || value.length !== 7 ) {
				crash('a Tuple of length 7', value);
			}
			return A7( f,
				d1(value[0]),
				d2(value[1]),
				d3(value[2]),
				d4(value[3]),
				d5(value[4]),
				d6(value[5]),
				d7(value[6])
			);
		};
	}


	function decodeTuple8(f, d1, d2, d3, d4, d5, d6, d7, d8) {
		return function(value) {
			if ( !(value instanceof Array) || value.length !== 8 ) {
				crash('a Tuple of length 8', value);
			}
			return A8( f,
				d1(value[0]),
				d2(value[1]),
				d3(value[2]),
				d4(value[3]),
				d5(value[4]),
				d6(value[5]),
				d7(value[6]),
				d8(value[7])
			);
		};
	}


	// CUSTOM DECODERS

	function decodeValue(value) {
		return value;
	}

	function runDecoderValue(decoder, value) {
		try {
			return Result.Ok(decoder(value));
		} catch(e) {
			return Result.Err(e.message);
		}
	}

	function customDecoder(decoder, callback) {
		return function(value) {
			var result = callback(decoder(value));
			if (result.ctor === 'Err') {
				throw new Error('custom decoder failed: ' + result._0);
			}
			return result._0;
		};
	}

	function andThen(decode, callback) {
		return function(value) {
			var result = decode(value);
			return callback(result)(value);
		};
	}

	function fail(msg) {
		return function(value) {
			throw new Error(msg);
		};
	}

	function succeed(successValue) {
		return function(value) {
			return successValue;
		};
	}


	// ONE OF MANY

	function oneOf(decoders) {
		return function(value) {
			var errors = [];
			var temp = decoders;
			while (temp.ctor !== '[]') {
				try {
					return temp._0(value);
				} catch(e) {
					errors.push(e.message);
				}
				temp = temp._1;
			}
			throw new Error('expecting one of the following:\n    ' + errors.join('\n    '));
		};
	}

	function get(decoder, value) {
		try {
			return Result.Ok(decoder(value));
		} catch(e) {
			return Result.Err(e.message);
		}
	}


	// ENCODE / DECODE

	function runDecoderString(decoder, string) {
		try {
			return Result.Ok(decoder(JSON.parse(string)));
		} catch(e) {
			return Result.Err(e.message);
		}
	}

	function encode(indentLevel, value) {
		return JSON.stringify(value, null, indentLevel);
	}

	function identity(value) {
		return value;
	}

	function encodeObject(keyValuePairs) {
		var obj = {};
		while (keyValuePairs.ctor !== '[]') {
			var pair = keyValuePairs._0;
			obj[pair._0] = pair._1;
			keyValuePairs = keyValuePairs._1;
		}
		return obj;
	}

	return localRuntime.Native.Json.values = {
		encode: F2(encode),
		runDecoderString: F2(runDecoderString),
		runDecoderValue: F2(runDecoderValue),

		get: F2(get),
		oneOf: oneOf,

		decodeNull: decodeNull,
		decodeInt: decodeInt,
		decodeFloat: decodeFloat,
		decodeString: decodeString,
		decodeBool: decodeBool,

		decodeMaybe: decodeMaybe,

		decodeList: decodeList,
		decodeArray: decodeArray,

		decodeField: F2(decodeField),

		decodeObject1: F2(decodeObject1),
		decodeObject2: F3(decodeObject2),
		decodeObject3: F4(decodeObject3),
		decodeObject4: F5(decodeObject4),
		decodeObject5: F6(decodeObject5),
		decodeObject6: F7(decodeObject6),
		decodeObject7: F8(decodeObject7),
		decodeObject8: F9(decodeObject8),
		decodeKeyValuePairs: decodeKeyValuePairs,

		decodeTuple1: F2(decodeTuple1),
		decodeTuple2: F3(decodeTuple2),
		decodeTuple3: F4(decodeTuple3),
		decodeTuple4: F5(decodeTuple4),
		decodeTuple5: F6(decodeTuple5),
		decodeTuple6: F7(decodeTuple6),
		decodeTuple7: F8(decodeTuple7),
		decodeTuple8: F9(decodeTuple8),

		andThen: F2(andThen),
		decodeValue: decodeValue,
		customDecoder: F2(customDecoder),
		fail: fail,
		succeed: succeed,

		identity: identity,
		encodeNull: null,
		encodeArray: ElmArray.toJSArray,
		encodeList: List.toArray,
		encodeObject: encodeObject

	};
};

Elm.Json = Elm.Json || {};
Elm.Json.Encode = Elm.Json.Encode || {};
Elm.Json.Encode.make = function (_elm) {
   "use strict";
   _elm.Json = _elm.Json || {};
   _elm.Json.Encode = _elm.Json.Encode || {};
   if (_elm.Json.Encode.values) return _elm.Json.Encode.values;
   var _U = Elm.Native.Utils.make(_elm),$Array = Elm.Array.make(_elm),$Native$Json = Elm.Native.Json.make(_elm);
   var _op = {};
   var list = $Native$Json.encodeList;
   var array = $Native$Json.encodeArray;
   var object = $Native$Json.encodeObject;
   var $null = $Native$Json.encodeNull;
   var bool = $Native$Json.identity;
   var $float = $Native$Json.identity;
   var $int = $Native$Json.identity;
   var string = $Native$Json.identity;
   var encode = $Native$Json.encode;
   var Value = {ctor: "Value"};
   return _elm.Json.Encode.values = {_op: _op
                                    ,encode: encode
                                    ,string: string
                                    ,$int: $int
                                    ,$float: $float
                                    ,bool: bool
                                    ,$null: $null
                                    ,list: list
                                    ,array: array
                                    ,object: object};
};
Elm.Json = Elm.Json || {};
Elm.Json.Decode = Elm.Json.Decode || {};
Elm.Json.Decode.make = function (_elm) {
   "use strict";
   _elm.Json = _elm.Json || {};
   _elm.Json.Decode = _elm.Json.Decode || {};
   if (_elm.Json.Decode.values) return _elm.Json.Decode.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Array = Elm.Array.make(_elm),
   $Dict = Elm.Dict.make(_elm),
   $Json$Encode = Elm.Json.Encode.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Native$Json = Elm.Native.Json.make(_elm),
   $Result = Elm.Result.make(_elm);
   var _op = {};
   var tuple8 = $Native$Json.decodeTuple8;
   var tuple7 = $Native$Json.decodeTuple7;
   var tuple6 = $Native$Json.decodeTuple6;
   var tuple5 = $Native$Json.decodeTuple5;
   var tuple4 = $Native$Json.decodeTuple4;
   var tuple3 = $Native$Json.decodeTuple3;
   var tuple2 = $Native$Json.decodeTuple2;
   var tuple1 = $Native$Json.decodeTuple1;
   var succeed = $Native$Json.succeed;
   var fail = $Native$Json.fail;
   var andThen = $Native$Json.andThen;
   var customDecoder = $Native$Json.customDecoder;
   var decodeValue = $Native$Json.runDecoderValue;
   var value = $Native$Json.decodeValue;
   var maybe = $Native$Json.decodeMaybe;
   var $null = $Native$Json.decodeNull;
   var array = $Native$Json.decodeArray;
   var list = $Native$Json.decodeList;
   var bool = $Native$Json.decodeBool;
   var $int = $Native$Json.decodeInt;
   var $float = $Native$Json.decodeFloat;
   var string = $Native$Json.decodeString;
   var oneOf = $Native$Json.oneOf;
   var keyValuePairs = $Native$Json.decodeKeyValuePairs;
   var object8 = $Native$Json.decodeObject8;
   var object7 = $Native$Json.decodeObject7;
   var object6 = $Native$Json.decodeObject6;
   var object5 = $Native$Json.decodeObject5;
   var object4 = $Native$Json.decodeObject4;
   var object3 = $Native$Json.decodeObject3;
   var object2 = $Native$Json.decodeObject2;
   var object1 = $Native$Json.decodeObject1;
   _op[":="] = $Native$Json.decodeField;
   var at = F2(function (fields,decoder) {    return A3($List.foldr,F2(function (x,y) {    return A2(_op[":="],x,y);}),decoder,fields);});
   var decodeString = $Native$Json.runDecoderString;
   var map = $Native$Json.decodeObject1;
   var dict = function (decoder) {    return A2(map,$Dict.fromList,keyValuePairs(decoder));};
   var Decoder = {ctor: "Decoder"};
   return _elm.Json.Decode.values = {_op: _op
                                    ,decodeString: decodeString
                                    ,decodeValue: decodeValue
                                    ,string: string
                                    ,$int: $int
                                    ,$float: $float
                                    ,bool: bool
                                    ,$null: $null
                                    ,list: list
                                    ,array: array
                                    ,tuple1: tuple1
                                    ,tuple2: tuple2
                                    ,tuple3: tuple3
                                    ,tuple4: tuple4
                                    ,tuple5: tuple5
                                    ,tuple6: tuple6
                                    ,tuple7: tuple7
                                    ,tuple8: tuple8
                                    ,at: at
                                    ,object1: object1
                                    ,object2: object2
                                    ,object3: object3
                                    ,object4: object4
                                    ,object5: object5
                                    ,object6: object6
                                    ,object7: object7
                                    ,object8: object8
                                    ,keyValuePairs: keyValuePairs
                                    ,dict: dict
                                    ,maybe: maybe
                                    ,oneOf: oneOf
                                    ,map: map
                                    ,fail: fail
                                    ,succeed: succeed
                                    ,andThen: andThen
                                    ,value: value
                                    ,customDecoder: customDecoder};
};
Elm.Native.Time = {};

Elm.Native.Time.make = function(localRuntime)
{
	localRuntime.Native = localRuntime.Native || {};
	localRuntime.Native.Time = localRuntime.Native.Time || {};
	if (localRuntime.Native.Time.values)
	{
		return localRuntime.Native.Time.values;
	}

	var NS = Elm.Native.Signal.make(localRuntime);
	var Maybe = Elm.Maybe.make(localRuntime);


	// FRAMES PER SECOND

	function fpsWhen(desiredFPS, isOn)
	{
		var msPerFrame = 1000 / desiredFPS;
		var ticker = NS.input('fps-' + desiredFPS, null);

		function notifyTicker()
		{
			localRuntime.notify(ticker.id, null);
		}

		function firstArg(x, y)
		{
			return x;
		}

		// input fires either when isOn changes, or when ticker fires.
		// Its value is a tuple with the current timestamp, and the state of isOn
		var input = NS.timestamp(A3(NS.map2, F2(firstArg), NS.dropRepeats(isOn), ticker));

		var initialState = {
			isOn: false,
			time: localRuntime.timer.programStart,
			delta: 0
		};

		var timeoutId;

		function update(input, state)
		{
			var currentTime = input._0;
			var isOn = input._1;
			var wasOn = state.isOn;
			var previousTime = state.time;

			if (isOn)
			{
				timeoutId = localRuntime.setTimeout(notifyTicker, msPerFrame);
			}
			else if (wasOn)
			{
				clearTimeout(timeoutId);
			}

			return {
				isOn: isOn,
				time: currentTime,
				delta: (isOn && !wasOn) ? 0 : currentTime - previousTime
			};
		}

		return A2(
			NS.map,
			function(state) { return state.delta; },
			A3(NS.foldp, F2(update), update(input.value, initialState), input)
		);
	}


	// EVERY

	function every(t)
	{
		var ticker = NS.input('every-' + t, null);
		function tellTime()
		{
			localRuntime.notify(ticker.id, null);
		}
		var clock = A2(NS.map, fst, NS.timestamp(ticker));
		setInterval(tellTime, t);
		return clock;
	}


	function fst(pair)
	{
		return pair._0;
	}


	function read(s)
	{
		var t = Date.parse(s);
		return isNaN(t) ? Maybe.Nothing : Maybe.Just(t);
	}

	return localRuntime.Native.Time.values = {
		fpsWhen: F2(fpsWhen),
		every: every,
		toDate: function(t) { return new Date(t); },
		read: read
	};
};

Elm.Time = Elm.Time || {};
Elm.Time.make = function (_elm) {
   "use strict";
   _elm.Time = _elm.Time || {};
   if (_elm.Time.values) return _elm.Time.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Native$Signal = Elm.Native.Signal.make(_elm),
   $Native$Time = Elm.Native.Time.make(_elm),
   $Signal = Elm.Signal.make(_elm);
   var _op = {};
   var delay = $Native$Signal.delay;
   var since = F2(function (time,signal) {
      var stop = A2($Signal.map,$Basics.always(-1),A2(delay,time,signal));
      var start = A2($Signal.map,$Basics.always(1),signal);
      var delaydiff = A3($Signal.foldp,F2(function (x,y) {    return x + y;}),0,A2($Signal.merge,start,stop));
      return A2($Signal.map,F2(function (x,y) {    return !_U.eq(x,y);})(0),delaydiff);
   });
   var timestamp = $Native$Signal.timestamp;
   var every = $Native$Time.every;
   var fpsWhen = $Native$Time.fpsWhen;
   var fps = function (targetFrames) {    return A2(fpsWhen,targetFrames,$Signal.constant(true));};
   var inMilliseconds = function (t) {    return t;};
   var millisecond = 1;
   var second = 1000 * millisecond;
   var minute = 60 * second;
   var hour = 60 * minute;
   var inHours = function (t) {    return t / hour;};
   var inMinutes = function (t) {    return t / minute;};
   var inSeconds = function (t) {    return t / second;};
   return _elm.Time.values = {_op: _op
                             ,millisecond: millisecond
                             ,second: second
                             ,minute: minute
                             ,hour: hour
                             ,inMilliseconds: inMilliseconds
                             ,inSeconds: inSeconds
                             ,inMinutes: inMinutes
                             ,inHours: inHours
                             ,fps: fps
                             ,fpsWhen: fpsWhen
                             ,every: every
                             ,timestamp: timestamp
                             ,delay: delay
                             ,since: since};
};
Elm.Set = Elm.Set || {};
Elm.Set.make = function (_elm) {
   "use strict";
   _elm.Set = _elm.Set || {};
   if (_elm.Set.values) return _elm.Set.values;
   var _U = Elm.Native.Utils.make(_elm),$Basics = Elm.Basics.make(_elm),$Dict = Elm.Dict.make(_elm),$List = Elm.List.make(_elm);
   var _op = {};
   var foldr = F3(function (f,b,_p0) {    var _p1 = _p0;return A3($Dict.foldr,F3(function (k,_p2,b) {    return A2(f,k,b);}),b,_p1._0);});
   var foldl = F3(function (f,b,_p3) {    var _p4 = _p3;return A3($Dict.foldl,F3(function (k,_p5,b) {    return A2(f,k,b);}),b,_p4._0);});
   var toList = function (_p6) {    var _p7 = _p6;return $Dict.keys(_p7._0);};
   var size = function (_p8) {    var _p9 = _p8;return $Dict.size(_p9._0);};
   var member = F2(function (k,_p10) {    var _p11 = _p10;return A2($Dict.member,k,_p11._0);});
   var isEmpty = function (_p12) {    var _p13 = _p12;return $Dict.isEmpty(_p13._0);};
   var Set_elm_builtin = function (a) {    return {ctor: "Set_elm_builtin",_0: a};};
   var empty = Set_elm_builtin($Dict.empty);
   var singleton = function (k) {    return Set_elm_builtin(A2($Dict.singleton,k,{ctor: "_Tuple0"}));};
   var insert = F2(function (k,_p14) {    var _p15 = _p14;return Set_elm_builtin(A3($Dict.insert,k,{ctor: "_Tuple0"},_p15._0));});
   var fromList = function (xs) {    return A3($List.foldl,insert,empty,xs);};
   var map = F2(function (f,s) {    return fromList(A2($List.map,f,toList(s)));});
   var remove = F2(function (k,_p16) {    var _p17 = _p16;return Set_elm_builtin(A2($Dict.remove,k,_p17._0));});
   var union = F2(function (_p19,_p18) {    var _p20 = _p19;var _p21 = _p18;return Set_elm_builtin(A2($Dict.union,_p20._0,_p21._0));});
   var intersect = F2(function (_p23,_p22) {    var _p24 = _p23;var _p25 = _p22;return Set_elm_builtin(A2($Dict.intersect,_p24._0,_p25._0));});
   var diff = F2(function (_p27,_p26) {    var _p28 = _p27;var _p29 = _p26;return Set_elm_builtin(A2($Dict.diff,_p28._0,_p29._0));});
   var filter = F2(function (p,_p30) {    var _p31 = _p30;return Set_elm_builtin(A2($Dict.filter,F2(function (k,_p32) {    return p(k);}),_p31._0));});
   var partition = F2(function (p,_p33) {
      var _p34 = _p33;
      var _p35 = A2($Dict.partition,F2(function (k,_p36) {    return p(k);}),_p34._0);
      var p1 = _p35._0;
      var p2 = _p35._1;
      return {ctor: "_Tuple2",_0: Set_elm_builtin(p1),_1: Set_elm_builtin(p2)};
   });
   return _elm.Set.values = {_op: _op
                            ,empty: empty
                            ,singleton: singleton
                            ,insert: insert
                            ,remove: remove
                            ,isEmpty: isEmpty
                            ,member: member
                            ,size: size
                            ,foldl: foldl
                            ,foldr: foldr
                            ,map: map
                            ,filter: filter
                            ,partition: partition
                            ,union: union
                            ,intersect: intersect
                            ,diff: diff
                            ,toList: toList
                            ,fromList: fromList};
};
// setup
Elm.Native = Elm.Native || {};
Elm.Native.Graphics = Elm.Native.Graphics || {};
Elm.Native.Graphics.Input = Elm.Native.Graphics.Input || {};

// definition
Elm.Native.Graphics.Input.make = function(localRuntime) {
	'use strict';

	// attempt to short-circuit
	if ('values' in Elm.Native.Graphics.Input) {
		return Elm.Native.Graphics.Input.values;
	}

	var Color = Elm.Native.Color.make(localRuntime);
	var List = Elm.Native.List.make(localRuntime);
	var Signal = Elm.Native.Signal.make(localRuntime);
	var Text = Elm.Native.Text.make(localRuntime);
	var Utils = Elm.Native.Utils.make(localRuntime);

	var Element = Elm.Native.Graphics.Element.make(localRuntime);


	function renderDropDown(model)
	{
		var drop = Element.createNode('select');
		drop.style.border = '0 solid';
		drop.style.pointerEvents = 'auto';
		drop.style.display = 'block';

		drop.elm_values = List.toArray(model.values);
		drop.elm_handler = model.handler;
		var values = drop.elm_values;

		for (var i = 0; i < values.length; ++i)
		{
			var option = Element.createNode('option');
			var name = values[i]._0;
			option.value = name;
			option.innerHTML = name;
			drop.appendChild(option);
		}
		drop.addEventListener('change', function() {
			Signal.sendMessage(drop.elm_handler(drop.elm_values[drop.selectedIndex]._1));
		});

		return drop;
	}

	function updateDropDown(node, oldModel, newModel)
	{
		node.elm_values = List.toArray(newModel.values);
		node.elm_handler = newModel.handler;

		var values = node.elm_values;
		var kids = node.childNodes;
		var kidsLength = kids.length;

		var i = 0;
		for (; i < kidsLength && i < values.length; ++i)
		{
			var option = kids[i];
			var name = values[i]._0;
			option.value = name;
			option.innerHTML = name;
		}
		for (; i < kidsLength; ++i)
		{
			node.removeChild(node.lastChild);
		}
		for (; i < values.length; ++i)
		{
			var option = Element.createNode('option');
			var name = values[i]._0;
			option.value = name;
			option.innerHTML = name;
			node.appendChild(option);
		}
		return node;
	}

	function dropDown(handler, values)
	{
		return A3(Element.newElement, 100, 24, {
			ctor: 'Custom',
			type: 'DropDown',
			render: renderDropDown,
			update: updateDropDown,
			model: {
				values: values,
				handler: handler
			}
		});
	}

	function renderButton(model)
	{
		var node = Element.createNode('button');
		node.style.display = 'block';
		node.style.pointerEvents = 'auto';
		node.elm_message = model.message;
		function click()
		{
			Signal.sendMessage(node.elm_message);
		}
		node.addEventListener('click', click);
		node.innerHTML = model.text;
		return node;
	}

	function updateButton(node, oldModel, newModel)
	{
		node.elm_message = newModel.message;
		var txt = newModel.text;
		if (oldModel.text !== txt)
		{
			node.innerHTML = txt;
		}
		return node;
	}

	function button(message, text)
	{
		return A3(Element.newElement, 100, 40, {
			ctor: 'Custom',
			type: 'Button',
			render: renderButton,
			update: updateButton,
			model: {
				message: message,
				text: text
			}
		});
	}

	function renderCustomButton(model)
	{
		var btn = Element.createNode('div');
		btn.style.pointerEvents = 'auto';
		btn.elm_message = model.message;

		btn.elm_up    = Element.render(model.up);
		btn.elm_hover = Element.render(model.hover);
		btn.elm_down  = Element.render(model.down);

		btn.elm_up.style.display = 'block';
		btn.elm_hover.style.display = 'none';
		btn.elm_down.style.display = 'none';

		btn.appendChild(btn.elm_up);
		btn.appendChild(btn.elm_hover);
		btn.appendChild(btn.elm_down);

		function swap(visibleNode, hiddenNode1, hiddenNode2)
		{
			visibleNode.style.display = 'block';
			hiddenNode1.style.display = 'none';
			hiddenNode2.style.display = 'none';
		}

		var overCount = 0;
		function over(e)
		{
			if (overCount++ > 0) return;
			swap(btn.elm_hover, btn.elm_down, btn.elm_up);
		}
		function out(e)
		{
			if (btn.contains(e.toElement || e.relatedTarget)) return;
			overCount = 0;
			swap(btn.elm_up, btn.elm_down, btn.elm_hover);
		}
		function up()
		{
			swap(btn.elm_hover, btn.elm_down, btn.elm_up);
			Signal.sendMessage(btn.elm_message);
		}
		function down()
		{
			swap(btn.elm_down, btn.elm_hover, btn.elm_up);
		}

		btn.addEventListener('mouseover', over);
		btn.addEventListener('mouseout', out);
		btn.addEventListener('mousedown', down);
		btn.addEventListener('mouseup', up);

		return btn;
	}

	function updateCustomButton(node, oldModel, newModel)
	{
		node.elm_message = newModel.message;

		var kids = node.childNodes;
		var styleUp    = kids[0].style.display;
		var styleHover = kids[1].style.display;
		var styleDown  = kids[2].style.display;

		Element.updateAndReplace(kids[0], oldModel.up, newModel.up);
		Element.updateAndReplace(kids[1], oldModel.hover, newModel.hover);
		Element.updateAndReplace(kids[2], oldModel.down, newModel.down);

		var kids = node.childNodes;
		kids[0].style.display = styleUp;
		kids[1].style.display = styleHover;
		kids[2].style.display = styleDown;

		return node;
	}

	function max3(a, b, c)
	{
		var ab = a > b ? a : b;
		return ab > c ? ab : c;
	}

	function customButton(message, up, hover, down)
	{
		return A3(Element.newElement,
				  max3(up._0.props.width, hover._0.props.width, down._0.props.width),
				  max3(up._0.props.height, hover._0.props.height, down._0.props.height),
				  { ctor: 'Custom',
					type: 'CustomButton',
					render: renderCustomButton,
					update: updateCustomButton,
					model: {
						message: message,
						up: up,
						hover: hover,
						down: down
					}
				  });
	}

	function renderCheckbox(model)
	{
		var node = Element.createNode('input');
		node.type = 'checkbox';
		node.checked = model.checked;
		node.style.display = 'block';
		node.style.pointerEvents = 'auto';
		node.elm_handler = model.handler;
		function change()
		{
			Signal.sendMessage(node.elm_handler(node.checked));
		}
		node.addEventListener('change', change);
		return node;
	}

	function updateCheckbox(node, oldModel, newModel)
	{
		node.elm_handler = newModel.handler;
		node.checked = newModel.checked;
		return node;
	}

	function checkbox(handler, checked)
	{
		return A3(Element.newElement, 13, 13, {
			ctor: 'Custom',
			type: 'CheckBox',
			render: renderCheckbox,
			update: updateCheckbox,
			model: { handler: handler, checked: checked }
		});
	}

	function setRange(node, start, end, dir)
	{
		if (node.parentNode)
		{
			node.setSelectionRange(start, end, dir);
		}
		else
		{
			setTimeout(function() {node.setSelectionRange(start, end, dir); }, 0);
		}
	}

	function updateIfNeeded(css, attribute, latestAttribute)
	{
		if (css[attribute] !== latestAttribute)
		{
			css[attribute] = latestAttribute;
		}
	}
	function cssDimensions(dimensions)
	{
		return dimensions.top    + 'px ' +
			   dimensions.right  + 'px ' +
			   dimensions.bottom + 'px ' +
			   dimensions.left   + 'px';
	}
	function updateFieldStyle(css, style)
	{
		updateIfNeeded(css, 'padding', cssDimensions(style.padding));

		var outline = style.outline;
		updateIfNeeded(css, 'border-width', cssDimensions(outline.width));
		updateIfNeeded(css, 'border-color', Color.toCss(outline.color));
		updateIfNeeded(css, 'border-radius', outline.radius + 'px');

		var highlight = style.highlight;
		if (highlight.width === 0)
		{
			css.outline = 'none';
		}
		else
		{
			updateIfNeeded(css, 'outline-width', highlight.width + 'px');
			updateIfNeeded(css, 'outline-color', Color.toCss(highlight.color));
		}

		var textStyle = style.style;
		updateIfNeeded(css, 'color', Color.toCss(textStyle.color));
		if (textStyle.typeface.ctor !== '[]')
		{
			updateIfNeeded(css, 'font-family', Text.toTypefaces(textStyle.typeface));
		}
		if (textStyle.height.ctor !== 'Nothing')
		{
			updateIfNeeded(css, 'font-size', textStyle.height._0 + 'px');
		}
		updateIfNeeded(css, 'font-weight', textStyle.bold ? 'bold' : 'normal');
		updateIfNeeded(css, 'font-style', textStyle.italic ? 'italic' : 'normal');
		if (textStyle.line.ctor !== 'Nothing')
		{
			updateIfNeeded(css, 'text-decoration', Text.toLine(textStyle.line._0));
		}
	}

	function renderField(model)
	{
		var field = Element.createNode('input');
		updateFieldStyle(field.style, model.style);
		field.style.borderStyle = 'solid';
		field.style.pointerEvents = 'auto';

		field.type = model.type;
		field.placeholder = model.placeHolder;
		field.value = model.content.string;

		field.elm_handler = model.handler;
		field.elm_old_value = field.value;

		function inputUpdate(event)
		{
			var curr = field.elm_old_value;
			var next = field.value;
			if (curr === next)
			{
				return;
			}

			var direction = field.selectionDirection === 'forward' ? 'Forward' : 'Backward';
			var start = field.selectionStart;
			var end = field.selectionEnd;
			field.value = field.elm_old_value;

			Signal.sendMessage(field.elm_handler({
				string: next,
				selection: {
					start: start,
					end: end,
					direction: { ctor: direction }
				}
			}));
		}

		field.addEventListener('input', inputUpdate);
		field.addEventListener('focus', function() {
			field.elm_hasFocus = true;
		});
		field.addEventListener('blur', function() {
			field.elm_hasFocus = false;
		});

		return field;
	}

	function updateField(field, oldModel, newModel)
	{
		if (oldModel.style !== newModel.style)
		{
			updateFieldStyle(field.style, newModel.style);
		}
		field.elm_handler = newModel.handler;

		field.type = newModel.type;
		field.placeholder = newModel.placeHolder;
		var value = newModel.content.string;
		field.value = value;
		field.elm_old_value = value;
		if (field.elm_hasFocus)
		{
			var selection = newModel.content.selection;
			var direction = selection.direction.ctor === 'Forward' ? 'forward' : 'backward';
			setRange(field, selection.start, selection.end, direction);
		}
		return field;
	}

	function mkField(type)
	{
		function field(style, handler, placeHolder, content)
		{
			var padding = style.padding;
			var outline = style.outline.width;
			var adjustWidth = padding.left + padding.right + outline.left + outline.right;
			var adjustHeight = padding.top + padding.bottom + outline.top + outline.bottom;
			return A3(Element.newElement, 200, 30, {
				ctor: 'Custom',
				type: type + 'Field',
				adjustWidth: adjustWidth,
				adjustHeight: adjustHeight,
				render: renderField,
				update: updateField,
				model: {
					handler: handler,
					placeHolder: placeHolder,
					content: content,
					style: style,
					type: type
				}
			});
		}
		return F4(field);
	}

	function hoverable(handler, wrappedElement)
	{
		function onHover(bool)
		{
			Signal.sendMessage(handler(bool));
		}
		var element = wrappedElement._0;
		var newProps = Utils.update(element.props, { hover: onHover });
		return {
			ctor: wrappedElement.ctor,
			_0: {
				props: newProps,
				element: element.element
			}
		};
	}

	function clickable(message, wrappedElement)
	{
		function onClick()
		{
			Signal.sendMessage(message);
		}
		var element = wrappedElement._0;
		var newProps = Utils.update(element.props, { click: onClick });
		return {
			ctor: wrappedElement.ctor,
			_0: {
				props: newProps,
				element: element.element
			}
		};
	}

	return Elm.Native.Graphics.Input.values = {
		button: F2(button),
		customButton: F4(customButton),
		checkbox: F2(checkbox),
		dropDown: F2(dropDown),
		field: mkField('text'),
		email: mkField('email'),
		password: mkField('password'),
		hoverable: F2(hoverable),
		clickable: F2(clickable)
	};
};

Elm.Graphics = Elm.Graphics || {};
Elm.Graphics.Input = Elm.Graphics.Input || {};
Elm.Graphics.Input.Field = Elm.Graphics.Input.Field || {};
Elm.Graphics.Input.Field.make = function (_elm) {
   "use strict";
   _elm.Graphics = _elm.Graphics || {};
   _elm.Graphics.Input = _elm.Graphics.Input || {};
   _elm.Graphics.Input.Field = _elm.Graphics.Input.Field || {};
   if (_elm.Graphics.Input.Field.values) return _elm.Graphics.Input.Field.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Color = Elm.Color.make(_elm),
   $Graphics$Element = Elm.Graphics.Element.make(_elm),
   $Native$Graphics$Input = Elm.Native.Graphics.Input.make(_elm),
   $Signal = Elm.Signal.make(_elm),
   $Text = Elm.Text.make(_elm);
   var _op = {};
   var email = $Native$Graphics$Input.email;
   var password = $Native$Graphics$Input.password;
   var field = $Native$Graphics$Input.field;
   var Backward = {ctor: "Backward"};
   var Forward = {ctor: "Forward"};
   var Selection = F3(function (a,b,c) {    return {start: a,end: b,direction: c};});
   var Content = F2(function (a,b) {    return {string: a,selection: b};});
   var noContent = A2(Content,"",A3(Selection,0,0,Forward));
   var Style = F4(function (a,b,c,d) {    return {padding: a,outline: b,highlight: c,style: d};});
   var Highlight = F2(function (a,b) {    return {color: a,width: b};});
   var noHighlight = A2(Highlight,$Color.blue,0);
   var Outline = F3(function (a,b,c) {    return {color: a,width: b,radius: c};});
   var Dimensions = F4(function (a,b,c,d) {    return {left: a,right: b,top: c,bottom: d};});
   var uniformly = function (n) {    return A4(Dimensions,n,n,n,n);};
   var noOutline = A3(Outline,$Color.grey,uniformly(0),0);
   var defaultStyle = {padding: uniformly(4),outline: A3(Outline,$Color.grey,uniformly(1),2),highlight: A2(Highlight,$Color.blue,1),style: $Text.defaultStyle};
   return _elm.Graphics.Input.Field.values = {_op: _op
                                             ,field: field
                                             ,password: password
                                             ,email: email
                                             ,noContent: noContent
                                             ,defaultStyle: defaultStyle
                                             ,noOutline: noOutline
                                             ,noHighlight: noHighlight
                                             ,uniformly: uniformly
                                             ,Content: Content
                                             ,Selection: Selection
                                             ,Style: Style
                                             ,Outline: Outline
                                             ,Highlight: Highlight
                                             ,Dimensions: Dimensions
                                             ,Forward: Forward
                                             ,Backward: Backward};
};
Elm.Native.Keyboard = {};

Elm.Native.Keyboard.make = function(localRuntime) {
	localRuntime.Native = localRuntime.Native || {};
	localRuntime.Native.Keyboard = localRuntime.Native.Keyboard || {};
	if (localRuntime.Native.Keyboard.values)
	{
		return localRuntime.Native.Keyboard.values;
	}

	var NS = Elm.Native.Signal.make(localRuntime);


	function keyEvent(event)
	{
		return {
			alt: event.altKey,
			meta: event.metaKey,
			keyCode: event.keyCode
		};
	}


	function keyStream(node, eventName, handler)
	{
		var stream = NS.input(eventName, { alt: false, meta: false, keyCode: 0 });

		localRuntime.addListener([stream.id], node, eventName, function(e) {
			localRuntime.notify(stream.id, handler(e));
		});

		return stream;
	}

	var downs = keyStream(document, 'keydown', keyEvent);
	var ups = keyStream(document, 'keyup', keyEvent);
	var presses = keyStream(document, 'keypress', keyEvent);
	var blurs = keyStream(window, 'blur', function() { return null; });


	return localRuntime.Native.Keyboard.values = {
		downs: downs,
		ups: ups,
		blurs: blurs,
		presses: presses
	};
};

Elm.Keyboard = Elm.Keyboard || {};
Elm.Keyboard.make = function (_elm) {
   "use strict";
   _elm.Keyboard = _elm.Keyboard || {};
   if (_elm.Keyboard.values) return _elm.Keyboard.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Char = Elm.Char.make(_elm),
   $Native$Keyboard = Elm.Native.Keyboard.make(_elm),
   $Set = Elm.Set.make(_elm),
   $Signal = Elm.Signal.make(_elm);
   var _op = {};
   var presses = A2($Signal.map,function (_) {    return _.keyCode;},$Native$Keyboard.presses);
   var toXY = F2(function (_p0,keyCodes) {
      var _p1 = _p0;
      var is = function (keyCode) {    return A2($Set.member,keyCode,keyCodes) ? 1 : 0;};
      return {x: is(_p1.right) - is(_p1.left),y: is(_p1.up) - is(_p1.down)};
   });
   var Directions = F4(function (a,b,c,d) {    return {up: a,down: b,left: c,right: d};});
   var dropMap = F2(function (f,signal) {    return $Signal.dropRepeats(A2($Signal.map,f,signal));});
   var EventInfo = F3(function (a,b,c) {    return {alt: a,meta: b,keyCode: c};});
   var Blur = {ctor: "Blur"};
   var Down = function (a) {    return {ctor: "Down",_0: a};};
   var Up = function (a) {    return {ctor: "Up",_0: a};};
   var rawEvents = $Signal.mergeMany(_U.list([A2($Signal.map,Up,$Native$Keyboard.ups)
                                             ,A2($Signal.map,Down,$Native$Keyboard.downs)
                                             ,A2($Signal.map,$Basics.always(Blur),$Native$Keyboard.blurs)]));
   var empty = {alt: false,meta: false,keyCodes: $Set.empty};
   var update = F2(function (event,model) {
      var _p2 = event;
      switch (_p2.ctor)
      {case "Down": var _p3 = _p2._0;
           return {alt: _p3.alt,meta: _p3.meta,keyCodes: A2($Set.insert,_p3.keyCode,model.keyCodes)};
         case "Up": var _p4 = _p2._0;
           return {alt: _p4.alt,meta: _p4.meta,keyCodes: A2($Set.remove,_p4.keyCode,model.keyCodes)};
         default: return empty;}
   });
   var model = A3($Signal.foldp,update,empty,rawEvents);
   var alt = A2(dropMap,function (_) {    return _.alt;},model);
   var meta = A2(dropMap,function (_) {    return _.meta;},model);
   var keysDown = A2(dropMap,function (_) {    return _.keyCodes;},model);
   var arrows = A2(dropMap,toXY({up: 38,down: 40,left: 37,right: 39}),keysDown);
   var wasd = A2(dropMap,toXY({up: 87,down: 83,left: 65,right: 68}),keysDown);
   var isDown = function (keyCode) {    return A2(dropMap,$Set.member(keyCode),keysDown);};
   var ctrl = isDown(17);
   var shift = isDown(16);
   var space = isDown(32);
   var enter = isDown(13);
   var Model = F3(function (a,b,c) {    return {alt: a,meta: b,keyCodes: c};});
   return _elm.Keyboard.values = {_op: _op
                                 ,arrows: arrows
                                 ,wasd: wasd
                                 ,enter: enter
                                 ,space: space
                                 ,ctrl: ctrl
                                 ,shift: shift
                                 ,alt: alt
                                 ,meta: meta
                                 ,isDown: isDown
                                 ,keysDown: keysDown
                                 ,presses: presses};
};
Elm.Native = Elm.Native || {};
Elm.Native.Window = {};
Elm.Native.Window.make = function make(localRuntime) {
	localRuntime.Native = localRuntime.Native || {};
	localRuntime.Native.Window = localRuntime.Native.Window || {};
	if (localRuntime.Native.Window.values)
	{
		return localRuntime.Native.Window.values;
	}

	var NS = Elm.Native.Signal.make(localRuntime);
	var Tuple2 = Elm.Native.Utils.make(localRuntime).Tuple2;


	function getWidth()
	{
		return localRuntime.node.clientWidth;
	}


	function getHeight()
	{
		if (localRuntime.isFullscreen())
		{
			return window.innerHeight;
		}
		return localRuntime.node.clientHeight;
	}


	var dimensions = NS.input('Window.dimensions', Tuple2(getWidth(), getHeight()));


	function resizeIfNeeded()
	{
		// Do not trigger event if the dimensions have not changed.
		// This should be most of the time.
		var w = getWidth();
		var h = getHeight();
		if (dimensions.value._0 === w && dimensions.value._1 === h)
		{
			return;
		}

		setTimeout(function() {
			// Check again to see if the dimensions have changed.
			// It is conceivable that the dimensions have changed
			// again while some other event was being processed.
			w = getWidth();
			h = getHeight();
			if (dimensions.value._0 === w && dimensions.value._1 === h)
			{
				return;
			}
			localRuntime.notify(dimensions.id, Tuple2(w, h));
		}, 0);
	}


	localRuntime.addListener([dimensions.id], window, 'resize', resizeIfNeeded);


	return localRuntime.Native.Window.values = {
		dimensions: dimensions,
		resizeIfNeeded: resizeIfNeeded
	};
};

Elm.Window = Elm.Window || {};
Elm.Window.make = function (_elm) {
   "use strict";
   _elm.Window = _elm.Window || {};
   if (_elm.Window.values) return _elm.Window.values;
   var _U = Elm.Native.Utils.make(_elm),$Basics = Elm.Basics.make(_elm),$Native$Window = Elm.Native.Window.make(_elm),$Signal = Elm.Signal.make(_elm);
   var _op = {};
   var dimensions = $Native$Window.dimensions;
   var width = A2($Signal.map,$Basics.fst,dimensions);
   var height = A2($Signal.map,$Basics.snd,dimensions);
   return _elm.Window.values = {_op: _op,dimensions: dimensions,width: width,height: height};
};
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"min-document":1}],3:[function(require,module,exports){
"use strict";

module.exports = function isObject(x) {
	return typeof x === "object" && x !== null;
};

},{}],4:[function(require,module,exports){
var nativeIsArray = Array.isArray
var toString = Object.prototype.toString

module.exports = nativeIsArray || isArray

function isArray(obj) {
    return toString.call(obj) === "[object Array]"
}

},{}],5:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook.js")

module.exports = applyProperties

function applyProperties(node, props, previous) {
    for (var propName in props) {
        var propValue = props[propName]

        if (propValue === undefined) {
            removeProperty(node, propName, propValue, previous);
        } else if (isHook(propValue)) {
            removeProperty(node, propName, propValue, previous)
            if (propValue.hook) {
                propValue.hook(node,
                    propName,
                    previous ? previous[propName] : undefined)
            }
        } else {
            if (isObject(propValue)) {
                patchObject(node, props, previous, propName, propValue);
            } else {
                node[propName] = propValue
            }
        }
    }
}

function removeProperty(node, propName, propValue, previous) {
    if (previous) {
        var previousValue = previous[propName]

        if (!isHook(previousValue)) {
            if (propName === "attributes") {
                for (var attrName in previousValue) {
                    node.removeAttribute(attrName)
                }
            } else if (propName === "style") {
                for (var i in previousValue) {
                    node.style[i] = ""
                }
            } else if (typeof previousValue === "string") {
                node[propName] = ""
            } else {
                node[propName] = null
            }
        } else if (previousValue.unhook) {
            previousValue.unhook(node, propName, propValue)
        }
    }
}

function patchObject(node, props, previous, propName, propValue) {
    var previousValue = previous ? previous[propName] : undefined

    // Set attributes
    if (propName === "attributes") {
        for (var attrName in propValue) {
            var attrValue = propValue[attrName]

            if (attrValue === undefined) {
                node.removeAttribute(attrName)
            } else {
                node.setAttribute(attrName, attrValue)
            }
        }

        return
    }

    if(previousValue && isObject(previousValue) &&
        getPrototype(previousValue) !== getPrototype(propValue)) {
        node[propName] = propValue
        return
    }

    if (!isObject(node[propName])) {
        node[propName] = {}
    }

    var replacer = propName === "style" ? "" : undefined

    for (var k in propValue) {
        var value = propValue[k]
        node[propName][k] = (value === undefined) ? replacer : value
    }
}

function getPrototype(value) {
    if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value)
    } else if (value.__proto__) {
        return value.__proto__
    } else if (value.constructor) {
        return value.constructor.prototype
    }
}

},{"../vnode/is-vhook.js":13,"is-object":3}],6:[function(require,module,exports){
var document = require("global/document")

var applyProperties = require("./apply-properties")

var isVNode = require("../vnode/is-vnode.js")
var isVText = require("../vnode/is-vtext.js")
var isWidget = require("../vnode/is-widget.js")
var handleThunk = require("../vnode/handle-thunk.js")

module.exports = createElement

function createElement(vnode, opts) {
    var doc = opts ? opts.document || document : document
    var warn = opts ? opts.warn : null

    vnode = handleThunk(vnode).a

    if (isWidget(vnode)) {
        return vnode.init()
    } else if (isVText(vnode)) {
        return doc.createTextNode(vnode.text)
    } else if (!isVNode(vnode)) {
        if (warn) {
            warn("Item is not a valid virtual dom node", vnode)
        }
        return null
    }

    var node = (vnode.namespace === null) ?
        doc.createElement(vnode.tagName) :
        doc.createElementNS(vnode.namespace, vnode.tagName)

    var props = vnode.properties
    applyProperties(node, props)

    var children = vnode.children

    for (var i = 0; i < children.length; i++) {
        var childNode = createElement(children[i], opts)
        if (childNode) {
            node.appendChild(childNode)
        }
    }

    return node
}

},{"../vnode/handle-thunk.js":11,"../vnode/is-vnode.js":14,"../vnode/is-vtext.js":15,"../vnode/is-widget.js":16,"./apply-properties":5,"global/document":2}],7:[function(require,module,exports){
// Maps a virtual DOM tree onto a real DOM tree in an efficient manner.
// We don't want to read all of the DOM nodes in the tree so we use
// the in-order tree indexing to eliminate recursion down certain branches.
// We only recurse into a DOM node if we know that it contains a child of
// interest.

var noChild = {}

module.exports = domIndex

function domIndex(rootNode, tree, indices, nodes) {
    if (!indices || indices.length === 0) {
        return {}
    } else {
        indices.sort(ascending)
        return recurse(rootNode, tree, indices, nodes, 0)
    }
}

function recurse(rootNode, tree, indices, nodes, rootIndex) {
    nodes = nodes || {}


    if (rootNode) {
        if (indexInRange(indices, rootIndex, rootIndex)) {
            nodes[rootIndex] = rootNode
        }

        var vChildren = tree.children

        if (vChildren) {

            var childNodes = rootNode.childNodes

            for (var i = 0; i < tree.children.length; i++) {
                rootIndex += 1

                var vChild = vChildren[i] || noChild
                var nextIndex = rootIndex + (vChild.count || 0)

                // skip recursion down the tree if there are no nodes down here
                if (indexInRange(indices, rootIndex, nextIndex)) {
                    recurse(childNodes[i], vChild, indices, nodes, rootIndex)
                }

                rootIndex = nextIndex
            }
        }
    }

    return nodes
}

// Binary search for an index in the interval [left, right]
function indexInRange(indices, left, right) {
    if (indices.length === 0) {
        return false
    }

    var minIndex = 0
    var maxIndex = indices.length - 1
    var currentIndex
    var currentItem

    while (minIndex <= maxIndex) {
        currentIndex = ((maxIndex + minIndex) / 2) >> 0
        currentItem = indices[currentIndex]

        if (minIndex === maxIndex) {
            return currentItem >= left && currentItem <= right
        } else if (currentItem < left) {
            minIndex = currentIndex + 1
        } else  if (currentItem > right) {
            maxIndex = currentIndex - 1
        } else {
            return true
        }
    }

    return false;
}

function ascending(a, b) {
    return a > b ? 1 : -1
}

},{}],8:[function(require,module,exports){
var applyProperties = require("./apply-properties")

var isWidget = require("../vnode/is-widget.js")
var VPatch = require("../vnode/vpatch.js")

var render = require("./create-element")
var updateWidget = require("./update-widget")

module.exports = applyPatch

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
        case VPatch.REMOVE:
            return removeNode(domNode, vNode)
        case VPatch.INSERT:
            return insertNode(domNode, patch, renderOptions)
        case VPatch.VTEXT:
            return stringPatch(domNode, vNode, patch, renderOptions)
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case VPatch.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
            reorderChildren(domNode, patch)
            return domNode
        case VPatch.PROPS:
            applyProperties(domNode, patch, vNode.properties)
            return domNode
        case VPatch.THUNK:
            return replaceRoot(domNode,
                renderOptions.patch(domNode, patch, renderOptions))
        default:
            return domNode
    }
}

function removeNode(domNode, vNode) {
    var parentNode = domNode.parentNode

    if (parentNode) {
        parentNode.removeChild(domNode)
    }

    destroyWidget(domNode, vNode);

    return null
}

function insertNode(parentNode, vNode, renderOptions) {
    var newNode = render(vNode, renderOptions)

    if (parentNode) {
        parentNode.appendChild(newNode)
    }

    return parentNode
}

function stringPatch(domNode, leftVNode, vText, renderOptions) {
    var newNode

    if (domNode.nodeType === 3) {
        domNode.replaceData(0, domNode.length, vText.text)
        newNode = domNode
    } else {
        var parentNode = domNode.parentNode
        newNode = render(vText, renderOptions)

        if (parentNode && newNode !== domNode) {
            parentNode.replaceChild(newNode, domNode)
        }
    }

    return newNode
}

function widgetPatch(domNode, leftVNode, widget, renderOptions) {
    var updating = updateWidget(leftVNode, widget)
    var newNode

    if (updating) {
        newNode = widget.update(leftVNode, domNode) || domNode
    } else {
        newNode = render(widget, renderOptions)
    }

    var parentNode = domNode.parentNode

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    if (!updating) {
        destroyWidget(domNode, leftVNode)
    }

    return newNode
}

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
    var parentNode = domNode.parentNode
    var newNode = render(vNode, renderOptions)

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    return newNode
}

function destroyWidget(domNode, w) {
    if (typeof w.destroy === "function" && isWidget(w)) {
        w.destroy(domNode)
    }
}

function reorderChildren(domNode, moves) {
    var childNodes = domNode.childNodes
    var keyMap = {}
    var node
    var remove
    var insert

    for (var i = 0; i < moves.removes.length; i++) {
        remove = moves.removes[i]
        node = childNodes[remove.from]
        if (remove.key) {
            keyMap[remove.key] = node
        }
        domNode.removeChild(node)
    }

    var length = childNodes.length
    for (var j = 0; j < moves.inserts.length; j++) {
        insert = moves.inserts[j]
        node = keyMap[insert.key]
        // this is the weirdest bug i've ever seen in webkit
        domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to])
    }
}

function replaceRoot(oldRoot, newRoot) {
    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
        oldRoot.parentNode.replaceChild(newRoot, oldRoot)
    }

    return newRoot;
}

},{"../vnode/is-widget.js":16,"../vnode/vpatch.js":19,"./apply-properties":5,"./create-element":6,"./update-widget":10}],9:[function(require,module,exports){
var document = require("global/document")
var isArray = require("x-is-array")

var domIndex = require("./dom-index")
var patchOp = require("./patch-op")
module.exports = patch

function patch(rootNode, patches) {
    return patchRecursive(rootNode, patches)
}

function patchRecursive(rootNode, patches, renderOptions) {
    var indices = patchIndices(patches)

    if (indices.length === 0) {
        return rootNode
    }

    var index = domIndex(rootNode, patches.a, indices)
    var ownerDocument = rootNode.ownerDocument

    if (!renderOptions) {
        renderOptions = { patch: patchRecursive }
        if (ownerDocument !== document) {
            renderOptions.document = ownerDocument
        }
    }

    for (var i = 0; i < indices.length; i++) {
        var nodeIndex = indices[i]
        rootNode = applyPatch(rootNode,
            index[nodeIndex],
            patches[nodeIndex],
            renderOptions)
    }

    return rootNode
}

function applyPatch(rootNode, domNode, patchList, renderOptions) {
    if (!domNode) {
        return rootNode
    }

    var newNode

    if (isArray(patchList)) {
        for (var i = 0; i < patchList.length; i++) {
            newNode = patchOp(patchList[i], domNode, renderOptions)

            if (domNode === rootNode) {
                rootNode = newNode
            }
        }
    } else {
        newNode = patchOp(patchList, domNode, renderOptions)

        if (domNode === rootNode) {
            rootNode = newNode
        }
    }

    return rootNode
}

function patchIndices(patches) {
    var indices = []

    for (var key in patches) {
        if (key !== "a") {
            indices.push(Number(key))
        }
    }

    return indices
}

},{"./dom-index":7,"./patch-op":8,"global/document":2,"x-is-array":4}],10:[function(require,module,exports){
var isWidget = require("../vnode/is-widget.js")

module.exports = updateWidget

function updateWidget(a, b) {
    if (isWidget(a) && isWidget(b)) {
        if ("name" in a && "name" in b) {
            return a.id === b.id
        } else {
            return a.init === b.init
        }
    }

    return false
}

},{"../vnode/is-widget.js":16}],11:[function(require,module,exports){
var isVNode = require("./is-vnode")
var isVText = require("./is-vtext")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")

module.exports = handleThunk

function handleThunk(a, b) {
    var renderedA = a
    var renderedB = b

    if (isThunk(b)) {
        renderedB = renderThunk(b, a)
    }

    if (isThunk(a)) {
        renderedA = renderThunk(a, null)
    }

    return {
        a: renderedA,
        b: renderedB
    }
}

function renderThunk(thunk, previous) {
    var renderedThunk = thunk.vnode

    if (!renderedThunk) {
        renderedThunk = thunk.vnode = thunk.render(previous)
    }

    if (!(isVNode(renderedThunk) ||
            isVText(renderedThunk) ||
            isWidget(renderedThunk))) {
        throw new Error("thunk did not return a valid node");
    }

    return renderedThunk
}

},{"./is-thunk":12,"./is-vnode":14,"./is-vtext":15,"./is-widget":16}],12:[function(require,module,exports){
module.exports = isThunk

function isThunk(t) {
    return t && t.type === "Thunk"
}

},{}],13:[function(require,module,exports){
module.exports = isHook

function isHook(hook) {
    return hook &&
      (typeof hook.hook === "function" && !hook.hasOwnProperty("hook") ||
       typeof hook.unhook === "function" && !hook.hasOwnProperty("unhook"))
}

},{}],14:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualNode

function isVirtualNode(x) {
    return x && x.type === "VirtualNode" && x.version === version
}

},{"./version":17}],15:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualText

function isVirtualText(x) {
    return x && x.type === "VirtualText" && x.version === version
}

},{"./version":17}],16:[function(require,module,exports){
module.exports = isWidget

function isWidget(w) {
    return w && w.type === "Widget"
}

},{}],17:[function(require,module,exports){
module.exports = "2"

},{}],18:[function(require,module,exports){
var version = require("./version")
var isVNode = require("./is-vnode")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")
var isVHook = require("./is-vhook")

module.exports = VirtualNode

var noProperties = {}
var noChildren = []

function VirtualNode(tagName, properties, children, key, namespace) {
    this.tagName = tagName
    this.properties = properties || noProperties
    this.children = children || noChildren
    this.key = key != null ? String(key) : undefined
    this.namespace = (typeof namespace === "string") ? namespace : null

    var count = (children && children.length) || 0
    var descendants = 0
    var hasWidgets = false
    var hasThunks = false
    var descendantHooks = false
    var hooks

    for (var propName in properties) {
        if (properties.hasOwnProperty(propName)) {
            var property = properties[propName]
            if (isVHook(property) && property.unhook) {
                if (!hooks) {
                    hooks = {}
                }

                hooks[propName] = property
            }
        }
    }

    for (var i = 0; i < count; i++) {
        var child = children[i]
        if (isVNode(child)) {
            descendants += child.count || 0

            if (!hasWidgets && child.hasWidgets) {
                hasWidgets = true
            }

            if (!hasThunks && child.hasThunks) {
                hasThunks = true
            }

            if (!descendantHooks && (child.hooks || child.descendantHooks)) {
                descendantHooks = true
            }
        } else if (!hasWidgets && isWidget(child)) {
            if (typeof child.destroy === "function") {
                hasWidgets = true
            }
        } else if (!hasThunks && isThunk(child)) {
            hasThunks = true;
        }
    }

    this.count = count + descendants
    this.hasWidgets = hasWidgets
    this.hasThunks = hasThunks
    this.hooks = hooks
    this.descendantHooks = descendantHooks
}

VirtualNode.prototype.version = version
VirtualNode.prototype.type = "VirtualNode"

},{"./is-thunk":12,"./is-vhook":13,"./is-vnode":14,"./is-widget":16,"./version":17}],19:[function(require,module,exports){
var version = require("./version")

VirtualPatch.NONE = 0
VirtualPatch.VTEXT = 1
VirtualPatch.VNODE = 2
VirtualPatch.WIDGET = 3
VirtualPatch.PROPS = 4
VirtualPatch.ORDER = 5
VirtualPatch.INSERT = 6
VirtualPatch.REMOVE = 7
VirtualPatch.THUNK = 8

module.exports = VirtualPatch

function VirtualPatch(type, vNode, patch) {
    this.type = Number(type)
    this.vNode = vNode
    this.patch = patch
}

VirtualPatch.prototype.version = version
VirtualPatch.prototype.type = "VirtualPatch"

},{"./version":17}],20:[function(require,module,exports){
var version = require("./version")

module.exports = VirtualText

function VirtualText(text) {
    this.text = String(text)
}

VirtualText.prototype.version = version
VirtualText.prototype.type = "VirtualText"

},{"./version":17}],21:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook")

module.exports = diffProps

function diffProps(a, b) {
    var diff

    for (var aKey in a) {
        if (!(aKey in b)) {
            diff = diff || {}
            diff[aKey] = undefined
        }

        var aValue = a[aKey]
        var bValue = b[aKey]

        if (aValue === bValue) {
            continue
        } else if (isObject(aValue) && isObject(bValue)) {
            if (getPrototype(bValue) !== getPrototype(aValue)) {
                diff = diff || {}
                diff[aKey] = bValue
            } else if (isHook(bValue)) {
                 diff = diff || {}
                 diff[aKey] = bValue
            } else {
                var objectDiff = diffProps(aValue, bValue)
                if (objectDiff) {
                    diff = diff || {}
                    diff[aKey] = objectDiff
                }
            }
        } else {
            diff = diff || {}
            diff[aKey] = bValue
        }
    }

    for (var bKey in b) {
        if (!(bKey in a)) {
            diff = diff || {}
            diff[bKey] = b[bKey]
        }
    }

    return diff
}

function getPrototype(value) {
  if (Object.getPrototypeOf) {
    return Object.getPrototypeOf(value)
  } else if (value.__proto__) {
    return value.__proto__
  } else if (value.constructor) {
    return value.constructor.prototype
  }
}

},{"../vnode/is-vhook":13,"is-object":3}],22:[function(require,module,exports){
var isArray = require("x-is-array")

var VPatch = require("../vnode/vpatch")
var isVNode = require("../vnode/is-vnode")
var isVText = require("../vnode/is-vtext")
var isWidget = require("../vnode/is-widget")
var isThunk = require("../vnode/is-thunk")
var handleThunk = require("../vnode/handle-thunk")

var diffProps = require("./diff-props")

module.exports = diff

function diff(a, b) {
    var patch = { a: a }
    walk(a, b, patch, 0)
    return patch
}

function walk(a, b, patch, index) {
    if (a === b) {
        return
    }

    var apply = patch[index]
    var applyClear = false

    if (isThunk(a) || isThunk(b)) {
        thunks(a, b, patch, index)
    } else if (b == null) {

        // If a is a widget we will add a remove patch for it
        // Otherwise any child widgets/hooks must be destroyed.
        // This prevents adding two remove patches for a widget.
        if (!isWidget(a)) {
            clearState(a, patch, index)
            apply = patch[index]
        }

        apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b))
    } else if (isVNode(b)) {
        if (isVNode(a)) {
            if (a.tagName === b.tagName &&
                a.namespace === b.namespace &&
                a.key === b.key) {
                var propsPatch = diffProps(a.properties, b.properties)
                if (propsPatch) {
                    apply = appendPatch(apply,
                        new VPatch(VPatch.PROPS, a, propsPatch))
                }
                apply = diffChildren(a, b, patch, apply, index)
            } else {
                apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
                applyClear = true
            }
        } else {
            apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
            applyClear = true
        }
    } else if (isVText(b)) {
        if (!isVText(a)) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
            applyClear = true
        } else if (a.text !== b.text) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
        }
    } else if (isWidget(b)) {
        if (!isWidget(a)) {
            applyClear = true
        }

        apply = appendPatch(apply, new VPatch(VPatch.WIDGET, a, b))
    }

    if (apply) {
        patch[index] = apply
    }

    if (applyClear) {
        clearState(a, patch, index)
    }
}

function diffChildren(a, b, patch, apply, index) {
    var aChildren = a.children
    var orderedSet = reorder(aChildren, b.children)
    var bChildren = orderedSet.children

    var aLen = aChildren.length
    var bLen = bChildren.length
    var len = aLen > bLen ? aLen : bLen

    for (var i = 0; i < len; i++) {
        var leftNode = aChildren[i]
        var rightNode = bChildren[i]
        index += 1

        if (!leftNode) {
            if (rightNode) {
                // Excess nodes in b need to be added
                apply = appendPatch(apply,
                    new VPatch(VPatch.INSERT, null, rightNode))
            }
        } else {
            walk(leftNode, rightNode, patch, index)
        }

        if (isVNode(leftNode) && leftNode.count) {
            index += leftNode.count
        }
    }

    if (orderedSet.moves) {
        // Reorder nodes last
        apply = appendPatch(apply, new VPatch(
            VPatch.ORDER,
            a,
            orderedSet.moves
        ))
    }

    return apply
}

function clearState(vNode, patch, index) {
    // TODO: Make this a single walk, not two
    unhook(vNode, patch, index)
    destroyWidgets(vNode, patch, index)
}

// Patch records for all destroyed widgets must be added because we need
// a DOM node reference for the destroy function
function destroyWidgets(vNode, patch, index) {
    if (isWidget(vNode)) {
        if (typeof vNode.destroy === "function") {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(VPatch.REMOVE, vNode, null)
            )
        }
    } else if (isVNode(vNode) && (vNode.hasWidgets || vNode.hasThunks)) {
        var children = vNode.children
        var len = children.length
        for (var i = 0; i < len; i++) {
            var child = children[i]
            index += 1

            destroyWidgets(child, patch, index)

            if (isVNode(child) && child.count) {
                index += child.count
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

// Create a sub-patch for thunks
function thunks(a, b, patch, index) {
    var nodes = handleThunk(a, b)
    var thunkPatch = diff(nodes.a, nodes.b)
    if (hasPatches(thunkPatch)) {
        patch[index] = new VPatch(VPatch.THUNK, null, thunkPatch)
    }
}

function hasPatches(patch) {
    for (var index in patch) {
        if (index !== "a") {
            return true
        }
    }

    return false
}

// Execute hooks when two nodes are identical
function unhook(vNode, patch, index) {
    if (isVNode(vNode)) {
        if (vNode.hooks) {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(
                    VPatch.PROPS,
                    vNode,
                    undefinedKeys(vNode.hooks)
                )
            )
        }

        if (vNode.descendantHooks || vNode.hasThunks) {
            var children = vNode.children
            var len = children.length
            for (var i = 0; i < len; i++) {
                var child = children[i]
                index += 1

                unhook(child, patch, index)

                if (isVNode(child) && child.count) {
                    index += child.count
                }
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

function undefinedKeys(obj) {
    var result = {}

    for (var key in obj) {
        result[key] = undefined
    }

    return result
}

// List diff, naive left to right reordering
function reorder(aChildren, bChildren) {
    // O(M) time, O(M) memory
    var bChildIndex = keyIndex(bChildren)
    var bKeys = bChildIndex.keys
    var bFree = bChildIndex.free

    if (bFree.length === bChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(N) time, O(N) memory
    var aChildIndex = keyIndex(aChildren)
    var aKeys = aChildIndex.keys
    var aFree = aChildIndex.free

    if (aFree.length === aChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(MAX(N, M)) memory
    var newChildren = []

    var freeIndex = 0
    var freeCount = bFree.length
    var deletedItems = 0

    // Iterate through a and match a node in b
    // O(N) time,
    for (var i = 0 ; i < aChildren.length; i++) {
        var aItem = aChildren[i]
        var itemIndex

        if (aItem.key) {
            if (bKeys.hasOwnProperty(aItem.key)) {
                // Match up the old keys
                itemIndex = bKeys[aItem.key]
                newChildren.push(bChildren[itemIndex])

            } else {
                // Remove old keyed items
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        } else {
            // Match the item in a with the next free item in b
            if (freeIndex < freeCount) {
                itemIndex = bFree[freeIndex++]
                newChildren.push(bChildren[itemIndex])
            } else {
                // There are no free items in b to match with
                // the free items in a, so the extra free nodes
                // are deleted.
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        }
    }

    var lastFreeIndex = freeIndex >= bFree.length ?
        bChildren.length :
        bFree[freeIndex]

    // Iterate through b and append any new keys
    // O(M) time
    for (var j = 0; j < bChildren.length; j++) {
        var newItem = bChildren[j]

        if (newItem.key) {
            if (!aKeys.hasOwnProperty(newItem.key)) {
                // Add any new keyed items
                // We are adding new items to the end and then sorting them
                // in place. In future we should insert new items in place.
                newChildren.push(newItem)
            }
        } else if (j >= lastFreeIndex) {
            // Add any leftover non-keyed items
            newChildren.push(newItem)
        }
    }

    var simulate = newChildren.slice()
    var simulateIndex = 0
    var removes = []
    var inserts = []
    var simulateItem

    for (var k = 0; k < bChildren.length;) {
        var wantedItem = bChildren[k]
        simulateItem = simulate[simulateIndex]

        // remove items
        while (simulateItem === null && simulate.length) {
            removes.push(remove(simulate, simulateIndex, null))
            simulateItem = simulate[simulateIndex]
        }

        if (!simulateItem || simulateItem.key !== wantedItem.key) {
            // if we need a key in this position...
            if (wantedItem.key) {
                if (simulateItem && simulateItem.key) {
                    // if an insert doesn't put this key in place, it needs to move
                    if (bKeys[simulateItem.key] !== k + 1) {
                        removes.push(remove(simulate, simulateIndex, simulateItem.key))
                        simulateItem = simulate[simulateIndex]
                        // if the remove didn't put the wanted item in place, we need to insert it
                        if (!simulateItem || simulateItem.key !== wantedItem.key) {
                            inserts.push({key: wantedItem.key, to: k})
                        }
                        // items are matching, so skip ahead
                        else {
                            simulateIndex++
                        }
                    }
                    else {
                        inserts.push({key: wantedItem.key, to: k})
                    }
                }
                else {
                    inserts.push({key: wantedItem.key, to: k})
                }
                k++
            }
            // a key in simulate has no matching wanted key, remove it
            else if (simulateItem && simulateItem.key) {
                removes.push(remove(simulate, simulateIndex, simulateItem.key))
            }
        }
        else {
            simulateIndex++
            k++
        }
    }

    // remove all the remaining nodes from simulate
    while(simulateIndex < simulate.length) {
        simulateItem = simulate[simulateIndex]
        removes.push(remove(simulate, simulateIndex, simulateItem && simulateItem.key))
    }

    // If the only moves we have are deletes then we can just
    // let the delete patch remove these items.
    if (removes.length === deletedItems && !inserts.length) {
        return {
            children: newChildren,
            moves: null
        }
    }

    return {
        children: newChildren,
        moves: {
            removes: removes,
            inserts: inserts
        }
    }
}

function remove(arr, index, key) {
    arr.splice(index, 1)

    return {
        from: index,
        key: key
    }
}

function keyIndex(children) {
    var keys = {}
    var free = []
    var length = children.length

    for (var i = 0; i < length; i++) {
        var child = children[i]

        if (child.key) {
            keys[child.key] = i
        } else {
            free.push(i)
        }
    }

    return {
        keys: keys,     // A hash of key name to index
        free: free,     // An array of unkeyed item indices
    }
}

function appendPatch(apply, patch) {
    if (apply) {
        if (isArray(apply)) {
            apply.push(patch)
        } else {
            apply = [apply, patch]
        }

        return apply
    } else {
        return patch
    }
}

},{"../vnode/handle-thunk":11,"../vnode/is-thunk":12,"../vnode/is-vnode":14,"../vnode/is-vtext":15,"../vnode/is-widget":16,"../vnode/vpatch":19,"./diff-props":21,"x-is-array":4}],23:[function(require,module,exports){
var VNode = require('virtual-dom/vnode/vnode');
var VText = require('virtual-dom/vnode/vtext');
var diff = require('virtual-dom/vtree/diff');
var patch = require('virtual-dom/vdom/patch');
var createElement = require('virtual-dom/vdom/create-element');
var isHook = require("virtual-dom/vnode/is-vhook");


Elm.Native.VirtualDom = {};
Elm.Native.VirtualDom.make = function(elm)
{
	elm.Native = elm.Native || {};
	elm.Native.VirtualDom = elm.Native.VirtualDom || {};
	if (elm.Native.VirtualDom.values)
	{
		return elm.Native.VirtualDom.values;
	}

	var Element = Elm.Native.Graphics.Element.make(elm);
	var Json = Elm.Native.Json.make(elm);
	var List = Elm.Native.List.make(elm);
	var Signal = Elm.Native.Signal.make(elm);
	var Utils = Elm.Native.Utils.make(elm);

	var ATTRIBUTE_KEY = 'UniqueNameThatOthersAreVeryUnlikelyToUse';



	// VIRTUAL DOM NODES


	function text(string)
	{
		return new VText(string);
	}

	function node(name)
	{
		return F2(function(propertyList, contents) {
			return makeNode(name, propertyList, contents);
		});
	}


	// BUILD VIRTUAL DOME NODES


	function makeNode(name, propertyList, contents)
	{
		var props = listToProperties(propertyList);

		var key, namespace;
		// support keys
		if (props.key !== undefined)
		{
			key = props.key;
			props.key = undefined;
		}

		// support namespace
		if (props.namespace !== undefined)
		{
			namespace = props.namespace;
			props.namespace = undefined;
		}

		// ensure that setting text of an input does not move the cursor
		var useSoftSet =
			(name === 'input' || name === 'textarea')
			&& props.value !== undefined
			&& !isHook(props.value);

		if (useSoftSet)
		{
			props.value = SoftSetHook(props.value);
		}

		return new VNode(name, props, List.toArray(contents), key, namespace);
	}

	function listToProperties(list)
	{
		var object = {};
		while (list.ctor !== '[]')
		{
			var entry = list._0;
			if (entry.key === ATTRIBUTE_KEY)
			{
				object.attributes = object.attributes || {};
				object.attributes[entry.value.attrKey] = entry.value.attrValue;
			}
			else
			{
				object[entry.key] = entry.value;
			}
			list = list._1;
		}
		return object;
	}



	// PROPERTIES AND ATTRIBUTES


	function property(key, value)
	{
		return {
			key: key,
			value: value
		};
	}

	function attribute(key, value)
	{
		return {
			key: ATTRIBUTE_KEY,
			value: {
				attrKey: key,
				attrValue: value
			}
		};
	}



	// NAMESPACED ATTRIBUTES


	function attributeNS(namespace, key, value)
	{
		return {
			key: key,
			value: new AttributeHook(namespace, key, value)
		};
	}

	function AttributeHook(namespace, key, value)
	{
		if (!(this instanceof AttributeHook))
		{
			return new AttributeHook(namespace, key, value);
		}

		this.namespace = namespace;
		this.key = key;
		this.value = value;
	}

	AttributeHook.prototype.hook = function (node, prop, prev)
	{
		if (prev
			&& prev.type === 'AttributeHook'
			&& prev.value === this.value
			&& prev.namespace === this.namespace)
		{
			return;
		}

		node.setAttributeNS(this.namespace, prop, this.value);
	};

	AttributeHook.prototype.unhook = function (node, prop, next)
	{
		if (next
			&& next.type === 'AttributeHook'
			&& next.namespace === this.namespace)
		{
			return;
		}

		node.removeAttributeNS(this.namespace, this.key);
	};

	AttributeHook.prototype.type = 'AttributeHook';



	// EVENTS


	function on(name, options, decoder, createMessage)
	{
		function eventHandler(event)
		{
			var value = A2(Json.runDecoderValue, decoder, event);
			if (value.ctor === 'Ok')
			{
				if (options.stopPropagation)
				{
					event.stopPropagation();
				}
				if (options.preventDefault)
				{
					event.preventDefault();
				}
				Signal.sendMessage(createMessage(value._0));
			}
		}
		return property('on' + name, eventHandler);
	}

	function SoftSetHook(value)
	{
		if (!(this instanceof SoftSetHook))
		{
			return new SoftSetHook(value);
		}

		this.value = value;
	}

	SoftSetHook.prototype.hook = function (node, propertyName)
	{
		if (node[propertyName] !== this.value)
		{
			node[propertyName] = this.value;
		}
	};



	// INTEGRATION WITH ELEMENTS


	function ElementWidget(element)
	{
		this.element = element;
	}

	ElementWidget.prototype.type = "Widget";

	ElementWidget.prototype.init = function init()
	{
		return Element.render(this.element);
	};

	ElementWidget.prototype.update = function update(previous, node)
	{
		return Element.update(node, previous.element, this.element);
	};

	function fromElement(element)
	{
		return new ElementWidget(element);
	}

	function toElement(width, height, html)
	{
		return A3(Element.newElement, width, height, {
			ctor: 'Custom',
			type: 'evancz/elm-html',
			render: render,
			update: update,
			model: html
		});
	}



	// RENDER AND UPDATE


	function render(model)
	{
		var element = Element.createNode('div');
		element.appendChild(createElement(model));
		return element;
	}

	function update(node, oldModel, newModel)
	{
		updateAndReplace(node.firstChild, oldModel, newModel);
		return node;
	}

	function updateAndReplace(node, oldModel, newModel)
	{
		var patches = diff(oldModel, newModel);
		var newNode = patch(node, patches);
		return newNode;
	}



	// LAZINESS


	function lazyRef(fn, a)
	{
		function thunk()
		{
			return fn(a);
		}
		return new Thunk(fn, [a], thunk);
	}

	function lazyRef2(fn, a, b)
	{
		function thunk()
		{
			return A2(fn, a, b);
		}
		return new Thunk(fn, [a,b], thunk);
	}

	function lazyRef3(fn, a, b, c)
	{
		function thunk()
		{
			return A3(fn, a, b, c);
		}
		return new Thunk(fn, [a,b,c], thunk);
	}

	function Thunk(fn, args, thunk)
	{
		/* public (used by VirtualDom.js) */
		this.vnode = null;
		this.key = undefined;

		/* private */
		this.fn = fn;
		this.args = args;
		this.thunk = thunk;
	}

	Thunk.prototype.type = "Thunk";
	Thunk.prototype.render = renderThunk;

	function shouldUpdate(current, previous)
	{
		if (current.fn !== previous.fn)
		{
			return true;
		}

		// if it's the same function, we know the number of args must match
		var cargs = current.args;
		var pargs = previous.args;

		for (var i = cargs.length; i--; )
		{
			if (cargs[i] !== pargs[i])
			{
				return true;
			}
		}

		return false;
	}

	function renderThunk(previous)
	{
		if (previous == null || shouldUpdate(this, previous))
		{
			return this.thunk();
		}
		else
		{
			return previous.vnode;
		}
	}


	return elm.Native.VirtualDom.values = Elm.Native.VirtualDom.values = {
		node: node,
		text: text,
		on: F4(on),

		property: F2(property),
		attribute: F2(attribute),
		attributeNS: F3(attributeNS),

		lazy: F2(lazyRef),
		lazy2: F3(lazyRef2),
		lazy3: F4(lazyRef3),

		toElement: F3(toElement),
		fromElement: fromElement,

		render: createElement,
		updateAndReplace: updateAndReplace
	};
};

},{"virtual-dom/vdom/create-element":6,"virtual-dom/vdom/patch":9,"virtual-dom/vnode/is-vhook":13,"virtual-dom/vnode/vnode":18,"virtual-dom/vnode/vtext":20,"virtual-dom/vtree/diff":22}]},{},[23]);

Elm.VirtualDom = Elm.VirtualDom || {};
Elm.VirtualDom.make = function (_elm) {
   "use strict";
   _elm.VirtualDom = _elm.VirtualDom || {};
   if (_elm.VirtualDom.values) return _elm.VirtualDom.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $Graphics$Element = Elm.Graphics.Element.make(_elm),
   $Json$Decode = Elm.Json.Decode.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Native$VirtualDom = Elm.Native.VirtualDom.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm);
   var _op = {};
   var lazy3 = $Native$VirtualDom.lazy3;
   var lazy2 = $Native$VirtualDom.lazy2;
   var lazy = $Native$VirtualDom.lazy;
   var defaultOptions = {stopPropagation: false,preventDefault: false};
   var Options = F2(function (a,b) {    return {stopPropagation: a,preventDefault: b};});
   var onWithOptions = $Native$VirtualDom.on;
   var on = F3(function (eventName,decoder,toMessage) {    return A4($Native$VirtualDom.on,eventName,defaultOptions,decoder,toMessage);});
   var attributeNS = $Native$VirtualDom.attributeNS;
   var attribute = $Native$VirtualDom.attribute;
   var property = $Native$VirtualDom.property;
   var Property = {ctor: "Property"};
   var fromElement = $Native$VirtualDom.fromElement;
   var toElement = $Native$VirtualDom.toElement;
   var text = $Native$VirtualDom.text;
   var node = $Native$VirtualDom.node;
   var Node = {ctor: "Node"};
   return _elm.VirtualDom.values = {_op: _op
                                   ,text: text
                                   ,node: node
                                   ,toElement: toElement
                                   ,fromElement: fromElement
                                   ,property: property
                                   ,attribute: attribute
                                   ,attributeNS: attributeNS
                                   ,on: on
                                   ,onWithOptions: onWithOptions
                                   ,defaultOptions: defaultOptions
                                   ,lazy: lazy
                                   ,lazy2: lazy2
                                   ,lazy3: lazy3
                                   ,Options: Options};
};
Elm.Html = Elm.Html || {};
Elm.Html.make = function (_elm) {
   "use strict";
   _elm.Html = _elm.Html || {};
   if (_elm.Html.values) return _elm.Html.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $Graphics$Element = Elm.Graphics.Element.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm),
   $VirtualDom = Elm.VirtualDom.make(_elm);
   var _op = {};
   var fromElement = $VirtualDom.fromElement;
   var toElement = $VirtualDom.toElement;
   var text = $VirtualDom.text;
   var node = $VirtualDom.node;
   var body = node("body");
   var section = node("section");
   var nav = node("nav");
   var article = node("article");
   var aside = node("aside");
   var h1 = node("h1");
   var h2 = node("h2");
   var h3 = node("h3");
   var h4 = node("h4");
   var h5 = node("h5");
   var h6 = node("h6");
   var header = node("header");
   var footer = node("footer");
   var address = node("address");
   var main$ = node("main");
   var p = node("p");
   var hr = node("hr");
   var pre = node("pre");
   var blockquote = node("blockquote");
   var ol = node("ol");
   var ul = node("ul");
   var li = node("li");
   var dl = node("dl");
   var dt = node("dt");
   var dd = node("dd");
   var figure = node("figure");
   var figcaption = node("figcaption");
   var div = node("div");
   var a = node("a");
   var em = node("em");
   var strong = node("strong");
   var small = node("small");
   var s = node("s");
   var cite = node("cite");
   var q = node("q");
   var dfn = node("dfn");
   var abbr = node("abbr");
   var time = node("time");
   var code = node("code");
   var $var = node("var");
   var samp = node("samp");
   var kbd = node("kbd");
   var sub = node("sub");
   var sup = node("sup");
   var i = node("i");
   var b = node("b");
   var u = node("u");
   var mark = node("mark");
   var ruby = node("ruby");
   var rt = node("rt");
   var rp = node("rp");
   var bdi = node("bdi");
   var bdo = node("bdo");
   var span = node("span");
   var br = node("br");
   var wbr = node("wbr");
   var ins = node("ins");
   var del = node("del");
   var img = node("img");
   var iframe = node("iframe");
   var embed = node("embed");
   var object = node("object");
   var param = node("param");
   var video = node("video");
   var audio = node("audio");
   var source = node("source");
   var track = node("track");
   var canvas = node("canvas");
   var svg = node("svg");
   var math = node("math");
   var table = node("table");
   var caption = node("caption");
   var colgroup = node("colgroup");
   var col = node("col");
   var tbody = node("tbody");
   var thead = node("thead");
   var tfoot = node("tfoot");
   var tr = node("tr");
   var td = node("td");
   var th = node("th");
   var form = node("form");
   var fieldset = node("fieldset");
   var legend = node("legend");
   var label = node("label");
   var input = node("input");
   var button = node("button");
   var select = node("select");
   var datalist = node("datalist");
   var optgroup = node("optgroup");
   var option = node("option");
   var textarea = node("textarea");
   var keygen = node("keygen");
   var output = node("output");
   var progress = node("progress");
   var meter = node("meter");
   var details = node("details");
   var summary = node("summary");
   var menuitem = node("menuitem");
   var menu = node("menu");
   return _elm.Html.values = {_op: _op
                             ,node: node
                             ,text: text
                             ,toElement: toElement
                             ,fromElement: fromElement
                             ,body: body
                             ,section: section
                             ,nav: nav
                             ,article: article
                             ,aside: aside
                             ,h1: h1
                             ,h2: h2
                             ,h3: h3
                             ,h4: h4
                             ,h5: h5
                             ,h6: h6
                             ,header: header
                             ,footer: footer
                             ,address: address
                             ,main$: main$
                             ,p: p
                             ,hr: hr
                             ,pre: pre
                             ,blockquote: blockquote
                             ,ol: ol
                             ,ul: ul
                             ,li: li
                             ,dl: dl
                             ,dt: dt
                             ,dd: dd
                             ,figure: figure
                             ,figcaption: figcaption
                             ,div: div
                             ,a: a
                             ,em: em
                             ,strong: strong
                             ,small: small
                             ,s: s
                             ,cite: cite
                             ,q: q
                             ,dfn: dfn
                             ,abbr: abbr
                             ,time: time
                             ,code: code
                             ,$var: $var
                             ,samp: samp
                             ,kbd: kbd
                             ,sub: sub
                             ,sup: sup
                             ,i: i
                             ,b: b
                             ,u: u
                             ,mark: mark
                             ,ruby: ruby
                             ,rt: rt
                             ,rp: rp
                             ,bdi: bdi
                             ,bdo: bdo
                             ,span: span
                             ,br: br
                             ,wbr: wbr
                             ,ins: ins
                             ,del: del
                             ,img: img
                             ,iframe: iframe
                             ,embed: embed
                             ,object: object
                             ,param: param
                             ,video: video
                             ,audio: audio
                             ,source: source
                             ,track: track
                             ,canvas: canvas
                             ,svg: svg
                             ,math: math
                             ,table: table
                             ,caption: caption
                             ,colgroup: colgroup
                             ,col: col
                             ,tbody: tbody
                             ,thead: thead
                             ,tfoot: tfoot
                             ,tr: tr
                             ,td: td
                             ,th: th
                             ,form: form
                             ,fieldset: fieldset
                             ,legend: legend
                             ,label: label
                             ,input: input
                             ,button: button
                             ,select: select
                             ,datalist: datalist
                             ,optgroup: optgroup
                             ,option: option
                             ,textarea: textarea
                             ,keygen: keygen
                             ,output: output
                             ,progress: progress
                             ,meter: meter
                             ,details: details
                             ,summary: summary
                             ,menuitem: menuitem
                             ,menu: menu};
};
Elm.Native.SocketIO = {};
Elm.Native.SocketIO.make = function(localRuntime) {

    localRuntime.Native = localRuntime.Native || {};
    localRuntime.Native.SocketIO = localRuntime.Native.SocketIO || {};
    if (localRuntime.Native.SocketIO.values){
        return localRuntime.Native.SocketIO.values;
    }

    var Signal = Elm.Native.Signal.make (localRuntime);
    var Task = Elm.Native.Task.make (localRuntime);
    var Utils = Elm.Native.Utils.make (localRuntime);

    function ioWrapper(hostname, options){
        var socket;
        return Task.asyncFunction(function(callback){
            socket = socket || io(hostname, options);
            if (socket.connected){
                callback(Task.succeed(socket));
            }else{
                attemptConnection(socket, callback);
            }
        });
    }

    function attemptConnection(socket, callback){
        var sent = false;
        socket.on("connect", function(){
            if (!sent){
                sent = true;
                callback(Task.succeed(socket));
            }
        });
    }

    function emit(eventName, message, socket){
        return Task.asyncFunction(function(callback){
            if (socket.disconnected) return callback(Task.fail("Socket disconnected"));
            if (eventName === ""){
                socket.send(message);
            }else{
                socket.emit(eventName, message);
            }
            callback(Task.succeed(Utils.Tuple0));
        });
    }

    function on(eventName, address, socket){
        return Task.asyncFunction(function(callback){
            if (socket.disconnected) return callback(Task.fail("Socket disconnected"));
            if (eventName === "") eventName = 'message';
            socket.on(eventName, function(data){
                if (typeof data !== "string") data = JSON.stringify(data) || "null";
                Task.perform(address._0(data));
            });
            callback(Task.succeed(Utils.Tuple0));
        });
    }

    function connected(address, socket){
        return Task.asyncFunction(function(callback){
            Task.perform(address._0(socket.connected));
            socket.on("connect", function(){ Task.perform(address._0(true)); });
            socket.on("disconnect", function(){ Task.perform(address._0(false)); });
            callback(Task.succeed(Utils.Tuple0));
        });
    }

    localRuntime.Native.SocketIO.values = {
        io: F2(ioWrapper),
        emit: F3(emit),
        on: F3(on),
        connected: F2(connected),
    };
    return localRuntime.Native.SocketIO.values;
};

// Socket.io client from https://cdn.socket.io/socket.io-1.3.7.js
// License: MIT
/* jshint ignore:start */
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.io=e()}}(function(){var define,module,exports;return function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}({1:[function(_dereq_,module,exports){module.exports=_dereq_("./lib/")},{"./lib/":2}],2:[function(_dereq_,module,exports){var url=_dereq_("./url");var parser=_dereq_("socket.io-parser");var Manager=_dereq_("./manager");var debug=_dereq_("debug")("socket.io-client");module.exports=exports=lookup;var cache=exports.managers={};function lookup(uri,opts){if(typeof uri=="object"){opts=uri;uri=undefined}opts=opts||{};var parsed=url(uri);var source=parsed.source;var id=parsed.id;var io;if(opts.forceNew||opts["force new connection"]||false===opts.multiplex){debug("ignoring socket cache for %s",source);io=Manager(source,opts)}else{if(!cache[id]){debug("new io instance for %s",source);cache[id]=Manager(source,opts)}io=cache[id]}return io.socket(parsed.path)}exports.protocol=parser.protocol;exports.connect=lookup;exports.Manager=_dereq_("./manager");exports.Socket=_dereq_("./socket")},{"./manager":3,"./socket":5,"./url":6,debug:10,"socket.io-parser":44}],3:[function(_dereq_,module,exports){var url=_dereq_("./url");var eio=_dereq_("engine.io-client");var Socket=_dereq_("./socket");var Emitter=_dereq_("component-emitter");var parser=_dereq_("socket.io-parser");var on=_dereq_("./on");var bind=_dereq_("component-bind");var object=_dereq_("object-component");var debug=_dereq_("debug")("socket.io-client:manager");var indexOf=_dereq_("indexof");var Backoff=_dereq_("backo2");module.exports=Manager;function Manager(uri,opts){if(!(this instanceof Manager))return new Manager(uri,opts);if(uri&&"object"==typeof uri){opts=uri;uri=undefined}opts=opts||{};opts.path=opts.path||"/socket.io";this.nsps={};this.subs=[];this.opts=opts;this.reconnection(opts.reconnection!==false);this.reconnectionAttempts(opts.reconnectionAttempts||Infinity);this.reconnectionDelay(opts.reconnectionDelay||1e3);this.reconnectionDelayMax(opts.reconnectionDelayMax||5e3);this.randomizationFactor(opts.randomizationFactor||.5);this.backoff=new Backoff({min:this.reconnectionDelay(),max:this.reconnectionDelayMax(),jitter:this.randomizationFactor()});this.timeout(null==opts.timeout?2e4:opts.timeout);this.readyState="closed";this.uri=uri;this.connected=[];this.encoding=false;this.packetBuffer=[];this.encoder=new parser.Encoder;this.decoder=new parser.Decoder;this.autoConnect=opts.autoConnect!==false;if(this.autoConnect)this.open()}Manager.prototype.emitAll=function(){this.emit.apply(this,arguments);for(var nsp in this.nsps){this.nsps[nsp].emit.apply(this.nsps[nsp],arguments)}};Manager.prototype.updateSocketIds=function(){for(var nsp in this.nsps){this.nsps[nsp].id=this.engine.id}};Emitter(Manager.prototype);Manager.prototype.reconnection=function(v){if(!arguments.length)return this._reconnection;this._reconnection=!!v;return this};Manager.prototype.reconnectionAttempts=function(v){if(!arguments.length)return this._reconnectionAttempts;this._reconnectionAttempts=v;return this};Manager.prototype.reconnectionDelay=function(v){if(!arguments.length)return this._reconnectionDelay;this._reconnectionDelay=v;this.backoff&&this.backoff.setMin(v);return this};Manager.prototype.randomizationFactor=function(v){if(!arguments.length)return this._randomizationFactor;this._randomizationFactor=v;this.backoff&&this.backoff.setJitter(v);return this};Manager.prototype.reconnectionDelayMax=function(v){if(!arguments.length)return this._reconnectionDelayMax;this._reconnectionDelayMax=v;this.backoff&&this.backoff.setMax(v);return this};Manager.prototype.timeout=function(v){if(!arguments.length)return this._timeout;this._timeout=v;return this};Manager.prototype.maybeReconnectOnOpen=function(){if(!this.reconnecting&&this._reconnection&&this.backoff.attempts===0){this.reconnect()}};Manager.prototype.open=Manager.prototype.connect=function(fn){debug("readyState %s",this.readyState);if(~this.readyState.indexOf("open"))return this;debug("opening %s",this.uri);this.engine=eio(this.uri,this.opts);var socket=this.engine;var self=this;this.readyState="opening";this.skipReconnect=false;var openSub=on(socket,"open",function(){self.onopen();fn&&fn()});var errorSub=on(socket,"error",function(data){debug("connect_error");self.cleanup();self.readyState="closed";self.emitAll("connect_error",data);if(fn){var err=new Error("Connection error");err.data=data;fn(err)}else{self.maybeReconnectOnOpen()}});if(false!==this._timeout){var timeout=this._timeout;debug("connect attempt will timeout after %d",timeout);var timer=setTimeout(function(){debug("connect attempt timed out after %d",timeout);openSub.destroy();socket.close();socket.emit("error","timeout");self.emitAll("connect_timeout",timeout)},timeout);this.subs.push({destroy:function(){clearTimeout(timer)}})}this.subs.push(openSub);this.subs.push(errorSub);return this};Manager.prototype.onopen=function(){debug("open");this.cleanup();this.readyState="open";this.emit("open");var socket=this.engine;this.subs.push(on(socket,"data",bind(this,"ondata")));this.subs.push(on(this.decoder,"decoded",bind(this,"ondecoded")));this.subs.push(on(socket,"error",bind(this,"onerror")));this.subs.push(on(socket,"close",bind(this,"onclose")))};Manager.prototype.ondata=function(data){this.decoder.add(data)};Manager.prototype.ondecoded=function(packet){this.emit("packet",packet)};Manager.prototype.onerror=function(err){debug("error",err);this.emitAll("error",err)};Manager.prototype.socket=function(nsp){var socket=this.nsps[nsp];if(!socket){socket=new Socket(this,nsp);this.nsps[nsp]=socket;var self=this;socket.on("connect",function(){socket.id=self.engine.id;if(!~indexOf(self.connected,socket)){self.connected.push(socket)}})}return socket};Manager.prototype.destroy=function(socket){var index=indexOf(this.connected,socket);if(~index)this.connected.splice(index,1);if(this.connected.length)return;this.close()};Manager.prototype.packet=function(packet){debug("writing packet %j",packet);var self=this;if(!self.encoding){self.encoding=true;this.encoder.encode(packet,function(encodedPackets){for(var i=0;i<encodedPackets.length;i++){self.engine.write(encodedPackets[i])}self.encoding=false;self.processPacketQueue()})}else{self.packetBuffer.push(packet)}};Manager.prototype.processPacketQueue=function(){if(this.packetBuffer.length>0&&!this.encoding){var pack=this.packetBuffer.shift();this.packet(pack)}};Manager.prototype.cleanup=function(){var sub;while(sub=this.subs.shift())sub.destroy();this.packetBuffer=[];this.encoding=false;this.decoder.destroy()};Manager.prototype.close=Manager.prototype.disconnect=function(){this.skipReconnect=true;this.backoff.reset();this.readyState="closed";this.engine&&this.engine.close()};Manager.prototype.onclose=function(reason){debug("close");this.cleanup();this.backoff.reset();this.readyState="closed";this.emit("close",reason);if(this._reconnection&&!this.skipReconnect){this.reconnect()}};Manager.prototype.reconnect=function(){if(this.reconnecting||this.skipReconnect)return this;var self=this;if(this.backoff.attempts>=this._reconnectionAttempts){debug("reconnect failed");this.backoff.reset();this.emitAll("reconnect_failed");this.reconnecting=false}else{var delay=this.backoff.duration();debug("will wait %dms before reconnect attempt",delay);this.reconnecting=true;var timer=setTimeout(function(){if(self.skipReconnect)return;debug("attempting reconnect");self.emitAll("reconnect_attempt",self.backoff.attempts);self.emitAll("reconnecting",self.backoff.attempts);if(self.skipReconnect)return;self.open(function(err){if(err){debug("reconnect attempt error");self.reconnecting=false;self.reconnect();self.emitAll("reconnect_error",err.data)}else{debug("reconnect success");self.onreconnect()}})},delay);this.subs.push({destroy:function(){clearTimeout(timer)}})}};Manager.prototype.onreconnect=function(){var attempt=this.backoff.attempts;this.reconnecting=false;this.backoff.reset();this.updateSocketIds();this.emitAll("reconnect",attempt)}},{"./on":4,"./socket":5,"./url":6,backo2:7,"component-bind":8,"component-emitter":9,debug:10,"engine.io-client":11,indexof:40,"object-component":41,"socket.io-parser":44}],4:[function(_dereq_,module,exports){module.exports=on;function on(obj,ev,fn){obj.on(ev,fn);return{destroy:function(){obj.removeListener(ev,fn)}}}},{}],5:[function(_dereq_,module,exports){var parser=_dereq_("socket.io-parser");var Emitter=_dereq_("component-emitter");var toArray=_dereq_("to-array");var on=_dereq_("./on");var bind=_dereq_("component-bind");var debug=_dereq_("debug")("socket.io-client:socket");var hasBin=_dereq_("has-binary");module.exports=exports=Socket;var events={connect:1,connect_error:1,connect_timeout:1,disconnect:1,error:1,reconnect:1,reconnect_attempt:1,reconnect_failed:1,reconnect_error:1,reconnecting:1};var emit=Emitter.prototype.emit;function Socket(io,nsp){this.io=io;this.nsp=nsp;this.json=this;this.ids=0;this.acks={};if(this.io.autoConnect)this.open();this.receiveBuffer=[];this.sendBuffer=[];this.connected=false;this.disconnected=true}Emitter(Socket.prototype);Socket.prototype.subEvents=function(){if(this.subs)return;var io=this.io;this.subs=[on(io,"open",bind(this,"onopen")),on(io,"packet",bind(this,"onpacket")),on(io,"close",bind(this,"onclose"))]};Socket.prototype.open=Socket.prototype.connect=function(){if(this.connected)return this;this.subEvents();this.io.open();if("open"==this.io.readyState)this.onopen();return this};Socket.prototype.send=function(){var args=toArray(arguments);args.unshift("message");this.emit.apply(this,args);return this};Socket.prototype.emit=function(ev){if(events.hasOwnProperty(ev)){emit.apply(this,arguments);return this}var args=toArray(arguments);var parserType=parser.EVENT;if(hasBin(args)){parserType=parser.BINARY_EVENT}var packet={type:parserType,data:args};if("function"==typeof args[args.length-1]){debug("emitting packet with ack id %d",this.ids);this.acks[this.ids]=args.pop();packet.id=this.ids++}if(this.connected){this.packet(packet)}else{this.sendBuffer.push(packet)}return this};Socket.prototype.packet=function(packet){packet.nsp=this.nsp;this.io.packet(packet)};Socket.prototype.onopen=function(){debug("transport is open - connecting");if("/"!=this.nsp){this.packet({type:parser.CONNECT})}};Socket.prototype.onclose=function(reason){debug("close (%s)",reason);this.connected=false;this.disconnected=true;delete this.id;this.emit("disconnect",reason)};Socket.prototype.onpacket=function(packet){if(packet.nsp!=this.nsp)return;switch(packet.type){case parser.CONNECT:this.onconnect();break;case parser.EVENT:this.onevent(packet);break;case parser.BINARY_EVENT:this.onevent(packet);break;case parser.ACK:this.onack(packet);break;case parser.BINARY_ACK:this.onack(packet);break;case parser.DISCONNECT:this.ondisconnect();break;case parser.ERROR:this.emit("error",packet.data);break}};Socket.prototype.onevent=function(packet){var args=packet.data||[];debug("emitting event %j",args);if(null!=packet.id){debug("attaching ack callback to event");args.push(this.ack(packet.id))}if(this.connected){emit.apply(this,args)}else{this.receiveBuffer.push(args)}};Socket.prototype.ack=function(id){var self=this;var sent=false;return function(){if(sent)return;sent=true;var args=toArray(arguments);debug("sending ack %j",args);var type=hasBin(args)?parser.BINARY_ACK:parser.ACK;self.packet({type:type,id:id,data:args})}};Socket.prototype.onack=function(packet){debug("calling ack %s with %j",packet.id,packet.data);var fn=this.acks[packet.id];fn.apply(this,packet.data);delete this.acks[packet.id]};Socket.prototype.onconnect=function(){this.connected=true;this.disconnected=false;this.emit("connect");this.emitBuffered()};Socket.prototype.emitBuffered=function(){var i;for(i=0;i<this.receiveBuffer.length;i++){emit.apply(this,this.receiveBuffer[i])}this.receiveBuffer=[];for(i=0;i<this.sendBuffer.length;i++){this.packet(this.sendBuffer[i])}this.sendBuffer=[]};Socket.prototype.ondisconnect=function(){debug("server disconnect (%s)",this.nsp);this.destroy();this.onclose("io server disconnect")};Socket.prototype.destroy=function(){if(this.subs){for(var i=0;i<this.subs.length;i++){this.subs[i].destroy()}this.subs=null}this.io.destroy(this)};Socket.prototype.close=Socket.prototype.disconnect=function(){if(this.connected){debug("performing disconnect (%s)",this.nsp);this.packet({type:parser.DISCONNECT})}this.destroy();if(this.connected){this.onclose("io client disconnect")}return this}},{"./on":4,"component-bind":8,"component-emitter":9,debug:10,"has-binary":36,"socket.io-parser":44,"to-array":48}],6:[function(_dereq_,module,exports){(function(global){var parseuri=_dereq_("parseuri");var debug=_dereq_("debug")("socket.io-client:url");module.exports=url;function url(uri,loc){var obj=uri;var loc=loc||global.location;if(null==uri)uri=loc.protocol+"//"+loc.host;if("string"==typeof uri){if("/"==uri.charAt(0)){if("/"==uri.charAt(1)){uri=loc.protocol+uri}else{uri=loc.hostname+uri}}if(!/^(https?|wss?):\/\//.test(uri)){debug("protocol-less url %s",uri);if("undefined"!=typeof loc){uri=loc.protocol+"//"+uri}else{uri="https://"+uri}}debug("parse %s",uri);obj=parseuri(uri)}if(!obj.port){if(/^(http|ws)$/.test(obj.protocol)){obj.port="80"}else if(/^(http|ws)s$/.test(obj.protocol)){obj.port="443"}}obj.path=obj.path||"/";obj.id=obj.protocol+"://"+obj.host+":"+obj.port;obj.href=obj.protocol+"://"+obj.host+(loc&&loc.port==obj.port?"":":"+obj.port);return obj}}).call(this,typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{debug:10,parseuri:42}],7:[function(_dereq_,module,exports){module.exports=Backoff;function Backoff(opts){opts=opts||{};this.ms=opts.min||100;this.max=opts.max||1e4;this.factor=opts.factor||2;this.jitter=opts.jitter>0&&opts.jitter<=1?opts.jitter:0;this.attempts=0}Backoff.prototype.duration=function(){var ms=this.ms*Math.pow(this.factor,this.attempts++);if(this.jitter){var rand=Math.random();var deviation=Math.floor(rand*this.jitter*ms);ms=(Math.floor(rand*10)&1)==0?ms-deviation:ms+deviation}return Math.min(ms,this.max)|0};Backoff.prototype.reset=function(){this.attempts=0};Backoff.prototype.setMin=function(min){this.ms=min};Backoff.prototype.setMax=function(max){this.max=max};Backoff.prototype.setJitter=function(jitter){this.jitter=jitter}},{}],8:[function(_dereq_,module,exports){var slice=[].slice;module.exports=function(obj,fn){if("string"==typeof fn)fn=obj[fn];if("function"!=typeof fn)throw new Error("bind() requires a function");var args=slice.call(arguments,2);return function(){return fn.apply(obj,args.concat(slice.call(arguments)))}}},{}],9:[function(_dereq_,module,exports){module.exports=Emitter;function Emitter(obj){if(obj)return mixin(obj)}function mixin(obj){for(var key in Emitter.prototype){obj[key]=Emitter.prototype[key]}return obj}Emitter.prototype.on=Emitter.prototype.addEventListener=function(event,fn){this._callbacks=this._callbacks||{};(this._callbacks[event]=this._callbacks[event]||[]).push(fn);return this};Emitter.prototype.once=function(event,fn){var self=this;this._callbacks=this._callbacks||{};function on(){self.off(event,on);fn.apply(this,arguments)}on.fn=fn;this.on(event,on);return this};Emitter.prototype.off=Emitter.prototype.removeListener=Emitter.prototype.removeAllListeners=Emitter.prototype.removeEventListener=function(event,fn){this._callbacks=this._callbacks||{};if(0==arguments.length){this._callbacks={};return this}var callbacks=this._callbacks[event];if(!callbacks)return this;if(1==arguments.length){delete this._callbacks[event];return this}var cb;for(var i=0;i<callbacks.length;i++){cb=callbacks[i];if(cb===fn||cb.fn===fn){callbacks.splice(i,1);break}}return this};Emitter.prototype.emit=function(event){this._callbacks=this._callbacks||{};var args=[].slice.call(arguments,1),callbacks=this._callbacks[event];if(callbacks){callbacks=callbacks.slice(0);for(var i=0,len=callbacks.length;i<len;++i){callbacks[i].apply(this,args)}}return this};Emitter.prototype.listeners=function(event){this._callbacks=this._callbacks||{};return this._callbacks[event]||[]};Emitter.prototype.hasListeners=function(event){return!!this.listeners(event).length}},{}],10:[function(_dereq_,module,exports){module.exports=debug;function debug(name){if(!debug.enabled(name))return function(){};return function(fmt){fmt=coerce(fmt);var curr=new Date;var ms=curr-(debug[name]||curr);debug[name]=curr;fmt=name+" "+fmt+" +"+debug.humanize(ms);window.console&&console.log&&Function.prototype.apply.call(console.log,console,arguments)}}debug.names=[];debug.skips=[];debug.enable=function(name){try{localStorage.debug=name}catch(e){}var split=(name||"").split(/[\s,]+/),len=split.length;for(var i=0;i<len;i++){name=split[i].replace("*",".*?");if(name[0]==="-"){debug.skips.push(new RegExp("^"+name.substr(1)+"$"))}else{debug.names.push(new RegExp("^"+name+"$"))}}};debug.disable=function(){debug.enable("")};debug.humanize=function(ms){var sec=1e3,min=60*1e3,hour=60*min;if(ms>=hour)return(ms/hour).toFixed(1)+"h";if(ms>=min)return(ms/min).toFixed(1)+"m";if(ms>=sec)return(ms/sec|0)+"s";return ms+"ms"};debug.enabled=function(name){for(var i=0,len=debug.skips.length;i<len;i++){if(debug.skips[i].test(name)){return false}}for(var i=0,len=debug.names.length;i<len;i++){if(debug.names[i].test(name)){return true}}return false};function coerce(val){if(val instanceof Error)return val.stack||val.message;return val}try{if(window.localStorage)debug.enable(localStorage.debug)}catch(e){}},{}],11:[function(_dereq_,module,exports){module.exports=_dereq_("./lib/")},{"./lib/":12}],12:[function(_dereq_,module,exports){module.exports=_dereq_("./socket");module.exports.parser=_dereq_("engine.io-parser")},{"./socket":13,"engine.io-parser":25}],13:[function(_dereq_,module,exports){(function(global){var transports=_dereq_("./transports");var Emitter=_dereq_("component-emitter");var debug=_dereq_("debug")("engine.io-client:socket");var index=_dereq_("indexof");var parser=_dereq_("engine.io-parser");var parseuri=_dereq_("parseuri");var parsejson=_dereq_("parsejson");var parseqs=_dereq_("parseqs");module.exports=Socket;function noop(){}function Socket(uri,opts){if(!(this instanceof Socket))return new Socket(uri,opts);opts=opts||{};if(uri&&"object"==typeof uri){opts=uri;uri=null}if(uri){uri=parseuri(uri);opts.host=uri.host;opts.secure=uri.protocol=="https"||uri.protocol=="wss";opts.port=uri.port;if(uri.query)opts.query=uri.query}this.secure=null!=opts.secure?opts.secure:global.location&&"https:"==location.protocol;if(opts.host){var pieces=opts.host.split(":");opts.hostname=pieces.shift();if(pieces.length){opts.port=pieces.pop()}else if(!opts.port){opts.port=this.secure?"443":"80"}}this.agent=opts.agent||false;this.hostname=opts.hostname||(global.location?location.hostname:"localhost");this.port=opts.port||(global.location&&location.port?location.port:this.secure?443:80);this.query=opts.query||{};if("string"==typeof this.query)this.query=parseqs.decode(this.query);this.upgrade=false!==opts.upgrade;this.path=(opts.path||"/engine.io").replace(/\/$/,"")+"/";this.forceJSONP=!!opts.forceJSONP;this.jsonp=false!==opts.jsonp;this.forceBase64=!!opts.forceBase64;this.enablesXDR=!!opts.enablesXDR;this.timestampParam=opts.timestampParam||"t";this.timestampRequests=opts.timestampRequests;this.transports=opts.transports||["polling","websocket"];this.readyState="";this.writeBuffer=[];this.callbackBuffer=[];this.policyPort=opts.policyPort||843;this.rememberUpgrade=opts.rememberUpgrade||false;this.binaryType=null;this.onlyBinaryUpgrades=opts.onlyBinaryUpgrades;this.pfx=opts.pfx||null;this.key=opts.key||null;this.passphrase=opts.passphrase||null;this.cert=opts.cert||null;this.ca=opts.ca||null;this.ciphers=opts.ciphers||null;this.rejectUnauthorized=opts.rejectUnauthorized||null;this.open()}Socket.priorWebsocketSuccess=false;Emitter(Socket.prototype);Socket.protocol=parser.protocol;Socket.Socket=Socket;Socket.Transport=_dereq_("./transport");Socket.transports=_dereq_("./transports");Socket.parser=_dereq_("engine.io-parser");Socket.prototype.createTransport=function(name){debug('creating transport "%s"',name);var query=clone(this.query);query.EIO=parser.protocol;query.transport=name;if(this.id)query.sid=this.id;var transport=new transports[name]({agent:this.agent,hostname:this.hostname,port:this.port,secure:this.secure,path:this.path,query:query,forceJSONP:this.forceJSONP,jsonp:this.jsonp,forceBase64:this.forceBase64,enablesXDR:this.enablesXDR,timestampRequests:this.timestampRequests,timestampParam:this.timestampParam,policyPort:this.policyPort,socket:this,pfx:this.pfx,key:this.key,passphrase:this.passphrase,cert:this.cert,ca:this.ca,ciphers:this.ciphers,rejectUnauthorized:this.rejectUnauthorized});return transport};function clone(obj){var o={};for(var i in obj){if(obj.hasOwnProperty(i)){o[i]=obj[i]}}return o}Socket.prototype.open=function(){var transport;if(this.rememberUpgrade&&Socket.priorWebsocketSuccess&&this.transports.indexOf("websocket")!=-1){transport="websocket"}else if(0==this.transports.length){var self=this;setTimeout(function(){self.emit("error","No transports available")},0);return}else{transport=this.transports[0]}this.readyState="opening";var transport;try{transport=this.createTransport(transport)}catch(e){this.transports.shift();this.open();return}transport.open();this.setTransport(transport)};Socket.prototype.setTransport=function(transport){debug("setting transport %s",transport.name);var self=this;if(this.transport){debug("clearing existing transport %s",this.transport.name);this.transport.removeAllListeners()}this.transport=transport;transport.on("drain",function(){self.onDrain()}).on("packet",function(packet){self.onPacket(packet)}).on("error",function(e){self.onError(e)}).on("close",function(){self.onClose("transport close")})};Socket.prototype.probe=function(name){debug('probing transport "%s"',name);var transport=this.createTransport(name,{probe:1}),failed=false,self=this;Socket.priorWebsocketSuccess=false;function onTransportOpen(){if(self.onlyBinaryUpgrades){var upgradeLosesBinary=!this.supportsBinary&&self.transport.supportsBinary;failed=failed||upgradeLosesBinary}if(failed)return;debug('probe transport "%s" opened',name);transport.send([{type:"ping",data:"probe"}]);transport.once("packet",function(msg){if(failed)return;if("pong"==msg.type&&"probe"==msg.data){debug('probe transport "%s" pong',name);self.upgrading=true;self.emit("upgrading",transport);if(!transport)return;Socket.priorWebsocketSuccess="websocket"==transport.name;debug('pausing current transport "%s"',self.transport.name);self.transport.pause(function(){if(failed)return;if("closed"==self.readyState)return;debug("changing transport and sending upgrade packet");cleanup();self.setTransport(transport);transport.send([{type:"upgrade"}]);self.emit("upgrade",transport);transport=null;self.upgrading=false;self.flush()})}else{debug('probe transport "%s" failed',name);var err=new Error("probe error");err.transport=transport.name;self.emit("upgradeError",err)}})}function freezeTransport(){if(failed)return;failed=true;cleanup();transport.close();transport=null}function onerror(err){var error=new Error("probe error: "+err);error.transport=transport.name;freezeTransport();debug('probe transport "%s" failed because of error: %s',name,err);self.emit("upgradeError",error)}function onTransportClose(){onerror("transport closed")}function onclose(){onerror("socket closed")}function onupgrade(to){if(transport&&to.name!=transport.name){debug('"%s" works - aborting "%s"',to.name,transport.name);freezeTransport()}}function cleanup(){transport.removeListener("open",onTransportOpen);transport.removeListener("error",onerror);transport.removeListener("close",onTransportClose);self.removeListener("close",onclose);self.removeListener("upgrading",onupgrade)}transport.once("open",onTransportOpen);transport.once("error",onerror);transport.once("close",onTransportClose);this.once("close",onclose);this.once("upgrading",onupgrade);transport.open()};Socket.prototype.onOpen=function(){debug("socket open");this.readyState="open";Socket.priorWebsocketSuccess="websocket"==this.transport.name;this.emit("open");this.flush();if("open"==this.readyState&&this.upgrade&&this.transport.pause){debug("starting upgrade probes");for(var i=0,l=this.upgrades.length;i<l;i++){this.probe(this.upgrades[i])}}};Socket.prototype.onPacket=function(packet){if("opening"==this.readyState||"open"==this.readyState){debug('socket receive: type "%s", data "%s"',packet.type,packet.data);this.emit("packet",packet);this.emit("heartbeat");switch(packet.type){case"open":this.onHandshake(parsejson(packet.data));break;case"pong":this.setPing();break;case"error":var err=new Error("server error");err.code=packet.data;this.emit("error",err);break;case"message":this.emit("data",packet.data);this.emit("message",packet.data);break}}else{debug('packet received with socket readyState "%s"',this.readyState)}};Socket.prototype.onHandshake=function(data){this.emit("handshake",data);this.id=data.sid;this.transport.query.sid=data.sid;this.upgrades=this.filterUpgrades(data.upgrades);this.pingInterval=data.pingInterval;this.pingTimeout=data.pingTimeout;this.onOpen();if("closed"==this.readyState)return;this.setPing();this.removeListener("heartbeat",this.onHeartbeat);this.on("heartbeat",this.onHeartbeat)};Socket.prototype.onHeartbeat=function(timeout){clearTimeout(this.pingTimeoutTimer);var self=this;self.pingTimeoutTimer=setTimeout(function(){if("closed"==self.readyState)return;self.onClose("ping timeout")},timeout||self.pingInterval+self.pingTimeout)};Socket.prototype.setPing=function(){var self=this;clearTimeout(self.pingIntervalTimer);self.pingIntervalTimer=setTimeout(function(){debug("writing ping packet - expecting pong within %sms",self.pingTimeout);self.ping();self.onHeartbeat(self.pingTimeout)},self.pingInterval)};Socket.prototype.ping=function(){this.sendPacket("ping")};Socket.prototype.onDrain=function(){for(var i=0;i<this.prevBufferLen;i++){if(this.callbackBuffer[i]){this.callbackBuffer[i]()}}this.writeBuffer.splice(0,this.prevBufferLen);this.callbackBuffer.splice(0,this.prevBufferLen);this.prevBufferLen=0;if(this.writeBuffer.length==0){this.emit("drain")}else{this.flush()}};Socket.prototype.flush=function(){if("closed"!=this.readyState&&this.transport.writable&&!this.upgrading&&this.writeBuffer.length){debug("flushing %d packets in socket",this.writeBuffer.length);this.transport.send(this.writeBuffer);this.prevBufferLen=this.writeBuffer.length;this.emit("flush")}};Socket.prototype.write=Socket.prototype.send=function(msg,fn){this.sendPacket("message",msg,fn);return this};Socket.prototype.sendPacket=function(type,data,fn){if("closing"==this.readyState||"closed"==this.readyState){return}var packet={type:type,data:data};this.emit("packetCreate",packet);this.writeBuffer.push(packet);this.callbackBuffer.push(fn);this.flush()};Socket.prototype.close=function(){if("opening"==this.readyState||"open"==this.readyState){this.readyState="closing";var self=this;function close(){self.onClose("forced close");debug("socket closing - telling transport to close");self.transport.close()}function cleanupAndClose(){self.removeListener("upgrade",cleanupAndClose);self.removeListener("upgradeError",cleanupAndClose);close()}function waitForUpgrade(){self.once("upgrade",cleanupAndClose);self.once("upgradeError",cleanupAndClose)}if(this.writeBuffer.length){this.once("drain",function(){if(this.upgrading){waitForUpgrade()}else{close()}})}else if(this.upgrading){waitForUpgrade()}else{close()}}return this};Socket.prototype.onError=function(err){debug("socket error %j",err);Socket.priorWebsocketSuccess=false;this.emit("error",err);this.onClose("transport error",err)};Socket.prototype.onClose=function(reason,desc){if("opening"==this.readyState||"open"==this.readyState||"closing"==this.readyState){debug('socket close with reason: "%s"',reason);var self=this;clearTimeout(this.pingIntervalTimer);clearTimeout(this.pingTimeoutTimer);setTimeout(function(){self.writeBuffer=[];self.callbackBuffer=[];self.prevBufferLen=0},0);this.transport.removeAllListeners("close");this.transport.close();this.transport.removeAllListeners();this.readyState="closed";this.id=null;this.emit("close",reason,desc)}};Socket.prototype.filterUpgrades=function(upgrades){var filteredUpgrades=[];for(var i=0,j=upgrades.length;i<j;i++){if(~index(this.transports,upgrades[i]))filteredUpgrades.push(upgrades[i])}return filteredUpgrades}}).call(this,typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{"./transport":14,"./transports":15,"component-emitter":9,debug:22,"engine.io-parser":25,indexof:40,parsejson:32,parseqs:33,parseuri:34}],14:[function(_dereq_,module,exports){var parser=_dereq_("engine.io-parser");var Emitter=_dereq_("component-emitter");module.exports=Transport;function Transport(opts){this.path=opts.path;this.hostname=opts.hostname;this.port=opts.port;this.secure=opts.secure;this.query=opts.query;this.timestampParam=opts.timestampParam;this.timestampRequests=opts.timestampRequests;this.readyState="";this.agent=opts.agent||false;this.socket=opts.socket;this.enablesXDR=opts.enablesXDR;this.pfx=opts.pfx;this.key=opts.key;this.passphrase=opts.passphrase;this.cert=opts.cert;this.ca=opts.ca;this.ciphers=opts.ciphers;this.rejectUnauthorized=opts.rejectUnauthorized}Emitter(Transport.prototype);Transport.timestamps=0;Transport.prototype.onError=function(msg,desc){var err=new Error(msg);err.type="TransportError";err.description=desc;this.emit("error",err);return this};Transport.prototype.open=function(){if("closed"==this.readyState||""==this.readyState){this.readyState="opening";this.doOpen()}return this};Transport.prototype.close=function(){if("opening"==this.readyState||"open"==this.readyState){this.doClose();this.onClose()}return this};Transport.prototype.send=function(packets){if("open"==this.readyState){this.write(packets)}else{throw new Error("Transport not open")}};Transport.prototype.onOpen=function(){this.readyState="open";this.writable=true;this.emit("open")};Transport.prototype.onData=function(data){var packet=parser.decodePacket(data,this.socket.binaryType);this.onPacket(packet)};Transport.prototype.onPacket=function(packet){this.emit("packet",packet)};Transport.prototype.onClose=function(){this.readyState="closed";this.emit("close")}},{"component-emitter":9,"engine.io-parser":25}],15:[function(_dereq_,module,exports){(function(global){var XMLHttpRequest=_dereq_("xmlhttprequest");var XHR=_dereq_("./polling-xhr");var JSONP=_dereq_("./polling-jsonp");var websocket=_dereq_("./websocket");exports.polling=polling;exports.websocket=websocket;function polling(opts){var xhr;var xd=false;var xs=false;var jsonp=false!==opts.jsonp;if(global.location){var isSSL="https:"==location.protocol;var port=location.port;if(!port){port=isSSL?443:80}xd=opts.hostname!=location.hostname||port!=opts.port;xs=opts.secure!=isSSL}opts.xdomain=xd;opts.xscheme=xs;xhr=new XMLHttpRequest(opts);if("open"in xhr&&!opts.forceJSONP){return new XHR(opts)}else{if(!jsonp)throw new Error("JSONP disabled");return new JSONP(opts)}}}).call(this,typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{"./polling-jsonp":16,"./polling-xhr":17,"./websocket":19,xmlhttprequest:20}],16:[function(_dereq_,module,exports){(function(global){var Polling=_dereq_("./polling");var inherit=_dereq_("component-inherit");module.exports=JSONPPolling;var rNewline=/\n/g;var rEscapedNewline=/\\n/g;var callbacks;var index=0;function empty(){}function JSONPPolling(opts){Polling.call(this,opts); this.query=this.query||{};if(!callbacks){if(!global.___eio)global.___eio=[];callbacks=global.___eio}this.index=callbacks.length;var self=this;callbacks.push(function(msg){self.onData(msg)});this.query.j=this.index;if(global.document&&global.addEventListener){global.addEventListener("beforeunload",function(){if(self.script)self.script.onerror=empty},false)}}inherit(JSONPPolling,Polling);JSONPPolling.prototype.supportsBinary=false;JSONPPolling.prototype.doClose=function(){if(this.script){this.script.parentNode.removeChild(this.script);this.script=null}if(this.form){this.form.parentNode.removeChild(this.form);this.form=null;this.iframe=null}Polling.prototype.doClose.call(this)};JSONPPolling.prototype.doPoll=function(){var self=this;var script=document.createElement("script");if(this.script){this.script.parentNode.removeChild(this.script);this.script=null}script.async=true;script.src=this.uri();script.onerror=function(e){self.onError("jsonp poll error",e)};var insertAt=document.getElementsByTagName("script")[0];insertAt.parentNode.insertBefore(script,insertAt);this.script=script;var isUAgecko="undefined"!=typeof navigator&&/gecko/i.test(navigator.userAgent);if(isUAgecko){setTimeout(function(){var iframe=document.createElement("iframe");document.body.appendChild(iframe);document.body.removeChild(iframe)},100)}};JSONPPolling.prototype.doWrite=function(data,fn){var self=this;if(!this.form){var form=document.createElement("form");var area=document.createElement("textarea");var id=this.iframeId="eio_iframe_"+this.index;var iframe;form.className="socketio";form.style.position="absolute";form.style.top="-1000px";form.style.left="-1000px";form.target=id;form.method="POST";form.setAttribute("accept-charset","utf-8");area.name="d";form.appendChild(area);document.body.appendChild(form);this.form=form;this.area=area}this.form.action=this.uri();function complete(){initIframe();fn()}function initIframe(){if(self.iframe){try{self.form.removeChild(self.iframe)}catch(e){self.onError("jsonp polling iframe removal error",e)}}try{var html='<iframe src="javascript:0" name="'+self.iframeId+'">';iframe=document.createElement(html)}catch(e){iframe=document.createElement("iframe");iframe.name=self.iframeId;iframe.src="javascript:0"}iframe.id=self.iframeId;self.form.appendChild(iframe);self.iframe=iframe}initIframe();data=data.replace(rEscapedNewline,"\\\n");this.area.value=data.replace(rNewline,"\\n");try{this.form.submit()}catch(e){}if(this.iframe.attachEvent){this.iframe.onreadystatechange=function(){if(self.iframe.readyState=="complete"){complete()}}}else{this.iframe.onload=complete}}}).call(this,typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{"./polling":18,"component-inherit":21}],17:[function(_dereq_,module,exports){(function(global){var XMLHttpRequest=_dereq_("xmlhttprequest");var Polling=_dereq_("./polling");var Emitter=_dereq_("component-emitter");var inherit=_dereq_("component-inherit");var debug=_dereq_("debug")("engine.io-client:polling-xhr");module.exports=XHR;module.exports.Request=Request;function empty(){}function XHR(opts){Polling.call(this,opts);if(global.location){var isSSL="https:"==location.protocol;var port=location.port;if(!port){port=isSSL?443:80}this.xd=opts.hostname!=global.location.hostname||port!=opts.port;this.xs=opts.secure!=isSSL}}inherit(XHR,Polling);XHR.prototype.supportsBinary=true;XHR.prototype.request=function(opts){opts=opts||{};opts.uri=this.uri();opts.xd=this.xd;opts.xs=this.xs;opts.agent=this.agent||false;opts.supportsBinary=this.supportsBinary;opts.enablesXDR=this.enablesXDR;opts.pfx=this.pfx;opts.key=this.key;opts.passphrase=this.passphrase;opts.cert=this.cert;opts.ca=this.ca;opts.ciphers=this.ciphers;opts.rejectUnauthorized=this.rejectUnauthorized;return new Request(opts)};XHR.prototype.doWrite=function(data,fn){var isBinary=typeof data!=="string"&&data!==undefined;var req=this.request({method:"POST",data:data,isBinary:isBinary});var self=this;req.on("success",fn);req.on("error",function(err){self.onError("xhr post error",err)});this.sendXhr=req};XHR.prototype.doPoll=function(){debug("xhr poll");var req=this.request();var self=this;req.on("data",function(data){self.onData(data)});req.on("error",function(err){self.onError("xhr poll error",err)});this.pollXhr=req};function Request(opts){this.method=opts.method||"GET";this.uri=opts.uri;this.xd=!!opts.xd;this.xs=!!opts.xs;this.async=false!==opts.async;this.data=undefined!=opts.data?opts.data:null;this.agent=opts.agent;this.isBinary=opts.isBinary;this.supportsBinary=opts.supportsBinary;this.enablesXDR=opts.enablesXDR;this.pfx=opts.pfx;this.key=opts.key;this.passphrase=opts.passphrase;this.cert=opts.cert;this.ca=opts.ca;this.ciphers=opts.ciphers;this.rejectUnauthorized=opts.rejectUnauthorized;this.create()}Emitter(Request.prototype);Request.prototype.create=function(){var opts={agent:this.agent,xdomain:this.xd,xscheme:this.xs,enablesXDR:this.enablesXDR};opts.pfx=this.pfx;opts.key=this.key;opts.passphrase=this.passphrase;opts.cert=this.cert;opts.ca=this.ca;opts.ciphers=this.ciphers;opts.rejectUnauthorized=this.rejectUnauthorized;var xhr=this.xhr=new XMLHttpRequest(opts);var self=this;try{debug("xhr open %s: %s",this.method,this.uri);xhr.open(this.method,this.uri,this.async);if(this.supportsBinary){xhr.responseType="arraybuffer"}if("POST"==this.method){try{if(this.isBinary){xhr.setRequestHeader("Content-type","application/octet-stream")}else{xhr.setRequestHeader("Content-type","text/plain;charset=UTF-8")}}catch(e){}}if("withCredentials"in xhr){xhr.withCredentials=true}if(this.hasXDR()){xhr.onload=function(){self.onLoad()};xhr.onerror=function(){self.onError(xhr.responseText)}}else{xhr.onreadystatechange=function(){if(4!=xhr.readyState)return;if(200==xhr.status||1223==xhr.status){self.onLoad()}else{setTimeout(function(){self.onError(xhr.status)},0)}}}debug("xhr data %s",this.data);xhr.send(this.data)}catch(e){setTimeout(function(){self.onError(e)},0);return}if(global.document){this.index=Request.requestsCount++;Request.requests[this.index]=this}};Request.prototype.onSuccess=function(){this.emit("success");this.cleanup()};Request.prototype.onData=function(data){this.emit("data",data);this.onSuccess()};Request.prototype.onError=function(err){this.emit("error",err);this.cleanup(true)};Request.prototype.cleanup=function(fromError){if("undefined"==typeof this.xhr||null===this.xhr){return}if(this.hasXDR()){this.xhr.onload=this.xhr.onerror=empty}else{this.xhr.onreadystatechange=empty}if(fromError){try{this.xhr.abort()}catch(e){}}if(global.document){delete Request.requests[this.index]}this.xhr=null};Request.prototype.onLoad=function(){var data;try{var contentType;try{contentType=this.xhr.getResponseHeader("Content-Type").split(";")[0]}catch(e){}if(contentType==="application/octet-stream"){data=this.xhr.response}else{if(!this.supportsBinary){data=this.xhr.responseText}else{data="ok"}}}catch(e){this.onError(e)}if(null!=data){this.onData(data)}};Request.prototype.hasXDR=function(){return"undefined"!==typeof global.XDomainRequest&&!this.xs&&this.enablesXDR};Request.prototype.abort=function(){this.cleanup()};if(global.document){Request.requestsCount=0;Request.requests={};if(global.attachEvent){global.attachEvent("onunload",unloadHandler)}else if(global.addEventListener){global.addEventListener("beforeunload",unloadHandler,false)}}function unloadHandler(){for(var i in Request.requests){if(Request.requests.hasOwnProperty(i)){Request.requests[i].abort()}}}}).call(this,typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{"./polling":18,"component-emitter":9,"component-inherit":21,debug:22,xmlhttprequest:20}],18:[function(_dereq_,module,exports){var Transport=_dereq_("../transport");var parseqs=_dereq_("parseqs");var parser=_dereq_("engine.io-parser");var inherit=_dereq_("component-inherit");var debug=_dereq_("debug")("engine.io-client:polling");module.exports=Polling;var hasXHR2=function(){var XMLHttpRequest=_dereq_("xmlhttprequest");var xhr=new XMLHttpRequest({xdomain:false});return null!=xhr.responseType}();function Polling(opts){var forceBase64=opts&&opts.forceBase64;if(!hasXHR2||forceBase64){this.supportsBinary=false}Transport.call(this,opts)}inherit(Polling,Transport);Polling.prototype.name="polling";Polling.prototype.doOpen=function(){this.poll()};Polling.prototype.pause=function(onPause){var pending=0;var self=this;this.readyState="pausing";function pause(){debug("paused");self.readyState="paused";onPause()}if(this.polling||!this.writable){var total=0;if(this.polling){debug("we are currently polling - waiting to pause");total++;this.once("pollComplete",function(){debug("pre-pause polling complete");--total||pause()})}if(!this.writable){debug("we are currently writing - waiting to pause");total++;this.once("drain",function(){debug("pre-pause writing complete");--total||pause()})}}else{pause()}};Polling.prototype.poll=function(){debug("polling");this.polling=true;this.doPoll();this.emit("poll")};Polling.prototype.onData=function(data){var self=this;debug("polling got data %s",data);var callback=function(packet,index,total){if("opening"==self.readyState){self.onOpen()}if("close"==packet.type){self.onClose();return false}self.onPacket(packet)};parser.decodePayload(data,this.socket.binaryType,callback);if("closed"!=this.readyState){this.polling=false;this.emit("pollComplete");if("open"==this.readyState){this.poll()}else{debug('ignoring poll - transport state "%s"',this.readyState)}}};Polling.prototype.doClose=function(){var self=this;function close(){debug("writing close packet");self.write([{type:"close"}])}if("open"==this.readyState){debug("transport open - closing");close()}else{debug("transport not open - deferring close");this.once("open",close)}};Polling.prototype.write=function(packets){var self=this;this.writable=false;var callbackfn=function(){self.writable=true;self.emit("drain")};var self=this;parser.encodePayload(packets,this.supportsBinary,function(data){self.doWrite(data,callbackfn)})};Polling.prototype.uri=function(){var query=this.query||{};var schema=this.secure?"https":"http";var port="";if(false!==this.timestampRequests){query[this.timestampParam]=+new Date+"-"+Transport.timestamps++}if(!this.supportsBinary&&!query.sid){query.b64=1}query=parseqs.encode(query);if(this.port&&("https"==schema&&this.port!=443||"http"==schema&&this.port!=80)){port=":"+this.port}if(query.length){query="?"+query}return schema+"://"+this.hostname+port+this.path+query}},{"../transport":14,"component-inherit":21,debug:22,"engine.io-parser":25,parseqs:33,xmlhttprequest:20}],19:[function(_dereq_,module,exports){var Transport=_dereq_("../transport");var parser=_dereq_("engine.io-parser");var parseqs=_dereq_("parseqs");var inherit=_dereq_("component-inherit");var debug=_dereq_("debug")("engine.io-client:websocket");var WebSocket=_dereq_("ws");module.exports=WS;function WS(opts){var forceBase64=opts&&opts.forceBase64;if(forceBase64){this.supportsBinary=false}Transport.call(this,opts)}inherit(WS,Transport);WS.prototype.name="websocket";WS.prototype.supportsBinary=true;WS.prototype.doOpen=function(){if(!this.check()){return}var self=this;var uri=this.uri();var protocols=void 0;var opts={agent:this.agent};opts.pfx=this.pfx;opts.key=this.key;opts.passphrase=this.passphrase;opts.cert=this.cert;opts.ca=this.ca;opts.ciphers=this.ciphers;opts.rejectUnauthorized=this.rejectUnauthorized;this.ws=new WebSocket(uri,protocols,opts);if(this.ws.binaryType===undefined){this.supportsBinary=false}this.ws.binaryType="arraybuffer";this.addEventListeners()};WS.prototype.addEventListeners=function(){var self=this;this.ws.onopen=function(){self.onOpen()};this.ws.onclose=function(){self.onClose()};this.ws.onmessage=function(ev){self.onData(ev.data)};this.ws.onerror=function(e){self.onError("websocket error",e)}};if("undefined"!=typeof navigator&&/iPad|iPhone|iPod/i.test(navigator.userAgent)){WS.prototype.onData=function(data){var self=this;setTimeout(function(){Transport.prototype.onData.call(self,data)},0)}}WS.prototype.write=function(packets){var self=this;this.writable=false;for(var i=0,l=packets.length;i<l;i++){parser.encodePacket(packets[i],this.supportsBinary,function(data){try{self.ws.send(data)}catch(e){debug("websocket closed before onclose event")}})}function ondrain(){self.writable=true;self.emit("drain")}setTimeout(ondrain,0)};WS.prototype.onClose=function(){Transport.prototype.onClose.call(this)};WS.prototype.doClose=function(){if(typeof this.ws!=="undefined"){this.ws.close()}};WS.prototype.uri=function(){var query=this.query||{};var schema=this.secure?"wss":"ws";var port="";if(this.port&&("wss"==schema&&this.port!=443||"ws"==schema&&this.port!=80)){port=":"+this.port}if(this.timestampRequests){query[this.timestampParam]=+new Date}if(!this.supportsBinary){query.b64=1}query=parseqs.encode(query);if(query.length){query="?"+query}return schema+"://"+this.hostname+port+this.path+query};WS.prototype.check=function(){return!!WebSocket&&!("__initialize"in WebSocket&&this.name===WS.prototype.name)}},{"../transport":14,"component-inherit":21,debug:22,"engine.io-parser":25,parseqs:33,ws:35}],20:[function(_dereq_,module,exports){var hasCORS=_dereq_("has-cors");module.exports=function(opts){var xdomain=opts.xdomain;var xscheme=opts.xscheme;var enablesXDR=opts.enablesXDR;try{if("undefined"!=typeof XMLHttpRequest&&(!xdomain||hasCORS)){return new XMLHttpRequest}}catch(e){}try{if("undefined"!=typeof XDomainRequest&&!xscheme&&enablesXDR){return new XDomainRequest}}catch(e){}if(!xdomain){try{return new ActiveXObject("Microsoft.XMLHTTP")}catch(e){}}}},{"has-cors":38}],21:[function(_dereq_,module,exports){module.exports=function(a,b){var fn=function(){};fn.prototype=b.prototype;a.prototype=new fn;a.prototype.constructor=a}},{}],22:[function(_dereq_,module,exports){exports=module.exports=_dereq_("./debug");exports.log=log;exports.formatArgs=formatArgs;exports.save=save;exports.load=load;exports.useColors=useColors;exports.colors=["lightseagreen","forestgreen","goldenrod","dodgerblue","darkorchid","crimson"];function useColors(){return"WebkitAppearance"in document.documentElement.style||window.console&&(console.firebug||console.exception&&console.table)||navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)&&parseInt(RegExp.$1,10)>=31}exports.formatters.j=function(v){return JSON.stringify(v)};function formatArgs(){var args=arguments;var useColors=this.useColors;args[0]=(useColors?"%c":"")+this.namespace+(useColors?" %c":" ")+args[0]+(useColors?"%c ":" ")+"+"+exports.humanize(this.diff);if(!useColors)return args;var c="color: "+this.color;args=[args[0],c,"color: inherit"].concat(Array.prototype.slice.call(args,1));var index=0;var lastC=0;args[0].replace(/%[a-z%]/g,function(match){if("%%"===match)return;index++;if("%c"===match){lastC=index}});args.splice(lastC,0,c);return args}function log(){return"object"==typeof console&&"function"==typeof console.log&&Function.prototype.apply.call(console.log,console,arguments)}function save(namespaces){try{if(null==namespaces){localStorage.removeItem("debug")}else{localStorage.debug=namespaces}}catch(e){}}function load(){var r;try{r=localStorage.debug}catch(e){}return r}exports.enable(load())},{"./debug":23}],23:[function(_dereq_,module,exports){exports=module.exports=debug;exports.coerce=coerce;exports.disable=disable;exports.enable=enable;exports.enabled=enabled;exports.humanize=_dereq_("ms");exports.names=[];exports.skips=[];exports.formatters={};var prevColor=0;var prevTime;function selectColor(){return exports.colors[prevColor++%exports.colors.length]}function debug(namespace){function disabled(){}disabled.enabled=false;function enabled(){var self=enabled;var curr=+new Date;var ms=curr-(prevTime||curr);self.diff=ms;self.prev=prevTime;self.curr=curr;prevTime=curr;if(null==self.useColors)self.useColors=exports.useColors();if(null==self.color&&self.useColors)self.color=selectColor();var args=Array.prototype.slice.call(arguments);args[0]=exports.coerce(args[0]);if("string"!==typeof args[0]){args=["%o"].concat(args)}var index=0;args[0]=args[0].replace(/%([a-z%])/g,function(match,format){if(match==="%%")return match;index++;var formatter=exports.formatters[format];if("function"===typeof formatter){var val=args[index];match=formatter.call(self,val);args.splice(index,1);index--}return match});if("function"===typeof exports.formatArgs){args=exports.formatArgs.apply(self,args)}var logFn=enabled.log||exports.log||console.log.bind(console);logFn.apply(self,args)}enabled.enabled=true;var fn=exports.enabled(namespace)?enabled:disabled;fn.namespace=namespace;return fn}function enable(namespaces){exports.save(namespaces);var split=(namespaces||"").split(/[\s,]+/);var len=split.length;for(var i=0;i<len;i++){if(!split[i])continue;namespaces=split[i].replace(/\*/g,".*?");if(namespaces[0]==="-"){exports.skips.push(new RegExp("^"+namespaces.substr(1)+"$"))}else{exports.names.push(new RegExp("^"+namespaces+"$"))}}}function disable(){exports.enable("")}function enabled(name){var i,len;for(i=0,len=exports.skips.length;i<len;i++){if(exports.skips[i].test(name)){return false}}for(i=0,len=exports.names.length;i<len;i++){if(exports.names[i].test(name)){return true}}return false}function coerce(val){if(val instanceof Error)return val.stack||val.message;return val}},{ms:24}],24:[function(_dereq_,module,exports){var s=1e3;var m=s*60;var h=m*60;var d=h*24;var y=d*365.25;module.exports=function(val,options){options=options||{};if("string"==typeof val)return parse(val);return options.long?long(val):short(val)};function parse(str){var match=/^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);if(!match)return;var n=parseFloat(match[1]);var type=(match[2]||"ms").toLowerCase();switch(type){case"years":case"year":case"y":return n*y;case"days":case"day":case"d":return n*d;case"hours":case"hour":case"h":return n*h;case"minutes":case"minute":case"m":return n*m;case"seconds":case"second":case"s":return n*s;case"ms":return n}}function short(ms){if(ms>=d)return Math.round(ms/d)+"d";if(ms>=h)return Math.round(ms/h)+"h";if(ms>=m)return Math.round(ms/m)+"m";if(ms>=s)return Math.round(ms/s)+"s";return ms+"ms"}function long(ms){return plural(ms,d,"day")||plural(ms,h,"hour")||plural(ms,m,"minute")||plural(ms,s,"second")||ms+" ms"}function plural(ms,n,name){if(ms<n)return;if(ms<n*1.5)return Math.floor(ms/n)+" "+name;return Math.ceil(ms/n)+" "+name+"s"}},{}],25:[function(_dereq_,module,exports){(function(global){var keys=_dereq_("./keys");var hasBinary=_dereq_("has-binary");var sliceBuffer=_dereq_("arraybuffer.slice");var base64encoder=_dereq_("base64-arraybuffer");var after=_dereq_("after");var utf8=_dereq_("utf8");var isAndroid=navigator.userAgent.match(/Android/i);var isPhantomJS=/PhantomJS/i.test(navigator.userAgent);var dontSendBlobs=isAndroid||isPhantomJS;exports.protocol=3;var packets=exports.packets={open:0,close:1,ping:2,pong:3,message:4,upgrade:5,noop:6};var packetslist=keys(packets);var err={type:"error",data:"parser error"};var Blob=_dereq_("blob");exports.encodePacket=function(packet,supportsBinary,utf8encode,callback){if("function"==typeof supportsBinary){callback=supportsBinary;supportsBinary=false}if("function"==typeof utf8encode){callback=utf8encode;utf8encode=null}var data=packet.data===undefined?undefined:packet.data.buffer||packet.data;if(global.ArrayBuffer&&data instanceof ArrayBuffer){return encodeArrayBuffer(packet,supportsBinary,callback)}else if(Blob&&data instanceof global.Blob){return encodeBlob(packet,supportsBinary,callback)}if(data&&data.base64){return encodeBase64Object(packet,callback)}var encoded=packets[packet.type];if(undefined!==packet.data){encoded+=utf8encode?utf8.encode(String(packet.data)):String(packet.data)}return callback(""+encoded)};function encodeBase64Object(packet,callback){var message="b"+exports.packets[packet.type]+packet.data.data;return callback(message)}function encodeArrayBuffer(packet,supportsBinary,callback){if(!supportsBinary){return exports.encodeBase64Packet(packet,callback)}var data=packet.data;var contentArray=new Uint8Array(data);var resultBuffer=new Uint8Array(1+data.byteLength);resultBuffer[0]=packets[packet.type];for(var i=0;i<contentArray.length;i++){resultBuffer[i+1]=contentArray[i]}return callback(resultBuffer.buffer)}function encodeBlobAsArrayBuffer(packet,supportsBinary,callback){if(!supportsBinary){return exports.encodeBase64Packet(packet,callback)}var fr=new FileReader;fr.onload=function(){packet.data=fr.result;exports.encodePacket(packet,supportsBinary,true,callback)};return fr.readAsArrayBuffer(packet.data)}function encodeBlob(packet,supportsBinary,callback){if(!supportsBinary){return exports.encodeBase64Packet(packet,callback)}if(dontSendBlobs){return encodeBlobAsArrayBuffer(packet,supportsBinary,callback)}var length=new Uint8Array(1);length[0]=packets[packet.type];var blob=new Blob([length.buffer,packet.data]);return callback(blob)}exports.encodeBase64Packet=function(packet,callback){var message="b"+exports.packets[packet.type];if(Blob&&packet.data instanceof Blob){var fr=new FileReader;fr.onload=function(){var b64=fr.result.split(",")[1];callback(message+b64)};return fr.readAsDataURL(packet.data)}var b64data;try{b64data=String.fromCharCode.apply(null,new Uint8Array(packet.data))}catch(e){var typed=new Uint8Array(packet.data);var basic=new Array(typed.length);for(var i=0;i<typed.length;i++){basic[i]=typed[i]}b64data=String.fromCharCode.apply(null,basic)}message+=global.btoa(b64data);return callback(message)};exports.decodePacket=function(data,binaryType,utf8decode){if(typeof data=="string"||data===undefined){if(data.charAt(0)=="b"){return exports.decodeBase64Packet(data.substr(1),binaryType)}if(utf8decode){try{data=utf8.decode(data)}catch(e){return err}}var type=data.charAt(0);if(Number(type)!=type||!packetslist[type]){return err}if(data.length>1){return{type:packetslist[type],data:data.substring(1)}}else{return{type:packetslist[type]}}}var asArray=new Uint8Array(data);var type=asArray[0];var rest=sliceBuffer(data,1);if(Blob&&binaryType==="blob"){rest=new Blob([rest])}return{type:packetslist[type],data:rest}};exports.decodeBase64Packet=function(msg,binaryType){var type=packetslist[msg.charAt(0)];if(!global.ArrayBuffer){return{type:type,data:{base64:true,data:msg.substr(1)}}}var data=base64encoder.decode(msg.substr(1));if(binaryType==="blob"&&Blob){data=new Blob([data])}return{type:type,data:data}};exports.encodePayload=function(packets,supportsBinary,callback){if(typeof supportsBinary=="function"){callback=supportsBinary;supportsBinary=null}var isBinary=hasBinary(packets);if(supportsBinary&&isBinary){if(Blob&&!dontSendBlobs){return exports.encodePayloadAsBlob(packets,callback)}return exports.encodePayloadAsArrayBuffer(packets,callback)}if(!packets.length){return callback("0:")}function setLengthHeader(message){return message.length+":"+message}function encodeOne(packet,doneCallback){exports.encodePacket(packet,!isBinary?false:supportsBinary,true,function(message){doneCallback(null,setLengthHeader(message))})}map(packets,encodeOne,function(err,results){return callback(results.join(""))})};function map(ary,each,done){var result=new Array(ary.length);var next=after(ary.length,done);var eachWithIndex=function(i,el,cb){each(el,function(error,msg){result[i]=msg;cb(error,result)})};for(var i=0;i<ary.length;i++){eachWithIndex(i,ary[i],next)}}exports.decodePayload=function(data,binaryType,callback){if(typeof data!="string"){return exports.decodePayloadAsBinary(data,binaryType,callback)}if(typeof binaryType==="function"){callback=binaryType;binaryType=null}var packet;if(data==""){return callback(err,0,1)}var length="",n,msg;for(var i=0,l=data.length;i<l;i++){var chr=data.charAt(i);if(":"!=chr){length+=chr}else{if(""==length||length!=(n=Number(length))){return callback(err,0,1)}msg=data.substr(i+1,n);if(length!=msg.length){return callback(err,0,1)}if(msg.length){packet=exports.decodePacket(msg,binaryType,true);if(err.type==packet.type&&err.data==packet.data){return callback(err,0,1)}var ret=callback(packet,i+n,l);if(false===ret)return}i+=n;length=""}}if(length!=""){return callback(err,0,1)}};exports.encodePayloadAsArrayBuffer=function(packets,callback){if(!packets.length){return callback(new ArrayBuffer(0))}function encodeOne(packet,doneCallback){exports.encodePacket(packet,true,true,function(data){return doneCallback(null,data)})}map(packets,encodeOne,function(err,encodedPackets){var totalLength=encodedPackets.reduce(function(acc,p){var len;if(typeof p==="string"){len=p.length}else{len=p.byteLength}return acc+len.toString().length+len+2},0);var resultArray=new Uint8Array(totalLength);var bufferIndex=0;encodedPackets.forEach(function(p){var isString=typeof p==="string";var ab=p;if(isString){var view=new Uint8Array(p.length);for(var i=0;i<p.length;i++){view[i]=p.charCodeAt(i)}ab=view.buffer}if(isString){resultArray[bufferIndex++]=0}else{resultArray[bufferIndex++]=1}var lenStr=ab.byteLength.toString();for(var i=0;i<lenStr.length;i++){resultArray[bufferIndex++]=parseInt(lenStr[i])}resultArray[bufferIndex++]=255;var view=new Uint8Array(ab);for(var i=0;i<view.length;i++){resultArray[bufferIndex++]=view[i]}});return callback(resultArray.buffer)})};exports.encodePayloadAsBlob=function(packets,callback){function encodeOne(packet,doneCallback){exports.encodePacket(packet,true,true,function(encoded){var binaryIdentifier=new Uint8Array(1);binaryIdentifier[0]=1;if(typeof encoded==="string"){var view=new Uint8Array(encoded.length);for(var i=0;i<encoded.length;i++){view[i]=encoded.charCodeAt(i)}encoded=view.buffer;binaryIdentifier[0]=0}var len=encoded instanceof ArrayBuffer?encoded.byteLength:encoded.size;var lenStr=len.toString();var lengthAry=new Uint8Array(lenStr.length+1);for(var i=0;i<lenStr.length;i++){lengthAry[i]=parseInt(lenStr[i])}lengthAry[lenStr.length]=255;if(Blob){var blob=new Blob([binaryIdentifier.buffer,lengthAry.buffer,encoded]);doneCallback(null,blob)}})}map(packets,encodeOne,function(err,results){return callback(new Blob(results))})};exports.decodePayloadAsBinary=function(data,binaryType,callback){if(typeof binaryType==="function"){callback=binaryType;binaryType=null}var bufferTail=data;var buffers=[];var numberTooLong=false;while(bufferTail.byteLength>0){var tailArray=new Uint8Array(bufferTail);var isString=tailArray[0]===0;var msgLength="";for(var i=1;;i++){if(tailArray[i]==255)break;if(msgLength.length>310){numberTooLong=true;break}msgLength+=tailArray[i]}if(numberTooLong)return callback(err,0,1);bufferTail=sliceBuffer(bufferTail,2+msgLength.length);msgLength=parseInt(msgLength);var msg=sliceBuffer(bufferTail,0,msgLength);if(isString){try{msg=String.fromCharCode.apply(null,new Uint8Array(msg))}catch(e){var typed=new Uint8Array(msg);msg="";for(var i=0;i<typed.length;i++){msg+=String.fromCharCode(typed[i])}}}buffers.push(msg);bufferTail=sliceBuffer(bufferTail,msgLength)}var total=buffers.length;buffers.forEach(function(buffer,i){callback(exports.decodePacket(buffer,binaryType,true),i,total)})}}).call(this,typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{"./keys":26,after:27,"arraybuffer.slice":28,"base64-arraybuffer":29,blob:30,"has-binary":36,utf8:31}],26:[function(_dereq_,module,exports){module.exports=Object.keys||function keys(obj){var arr=[];var has=Object.prototype.hasOwnProperty;for(var i in obj){if(has.call(obj,i)){arr.push(i)}}return arr}},{}],27:[function(_dereq_,module,exports){module.exports=after;function after(count,callback,err_cb){var bail=false;err_cb=err_cb||noop;proxy.count=count;return count===0?callback():proxy;function proxy(err,result){if(proxy.count<=0){throw new Error("after called too many times")}--proxy.count;if(err){bail=true;callback(err);callback=err_cb}else if(proxy.count===0&&!bail){callback(null,result)}}}function noop(){}},{}],28:[function(_dereq_,module,exports){module.exports=function(arraybuffer,start,end){var bytes=arraybuffer.byteLength;start=start||0;end=end||bytes;if(arraybuffer.slice){return arraybuffer.slice(start,end)}if(start<0){start+=bytes}if(end<0){end+=bytes}if(end>bytes){end=bytes}if(start>=bytes||start>=end||bytes===0){return new ArrayBuffer(0)}var abv=new Uint8Array(arraybuffer);var result=new Uint8Array(end-start);for(var i=start,ii=0;i<end;i++,ii++){result[ii]=abv[i]}return result.buffer}},{}],29:[function(_dereq_,module,exports){(function(chars){"use strict";exports.encode=function(arraybuffer){var bytes=new Uint8Array(arraybuffer),i,len=bytes.length,base64="";for(i=0;i<len;i+=3){base64+=chars[bytes[i]>>2];base64+=chars[(bytes[i]&3)<<4|bytes[i+1]>>4];base64+=chars[(bytes[i+1]&15)<<2|bytes[i+2]>>6];base64+=chars[bytes[i+2]&63]}if(len%3===2){base64=base64.substring(0,base64.length-1)+"="}else if(len%3===1){base64=base64.substring(0,base64.length-2)+"=="}return base64};exports.decode=function(base64){var bufferLength=base64.length*.75,len=base64.length,i,p=0,encoded1,encoded2,encoded3,encoded4;if(base64[base64.length-1]==="="){bufferLength--;if(base64[base64.length-2]==="="){bufferLength--}}var arraybuffer=new ArrayBuffer(bufferLength),bytes=new Uint8Array(arraybuffer);for(i=0;i<len;i+=4){encoded1=chars.indexOf(base64[i]);encoded2=chars.indexOf(base64[i+1]);encoded3=chars.indexOf(base64[i+2]);encoded4=chars.indexOf(base64[i+3]);bytes[p++]=encoded1<<2|encoded2>>4;bytes[p++]=(encoded2&15)<<4|encoded3>>2;bytes[p++]=(encoded3&3)<<6|encoded4&63}return arraybuffer}})("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/")},{}],30:[function(_dereq_,module,exports){(function(global){var BlobBuilder=global.BlobBuilder||global.WebKitBlobBuilder||global.MSBlobBuilder||global.MozBlobBuilder;var blobSupported=function(){try{var a=new Blob(["hi"]);return a.size===2}catch(e){return false}}();var blobSupportsArrayBufferView=blobSupported&&function(){try{var b=new Blob([new Uint8Array([1,2])]);return b.size===2}catch(e){return false}}();var blobBuilderSupported=BlobBuilder&&BlobBuilder.prototype.append&&BlobBuilder.prototype.getBlob;function mapArrayBufferViews(ary){for(var i=0;i<ary.length;i++){var chunk=ary[i];if(chunk.buffer instanceof ArrayBuffer){var buf=chunk.buffer;if(chunk.byteLength!==buf.byteLength){var copy=new Uint8Array(chunk.byteLength);copy.set(new Uint8Array(buf,chunk.byteOffset,chunk.byteLength));buf=copy.buffer}ary[i]=buf}}}function BlobBuilderConstructor(ary,options){options=options||{};var bb=new BlobBuilder;mapArrayBufferViews(ary);for(var i=0;i<ary.length;i++){bb.append(ary[i])}return options.type?bb.getBlob(options.type):bb.getBlob()}function BlobConstructor(ary,options){mapArrayBufferViews(ary);return new Blob(ary,options||{})}module.exports=function(){if(blobSupported){return blobSupportsArrayBufferView?global.Blob:BlobConstructor}else if(blobBuilderSupported){return BlobBuilderConstructor}else{return undefined}}()}).call(this,typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{}],31:[function(_dereq_,module,exports){(function(global){(function(root){var freeExports=typeof exports=="object"&&exports;var freeModule=typeof module=="object"&&module&&module.exports==freeExports&&module;var freeGlobal=typeof global=="object"&&global;if(freeGlobal.global===freeGlobal||freeGlobal.window===freeGlobal){root=freeGlobal}var stringFromCharCode=String.fromCharCode;function ucs2decode(string){var output=[];var counter=0;var length=string.length;var value;var extra;while(counter<length){value=string.charCodeAt(counter++);if(value>=55296&&value<=56319&&counter<length){extra=string.charCodeAt(counter++);if((extra&64512)==56320){output.push(((value&1023)<<10)+(extra&1023)+65536)}else{output.push(value);counter--}}else{output.push(value)}}return output}function ucs2encode(array){var length=array.length;var index=-1;var value;var output="";while(++index<length){value=array[index];if(value>65535){value-=65536;output+=stringFromCharCode(value>>>10&1023|55296);value=56320|value&1023}output+=stringFromCharCode(value)}return output}function checkScalarValue(codePoint){if(codePoint>=55296&&codePoint<=57343){throw Error("Lone surrogate U+"+codePoint.toString(16).toUpperCase()+" is not a scalar value") }}function createByte(codePoint,shift){return stringFromCharCode(codePoint>>shift&63|128)}function encodeCodePoint(codePoint){if((codePoint&4294967168)==0){return stringFromCharCode(codePoint)}var symbol="";if((codePoint&4294965248)==0){symbol=stringFromCharCode(codePoint>>6&31|192)}else if((codePoint&4294901760)==0){checkScalarValue(codePoint);symbol=stringFromCharCode(codePoint>>12&15|224);symbol+=createByte(codePoint,6)}else if((codePoint&4292870144)==0){symbol=stringFromCharCode(codePoint>>18&7|240);symbol+=createByte(codePoint,12);symbol+=createByte(codePoint,6)}symbol+=stringFromCharCode(codePoint&63|128);return symbol}function utf8encode(string){var codePoints=ucs2decode(string);var length=codePoints.length;var index=-1;var codePoint;var byteString="";while(++index<length){codePoint=codePoints[index];byteString+=encodeCodePoint(codePoint)}return byteString}function readContinuationByte(){if(byteIndex>=byteCount){throw Error("Invalid byte index")}var continuationByte=byteArray[byteIndex]&255;byteIndex++;if((continuationByte&192)==128){return continuationByte&63}throw Error("Invalid continuation byte")}function decodeSymbol(){var byte1;var byte2;var byte3;var byte4;var codePoint;if(byteIndex>byteCount){throw Error("Invalid byte index")}if(byteIndex==byteCount){return false}byte1=byteArray[byteIndex]&255;byteIndex++;if((byte1&128)==0){return byte1}if((byte1&224)==192){var byte2=readContinuationByte();codePoint=(byte1&31)<<6|byte2;if(codePoint>=128){return codePoint}else{throw Error("Invalid continuation byte")}}if((byte1&240)==224){byte2=readContinuationByte();byte3=readContinuationByte();codePoint=(byte1&15)<<12|byte2<<6|byte3;if(codePoint>=2048){checkScalarValue(codePoint);return codePoint}else{throw Error("Invalid continuation byte")}}if((byte1&248)==240){byte2=readContinuationByte();byte3=readContinuationByte();byte4=readContinuationByte();codePoint=(byte1&15)<<18|byte2<<12|byte3<<6|byte4;if(codePoint>=65536&&codePoint<=1114111){return codePoint}}throw Error("Invalid UTF-8 detected")}var byteArray;var byteCount;var byteIndex;function utf8decode(byteString){byteArray=ucs2decode(byteString);byteCount=byteArray.length;byteIndex=0;var codePoints=[];var tmp;while((tmp=decodeSymbol())!==false){codePoints.push(tmp)}return ucs2encode(codePoints)}var utf8={version:"2.0.0",encode:utf8encode,decode:utf8decode};if(typeof define=="function"&&typeof define.amd=="object"&&define.amd){define(function(){return utf8})}else if(freeExports&&!freeExports.nodeType){if(freeModule){freeModule.exports=utf8}else{var object={};var hasOwnProperty=object.hasOwnProperty;for(var key in utf8){hasOwnProperty.call(utf8,key)&&(freeExports[key]=utf8[key])}}}else{root.utf8=utf8}})(this)}).call(this,typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{}],32:[function(_dereq_,module,exports){(function(global){var rvalidchars=/^[\],:{}\s]*$/;var rvalidescape=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;var rvalidtokens=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;var rvalidbraces=/(?:^|:|,)(?:\s*\[)+/g;var rtrimLeft=/^\s+/;var rtrimRight=/\s+$/;module.exports=function parsejson(data){if("string"!=typeof data||!data){return null}data=data.replace(rtrimLeft,"").replace(rtrimRight,"");if(global.JSON&&JSON.parse){return JSON.parse(data)}if(rvalidchars.test(data.replace(rvalidescape,"@").replace(rvalidtokens,"]").replace(rvalidbraces,""))){return new Function("return "+data)()}}}).call(this,typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{}],33:[function(_dereq_,module,exports){exports.encode=function(obj){var str="";for(var i in obj){if(obj.hasOwnProperty(i)){if(str.length)str+="&";str+=encodeURIComponent(i)+"="+encodeURIComponent(obj[i])}}return str};exports.decode=function(qs){var qry={};var pairs=qs.split("&");for(var i=0,l=pairs.length;i<l;i++){var pair=pairs[i].split("=");qry[decodeURIComponent(pair[0])]=decodeURIComponent(pair[1])}return qry}},{}],34:[function(_dereq_,module,exports){var re=/^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;var parts=["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"];module.exports=function parseuri(str){var src=str,b=str.indexOf("["),e=str.indexOf("]");if(b!=-1&&e!=-1){str=str.substring(0,b)+str.substring(b,e).replace(/:/g,";")+str.substring(e,str.length)}var m=re.exec(str||""),uri={},i=14;while(i--){uri[parts[i]]=m[i]||""}if(b!=-1&&e!=-1){uri.source=src;uri.host=uri.host.substring(1,uri.host.length-1).replace(/;/g,":");uri.authority=uri.authority.replace("[","").replace("]","").replace(/;/g,":");uri.ipv6uri=true}return uri}},{}],35:[function(_dereq_,module,exports){var global=function(){return this}();var WebSocket=global.WebSocket||global.MozWebSocket;module.exports=WebSocket?ws:null;function ws(uri,protocols,opts){var instance;if(protocols){instance=new WebSocket(uri,protocols)}else{instance=new WebSocket(uri)}return instance}if(WebSocket)ws.prototype=WebSocket.prototype},{}],36:[function(_dereq_,module,exports){(function(global){var isArray=_dereq_("isarray");module.exports=hasBinary;function hasBinary(data){function _hasBinary(obj){if(!obj)return false;if(global.Buffer&&global.Buffer.isBuffer(obj)||global.ArrayBuffer&&obj instanceof ArrayBuffer||global.Blob&&obj instanceof Blob||global.File&&obj instanceof File){return true}if(isArray(obj)){for(var i=0;i<obj.length;i++){if(_hasBinary(obj[i])){return true}}}else if(obj&&"object"==typeof obj){if(obj.toJSON){obj=obj.toJSON()}for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key)&&_hasBinary(obj[key])){return true}}}return false}return _hasBinary(data)}}).call(this,typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{isarray:37}],37:[function(_dereq_,module,exports){module.exports=Array.isArray||function(arr){return Object.prototype.toString.call(arr)=="[object Array]"}},{}],38:[function(_dereq_,module,exports){var global=_dereq_("global");try{module.exports="XMLHttpRequest"in global&&"withCredentials"in new global.XMLHttpRequest}catch(err){module.exports=false}},{global:39}],39:[function(_dereq_,module,exports){module.exports=function(){return this}()},{}],40:[function(_dereq_,module,exports){var indexOf=[].indexOf;module.exports=function(arr,obj){if(indexOf)return arr.indexOf(obj);for(var i=0;i<arr.length;++i){if(arr[i]===obj)return i}return-1}},{}],41:[function(_dereq_,module,exports){var has=Object.prototype.hasOwnProperty;exports.keys=Object.keys||function(obj){var keys=[];for(var key in obj){if(has.call(obj,key)){keys.push(key)}}return keys};exports.values=function(obj){var vals=[];for(var key in obj){if(has.call(obj,key)){vals.push(obj[key])}}return vals};exports.merge=function(a,b){for(var key in b){if(has.call(b,key)){a[key]=b[key]}}return a};exports.length=function(obj){return exports.keys(obj).length};exports.isEmpty=function(obj){return 0==exports.length(obj)}},{}],42:[function(_dereq_,module,exports){var re=/^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;var parts=["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"];module.exports=function parseuri(str){var m=re.exec(str||""),uri={},i=14;while(i--){uri[parts[i]]=m[i]||""}return uri}},{}],43:[function(_dereq_,module,exports){(function(global){var isArray=_dereq_("isarray");var isBuf=_dereq_("./is-buffer");exports.deconstructPacket=function(packet){var buffers=[];var packetData=packet.data;function _deconstructPacket(data){if(!data)return data;if(isBuf(data)){var placeholder={_placeholder:true,num:buffers.length};buffers.push(data);return placeholder}else if(isArray(data)){var newData=new Array(data.length);for(var i=0;i<data.length;i++){newData[i]=_deconstructPacket(data[i])}return newData}else if("object"==typeof data&&!(data instanceof Date)){var newData={};for(var key in data){newData[key]=_deconstructPacket(data[key])}return newData}return data}var pack=packet;pack.data=_deconstructPacket(packetData);pack.attachments=buffers.length;return{packet:pack,buffers:buffers}};exports.reconstructPacket=function(packet,buffers){var curPlaceHolder=0;function _reconstructPacket(data){if(data&&data._placeholder){var buf=buffers[data.num];return buf}else if(isArray(data)){for(var i=0;i<data.length;i++){data[i]=_reconstructPacket(data[i])}return data}else if(data&&"object"==typeof data){for(var key in data){data[key]=_reconstructPacket(data[key])}return data}return data}packet.data=_reconstructPacket(packet.data);packet.attachments=undefined;return packet};exports.removeBlobs=function(data,callback){function _removeBlobs(obj,curKey,containingObject){if(!obj)return obj;if(global.Blob&&obj instanceof Blob||global.File&&obj instanceof File){pendingBlobs++;var fileReader=new FileReader;fileReader.onload=function(){if(containingObject){containingObject[curKey]=this.result}else{bloblessData=this.result}if(!--pendingBlobs){callback(bloblessData)}};fileReader.readAsArrayBuffer(obj)}else if(isArray(obj)){for(var i=0;i<obj.length;i++){_removeBlobs(obj[i],i,obj)}}else if(obj&&"object"==typeof obj&&!isBuf(obj)){for(var key in obj){_removeBlobs(obj[key],key,obj)}}}var pendingBlobs=0;var bloblessData=data;_removeBlobs(bloblessData);if(!pendingBlobs){callback(bloblessData)}}}).call(this,typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{"./is-buffer":45,isarray:46}],44:[function(_dereq_,module,exports){var debug=_dereq_("debug")("socket.io-parser");var json=_dereq_("json3");var isArray=_dereq_("isarray");var Emitter=_dereq_("component-emitter");var binary=_dereq_("./binary");var isBuf=_dereq_("./is-buffer");exports.protocol=4;exports.types=["CONNECT","DISCONNECT","EVENT","BINARY_EVENT","ACK","BINARY_ACK","ERROR"];exports.CONNECT=0;exports.DISCONNECT=1;exports.EVENT=2;exports.ACK=3;exports.ERROR=4;exports.BINARY_EVENT=5;exports.BINARY_ACK=6;exports.Encoder=Encoder;exports.Decoder=Decoder;function Encoder(){}Encoder.prototype.encode=function(obj,callback){debug("encoding packet %j",obj);if(exports.BINARY_EVENT==obj.type||exports.BINARY_ACK==obj.type){encodeAsBinary(obj,callback)}else{var encoding=encodeAsString(obj);callback([encoding])}};function encodeAsString(obj){var str="";var nsp=false;str+=obj.type;if(exports.BINARY_EVENT==obj.type||exports.BINARY_ACK==obj.type){str+=obj.attachments;str+="-"}if(obj.nsp&&"/"!=obj.nsp){nsp=true;str+=obj.nsp}if(null!=obj.id){if(nsp){str+=",";nsp=false}str+=obj.id}if(null!=obj.data){if(nsp)str+=",";str+=json.stringify(obj.data)}debug("encoded %j as %s",obj,str);return str}function encodeAsBinary(obj,callback){function writeEncoding(bloblessData){var deconstruction=binary.deconstructPacket(bloblessData);var pack=encodeAsString(deconstruction.packet);var buffers=deconstruction.buffers;buffers.unshift(pack);callback(buffers)}binary.removeBlobs(obj,writeEncoding)}function Decoder(){this.reconstructor=null}Emitter(Decoder.prototype);Decoder.prototype.add=function(obj){var packet;if("string"==typeof obj){packet=decodeString(obj);if(exports.BINARY_EVENT==packet.type||exports.BINARY_ACK==packet.type){this.reconstructor=new BinaryReconstructor(packet);if(this.reconstructor.reconPack.attachments===0){this.emit("decoded",packet)}}else{this.emit("decoded",packet)}}else if(isBuf(obj)||obj.base64){if(!this.reconstructor){throw new Error("got binary data when not reconstructing a packet")}else{packet=this.reconstructor.takeBinaryData(obj);if(packet){this.reconstructor=null;this.emit("decoded",packet)}}}else{throw new Error("Unknown type: "+obj)}};function decodeString(str){var p={};var i=0;p.type=Number(str.charAt(0));if(null==exports.types[p.type])return error();if(exports.BINARY_EVENT==p.type||exports.BINARY_ACK==p.type){var buf="";while(str.charAt(++i)!="-"){buf+=str.charAt(i);if(i==str.length)break}if(buf!=Number(buf)||str.charAt(i)!="-"){throw new Error("Illegal attachments")}p.attachments=Number(buf)}if("/"==str.charAt(i+1)){p.nsp="";while(++i){var c=str.charAt(i);if(","==c)break;p.nsp+=c;if(i==str.length)break}}else{p.nsp="/"}var next=str.charAt(i+1);if(""!==next&&Number(next)==next){p.id="";while(++i){var c=str.charAt(i);if(null==c||Number(c)!=c){--i;break}p.id+=str.charAt(i);if(i==str.length)break}p.id=Number(p.id)}if(str.charAt(++i)){try{p.data=json.parse(str.substr(i))}catch(e){return error()}}debug("decoded %s as %j",str,p);return p}Decoder.prototype.destroy=function(){if(this.reconstructor){this.reconstructor.finishedReconstruction()}};function BinaryReconstructor(packet){this.reconPack=packet;this.buffers=[]}BinaryReconstructor.prototype.takeBinaryData=function(binData){this.buffers.push(binData);if(this.buffers.length==this.reconPack.attachments){var packet=binary.reconstructPacket(this.reconPack,this.buffers);this.finishedReconstruction();return packet}return null};BinaryReconstructor.prototype.finishedReconstruction=function(){this.reconPack=null;this.buffers=[]};function error(data){return{type:exports.ERROR,data:"parser error"}}},{"./binary":43,"./is-buffer":45,"component-emitter":9,debug:10,isarray:46,json3:47}],45:[function(_dereq_,module,exports){(function(global){module.exports=isBuf;function isBuf(obj){return global.Buffer&&global.Buffer.isBuffer(obj)||global.ArrayBuffer&&obj instanceof ArrayBuffer}}).call(this,typeof self!=="undefined"?self:typeof window!=="undefined"?window:{})},{}],46:[function(_dereq_,module,exports){module.exports=_dereq_(37)},{}],47:[function(_dereq_,module,exports){(function(window){var getClass={}.toString,isProperty,forEach,undef;var isLoader=typeof define==="function"&&define.amd;var nativeJSON=typeof JSON=="object"&&JSON;var JSON3=typeof exports=="object"&&exports&&!exports.nodeType&&exports;if(JSON3&&nativeJSON){JSON3.stringify=nativeJSON.stringify;JSON3.parse=nativeJSON.parse}else{JSON3=window.JSON=nativeJSON||{}}var isExtended=new Date(-0xc782b5b800cec);try{isExtended=isExtended.getUTCFullYear()==-109252&&isExtended.getUTCMonth()===0&&isExtended.getUTCDate()===1&&isExtended.getUTCHours()==10&&isExtended.getUTCMinutes()==37&&isExtended.getUTCSeconds()==6&&isExtended.getUTCMilliseconds()==708}catch(exception){}function has(name){if(has[name]!==undef){return has[name]}var isSupported;if(name=="bug-string-char-index"){isSupported="a"[0]!="a"}else if(name=="json"){isSupported=has("json-stringify")&&has("json-parse")}else{var value,serialized='{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';if(name=="json-stringify"){var stringify=JSON3.stringify,stringifySupported=typeof stringify=="function"&&isExtended;if(stringifySupported){(value=function(){return 1}).toJSON=value;try{stringifySupported=stringify(0)==="0"&&stringify(new Number)==="0"&&stringify(new String)=='""'&&stringify(getClass)===undef&&stringify(undef)===undef&&stringify()===undef&&stringify(value)==="1"&&stringify([value])=="[1]"&&stringify([undef])=="[null]"&&stringify(null)=="null"&&stringify([undef,getClass,null])=="[null,null,null]"&&stringify({a:[value,true,false,null,"\x00\b\n\f\r	"]})==serialized&&stringify(null,value)==="1"&&stringify([1,2],null,1)=="[\n 1,\n 2\n]"&&stringify(new Date(-864e13))=='"-271821-04-20T00:00:00.000Z"'&&stringify(new Date(864e13))=='"+275760-09-13T00:00:00.000Z"'&&stringify(new Date(-621987552e5))=='"-000001-01-01T00:00:00.000Z"'&&stringify(new Date(-1))=='"1969-12-31T23:59:59.999Z"'}catch(exception){stringifySupported=false}}isSupported=stringifySupported}if(name=="json-parse"){var parse=JSON3.parse;if(typeof parse=="function"){try{if(parse("0")===0&&!parse(false)){value=parse(serialized);var parseSupported=value["a"].length==5&&value["a"][0]===1;if(parseSupported){try{parseSupported=!parse('"	"')}catch(exception){}if(parseSupported){try{parseSupported=parse("01")!==1}catch(exception){}}if(parseSupported){try{parseSupported=parse("1.")!==1}catch(exception){}}}}}catch(exception){parseSupported=false}}isSupported=parseSupported}}return has[name]=!!isSupported}if(!has("json")){var functionClass="[object Function]";var dateClass="[object Date]";var numberClass="[object Number]";var stringClass="[object String]";var arrayClass="[object Array]";var booleanClass="[object Boolean]";var charIndexBuggy=has("bug-string-char-index");if(!isExtended){var floor=Math.floor;var Months=[0,31,59,90,120,151,181,212,243,273,304,334];var getDay=function(year,month){return Months[month]+365*(year-1970)+floor((year-1969+(month=+(month>1)))/4)-floor((year-1901+month)/100)+floor((year-1601+month)/400)}}if(!(isProperty={}.hasOwnProperty)){isProperty=function(property){var members={},constructor;if((members.__proto__=null,members.__proto__={toString:1},members).toString!=getClass){isProperty=function(property){var original=this.__proto__,result=property in(this.__proto__=null,this);this.__proto__=original;return result}}else{constructor=members.constructor;isProperty=function(property){var parent=(this.constructor||constructor).prototype;return property in this&&!(property in parent&&this[property]===parent[property])}}members=null;return isProperty.call(this,property)}}var PrimitiveTypes={"boolean":1,number:1,string:1,undefined:1};var isHostType=function(object,property){var type=typeof object[property];return type=="object"?!!object[property]:!PrimitiveTypes[type]};forEach=function(object,callback){var size=0,Properties,members,property;(Properties=function(){this.valueOf=0}).prototype.valueOf=0;members=new Properties;for(property in members){if(isProperty.call(members,property)){size++}}Properties=members=null;if(!size){members=["valueOf","toString","toLocaleString","propertyIsEnumerable","isPrototypeOf","hasOwnProperty","constructor"];forEach=function(object,callback){var isFunction=getClass.call(object)==functionClass,property,length;var hasProperty=!isFunction&&typeof object.constructor!="function"&&isHostType(object,"hasOwnProperty")?object.hasOwnProperty:isProperty;for(property in object){if(!(isFunction&&property=="prototype")&&hasProperty.call(object,property)){callback(property)}}for(length=members.length;property=members[--length];hasProperty.call(object,property)&&callback(property));}}else if(size==2){forEach=function(object,callback){var members={},isFunction=getClass.call(object)==functionClass,property;for(property in object){if(!(isFunction&&property=="prototype")&&!isProperty.call(members,property)&&(members[property]=1)&&isProperty.call(object,property)){callback(property)}}}}else{forEach=function(object,callback){var isFunction=getClass.call(object)==functionClass,property,isConstructor;for(property in object){if(!(isFunction&&property=="prototype")&&isProperty.call(object,property)&&!(isConstructor=property==="constructor")){callback(property)}}if(isConstructor||isProperty.call(object,property="constructor")){callback(property)}}}return forEach(object,callback)};if(!has("json-stringify")){var Escapes={92:"\\\\",34:'\\"',8:"\\b",12:"\\f",10:"\\n",13:"\\r",9:"\\t"};var leadingZeroes="000000";var toPaddedString=function(width,value){return(leadingZeroes+(value||0)).slice(-width)};var unicodePrefix="\\u00";var quote=function(value){var result='"',index=0,length=value.length,isLarge=length>10&&charIndexBuggy,symbols;if(isLarge){symbols=value.split("")}for(;index<length;index++){var charCode=value.charCodeAt(index);switch(charCode){case 8:case 9:case 10:case 12:case 13:case 34:case 92:result+=Escapes[charCode];break;default:if(charCode<32){result+=unicodePrefix+toPaddedString(2,charCode.toString(16));break}result+=isLarge?symbols[index]:charIndexBuggy?value.charAt(index):value[index]}}return result+'"'};var serialize=function(property,object,callback,properties,whitespace,indentation,stack){var value,className,year,month,date,time,hours,minutes,seconds,milliseconds,results,element,index,length,prefix,result;try{value=object[property]}catch(exception){}if(typeof value=="object"&&value){className=getClass.call(value);if(className==dateClass&&!isProperty.call(value,"toJSON")){if(value>-1/0&&value<1/0){if(getDay){date=floor(value/864e5);for(year=floor(date/365.2425)+1970-1;getDay(year+1,0)<=date;year++);for(month=floor((date-getDay(year,0))/30.42);getDay(year,month+1)<=date;month++);date=1+date-getDay(year,month);time=(value%864e5+864e5)%864e5;hours=floor(time/36e5)%24;minutes=floor(time/6e4)%60;seconds=floor(time/1e3)%60;milliseconds=time%1e3}else{year=value.getUTCFullYear();month=value.getUTCMonth();date=value.getUTCDate();hours=value.getUTCHours();minutes=value.getUTCMinutes();seconds=value.getUTCSeconds();milliseconds=value.getUTCMilliseconds()}value=(year<=0||year>=1e4?(year<0?"-":"+")+toPaddedString(6,year<0?-year:year):toPaddedString(4,year))+"-"+toPaddedString(2,month+1)+"-"+toPaddedString(2,date)+"T"+toPaddedString(2,hours)+":"+toPaddedString(2,minutes)+":"+toPaddedString(2,seconds)+"."+toPaddedString(3,milliseconds)+"Z"}else{value=null}}else if(typeof value.toJSON=="function"&&(className!=numberClass&&className!=stringClass&&className!=arrayClass||isProperty.call(value,"toJSON"))){value=value.toJSON(property)}}if(callback){value=callback.call(object,property,value)}if(value===null){return"null"}className=getClass.call(value);if(className==booleanClass){return""+value}else if(className==numberClass){return value>-1/0&&value<1/0?""+value:"null"}else if(className==stringClass){return quote(""+value)}if(typeof value=="object"){for(length=stack.length;length--;){if(stack[length]===value){throw TypeError()}}stack.push(value);results=[];prefix=indentation;indentation+=whitespace;if(className==arrayClass){for(index=0,length=value.length;index<length;index++){element=serialize(index,value,callback,properties,whitespace,indentation,stack);results.push(element===undef?"null":element)}result=results.length?whitespace?"[\n"+indentation+results.join(",\n"+indentation)+"\n"+prefix+"]":"["+results.join(",")+"]":"[]"}else{forEach(properties||value,function(property){var element=serialize(property,value,callback,properties,whitespace,indentation,stack);if(element!==undef){results.push(quote(property)+":"+(whitespace?" ":"")+element)}});result=results.length?whitespace?"{\n"+indentation+results.join(",\n"+indentation)+"\n"+prefix+"}":"{"+results.join(",")+"}":"{}"}stack.pop();return result}};JSON3.stringify=function(source,filter,width){var whitespace,callback,properties,className;if(typeof filter=="function"||typeof filter=="object"&&filter){if((className=getClass.call(filter))==functionClass){callback=filter}else if(className==arrayClass){properties={};for(var index=0,length=filter.length,value;index<length;value=filter[index++],(className=getClass.call(value),className==stringClass||className==numberClass)&&(properties[value]=1));}}if(width){if((className=getClass.call(width))==numberClass){if((width-=width%1)>0){for(whitespace="",width>10&&(width=10);whitespace.length<width;whitespace+=" ");}}else if(className==stringClass){whitespace=width.length<=10?width:width.slice(0,10)}}return serialize("",(value={},value[""]=source,value),callback,properties,whitespace,"",[])}}if(!has("json-parse")){var fromCharCode=String.fromCharCode;var Unescapes={92:"\\",34:'"',47:"/",98:"\b",116:"	",110:"\n",102:"\f",114:"\r"};var Index,Source;var abort=function(){Index=Source=null;throw SyntaxError()};var lex=function(){var source=Source,length=source.length,value,begin,position,isSigned,charCode;while(Index<length){charCode=source.charCodeAt(Index);switch(charCode){case 9:case 10:case 13:case 32:Index++;break;case 123:case 125:case 91:case 93:case 58:case 44:value=charIndexBuggy?source.charAt(Index):source[Index];Index++;return value;case 34:for(value="@",Index++;Index<length;){charCode=source.charCodeAt(Index);if(charCode<32){abort()}else if(charCode==92){charCode=source.charCodeAt(++Index);switch(charCode){case 92:case 34:case 47:case 98:case 116:case 110:case 102:case 114:value+=Unescapes[charCode];Index++;break;case 117:begin=++Index;for(position=Index+4;Index<position;Index++){charCode=source.charCodeAt(Index);if(!(charCode>=48&&charCode<=57||charCode>=97&&charCode<=102||charCode>=65&&charCode<=70)){abort()}}value+=fromCharCode("0x"+source.slice(begin,Index));break;default:abort()}}else{if(charCode==34){break}charCode=source.charCodeAt(Index);begin=Index;while(charCode>=32&&charCode!=92&&charCode!=34){charCode=source.charCodeAt(++Index)}value+=source.slice(begin,Index)}}if(source.charCodeAt(Index)==34){Index++;return value}abort();default:begin=Index;if(charCode==45){isSigned=true;charCode=source.charCodeAt(++Index)}if(charCode>=48&&charCode<=57){if(charCode==48&&(charCode=source.charCodeAt(Index+1),charCode>=48&&charCode<=57)){abort()}isSigned=false;for(;Index<length&&(charCode=source.charCodeAt(Index),charCode>=48&&charCode<=57);Index++);if(source.charCodeAt(Index)==46){position=++Index;for(;position<length&&(charCode=source.charCodeAt(position),charCode>=48&&charCode<=57);position++);if(position==Index){abort()}Index=position}charCode=source.charCodeAt(Index);if(charCode==101||charCode==69){charCode=source.charCodeAt(++Index);if(charCode==43||charCode==45){Index++}for(position=Index;position<length&&(charCode=source.charCodeAt(position),charCode>=48&&charCode<=57);position++);if(position==Index){abort()}Index=position}return+source.slice(begin,Index)}if(isSigned){abort()}if(source.slice(Index,Index+4)=="true"){Index+=4;return true}else if(source.slice(Index,Index+5)=="false"){Index+=5;return false}else if(source.slice(Index,Index+4)=="null"){Index+=4;return null}abort()}}return"$"};var get=function(value){var results,hasMembers;if(value=="$"){abort()}if(typeof value=="string"){if((charIndexBuggy?value.charAt(0):value[0])=="@"){return value.slice(1)}if(value=="["){results=[];for(;;hasMembers||(hasMembers=true)){value=lex();if(value=="]"){break}if(hasMembers){if(value==","){value=lex();if(value=="]"){abort()}}else{abort()}}if(value==","){abort()}results.push(get(value))}return results}else if(value=="{"){results={};for(;;hasMembers||(hasMembers=true)){value=lex();if(value=="}"){break}if(hasMembers){if(value==","){value=lex();if(value=="}"){abort()}}else{abort()}}if(value==","||typeof value!="string"||(charIndexBuggy?value.charAt(0):value[0])!="@"||lex()!=":"){abort()}results[value.slice(1)]=get(lex())}return results}abort()}return value};var update=function(source,property,callback){var element=walk(source,property,callback);if(element===undef){delete source[property]}else{source[property]=element}};var walk=function(source,property,callback){var value=source[property],length;if(typeof value=="object"&&value){if(getClass.call(value)==arrayClass){for(length=value.length;length--;){update(value,length,callback)}}else{forEach(value,function(property){update(value,property,callback)})}}return callback.call(source,property,value)};JSON3.parse=function(source,callback){var result,value;Index=0;Source=""+source;result=get(lex());if(lex()!="$"){abort()}Index=Source=null;return callback&&getClass.call(callback)==functionClass?walk((value={},value[""]=result,value),"",callback):result}}}if(isLoader){define(function(){return JSON3})}})(this)},{}],48:[function(_dereq_,module,exports){module.exports=toArray;function toArray(list,index){var array=[];index=index||0;for(var i=index||0;i<list.length;i++){array[i-index]=list[i]}return array}},{}]},{},[1])(1)});
/* jshint ignore:end */

Elm.SocketIO = Elm.SocketIO || {};
Elm.SocketIO.make = function (_elm) {
   "use strict";
   _elm.SocketIO = _elm.SocketIO || {};
   if (_elm.SocketIO.values) return _elm.SocketIO.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Native$SocketIO = Elm.Native.SocketIO.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm),
   $Task = Elm.Task.make(_elm),
   $Time = Elm.Time.make(_elm);
   var _op = {};
   var connected = $Native$SocketIO.connected;
   var on = $Native$SocketIO.on;
   var emit = $Native$SocketIO.emit;
   var io = $Native$SocketIO.io;
   var Options = F5(function (a,b,c,d,e) {    return {multiplex: a,reconnection: b,reconnectionDelay: c,reconnectionDelayMax: d,timeout: e};});
   var defaultOptions = A5(Options,false,true,1000,500,20000);
   var Socket = {ctor: "Socket"};
   return _elm.SocketIO.values = {_op: _op,io: io,defaultOptions: defaultOptions,emit: emit,on: on,connected: connected,Options: Options};
};
Elm.Model = Elm.Model || {};
Elm.Model.make = function (_elm) {
   "use strict";
   _elm.Model = _elm.Model || {};
   if (_elm.Model.values) return _elm.Model.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Set = Elm.Set.make(_elm),
   $Signal = Elm.Signal.make(_elm);
   var _op = {};
   var Model = F9(function (a,b,c,d,e,f,g,h,i) {    return {counter: a,site: b,wString: c,start: d,doc: e,debug: f,wSeen: g,pool: h,processedPool: i};});
   var NoTUpdate = {ctor: "NoTUpdate"};
   var RequestWString = {ctor: "RequestWString"};
   var DS = F2(function (a,b) {    return {ctor: "DS",_0: a,_1: b};});
   var IS = F2(function (a,b) {    return {ctor: "IS",_0: a,_1: b};});
   var D = F2(function (a,b) {    return {ctor: "D",_0: a,_1: b};});
   var I = F3(function (a,b,c) {    return {ctor: "I",_0: a,_1: b,_2: c};});
   var T = function (a) {    return {ctor: "T",_0: a};};
   var W = function (a) {    return {ctor: "W",_0: a};};
   var NoUpdate = {ctor: "NoUpdate"};
   var CurrWString = F2(function (a,b) {    return {ctor: "CurrWString",_0: a,_1: b};});
   var SiteId = function (a) {    return {ctor: "SiteId",_0: a};};
   var Delete = function (a) {    return {ctor: "Delete",_0: a};};
   var Insert = function (a) {    return {ctor: "Insert",_0: a};};
   var WChar = F5(function (a,b,c,d,e) {    return {id: a,next: b,prev: c,vis: d,ch: e};});
   var Doc = F3(function (a,b,c) {    return {cp: a,str: b,len: c};});
   return _elm.Model.values = {_op: _op
                              ,Doc: Doc
                              ,WChar: WChar
                              ,Insert: Insert
                              ,Delete: Delete
                              ,SiteId: SiteId
                              ,CurrWString: CurrWString
                              ,NoUpdate: NoUpdate
                              ,W: W
                              ,T: T
                              ,I: I
                              ,D: D
                              ,IS: IS
                              ,DS: DS
                              ,RequestWString: RequestWString
                              ,NoTUpdate: NoTUpdate
                              ,Model: Model};
};
Elm.Constants = Elm.Constants || {};
Elm.Constants.make = function (_elm) {
   "use strict";
   _elm.Constants = _elm.Constants || {};
   if (_elm.Constants.values) return _elm.Constants.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Color = Elm.Color.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $Dict = Elm.Dict.make(_elm),
   $Graphics$Input$Field = Elm.Graphics.Input.Field.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Model = Elm.Model.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Set = Elm.Set.make(_elm),
   $Signal = Elm.Signal.make(_elm);
   var _op = {};
   var endId = {ctor: "_Tuple2",_0: 0,_1: 1};
   var startId = {ctor: "_Tuple2",_0: 0,_1: -1};
   var startChar = {id: startId,vis: -100,ch: _U.chr("<"),prev: startId,next: endId};
   var endChar = {id: endId,vis: -100,ch: _U.chr(">"),prev: startId,next: endId};
   var highlightStyle = {color: $Color.green,width: 4};
   var fieldStyle = _U.update($Graphics$Input$Field.defaultStyle,{highlight: highlightStyle});
   var emptyWIdDict = $Dict.empty;
   var fakeDeleted = {id: {ctor: "_Tuple2",_0: 7,_1: 0},next: endId,prev: startId,vis: -1,ch: _U.chr("t")};
   var emptyDelModel = {site: 0
                       ,counter: 0
                       ,wString: _U.list([])
                       ,start: startChar
                       ,doc: {cp: 0,str: "",len: 0}
                       ,pool: _U.list([])
                       ,processedPool: _U.list([])
                       ,debug: ""
                       ,wSeen: A2($Set.insert,endId,A2($Set.insert,startId,$Set.empty))};
   var emptyModel = {site: 0
                    ,counter: 0
                    ,wString: _U.list([])
                    ,start: startChar
                    ,doc: {cp: 0,str: "",len: 0}
                    ,pool: _U.list([])
                    ,processedPool: _U.list([])
                    ,debug: ""
                    ,wSeen: A2($Set.insert,endId,A2($Set.insert,startId,$Set.empty))};
   var fakeModel = {site: 0
                   ,counter: 6
                   ,wString: _U.list([{ch: _U.chr("a")
                                      ,id: {ctor: "_Tuple2",_0: 2,_1: 0}
                                      ,next: {ctor: "_Tuple2",_0: 0,_1: 1}
                                      ,prev: {ctor: "_Tuple2",_0: 0,_1: -1}
                                      ,vis: 1}
                                     ,{ch: _U.chr("b")
                                      ,id: {ctor: "_Tuple2",_0: 2,_1: 1}
                                      ,next: {ctor: "_Tuple2",_0: 0,_1: 1}
                                      ,prev: {ctor: "_Tuple2",_0: 2,_1: 0}
                                      ,vis: 1}
                                     ,{ch: _U.chr(" ")
                                      ,id: {ctor: "_Tuple2",_0: 2,_1: 2}
                                      ,next: {ctor: "_Tuple2",_0: 0,_1: 1}
                                      ,prev: {ctor: "_Tuple2",_0: 2,_1: 1}
                                      ,vis: 1}
                                     ,{ch: _U.chr("c")
                                      ,id: {ctor: "_Tuple2",_0: 2,_1: 3}
                                      ,next: {ctor: "_Tuple2",_0: 0,_1: 1}
                                      ,prev: {ctor: "_Tuple2",_0: 2,_1: 2}
                                      ,vis: -1}
                                     ,{ch: _U.chr("d")
                                      ,id: {ctor: "_Tuple2",_0: 2,_1: 4}
                                      ,next: {ctor: "_Tuple2",_0: 0,_1: 1}
                                      ,prev: {ctor: "_Tuple2",_0: 2,_1: 3}
                                      ,vis: 1}])
                   ,start: startChar
                   ,doc: {cp: 4,str: "ab d",len: 4}
                   ,pool: _U.list([])
                   ,processedPool: _U.list([])
                   ,debug: ""
                   ,wSeen: A2($Set.insert,
                   {ctor: "_Tuple2",_0: 2,_1: 4},
                   A2($Set.insert,
                   {ctor: "_Tuple2",_0: 2,_1: 2},
                   A2($Set.insert,
                   {ctor: "_Tuple2",_0: 2,_1: 1},
                   A2($Set.insert,{ctor: "_Tuple2",_0: 2,_1: 0},A2($Set.insert,endId,A2($Set.insert,startId,$Set.empty))))))};
   var debug = false;
   return _elm.Constants.values = {_op: _op
                                  ,debug: debug
                                  ,fakeModel: fakeModel
                                  ,emptyModel: emptyModel
                                  ,emptyDelModel: emptyDelModel
                                  ,fakeDeleted: fakeDeleted
                                  ,emptyWIdDict: emptyWIdDict
                                  ,highlightStyle: highlightStyle
                                  ,fieldStyle: fieldStyle
                                  ,startId: startId
                                  ,endId: endId
                                  ,startChar: startChar
                                  ,endChar: endChar};
};
Elm.Woot = Elm.Woot || {};
Elm.Woot.make = function (_elm) {
   "use strict";
   _elm.Woot = _elm.Woot || {};
   if (_elm.Woot.values) return _elm.Woot.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Constants = Elm.Constants.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Model = Elm.Model.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Set = Elm.Set.make(_elm),
   $Signal = Elm.Signal.make(_elm),
   $String = Elm.String.make(_elm);
   var _op = {};
   var canDel = F2(function (wCh,set) {    return A2($Set.member,wCh.id,set);});
   var canIns = F2(function (wCh,set) {    return A2($Set.member,wCh.next,set) && A2($Set.member,wCh.prev,set);});
   var canIntegrate = F2(function (wUpdate,dict) {
      var _p0 = wUpdate;
      switch (_p0.ctor)
      {case "Insert": return A2(canIns,_p0._0,dict);
         case "Delete": return A2(canDel,_p0._0,dict);
         default: return false;}
   });
   var grabPrev = F2(function (wCh,wStr) {
      grabPrev: while (true) {
         var _p1 = wStr;
         if (_p1.ctor === "::") {
               var _p2 = _p1._0;
               if (_U.eq(_p2.id,wCh.prev)) return _p2; else {
                     var _v2 = wCh,_v3 = _p1._1;
                     wCh = _v2;
                     wStr = _v3;
                     continue grabPrev;
                  }
            } else {
               return $Constants.startChar;
            }
      }
   });
   var grabNext = F2(function (wCh,wStr) {
      grabNext: while (true) {
         var _p3 = wStr;
         if (_p3.ctor === "::") {
               var _p4 = _p3._0;
               if (_U.eq(_p4.id,wCh.next)) return _p4; else {
                     var _v5 = wCh,_v6 = _p3._1;
                     wCh = _v5;
                     wStr = _v6;
                     continue grabNext;
                  }
            } else {
               return $Constants.endChar;
            }
      }
   });
   var isVisible = function (wCh) {
      return _U.eq(wCh.id,$Constants.startId) ? true : _U.eq(wCh.id,$Constants.endId) ? true : _U.cmp(wCh.vis,0) > 0 ? true : false;
   };
   var pos = F2(function (wStr,wCh) {
      pos: while (true) {
         var _p5 = wStr;
         if (_p5.ctor === "[]") {
               return 0;
            } else {
               var _p7 = _p5._1;
               var _p6 = _p5._0;
               if (isVisible(_p6)) return _U.eq(_p6.id,wCh.id) ? 0 : 1 + A2(pos,_p7,wCh); else if (_U.eq(_p6.id,wCh.id)) return 0; else {
                        var _v8 = _p7,_v9 = wCh;
                        wStr = _v8;
                        wCh = _v9;
                        continue pos;
                     }
            }
      }
   });
   var setInvisible = F2(function (wStr,id) {
      var _p8 = wStr;
      if (_p8.ctor === "[]") {
            return _U.list([]);
         } else {
            var _p10 = _p8._1;
            var _p9 = _p8._0;
            return _U.eq(_p9.id,id) ? A2($List._op["::"],_U.update(_p9,{vis: -1}),_p10) : A2($List._op["::"],_p9,A2(setInvisible,_p10,id));
         }
   });
   var ithVisible = F2(function (wStr,i) {
      ithVisible: while (true) if (_U.eq(i,-1)) return $Constants.startChar; else {
            var _p11 = wStr;
            if (_p11.ctor === "[]") {
                  return $Constants.endChar;
               } else {
                  var _p13 = _p11._1;
                  var _p12 = _p11._0;
                  if (_U.eq(i,0) && isVisible(_p12)) return _p12; else if (isVisible(_p12)) {
                           var _v12 = _p13,_v13 = i - 1;
                           wStr = _v12;
                           i = _v13;
                           continue ithVisible;
                        } else {
                           var _v14 = _p13,_v15 = i;
                           wStr = _v14;
                           i = _v15;
                           continue ithVisible;
                        }
               }
         }
   });
   var subSeqGrab = F2(function (wStr,end) {
      var _p14 = wStr;
      if (_p14.ctor === "[]") {
            return _U.list([]);
         } else {
            var _p15 = _p14._0;
            return _U.eq(_p15.id,end.id) ? _U.list([]) : A2($List._op["::"],_p15,A2(subSeqGrab,_p14._1,end));
         }
   });
   var subSeq = F3(function (wStr,start,end) {
      subSeq: while (true) {
         var _p16 = wStr;
         if (_p16.ctor === "[]") {
               return _U.list([]);
            } else {
               var _p17 = _p16._1;
               if (_U.eq(_p16._0.id,start.id)) return A2(subSeqGrab,_p17,end); else {
                     var _v18 = _p17,_v19 = start,_v20 = end;
                     wStr = _v18;
                     start = _v19;
                     end = _v20;
                     continue subSeq;
                  }
            }
      }
   });
   var wToString = function (wStr) {
      wToString: while (true) {
         var _p18 = wStr;
         if (_p18.ctor === "[]") {
               return "";
            } else {
               var _p20 = _p18._1;
               var _p19 = _p18._0;
               if (_U.cmp(_p19.vis,0) > 0) return A2($String.cons,_p19.ch,wToString(_p20)); else {
                     var _v22 = _p20;
                     wStr = _v22;
                     continue wToString;
                  }
            }
      }
   };
   var wIdOrder = F2(function (wA,wB) {
      var _p21 = wB.id;
      var wBSite = _p21._0;
      var wBClock = _p21._1;
      var _p22 = wA.id;
      var wASite = _p22._0;
      var wAClock = _p22._1;
      return _U.cmp(wASite,wBSite) > 0 ? $Basics.GT : _U.cmp(wASite,wBSite) < 0 ? $Basics.LT : _U.cmp(wAClock,wBClock) > 0 ? $Basics.GT : $Basics.GT;
   });
   var isLaterWChar = F2(function (wA,wB) {    return !_U.eq(A2(wIdOrder,wA,wB),$Basics.LT);});
   return _elm.Woot.values = {_op: _op
                             ,isLaterWChar: isLaterWChar
                             ,wIdOrder: wIdOrder
                             ,wToString: wToString
                             ,subSeq: subSeq
                             ,subSeqGrab: subSeqGrab
                             ,ithVisible: ithVisible
                             ,setInvisible: setInvisible
                             ,pos: pos
                             ,isVisible: isVisible
                             ,grabNext: grabNext
                             ,grabPrev: grabPrev
                             ,canIns: canIns
                             ,canDel: canDel
                             ,canIntegrate: canIntegrate};
};
Elm.ConvertJson = Elm.ConvertJson || {};
Elm.ConvertJson.make = function (_elm) {
   "use strict";
   _elm.ConvertJson = _elm.ConvertJson || {};
   if (_elm.ConvertJson.values) return _elm.ConvertJson.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $Json$Decode = Elm.Json.Decode.make(_elm),
   $Json$Encode = Elm.Json.Encode.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Model = Elm.Model.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm),
   $String = Elm.String.make(_elm),
   $Woot = Elm.Woot.make(_elm);
   var _op = {};
   var tInsertToJsonList = F3(function (ch,index,siteId) {
      return _U.list([{ctor: "_Tuple2",_0: "ch",_1: $Json$Encode.string($String.fromChar(ch))}
                     ,{ctor: "_Tuple2",_0: "index",_1: $Json$Encode.$int(index)}
                     ,{ctor: "_Tuple2",_0: "siteId",_1: $Json$Encode.$int(siteId)}]);
   });
   var tDelToJsonList = F2(function (ch,index) {
      return _U.list([{ctor: "_Tuple2",_0: "ch",_1: $Json$Encode.string($String.fromChar(ch))},{ctor: "_Tuple2",_0: "index",_1: $Json$Encode.$int(index)}]);
   });
   var encodeTUpdate = function (tUp) {
      var _p0 = tUp;
      switch (_p0.ctor)
      {case "I": return $Json$Encode.object(A2($List._op["::"],
           {ctor: "_Tuple2",_0: "type",_1: $Json$Encode.string("typingInsert")},
           A3(tInsertToJsonList,_p0._0,_p0._1,_p0._2)));
         case "D": return $Json$Encode.object(A2($List._op["::"],
           {ctor: "_Tuple2",_0: "type",_1: $Json$Encode.string("typingDelete")},
           A2(tDelToJsonList,_p0._0,_p0._1)));
         default: return $Json$Encode.object(_U.list([{ctor: "_Tuple2",_0: "type",_1: $Json$Encode.string("typingNoUpdate")}]));}
   };
   var wCharToJsonList = function (wCh) {
      return _U.list([{ctor: "_Tuple2",_0: "id",_1: $Json$Encode.list(_U.list([$Json$Encode.$int($Basics.fst(wCh.id)),$Json$Encode.$int($Basics.snd(wCh.id))]))}
                     ,{ctor: "_Tuple2"
                      ,_0: "prev"
                      ,_1: $Json$Encode.list(_U.list([$Json$Encode.$int($Basics.fst(wCh.prev)),$Json$Encode.$int($Basics.snd(wCh.prev))]))}
                     ,{ctor: "_Tuple2"
                      ,_0: "next"
                      ,_1: $Json$Encode.list(_U.list([$Json$Encode.$int($Basics.fst(wCh.next)),$Json$Encode.$int($Basics.snd(wCh.next))]))}
                     ,{ctor: "_Tuple2",_0: "vis",_1: $Json$Encode.$int(wCh.vis)}
                     ,{ctor: "_Tuple2",_0: "ch",_1: $Json$Encode.string($String.fromChar(wCh.ch))}]);
   };
   var encodeWUpdate = function (wUp) {
      var _p1 = wUp;
      switch (_p1.ctor)
      {case "Insert": return $Json$Encode.object(A2($List._op["::"],{ctor: "_Tuple2",_0: "type",_1: $Json$Encode.string("Insert")},wCharToJsonList(_p1._0)));
         case "Delete": return $Json$Encode.object(A2($List._op["::"],{ctor: "_Tuple2",_0: "type",_1: $Json$Encode.string("Delete")},wCharToJsonList(_p1._0)));
         case "CurrWString": return $Json$Encode.object(_U.list([{ctor: "_Tuple2",_0: "type",_1: $Json$Encode.string("CurrWString")}
                                                                ,{ctor: "_Tuple2"
                                                                 ,_0: "WString"
                                                                 ,_1: $Json$Encode.list(A2($List.map,
                                                                 function (wCh) {
                                                                    return $Json$Encode.object(wCharToJsonList(wCh));
                                                                 },
                                                                 _p1._0))}
                                                                ,{ctor: "_Tuple2",_0: "String",_1: $Json$Encode.string(_p1._1)}]));
         default: return $Json$Encode.object(_U.list([{ctor: "_Tuple2",_0: "type",_1: $Json$Encode.string("NoUpdate")}]));}
   };
   var encodeStringUpdate = function (str) {
      return $Json$Encode.object(_U.list([{ctor: "_Tuple2",_0: "type",_1: $Json$Encode.string("StringUpdate")}
                                         ,{ctor: "_Tuple2",_0: "string",_1: $Json$Encode.string(str)}]));
   };
   var encodeWInsert = function (wCh) {
      return $Json$Encode.object(_U.list([{ctor: "_Tuple2",_0: "id",_1: $Json$Encode.string(wCh.id)}
                                         ,{ctor: "_Tuple2",_0: "ch",_1: $Json$Encode.string($String.fromChar(wCh.ch))}
                                         ,{ctor: "_Tuple2",_0: "next",_1: $Json$Encode.string(wCh.next)}
                                         ,{ctor: "_Tuple2",_0: "prev",_1: $Json$Encode.string(wCh.prev)}
                                         ,{ctor: "_Tuple2",_0: "vis",_1: $Json$Encode.$int(wCh.vis)}]));
   };
   var stringUpdateToJson = function (str) {    var strValue = encodeStringUpdate(str);return A2($Json$Encode.encode,2,strValue);};
   var wUpdateToJson = function (wUpdate) {    var wUpValue = encodeWUpdate(wUpdate);return A2($Json$Encode.encode,2,wUpValue);};
   var wUpdatesToJson = function (wUpdates) {
      var wUpdateListValue = $Json$Encode.list(A2($List.map,encodeWUpdate,wUpdates));
      return A2($Json$Encode.encode,2,wUpdateListValue);
   };
   var tUpdateToJson = function (tUpd) {    var tUpValue = encodeTUpdate(tUpd);return A2($Json$Encode.encode,2,tUpValue);};
   var tUpdatesToJson = function (tUpdates) {
      var tUpdateListValue = $Json$Encode.list(A2($List.map,encodeTUpdate,tUpdates));
      return A2($Json$Encode.encode,2,tUpdateListValue);
   };
   var wSiteIdDecoder = A2($Json$Decode._op[":="],"siteId",$Json$Decode.$int);
   var decodeWSiteId = function (str) {
      var _p2 = A2($Json$Decode.decodeString,wSiteIdDecoder,str);
      if (_p2.ctor === "Ok") {
            return $Model.SiteId(_p2._0);
         } else {
            return $Model.NoUpdate;
         }
   };
   var decCP = A2($Json$Decode._op[":="],"cp",$Json$Decode.$int);
   var tDeleteStringDecoder = A3($Json$Decode.object2,
   F2(function (str,cp) {    return A2($Model.DS,str,cp);}),
   A2($Json$Decode._op[":="],"str",$Json$Decode.string),
   decCP);
   var tInsertStringDecoder = A3($Json$Decode.object2,
   F2(function (str,cp) {    return A2($Model.IS,str,cp);}),
   A2($Json$Decode._op[":="],"str",$Json$Decode.string),
   decCP);
   var toChar = function (str) {    var _p3 = $List.head($String.toList(str));if (_p3.ctor === "Just") {    return _p3._0;} else {    return _U.chr("$");}};
   var tDeleteDecoder = A3($Json$Decode.object2,
   F2(function (ch,cp) {    return A2($Model.D,toChar(ch),cp);}),
   A2($Json$Decode._op[":="],"ch",$Json$Decode.string),
   A2($Json$Decode._op[":="],"cp",$Json$Decode.$int));
   var decCh = A2($Json$Decode._op[":="],"ch",$Json$Decode.string);
   var tInsertDecoder = A4($Json$Decode.object3,
   F3(function (ch,cp,siteId) {    return A3($Model.I,toChar(ch),cp,siteId);}),
   decCh,
   decCP,
   A2($Json$Decode._op[":="],"siteId",$Json$Decode.$int));
   var decodeTUpdate = F2(function (typeStr,str) {
      if (_U.eq(typeStr,"Insert")) {
            var _p4 = A2($Json$Decode.decodeString,tInsertDecoder,str);
            if (_p4.ctor === "Ok") {
                  return _p4._0;
               } else {
                  return $Model.NoTUpdate;
               }
         } else if (_U.eq(typeStr,"Delete")) {
               var _p5 = A2($Json$Decode.decodeString,tDeleteDecoder,str);
               if (_p5.ctor === "Ok") {
                     return _p5._0;
                  } else {
                     return $Model.NoTUpdate;
                  }
            } else if (_U.eq(typeStr,"InsertString")) {
                  var _p6 = A2($Json$Decode.decodeString,tInsertStringDecoder,str);
                  if (_p6.ctor === "Ok") {
                        return _p6._0;
                     } else {
                        return $Model.NoTUpdate;
                     }
               } else if (_U.eq(typeStr,"DeleteString")) {
                     var _p7 = A2($Json$Decode.decodeString,tDeleteStringDecoder,str);
                     if (_p7.ctor === "Ok") {
                           return _p7._0;
                        } else {
                           return $Model.NoTUpdate;
                        }
                  } else if (_U.eq(typeStr,"RequestWString")) return $Model.RequestWString; else return $Model.NoTUpdate;
   });
   var decPrev = A2($Json$Decode._op[":="],
   "prev",
   A3($Json$Decode.tuple2,F2(function (v0,v1) {    return {ctor: "_Tuple2",_0: v0,_1: v1};}),$Json$Decode.$int,$Json$Decode.$int));
   var decNext = A2($Json$Decode._op[":="],
   "next",
   A3($Json$Decode.tuple2,F2(function (v0,v1) {    return {ctor: "_Tuple2",_0: v0,_1: v1};}),$Json$Decode.$int,$Json$Decode.$int));
   var decVis = A2($Json$Decode._op[":="],"vis",$Json$Decode.$int);
   var decodeId = A2($Json$Decode._op[":="],
   "id",
   A3($Json$Decode.tuple2,F2(function (v0,v1) {    return {ctor: "_Tuple2",_0: v0,_1: v1};}),$Json$Decode.$int,$Json$Decode.$int));
   var wCharDecoder = A6($Json$Decode.object5,
   F5(function (id,next,prev,vis,chr) {    return A5($Model.WChar,id,next,prev,vis,toChar(chr));}),
   decodeId,
   decNext,
   decPrev,
   decVis,
   decCh);
   var decodeWInsert = function (str) {
      var _p8 = A2($Json$Decode.decodeString,wCharDecoder,str);
      if (_p8.ctor === "Ok") {
            return $Model.Insert(_p8._0);
         } else {
            return $Model.NoUpdate;
         }
   };
   var decodeWDelete = function (str) {
      var _p9 = A2($Json$Decode.decodeString,wCharDecoder,str);
      if (_p9.ctor === "Ok") {
            return $Model.Delete(_p9._0);
         } else {
            return $Model.NoUpdate;
         }
   };
   var wStringDecoder = $Json$Decode.list(wCharDecoder);
   var decodeCurrWString = function (str) {
      var _p10 = A2($Json$Decode.decodeString,wStringDecoder,str);
      if (_p10.ctor === "Ok") {
            var _p11 = _p10._0;
            return A2($Model.CurrWString,_p11,$Woot.wToString(_p11));
         } else {
            return $Model.NoUpdate;
         }
   };
   var decodeWUpdate = F2(function (typeStr,str) {
      return _U.eq(typeStr,"Insert") ? decodeWInsert(str) : _U.eq(typeStr,"Delete") ? decodeWDelete(str) : _U.eq(typeStr,
      "SiteId") ? decodeWSiteId(str) : _U.eq(typeStr,"CurrWString") ? decodeCurrWString(str) : $Model.NoUpdate;
   });
   var jsonToTUpdate = function (str) {
      var _p12 = A2($Json$Decode.decodeString,A2($Json$Decode._op[":="],"type",$Json$Decode.string),str);
      if (_p12.ctor === "Ok") {
            return A2(decodeTUpdate,_p12._0,str);
         } else {
            return $Model.NoTUpdate;
         }
   };
   var jsonObjToWUpdate = function (str) {
      var _p13 = A2($Json$Decode.decodeString,A2($Json$Decode._op[":="],"type",$Json$Decode.string),str);
      if (_p13.ctor === "Ok") {
            return A2(decodeWUpdate,_p13._0,str);
         } else {
            return $Model.NoUpdate;
         }
   };
   var wCharMaker = F5(function (id,strCh,vis,next,prev) {    return {id: id,ch: toChar(strCh),vis: vis,next: next,prev: prev};});
   var siteIdDecoder = A2($Json$Decode.object1,function (id) {    return $Model.SiteId(id);},A2($Json$Decode._op[":="],"siteId",$Json$Decode.$int));
   var wDeleteDecoder = A6($Json$Decode.object5,
   F5(function (id,ch,vis,next,prev) {    return $Model.Delete(A5(wCharMaker,id,ch,vis,next,prev));}),
   decodeId,
   A2($Json$Decode._op[":="],"ch",$Json$Decode.string),
   A2($Json$Decode._op[":="],"vis",$Json$Decode.$int),
   decNext,
   decPrev);
   var insertDeleteDecoder = A7($Json$Decode.object6,
   F6(function (t,id,ch,vis,next,prev) {
      return _U.eq(t,"Insert") ? $Model.Insert(A5(wCharMaker,id,ch,vis,next,prev)) : $Model.Delete(A5(wCharMaker,id,ch,vis,next,prev));
   }),
   A2($Json$Decode._op[":="],"type",$Json$Decode.string),
   decodeId,
   A2($Json$Decode._op[":="],"ch",$Json$Decode.string),
   A2($Json$Decode._op[":="],"vis",$Json$Decode.$int),
   decNext,
   decPrev);
   var wUpdateDecoder = $Json$Decode.oneOf(_U.list([siteIdDecoder,insertDeleteDecoder]));
   var jsonToWUpdates = function (str) {
      var _p14 = A2($Json$Decode.decodeString,$Json$Decode.list(wUpdateDecoder),str);
      if (_p14.ctor === "Ok") {
            return _p14._0;
         } else {
            return _U.list([$Model.NoUpdate]);
         }
   };
   return _elm.ConvertJson.values = {_op: _op
                                    ,wUpdateDecoder: wUpdateDecoder
                                    ,insertDeleteDecoder: insertDeleteDecoder
                                    ,wDeleteDecoder: wDeleteDecoder
                                    ,siteIdDecoder: siteIdDecoder
                                    ,wCharMaker: wCharMaker
                                    ,jsonToWUpdates: jsonToWUpdates
                                    ,jsonObjToWUpdate: jsonObjToWUpdate
                                    ,jsonToTUpdate: jsonToTUpdate
                                    ,decodeId: decodeId
                                    ,decVis: decVis
                                    ,decNext: decNext
                                    ,decPrev: decPrev
                                    ,decCh: decCh
                                    ,toChar: toChar
                                    ,decodeTUpdate: decodeTUpdate
                                    ,tInsertStringDecoder: tInsertStringDecoder
                                    ,tDeleteStringDecoder: tDeleteStringDecoder
                                    ,tInsertDecoder: tInsertDecoder
                                    ,tDeleteDecoder: tDeleteDecoder
                                    ,decCP: decCP
                                    ,decodeWUpdate: decodeWUpdate
                                    ,decodeWInsert: decodeWInsert
                                    ,decodeWDelete: decodeWDelete
                                    ,decodeWSiteId: decodeWSiteId
                                    ,decodeCurrWString: decodeCurrWString
                                    ,wStringDecoder: wStringDecoder
                                    ,wCharDecoder: wCharDecoder
                                    ,wSiteIdDecoder: wSiteIdDecoder
                                    ,tUpdatesToJson: tUpdatesToJson
                                    ,tUpdateToJson: tUpdateToJson
                                    ,wUpdatesToJson: wUpdatesToJson
                                    ,wUpdateToJson: wUpdateToJson
                                    ,stringUpdateToJson: stringUpdateToJson
                                    ,encodeWInsert: encodeWInsert
                                    ,encodeStringUpdate: encodeStringUpdate
                                    ,encodeWUpdate: encodeWUpdate
                                    ,wCharToJsonList: wCharToJsonList
                                    ,tDelToJsonList: tDelToJsonList
                                    ,tInsertToJsonList: tInsertToJsonList
                                    ,encodeTUpdate: encodeTUpdate};
};
Elm.Graph = Elm.Graph || {};
Elm.Graph.make = function (_elm) {
   "use strict";
   _elm.Graph = _elm.Graph || {};
   if (_elm.Graph.values) return _elm.Graph.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Constants = Elm.Constants.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Model = Elm.Model.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Set = Elm.Set.make(_elm),
   $Signal = Elm.Signal.make(_elm),
   $String = Elm.String.make(_elm),
   $Woot = Elm.Woot.make(_elm);
   var _op = {};
   var updateStrAndLen = F3(function (doc,str,len) {    return _U.update(doc,{str: str,len: len});});
   var updateCP = F2(function (doc,cp) {    return _U.update(doc,{cp: cp});});
   var integrateDelete = F2(function (wChar,model) {
      var newWString = A2($Woot.setInvisible,model.wString,wChar.id);
      return _U.update(model,{wString: newWString});
   });
   var integrateRemoteDelete = F2(function (wChar,model) {
      var deletePos = A2($Woot.pos,model.wString,wChar);
      var currCP = model.doc.cp;
      var newCP = _U.cmp(currCP,deletePos) > 0 ? currCP - 1 : currCP;
      var newDocModel = _U.update(model,{doc: A2(updateCP,model.doc,newCP)});
      var newModel = A2(integrateDelete,wChar,newDocModel);
      return {ctor: "_Tuple2",_0: newModel,_1: $Model.T(A2($Model.D,wChar.ch,deletePos))};
   });
   var generateDelete = F3(function (ch,place,model) {
      var newModel = _U.update(model,{doc: A2(updateCP,model.doc,place)});
      var currWChar = A2($Woot.ithVisible,model.wString,place);
      var deletedWChar = _U.update(currWChar,{vis: -1});
      var successor = A2($Woot.ithVisible,model.wString,place + 1);
      var predecessor = A2($Woot.ithVisible,model.wString,place - 1);
      return {ctor: "_Tuple2",_0: A2(integrateDelete,deletedWChar,newModel),_1: $Model.W($Model.Delete(deletedWChar))};
   });
   var findLaterWChar = F2(function (insCh,wStr) {
      findLaterWChar: while (true) {
         var _p0 = wStr;
         if (_p0.ctor === "[]") {
               return {ctor: "_Tuple2",_0: $Constants.startChar,_1: $Constants.endChar};
            } else {
               if (_p0._1.ctor === "[]") {
                     return {ctor: "_Tuple2",_0: $Constants.startChar,_1: $Constants.endChar};
                  } else {
                     if (_p0._1._1.ctor === "[]") {
                           return {ctor: "_Tuple2",_0: _p0._0,_1: _p0._1._0};
                        } else {
                           var _p1 = _p0._1._0;
                           if (A2($Woot.isLaterWChar,_p1,insCh)) return {ctor: "_Tuple2",_0: _p0._0,_1: _p1}; else {
                                 var _v1 = insCh,_v2 = A2($List._op["::"],_p1,_p0._1._1);
                                 insCh = _v1;
                                 wStr = _v2;
                                 continue findLaterWChar;
                              }
                        }
                  }
            }
      }
   });
   var withoutPrecedenceOrdered = function (wStr) {
      var nextAbsent = function (wC) {    return $Basics.not(A2($List.any,function (x) {    return _U.eq(x.id,wC.next);},wStr));};
      var prevAbsent = function (wC) {    return $Basics.not(A2($List.any,function (x) {    return _U.eq(x.id,wC.prev);},wStr));};
      var prevAndNextAbsent = function (wC) {    return prevAbsent(wC) && nextAbsent(wC);};
      return A2($List.filter,prevAndNextAbsent,wStr);
   };
   var insertIntoList = F3(function (wCh,wStr,pos) {
      var _p2 = wStr;
      if (_p2.ctor === "::") {
            var _p4 = _p2._1;
            var _p3 = _p2._0;
            return _U.eq(pos,0) ? A2($List._op["::"],wCh,A2($List._op["::"],_p3,_p4)) : A2($List._op["::"],_p3,A3(insertIntoList,wCh,_p4,pos - 1));
         } else {
            return _U.list([wCh]);
         }
   });
   var intInsertChar = F3(function (wCh,pos,model) {
      var newWStr = A3(insertIntoList,wCh,model.wString,pos);
      var newStr = $Woot.wToString(newWStr);
      var newLen = $String.length(newStr);
      return _U.update(model,{wString: newWStr,wSeen: A2($Set.insert,wCh.id,model.wSeen),doc: A3(updateStrAndLen,model.doc,newStr,newLen)});
   });
   var integrateInsert$ = F5(function (wCh,pred,succ,posi,model) {
      var subStr = A3($Woot.subSeq,model.wString,pred,succ);
      var idOrderSubStr = A2($List._op["::"],pred,A2($Basics._op["++"],withoutPrecedenceOrdered(subStr),_U.list([succ])));
      var _p5 = A2(findLaterWChar,wCh,idOrderSubStr);
      var newPred = _p5._0;
      var newSucc = _p5._1;
      var _p6 = subStr;
      if (_p6.ctor === "[]") {
            var newModel = A3(intInsertChar,wCh,A2($Woot.pos,model.wString,succ),model);
            return _U.eq(pred,succ) ? _U.update(newModel,
            {debug: A2($Basics._op["++"],
            newModel.debug,
            A2($Basics._op["++"],
            "****",
            A2($Basics._op["++"],
            $Basics.toString(wCh.ch),
            A2($Basics._op["++"],$Basics.toString(A2($List.map,function (x) {    return $Basics.toString(x.ch);},idOrderSubStr))," ~~~~~"))))}) : newModel;
         } else {
            var newModel = A5(integrateInsert$,wCh,newPred,newSucc,posi,model);
            return _U.update(newModel,
            {debug: A2($Basics._op["++"],
            newModel.debug,
            A2($Basics._op["++"],
            "inserting: ",
            A2($Basics._op["++"],
            $Basics.toString(wCh.ch),
            A2($Basics._op["++"],
            "// ",
            A2($Basics._op["++"],
            "  newPred::  ",
            A2($Basics._op["++"],$Basics.toString(newPred.ch),A2($Basics._op["++"],"   NewSuc:: ",$Basics.toString(newSucc.ch))))))))});
         }
   });
   var generateInsChar = F4(function ($char,predIndex,nextIndex,model) {
      var newModel = _U.update(model,{counter: model.counter + 1});
      var newId = {ctor: "_Tuple2",_0: model.site,_1: model.counter};
      var succ = A2($Woot.ithVisible,model.wString,nextIndex);
      var pred = A2($Woot.ithVisible,model.wString,predIndex);
      var newWChar = {id: newId,ch: $char,prev: pred.id,next: succ.id,vis: 1};
      var debugModel = _U.update(newModel,
      {debug: A2($Basics._op["++"],
      newModel.debug,
      A2($Basics._op["++"],
      "PRED INDEX IS: ",
      A2($Basics._op["++"],
      $Basics.toString(predIndex),
      A2($Basics._op["++"],
      "((((((newWchar",
      A2($Basics._op["++"],
      $Basics.toString(newWChar),
      A2($Basics._op["++"],
      "   pred",
      A2($Basics._op["++"],$Basics.toString(pred.ch),A2($Basics._op["++"]," w stirng is === ",$Basics.toString(model.wString)))))))))});
      return {ctor: "_Tuple2",_0: A5(integrateInsert$,newWChar,pred,succ,nextIndex,debugModel),_1: $Model.W($Model.Insert(newWChar))};
   });
   var integrateRemoteInsert = F2(function (wChar,model) {
      var currCP = model.doc.cp;
      var next = A2($Woot.grabNext,wChar,model.wString);
      var prev = A2($Woot.grabPrev,wChar,model.wString);
      var insertPos = A2($Woot.pos,model.wString,A2($Woot.grabNext,wChar,model.wString));
      var newCP = _U.cmp(currCP,insertPos) > 0 ? currCP + 1 : currCP;
      var newCPModel = _U.update(model,
      {doc: A2(updateCP,model.doc,newCP),debug: A2($Basics._op["++"],model.debug,A2($Basics._op["++"],"prev: ",$Basics.toString(prev.ch)))});
      var newModel = A5(integrateInsert$,wChar,prev,next,insertPos,newCPModel);
      return {ctor: "_Tuple2",_0: newModel,_1: $Model.T(A3($Model.I,wChar.ch,insertPos,$Basics.fst(wChar.id)))};
   });
   var generateInsert = F3(function (ch,place,model) {
      var debugModel = _U.update(model,{debug: model.debug});
      return A4(generateInsChar,ch,place - 1,place,_U.update(debugModel,{doc: A2(updateCP,model.doc,place)}));
   });
   return _elm.Graph.values = {_op: _op
                              ,generateInsert: generateInsert
                              ,integrateRemoteInsert: integrateRemoteInsert
                              ,insertIntoList: insertIntoList
                              ,intInsertChar: intInsertChar
                              ,integrateInsert$: integrateInsert$
                              ,generateInsChar: generateInsChar
                              ,withoutPrecedenceOrdered: withoutPrecedenceOrdered
                              ,findLaterWChar: findLaterWChar
                              ,generateDelete: generateDelete
                              ,integrateRemoteDelete: integrateRemoteDelete
                              ,integrateDelete: integrateDelete
                              ,updateCP: updateCP
                              ,updateStrAndLen: updateStrAndLen};
};
Elm.Editor = Elm.Editor || {};
Elm.Editor.make = function (_elm) {
   "use strict";
   _elm.Editor = _elm.Editor || {};
   if (_elm.Editor.values) return _elm.Editor.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $Graph = Elm.Graph.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Model = Elm.Model.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Set = Elm.Set.make(_elm),
   $Signal = Elm.Signal.make(_elm),
   $String = Elm.String.make(_elm),
   $Woot = Elm.Woot.make(_elm);
   var _op = {};
   var sendDebug = F2(function (model,str) {
      return {ctor: "_Tuple2",_0: _U.update(model,{debug: A2($Basics._op["++"],str,model.debug)}),_1: $Model.W($Model.NoUpdate)};
   });
   var createInsertTUpdate = F2(function (_p0,tUpdates) {    var _p1 = _p0;return A2($List._op["::"],A3($Model.I,_p1._0,_p1._1,_p1._2),tUpdates);});
   var toEditList = function (_p2) {    var _p3 = _p2;return {ctor: "_Tuple2",_0: _p3._0,_1: _U.list([_p3._1])};};
   var processTUpdate = F2(function (typ,model) {
      var _p4 = typ;
      switch (_p4.ctor)
      {case "I": return toEditList(A3($Graph.generateInsert,_p4._0,_p4._1,model));
         case "D": return toEditList(A3($Graph.generateDelete,_p4._0,_p4._1,model));
         case "IS": var _p5 = A3(insertString,_p4._0,_p4._1 - 1,model);
           var newModel = _p5._0;
           var newEdits = _p5._1;
           return {ctor: "_Tuple2",_0: newModel,_1: $List.reverse(newEdits)};
         case "DS": return A3(deleteString,_p4._0,_p4._1,model);
         case "RequestWString": return {ctor: "_Tuple2",_0: model,_1: _U.list([$Model.W(A2($Model.CurrWString,model.wString,$Woot.wToString(model.wString)))])};
         default: return {ctor: "_Tuple2",_0: model,_1: _U.list([$Model.W($Model.NoUpdate)])};}
   });
   var deleteString = F3(function (str,index,model) {
      var tUpdates = $List.reverse(A3($List.map2,
      F2(function (ch,index) {    return A2($Model.D,ch,index);}),
      $String.toList(str),
      _U.range(index,index + $String.length(str) - 1)));
      var newModel = _U.update(model,
      {debug: A2($Basics._op["++"],
      model.debug,
      A2($Basics._op["++"],"DELETTTING: ",A2($Basics._op["++"],str,A2($Basics._op["++"],"DELETE LIST: ",$Basics.toString(tUpdates)))))});
      return A3($List.foldr,processTUpdateOfString,{ctor: "_Tuple2",_0: newModel,_1: _U.list([])},tUpdates);
   });
   var processTUpdateOfString = F2(function (tUpdate,_p6) {
      var _p7 = _p6;
      var _p8 = A2(processTUpdate,tUpdate,_p7._0);
      var newModel = _p8._0;
      var newEdits = _p8._1;
      return {ctor: "_Tuple2",_0: newModel,_1: A2($Basics._op["++"],_p7._1,newEdits)};
   });
   var insertString = F3(function (string,index,model) {
      var strIndexList = A3($List.map2,
      F2(function (ch,index) {    return {ctor: "_Tuple3",_0: ch,_1: index,_2: model.site};}),
      $String.toList(string),
      _U.range(index,index + $String.length(string) - 1));
      var tUpdates = A3($List.foldr,createInsertTUpdate,_U.list([]),strIndexList);
      return A3($List.foldl,processTUpdateOfString,{ctor: "_Tuple2",_0: model,_1: _U.list([])},tUpdates);
   });
   var integrateRemoteUpdate = F2(function (wUpd,m) {
      var integrate = F2(function (intFunction,wCh) {
         var _p9 = toEditList(A2(intFunction,wCh,m));
         var newModel = _p9._0;
         var newEdits = _p9._1;
         var _p10 = integratePool(newModel);
         var newIntModel = _p10._0;
         var newIntEdits = _p10._1;
         return {ctor: "_Tuple2",_0: newIntModel,_1: A2($Basics._op["++"],newIntEdits,newEdits)};
      });
      var _p11 = wUpd;
      switch (_p11.ctor)
      {case "Insert": return A2(integrate,$Graph.integrateRemoteInsert,_p11._0);
         case "Delete": return A2(integrate,$Graph.integrateRemoteDelete,_p11._0);
         default: return {ctor: "_Tuple2",_0: m,_1: _U.list([])};}
   });
   var integratePool = function (model) {
      integratePool: while (true) {
         var _p12 = model.pool;
         if (_p12.ctor === "[]") {
               return {ctor: "_Tuple2",_0: _U.update(model,{pool: model.processedPool,processedPool: _U.list([])}),_1: _U.list([])};
            } else {
               var _p14 = _p12._1;
               var _p13 = _p12._0;
               if (A2($Woot.canIntegrate,_p13,model.wSeen)) return A2(integrateRemoteUpdate,
                  _p13,
                  _U.update(model,{pool: A2($Basics._op["++"],model.processedPool,_p14),processedPool: _U.list([])})); else {
                     var _v6 = _U.update(model,{pool: _p14,processedPool: A2($List._op["::"],_p13,model.processedPool)});
                     model = _v6;
                     continue integratePool;
                  }
            }
      }
   };
   var integrateNew = F4(function (integrateFunction,wUpd,wCh,model) {
      var _p15 = toEditList(A2(integrateFunction,wCh,model));
      var newModel = _p15._0;
      var newEdits = _p15._1;
      var _p16 = integratePool(newModel);
      var intNewModel = _p16._0;
      var intNewEdits = _p16._1;
      return {ctor: "_Tuple2",_0: intNewModel,_1: A2($Basics._op["++"],intNewEdits,newEdits)};
   });
   var processServerUpdate = F2(function (wUpd,model) {
      var handleIntegration = F3(function (wCh,insert,integrateFunction) {
         return insert && A2($Set.member,wCh.id,model.wSeen) ? {ctor: "_Tuple2",_0: model,_1: _U.list([])} : A2($Woot.canIntegrate,
         wUpd,
         model.wSeen) ? A4(integrateNew,integrateFunction,wUpd,wCh,model) : {ctor: "_Tuple2"
                                                                            ,_0: _U.update(model,{pool: A2($List._op["::"],wUpd,model.pool)})
                                                                            ,_1: _U.list([])};
      });
      var _p17 = wUpd;
      switch (_p17.ctor)
      {case "SiteId": return {ctor: "_Tuple2",_0: _U.update(model,{site: _p17._0}),_1: _U.list([])};
         case "Insert": return A3(handleIntegration,_p17._0,true,$Graph.integrateRemoteInsert);
         case "Delete": return A3(handleIntegration,_p17._0,false,$Graph.integrateRemoteDelete);
         case "CurrWString": return {ctor: "_Tuple2",_0: _U.update(model,{wString: _p17._0}),_1: _U.list([])};
         default: return {ctor: "_Tuple2",_0: model,_1: _U.list([])};}
   });
   var processEdit = F2(function (edit,model) {
      var _p18 = edit;
      if (_p18.ctor === "T") {
            return A2(processTUpdate,_p18._0,model);
         } else {
            return A2(processServerUpdate,_p18._0,model);
         }
   });
   var processEditsAccum = F3(function (edits,model,oldEdits) {
      processEditsAccum: while (true) {
         var _p19 = edits;
         if (_p19.ctor === "[]") {
               return {ctor: "_Tuple2",_0: model,_1: oldEdits};
            } else {
               var _p20 = A2(processEdit,_p19._0,model);
               var newModel = _p20._0;
               var accEdits = _p20._1;
               var _v10 = _p19._1,_v11 = newModel,_v12 = A2($Basics._op["++"],oldEdits,accEdits);
               edits = _v10;
               model = _v11;
               oldEdits = _v12;
               continue processEditsAccum;
            }
      }
   });
   var processEdits = F2(function (edits,model) {    return A3(processEditsAccum,edits,model,_U.list([]));});
   return _elm.Editor.values = {_op: _op
                               ,integrateRemoteUpdate: integrateRemoteUpdate
                               ,integratePool: integratePool
                               ,processEdits: processEdits
                               ,processEditsAccum: processEditsAccum
                               ,processEdit: processEdit
                               ,integrateNew: integrateNew
                               ,processServerUpdate: processServerUpdate
                               ,processTUpdate: processTUpdate
                               ,deleteString: deleteString
                               ,insertString: insertString
                               ,processTUpdateOfString: processTUpdateOfString
                               ,toEditList: toEditList
                               ,createInsertTUpdate: createInsertTUpdate
                               ,sendDebug: sendDebug};
};
Elm.DraftTests = Elm.DraftTests || {};
Elm.DraftTests.make = function (_elm) {
   "use strict";
   _elm.DraftTests = _elm.DraftTests || {};
   if (_elm.DraftTests.values) return _elm.DraftTests.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Constants = Elm.Constants.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $Editor = Elm.Editor.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Model = Elm.Model.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Set = Elm.Set.make(_elm),
   $Signal = Elm.Signal.make(_elm),
   $Woot = Elm.Woot.make(_elm);
   var _op = {};
   var makeEmptySite = function (id) {
      return {counter: 1
             ,site: id
             ,wString: _U.list([])
             ,doc: {cp: 666,str: "bad",len: 666}
             ,debug: ""
             ,wSeen: A2($Set.insert,$Constants.endId,A2($Set.insert,$Constants.startId,$Set.empty))
             ,start: $Constants.startChar
             ,processedPool: _U.list([])
             ,pool: _U.list([])};
   };
   var simpleCase = function () {
      var empty = makeEmptySite(1);
      var _p0 = A3($Editor.insertString,"a",1,empty);
      var model = _p0._0;
      var added = _p0._1;
      return _U.eq($Woot.wToString(model.wString),"a");
   }();
   var simpleCaseLonger = function () {
      var empty = makeEmptySite(1);
      var _p1 = A3($Editor.insertString,"hello",1,empty);
      var model = _p1._0;
      var edit = _p1._1;
      return _U.eq($Woot.wToString(model.wString),"hello");
   }();
   var insertOrderIrrelevant = function () {
      var remote = makeEmptySite(2);
      var local = makeEmptySite(1);
      var _p2 = A3($Editor.insertString,"hello",1,local);
      var localModel = _p2._0;
      var lEdits = _p2._1;
      var _p3 = A2($Editor.processEdits,lEdits,remote);
      var remoteModel = _p3._0;
      var rEdits = _p3._1;
      return _U.eq($Woot.wToString(remoteModel.wString),"hello") && _U.eq($Woot.wToString(localModel.wString),"hello");
   }();
   var concurrentInsertsConsistentText = function () {
      var _p4 = A3($Editor.insertString,"hello",1,makeEmptySite(1));
      var localModel = _p4._0;
      var lEdits = _p4._1;
      var _p5 = A2($Editor.processEdits,lEdits,makeEmptySite(2));
      var remoteModel = _p5._0;
      var rEdits = _p5._1;
      var _p6 = A3($Editor.insertString,"kittie",5,remoteModel);
      var remoteModelType = _p6._0;
      var newREdits = _p6._1;
      var _p7 = A3($Editor.insertString,"doggie",3,localModel);
      var localModelType = _p7._0;
      var newLEdits = _p7._1;
      var _p8 = A2($Editor.processEdits,newREdits,localModelType);
      var localModelNew = _p8._0;
      var newLPEdits = _p8._1;
      var _p9 = A2($Editor.processEdits,newLEdits,remoteModelType);
      var remoteModelNew = _p9._0;
      var newRPEdits = _p9._1;
      return _U.eq($Woot.wToString(remoteModelNew.wString),$Woot.wToString(localModelNew.wString));
   }();
   var insertIsIdempotent = function () {
      var _p10 = A3($Editor.insertString,"hey there",1,makeEmptySite(1));
      var localModel = _p10._0;
      var lEdits = _p10._1;
      var _p11 = A2($Editor.processEdits,lEdits,localModel);
      var newLocalModel = _p11._0;
      var newEdits = _p11._1;
      return _U.eq($Woot.wToString(localModel.wString),$Woot.wToString(newLocalModel.wString));
   }();
   var localDeleteRemovesCharacter = function () {
      var _p12 = A3($Editor.insertString,"hi how are you?",1,makeEmptySite(1));
      var localModel = _p12._0;
      var lEdits = _p12._1;
      var _p13 = A2($Editor.processEdits,_U.list([$Model.T(A2($Model.D,_U.chr("h"),3))]),localModel);
      var newModel = _p13._0;
      var newEdits = _p13._1;
      return _U.eq($Woot.wToString(newModel.wString),"hi ow are you?");
   }();
   var remoteDeleteProducesConsistentResults = function () {
      var _p14 = A3($Editor.insertString,"what are you doing there?!?",1,makeEmptySite(1));
      var localModel = _p14._0;
      var lEdits = _p14._1;
      var _p15 = A2($Editor.processEdits,_U.list([$Model.T(A2($Model.D,_U.chr("a"),5))]),localModel);
      var newLocalModel = _p15._0;
      var newLEdits = _p15._1;
      var _p16 = A2($Editor.processEdits,A2($Basics._op["++"],newLEdits,lEdits),makeEmptySite(2));
      var remoteModel = _p16._0;
      var remoteEdits = _p16._1;
      return _U.eq($Woot.wToString(remoteModel.wString),"what re you doing there?!?");
   }();
   var runTestsStrings = _U.list([remoteDeleteProducesConsistentResults]);
   var runTests1 = _U.list([simpleCase
                           ,simpleCaseLonger
                           ,insertOrderIrrelevant
                           ,concurrentInsertsConsistentText
                           ,insertIsIdempotent
                           ,localDeleteRemovesCharacter
                           ,remoteDeleteProducesConsistentResults]);
   return _elm.DraftTests.values = {_op: _op
                                   ,makeEmptySite: makeEmptySite
                                   ,simpleCase: simpleCase
                                   ,simpleCaseLonger: simpleCaseLonger
                                   ,insertOrderIrrelevant: insertOrderIrrelevant
                                   ,concurrentInsertsConsistentText: concurrentInsertsConsistentText
                                   ,insertIsIdempotent: insertIsIdempotent
                                   ,localDeleteRemovesCharacter: localDeleteRemovesCharacter
                                   ,remoteDeleteProducesConsistentResults: remoteDeleteProducesConsistentResults
                                   ,runTestsStrings: runTestsStrings
                                   ,runTests1: runTests1};
};
Elm.Checks = Elm.Checks || {};
Elm.Checks.make = function (_elm) {
   "use strict";
   _elm.Checks = _elm.Checks || {};
   if (_elm.Checks.values) return _elm.Checks.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Check = Elm.Check.make(_elm),
   $Check$Investigator = Elm.Check.Investigator.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $DraftTests = Elm.DraftTests.make(_elm),
   $Editor = Elm.Editor.make(_elm),
   $Graphics$Element = Elm.Graphics.Element.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Model = Elm.Model.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm),
   $String = Elm.String.make(_elm),
   $Woot = Elm.Woot.make(_elm);
   var _op = {};
   var tripleStrings = _U.list([{ctor: "_Tuple3",_0: "footbol",_1: "how",_2: "are"}
                               ,{ctor: "_Tuple3",_0: "what",_1: "is",_2: "love"}
                               ,{ctor: "_Tuple3",_0: "home",_1: "cake",_2: "twelve"}]);
   var generatePseudoRandomIndex = F2(function (origStr,i) {    return _U.eq($String.length(origStr),0) ? 0 : A2($Basics._op["%"],i,$String.length(origStr));});
   var first_index = 0;
   var claim_insert_string = A2($Check.$for,
   A2($Check.is,
   A2($Check.that,
   $Check.claim("Can insert a string and get same string"),
   function (str) {
      var _p0 = A3($Editor.insertString,str,first_index,$DraftTests.makeEmptySite(1));
      var model = _p0._0;
      var edit = _p0._1;
      return $Woot.wToString(model.wString);
   }),
   $Basics.identity),
   $Check$Investigator.string);
   var insert_order_irrelevant = A2($Check.$for,
   A2($Check.is,
   A2($Check.that,
   $Check.claim("remote site gets same as local"),
   function (str) {
      var _p1 = A3($Editor.insertString,str,first_index,$DraftTests.makeEmptySite(1));
      var localModel = _p1._0;
      var lEdits = _p1._1;
      var _p2 = A2($Editor.processEdits,lEdits,$DraftTests.makeEmptySite(1));
      var remoteModel = _p2._0;
      var rEdits = _p2._1;
      return $Woot.wToString(remoteModel.wString);
   }),
   $Basics.identity),
   $Check$Investigator.string);
   var concurrent_insert_consistent$ = F5(function (origStr,localStr,remoteStr,x,y) {
      var lIndex = A2(generatePseudoRandomIndex,origStr,y);
      var rIndex = A2(generatePseudoRandomIndex,origStr,x);
      var _p3 = A3($Editor.insertString,origStr,first_index,$DraftTests.makeEmptySite(1));
      var localModel1 = _p3._0;
      var lEdits1 = _p3._1;
      var _p4 = A2($Editor.processEdits,lEdits1,$DraftTests.makeEmptySite(2));
      var remoteModel1 = _p4._0;
      var rEdits1 = _p4._1;
      var _p5 = A3($Editor.insertString,remoteStr,rIndex,remoteModel1);
      var remoteModel2 = _p5._0;
      var rEdits2 = _p5._1;
      var _p6 = A3($Editor.insertString,localStr,lIndex,localModel1);
      var localModel2 = _p6._0;
      var lEdits2 = _p6._1;
      var _p7 = A2($Editor.processEdits,rEdits2,localModel2);
      var localModel3 = _p7._0;
      var lEdits3 = _p7._1;
      var _p8 = A2($Editor.processEdits,lEdits2,remoteModel2);
      var remoteModel3 = _p8._0;
      var rEdits3 = _p8._1;
      return {ctor: "_Tuple2",_0: $Woot.wToString(remoteModel3.wString),_1: $Woot.wToString(localModel3.wString)};
   });
   var concurrent_insert_consistent = A2($Check.$for,
   A2($Check.is,
   A2($Check.that,
   $Check.claim("two people write at same time, same result"),
   function (_p9) {
      var _p10 = _p9;
      return $Basics.fst(A5(concurrent_insert_consistent$,_p10._0,_p10._1._0,_p10._1._1._0,_p10._1._1._1._0,_p10._1._1._1._1));
   }),
   function (_p11) {
      var _p12 = _p11;
      return $Basics.snd(A5(concurrent_insert_consistent$,_p12._0,_p12._1._0,_p12._1._1._0,_p12._1._1._1._0,_p12._1._1._1._1));
   }),
   $Check$Investigator.tuple({ctor: "_Tuple2"
                             ,_0: $Check$Investigator.string
                             ,_1: $Check$Investigator.tuple({ctor: "_Tuple2"
                                                            ,_0: $Check$Investigator.string
                                                            ,_1: $Check$Investigator.tuple({ctor: "_Tuple2"
                                                                                           ,_0: $Check$Investigator.string
                                                                                           ,_1: $Check$Investigator.tuple({ctor: "_Tuple2"
                                                                                                                          ,_0: $Check$Investigator.$int
                                                                                                                          ,_1: $Check$Investigator.$int})})})}));
   var runTests = A2($List.map,function (_p13) {    var _p14 = _p13;return A5(concurrent_insert_consistent$,_p14._0,_p14._1,_p14._2,1,1);},tripleStrings);
   var insert_idempotent = A2($Check.$for,
   A2($Check.is,
   A2($Check.that,
   $Check.claim("insert is idempotent"),
   function (str) {
      var _p15 = A3($Editor.insertString,str,first_index,$DraftTests.makeEmptySite(1));
      var model = _p15._0;
      var edits = _p15._1;
      return $Woot.wToString(model.wString);
   }),
   function (str) {
      var _p16 = A3($Editor.insertString,str,first_index,$DraftTests.makeEmptySite(1));
      var model = _p16._0;
      var edits = _p16._1;
      var _p17 = A2($Editor.processEdits,edits,model);
      var newModel = _p17._0;
      var newEdits = _p17._1;
      return $Woot.wToString(newModel.wString);
   }),
   $Check$Investigator.string);
   var local_delete_consistent = A2($Check.$for,
   A2($Check.is,
   A2($Check.that,
   $Check.claim("local delete produces consistent results"),
   function (_p18) {
      var _p19 = _p18;
      var _p23 = _p19._0;
      var newNumber = _U.eq($String.length(_p23),0) ? 0 : A2($Basics._op["%"],_p19._1,$String.length(_p23));
      var charToDelete = function () {
         var _p20 = A2($List.drop,newNumber,$String.toList(_p23));
         if (_p20.ctor === "::") {
               return _p20._0;
            } else {
               return _U.chr("a");
            }
      }();
      var _p21 = A3($Editor.insertString,_p23,first_index,$DraftTests.makeEmptySite(1));
      var model = _p21._0;
      var edits = _p21._1;
      var _p22 = A2($Editor.processEdits,_U.list([$Model.T(A2($Model.D,charToDelete,newNumber))]),model);
      var newModel = _p22._0;
      var newEdits = _p22._1;
      return $Woot.wToString(newModel.wString);
   }),
   function (_p24) {
      var _p25 = _p24;
      var _p26 = _p25._0;
      var newNumber = _U.eq($String.length(_p26),0) ? 0 : A2($Basics._op["%"],_p25._1,$String.length(_p26));
      var newStrList = A2($Basics._op["++"],A2($List.take,newNumber,$String.toList(_p26)),A2($List.drop,newNumber + 1,$String.toList(_p26)));
      return A3($List.foldl,F2(function ($char,accumStr) {    return A2($Basics._op["++"],$Basics.toString($char),accumStr);}),"",newStrList);
   }),
   $Check$Investigator.tuple({ctor: "_Tuple2",_0: $Check$Investigator.string,_1: $Check$Investigator.$int}));
   var suite_co = A2($Check.suite,
   "Collab Editing Suite",
   _U.list([claim_insert_string,insert_order_irrelevant,insert_idempotent,local_delete_consistent,concurrent_insert_consistent]));
   var result = $Check.quickCheck(suite_co);
   var main = $Graphics$Element.show(result);
   return _elm.Checks.values = {_op: _op
                               ,first_index: first_index
                               ,generatePseudoRandomIndex: generatePseudoRandomIndex
                               ,claim_insert_string: claim_insert_string
                               ,insert_order_irrelevant: insert_order_irrelevant
                               ,concurrent_insert_consistent$: concurrent_insert_consistent$
                               ,concurrent_insert_consistent: concurrent_insert_consistent
                               ,insert_idempotent: insert_idempotent
                               ,local_delete_consistent: local_delete_consistent
                               ,suite_co: suite_co
                               ,tripleStrings: tripleStrings
                               ,runTests: runTests
                               ,result: result
                               ,main: main};
};
Elm.TUpdate = Elm.TUpdate || {};
Elm.TUpdate.make = function (_elm) {
   "use strict";
   _elm.TUpdate = _elm.TUpdate || {};
   if (_elm.TUpdate.values) return _elm.TUpdate.values;
   var _U = Elm.Native.Utils.make(_elm),
   $Basics = Elm.Basics.make(_elm),
   $Constants = Elm.Constants.make(_elm),
   $ConvertJson = Elm.ConvertJson.make(_elm),
   $Debug = Elm.Debug.make(_elm),
   $DraftTests = Elm.DraftTests.make(_elm),
   $Editor = Elm.Editor.make(_elm),
   $Graphics$Element = Elm.Graphics.Element.make(_elm),
   $List = Elm.List.make(_elm),
   $Maybe = Elm.Maybe.make(_elm),
   $Model = Elm.Model.make(_elm),
   $Result = Elm.Result.make(_elm),
   $Signal = Elm.Signal.make(_elm),
   $SocketIO = Elm.SocketIO.make(_elm),
   $Task = Elm.Task.make(_elm);
   var _op = {};
   var main = $Graphics$Element.empty;
   var tester = function () {
      var remote = $DraftTests.makeEmptySite(2);
      var local = $DraftTests.makeEmptySite(1);
      var _p0 = A3($Editor.insertString,"hey",0,local);
      var localModel = _p0._0;
      var lEdits = _p0._1;
      var _p1 = A2($Editor.processEdits,lEdits,remote);
      var remoteModel = _p1._0;
      var rEdits = _p1._1;
      return {ctor: "_Tuple2",_0: remoteModel,_1: localModel};
   }();
   var tUpdatePort = Elm.Native.Port.make(_elm).inboundSignal("tUpdatePort",
   "String",
   function (v) {
      return typeof v === "string" || typeof v === "object" && v instanceof String ? v : _U.badPort("a string",v);
   });
   var tUpdate = A2($Signal.map,$ConvertJson.jsonToTUpdate,tUpdatePort);
   var windowLocPort = Elm.Native.Port.make(_elm).inbound("windowLocPort",
   "String",
   function (v) {
      return typeof v === "string" || typeof v === "object" && v instanceof String ? v : _U.badPort("a string",v);
   });
   var socket = A2($SocketIO.io,windowLocPort,$SocketIO.defaultOptions);
   var initializePort = Elm.Native.Task.make(_elm).perform(A2($Task.andThen,socket,A2($SocketIO.emit,"example","whaddup")));
   var incomingPeer = Elm.Native.Port.make(_elm).inboundSignal("incomingPeer",
   "String",
   function (v) {
      return typeof v === "string" || typeof v === "object" && v instanceof String ? v : _U.badPort("a string",v);
   });
   var serverUpdates = A2($Signal.map,function (u) {    return $ConvertJson.jsonToWUpdates(u);},incomingPeer);
   var incoming = $Signal.mailbox("null");
   var incomingPort = Elm.Native.Task.make(_elm).perform(A2($Task.andThen,socket,A2($SocketIO.on,"serverWUpdates",incoming.address)));
   var sockConnected = $Signal.mailbox(false);
   var handleServerUpdate = function (wUpdate) {    return $Model.W(wUpdate);};
   var serverUpdateToEdit = A2($Signal.map,$List.map(handleServerUpdate),serverUpdates);
   var handleTUpdate = function (tUpdate) {    return $Model.T(tUpdate);};
   var tUpdateToEdit = A2($Signal.map,function (t) {    return _U.list([handleTUpdate(t)]);},tUpdate);
   var edits = A2($Signal.merge,tUpdateToEdit,serverUpdateToEdit);
   var modelFold = A3($Signal.foldp,
   F2(function (e,_p2) {    var _p3 = _p2;return A2($Editor.processEdits,e,_p3._0);}),
   {ctor: "_Tuple2",_0: $Constants.emptyModel,_1: _U.list([])},
   edits);
   var sendNewString = A2($Signal.map,function (_p4) {    var _p5 = _p4;return $ConvertJson.stringUpdateToJson(_p5._0.doc.str);},modelFold);
   var sendNewStringUpdatesPort = Elm.Native.Port.make(_elm).outboundSignal("sendNewStringUpdatesPort",function (v) {    return v;},sendNewString);
   var editToTUpdate = function (e) {    var _p6 = e;if (_p6.ctor === "W") {    return $Model.NoTUpdate;} else {    return _p6._0;}};
   var docUpdatesToSend = A2($Signal.map,function (_p7) {    var _p8 = _p7;return A2($List.map,editToTUpdate,_p8._1);},modelFold);
   var docUpdatesPort = Elm.Native.Port.make(_elm).outboundSignal("docUpdatesPort",
   function (v) {
      return v;
   },
   A2($Signal.map,function (updates) {    return $ConvertJson.tUpdatesToJson(updates);},docUpdatesToSend));
   var editToWUpdate = function (e) {    var _p9 = e;if (_p9.ctor === "W") {    return _p9._0;} else {    return $Model.NoUpdate;}};
   var cleanedUpdatesToSend = A2($Signal.map,function (_p10) {    var _p11 = _p10;return A2($List.map,editToWUpdate,_p11._1);},modelFold);
   var localUpdatesAsJsonToSend = A2($Signal.map,function (updates) {    return $ConvertJson.wUpdatesToJson(updates);},cleanedUpdatesToSend);
   var sendUpdatesPort = Elm.Native.Task.make(_elm).performSignal("sendUpdatesPort",
   A2($Signal.map,function (i) {    return A2($Task.andThen,socket,A2($SocketIO.emit,"localEdits",i));},localUpdatesAsJsonToSend));
   var sendUpdatesPortPeer = Elm.Native.Port.make(_elm).outboundSignal("sendUpdatesPortPeer",function (v) {    return v;},localUpdatesAsJsonToSend);
   var throwOutNoUpdatesAndCaret = function (wUp) {    var _p12 = wUp;if (_p12.ctor === "NoUpdate") {    return false;} else {    return true;}};
   var throwOutNoTUpdates = function (tUp) {    var _p13 = tUp;if (_p13.ctor === "NoTUpdate") {    return false;} else {    return true;}};
   return _elm.TUpdate.values = {_op: _op
                                ,throwOutNoTUpdates: throwOutNoTUpdates
                                ,throwOutNoUpdatesAndCaret: throwOutNoUpdatesAndCaret
                                ,editToWUpdate: editToWUpdate
                                ,editToTUpdate: editToTUpdate
                                ,handleTUpdate: handleTUpdate
                                ,handleServerUpdate: handleServerUpdate
                                ,sockConnected: sockConnected
                                ,incoming: incoming
                                ,socket: socket
                                ,tUpdate: tUpdate
                                ,serverUpdates: serverUpdates
                                ,localUpdatesAsJsonToSend: localUpdatesAsJsonToSend
                                ,cleanedUpdatesToSend: cleanedUpdatesToSend
                                ,docUpdatesToSend: docUpdatesToSend
                                ,sendNewString: sendNewString
                                ,serverUpdateToEdit: serverUpdateToEdit
                                ,tUpdateToEdit: tUpdateToEdit
                                ,edits: edits
                                ,modelFold: modelFold
                                ,tester: tester
                                ,main: main};
};
