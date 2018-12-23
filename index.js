const { TransparentProxy } = require('./transparent-proxy');

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
  const originalToTargets = new WeakMap();

  /**
   * An object is crossing the membrane. It either needs to be wrapped, or
   * unwrapped.
   * @param {any} obj
   * @param {Set<any>} mines
   * @param {Set<any>} others
   * @param {boolean=} sameGraph
   */
  function crossMembrane(obj, mines, others, sameGraph) {
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
    if (sameGraph) {
      return wrap(obj, mines, others);
    }
    return wrap(obj, others, mines);
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
      const target = originalToTargets.get(original);
      if (target.hasOwnProperty(sym)) {
        // The data is guaranteed to be from the same object graph.
        original[sym] = crossMembrane(target[sym], mines, others, true);
      }
    });
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
      ? typeof original === 'function' ? () => {} : {}
      : original;

    const proxy = new TransparentProxy(target, {
      apply(target, thisArg, argArray) {
        thisArg = crossMembrane(thisArg, mines, others);
        for (let i = 0; i < argArray.length; i++) {
          argArray[i] = crossMembrane(argArray[i], mines, others);
        }
        const retval = Reflect.apply(original, thisArg, argArray);

        if (typeof retval === 'symbol' && retval.private) {
          // A private symbol is being exposed to the other side.
          handlePrivates(retval, mines, others);
        }

        // The retval is guaranteed to be from the same object graph as the
        // target.
        return crossMembrane(retval, mines, others, /* sameGraph */ true);
      },

      get(target, p, receiver) {
        receiver = crossMembrane(receiver, mines, others);
        const retval = Reflect.get(original, p, receiver);

        if (typeof retval === 'symbol' && retval.private) {
          // A private symbol is being exposed to the other side.
          handlePrivates(retval, mines, others);
        }

        // The retval is guaranteed to be from the same object graph as the
        // target.
        return crossMembrane(retval, mines, others, /* sameGraph */ true);
      },

      set(target, p, value, receiver) {
        value = crossMembrane(value, mines, others);
        receiver = crossMembrane(receiver, mines, others);

        return Reflect.set(original, p, value, receiver);
      },
    }, whitelist);

    mines.add(original);
    originalToTargets.set(original, target);
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
