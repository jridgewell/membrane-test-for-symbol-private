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
    || typeof obj === 'symbol'; // for simplicity let's treat symbols as primitives
}

/**
 * @param {boolean} useShadowTargets
 */
function createWrapFn(useShadowTargets) {
  const originalsToProxies = new WeakMap();
  const proxiesToOriginals = new WeakMap();
  /**
   * Whitelist holds the known private symbols that have been exposed to the
   * membrane.
   */
  const whitelist = new Set();

  /**
   * We also need a mapping from the original object to its shadow target, so
   * we can copy the transparently-placed data to the original.
   */
  const originalToTargets = new WeakMap();

  /**
   * @param {proxy} proxy
   * @param {Set<any>} originals
   * @param {Set<any>} proxies
   * @param {boolean=} sameGraph
   */
  function unwrap(proxy, originals, proxies, sameGraph) {
    if (proxiesToOriginals.has(proxy)) {
      return proxiesToOriginals.get(proxy);
    }
    if (sameGraph) {
      return wrap(proxy, originals, proxies);
    }
    return wrap(proxy, proxies, originals);
  }

  /**
   * @param {symbol} privateSymbol
   * @param {Set<any>} originals
   * @param {Set<any>} proxies
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
        original[sym] = wrap(target[sym], mines, others, true);
      }
    });
  }

  /**
   * @param {object | Function} original
   * @param {Set<any>} originals
   * @param {Set<any>} proxies
   */
  function wrap(original, originals, proxies) {
    // we don't need to wrap any primitive values
    if (isPrimitive(original)) return original;
    // we also don't need to wrap already wrapped values
    if (originalsToProxies.has(original)) return originalsToProxies.get(original);
    // if it's a proxied value, that means we're unwrapping it
    if (proxiesToOriginals.has(original)) return proxiesToOriginals.get(original);
    const target = useShadowTargets
      ? typeof original === 'function' ? () => {} : {}
      : original;

    const proxy = new TransparentProxy(target, {
      apply(target, thisArg, argArray) {
        thisArg = unwrap(thisArg, originals, proxies);
        for (let i = 0; i < argArray.length; i++) {
          if (!isPrimitive(argArray[i])) {
            argArray[i] = unwrap(argArray[i], originals, proxies);
          }
        }
        const retval = Reflect.apply(original, thisArg, argArray);

        if (typeof retval === 'symbol' && retval.private) {
          handlePrivates(retval, originals, proxies);
        }

        // The retval is guaranteed to be in the same object graph as the target
        return unwrap(retval, originals, proxies, /* sameGraph */ true);
      },
      get(target, p, receiver) {
        receiver = unwrap(receiver, originals, proxies);
        const retval = Reflect.get(original, p, receiver);

        if (typeof retval === 'symbol' && retval.private) {
          handlePrivates(retval, originals, proxies);
        }

        // The retval is guaranteed to be in the same object graph as the target
        return unwrap(retval, originals, proxies, /* sameGraph */ true);
      },
      set(target, p, value, receiver) {
        value = unwrap(value, originals, proxies);
        receiver = unwrap(receiver, originals, proxies);
        return Reflect.set(original, p, value, receiver);
      },
    }, whitelist);

    originals.add(original);
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
