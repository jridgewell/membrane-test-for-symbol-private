/**
 * @param {any} obj
 * @param {ProxyHandler} handler
 * @param {Set<symbol>} whitelist
 */
function TransparentProxy(obj, handler, whitelist) {
  function isPrivateSymbol(sym) {
    return typeof sym === 'symbol' && !!sym.private;
  }

  function trap(handler, name) {
    return function(target, key, ...args) {
      if (isPrivateSymbol(key) && !whitelist.has(key)) {
        return Reflect[name](target, key, ...args);
      }

      const trap = handler[name];
      if (trap) {
        return trap.call(handler, target, key, ...args);
      }

      return Reflect[name](target, key, ...args);
    };
  }

  return new Proxy(obj, {
    ...handler,
    get: trap(handler, 'get'),
    getOwnPropertyDescriptor: trap(handler, 'getOwnPropertyDescriptor'),
    has: trap(handler, 'has'),
    set: trap(handler, 'set'),
    deleteProperty: trap(handler, 'deleteProperty'),
    defineProperty: trap(handler, 'defineProperty'),
  });
}

function ShadowTarget(original) {
  const target = Array.isArray(original)
    ? []
    : typeof original === 'function'
      ? () => {}
      : {}
  // Object.freeze(target);

  return new Proxy(target, {
    // For example only.
    get(target, key, receiver) {
      if (key === '__shadow_original__') return original;
      if (key === '__shadow_target__') return target;

      return Reflect.get(original, key, receiver);
    },

    set(target, key, value, receiver) {
      return Reflect.set(original, key, value, receiver);
    },

    // Other handler traps.
    construct(target, argArray, newTarget) {
      return Reflect.construct(original, argArray, newTarget);
    },

    defineProperty(target, p, desc) {
      return Reflect.defineProperty(original, p, desc);
    },

    deleteProperty(target, p) {
      return Reflect.deleteProperty(original, p);
    },

    getOwnPropertyDescriptor(target, p) {
      return Reflect.getOwnPropertyDescriptor(original, p);
    },

    getPrototypeOf(target) {
      return Reflect.getPrototypeOf(original);
    },

    has(target, p) {
      return Reflect.has(original, p);
    },

    isExtensible(target) {
      return Reflect.isExtensible(original);
    },

    ownKeys(target) {
      return Reflect.ownKeys(original);
    },

    preventExtensions(target) {
      return Reflect.preventExtensions(original);
    },

    setPrototypeOf(target, proto) {
      return Reflect.setPrototypeOf(original, proto);
    },
  });
}

exports.ShadowTarget = ShadowTarget;
exports.TransparentProxy = TransparentProxy;
