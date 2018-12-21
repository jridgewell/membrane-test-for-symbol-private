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
 * @param {WeakMap<object, any>} originalsToProxies
 * @param {WeakMap<object, any>} proxiesToOriginals
 */
function createWrapFn(originalsToProxies, proxiesToOriginals) {
  /**
   * @param {proxy} proxy
   */
  function unwrap(proxy) {
    if (proxiesToOriginals.has(proxy)) {
      return proxiesToOriginals.get(proxy);
    }
    return wrap(proxy);
  }

  /**
   * @param {object | Function} original
   */
  function wrap(original) {
    // we don't need to wrap any primitive values
    if (isPrimitive(original)) return original;
    // we also don't need to wrap already wrapped values
    if (originalsToProxies.has(original)) return originalsToProxies.get(original);
    // if it's a proxied value, that means we're unwrapping it
    if (proxiesToOriginals.has(original)) return proxiesToOriginals.get(original);
    const shadowTarget = typeof original === 'function'
      ? () => { }
      : {};

    const proxy = new TransparentProxy(shadowTarget, {
      apply(target, thisArg, argArray) {
        thisArg = unwrap(thisArg);
        for (let i = 0; i < argArray.length; i++) {
          if (!isPrimitive(argArray[i])) {
            argArray[i] = unwrap(argArray[i]);
          }
        }
        const retval = Reflect.apply(original, thisArg, argArray);
        return unwrap(retval);
      },
      get(target, p, receiver) {
        receiver = unwrap(receiver);
        const retval = Reflect.get(original, p, receiver);
        return unwrap(retval);
      },
      set(target, p, value, receiver) {
        value = unwrap(value);
        receiver = unwrap(receiver);
        return Reflect.set(target, p, value, receiver);
      },
    });

    originalsToProxies.set(original, proxy);
    proxiesToOriginals.set(proxy, original);

    return proxy;
  }

  return wrap;
}

/**
 * @param {any} graph
 */
function Membrane(graph) {
  const originalsToProxies = new WeakMap();
  const proxiesToOriginals = new WeakMap();

  const wrap = createWrapFn(originalsToProxies, proxiesToOriginals);

  return wrap(graph);
}

exports.Membrane = Membrane;
