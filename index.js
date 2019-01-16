const { ProtoProxy, TransparentProxy } = require('./transparent-proxy');

/**
 * @param {any} obj
 */
function isPrimitive(obj) {
  return obj === undefined
    || obj === null
    || typeof obj === 'boolean'
    || typeof obj === 'number'
    || typeof obj === 'string'
    || typeof obj === 'symbol';
}

/**
 * @param {boolean} useShadowTargets
 */
function createWrapFn(useShadowTargets) {
  /**
   * Mappings from original objects (in either graph) to the already created
   * proxy, and back again.
   */
  const originalsToProxies = new WeakMap();
  const proxiesToOriginals = new WeakMap();

  /**
   * Whitelist holds the known private symbols that have been exposed to the
   * membrane. These then become trappable by the transparent proxy.
   */
  const whitelist = new Set();

  /**
   * We also need a mapping from the original object to its shadow target, so
   * we can copy the transparently-placed data to the original.
   */
  const originalsToTargets = new WeakMap();
  const targetsToOriginals = new WeakMap();

  /**
   * An object is crossing the membrane. It either needs to be wrapped, or
   * unwrapped. Mines is the object graph that obj belongs to, and others the
   * other object graph.
   * @param {any} obj
   * @param {Set<any>} mines
   * @param {Set<any>} others
   */
  function crossMembrane(obj, mines, others) {
    if (typeof obj === 'symbol' && obj.private) {
      // A private symbol is being exposed to the other side.
      handlePrivates(obj, mines, others);
    }

    // We don't need to wrap any primitive values.
    if (isPrimitive(obj)) return obj;

    // If the object is a proxy, that means it's being pushed back into its
    // original object graph.
    if (proxiesToOriginals.has(obj)) {
      return proxiesToOriginals.get(obj);
    }

    // Else, we're exposing a new object to the membrane. We must then
    // determine if the object is originating from the same object graph that
    // the outer proxy's target (return values from get/apply operations) or
    // if it's being exposed from the other object graph.
    return wrap(obj, mines, others);
  }

  /**
   * A private symbol is being exposed to the other side. Check every
   * object that has been exposed to this side to see if it had data
   * transparently set on it.
   * @param {symbol} sym
   * @param {Set<any>} mines
   * @param {Set<any>} others
   */
  function handlePrivates(sym, mines, others) {
    if (whitelist.has(sym)) {
      return;
    }
    whitelist.add(sym);

    others.forEach(original => {
      const target = originalsToTargets.get(original);
      const desc = Reflect.getOwnPropertyDescriptor(target, sym);
      if (desc) {
        // The desc is guaranteed to be from the same object graph.
        const crossed = crossMembrane(desc, mines, others);
        Reflect.defineProperty(original, sym, crossed);
      }
    });
  }

  function ShadowTarget(original) {
    if (Array.isArray(original)) {
      return [];
    }
    if (typeof original === 'function') {
      return function() {};
    }
    return {};
  }

  // Wraps the shadow target, that way the private symbols (which would
  // normally transparently interact with a proxy's target) fire getPrototypeOf
  // traps. Without this wrapper, the shadow target (which can't have an
  // in-sync prototype chain in all circumstances) would not be able to
  // traverse the membrane's prototype.
  function ShadowWrapper(shadow) {
    const wrapper = new ProtoProxy(shadow, {
      getPrototypeOf(target) {
        const original = targetsToOriginals.get(wrapper);
        const proxy = originalsToProxies.get(original);
        return Reflect.getPrototypeOf(proxy);
      },

      // setPrototypeOf(target) {
      // },
    });

    return wrapper;
  }

  /**
   * Wraps the object in a new membrane proxy.
   * Mines is a set of objects exposed through the membrane that belong to the
   * same object graph as the object. Others contains the other sides objects.
   * @param {any} original
   * @param {Set<any>} mines
   * @param {Set<any>} others
   */
  function wrap(original, mines, others) {
    // We don't need to wrap any primitive values.
    if (isPrimitive(original)) return original;

    // Reuse an already created proxy (to maintain object identity on the other
    // side).
    if (originalsToProxies.has(original)) return originalsToProxies.get(original);

    // Shadow targets are currently used by other Membrane implementations.
    const target = useShadowTargets
      ? new ShadowWrapper(new ShadowTarget(original))
      : original;

    const proxy = new TransparentProxy(target, {
      apply(target, thisArg, argArray) {
        // The thisArg is guaranteed to be from the other object graph.
        thisArg = crossMembrane(thisArg, others, mines);
        for (let i = 0; i < argArray.length; i++) {
          // The arg is guaranteed to be from the other object graph.
          argArray[i] = crossMembrane(argArray[i], others, mines);
        }
        const retval = Reflect.apply(original, thisArg, argArray);

        // The retval is guaranteed to be from the same object graph.
        return crossMembrane(retval, mines, others);
      },

      get(target, key, receiver) {
        // For debugging.
        if (key === '__original__') return original;
        if (key === '__target__') return target;

        // The receiver is guaranteed to be from the other object graph.
        receiver = crossMembrane(receiver, others, mines);
        const retval = Reflect.get(original, key, receiver);

        // The retval is guaranteed to be from the same object graph.
        return crossMembrane(retval, mines, others);
      },

      set(target, key, value, receiver) {
        // The value is guaranteed to be from the other object graph.
        value = crossMembrane(value, others, mines);
        // The receiver is guaranteed to be from the other object graph.
        receiver = crossMembrane(receiver, others, mines);

        return Reflect.set(original, key, value, receiver);
      },

      // Necessary for prototype inheritance tests
      getPrototypeOf(target) {
        const proto = Reflect.getPrototypeOf(original);

        // The proto is guaranteed to be from the same object graph.
        return crossMembrane(proto, mines, others);
      },

      setPrototypeOf(target, proto) {
        // The proto is guaranteed to be from the other object graph.
        proto = crossMembrane(proto, others, mines);

        return Reflect.setPrototypeOf(original, proto);
      },

      // Necessary for cross-membrane descriptor wrapping
      has(target, p) {
        return Reflect.has(original, p);
      },
    }, whitelist);

    mines.add(original);
    originalsToTargets.set(original, target);
    targetsToOriginals.set(target, original);
    originalsToProxies.set(original, proxy);
    proxiesToOriginals.set(proxy, original);

    return proxy;
  }

  return wrap;
}

/**
 * @param {any} graph
 * @param {boolean=} useShadowTargets
 */
function Membrane(graph, useShadowTargets) {
  const wrap = createWrapFn(!!useShadowTargets);
  return wrap(graph, new Set(), new Set());
}

exports.Membrane = Membrane;
