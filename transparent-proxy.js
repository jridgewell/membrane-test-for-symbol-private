/**
 * @param {any} obj
 * @param {ProxyHandler} handler
 * @param {?Set<symbol>} whitelist
 */
function TransparentProxy(obj, handler, whitelist = new Set()) {
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

// A special almost-Proxy that fires getPrototypeOf traps when traversing the
// prototype chain (as opposed to to just getting it from the target). This
// allows Membranes to wrap their targets, and traverse the membrane's
// prototype chain instead of the target's. Thus, we can private symbols can
// iterate the proxy prototypes (which can be kept in sync).
//
// This could easily throw an error instead, making proxies non-transparent.
// This could even happen without handler interaction (getPrototypeOf trap
// wouldn't fire), preserving privacy.
//
// For now, handler may only have getPrototypeOf and setPrototypeOf traps.
// Nothing else will be used. If we decide to throw instead, there would be no
// handler at all.
function ProtoProxy(target, handler, options = {}) {
  function isDataDescriptor(desc) {
    return 'value' in desc || 'writable' in desc;
  }
  function isAccessorDescriptor(desc) {
    return 'get' in desc || 'set' in desc;
  }

  // This is a configuration option for testing, not actual API.
  const {
    useBlockWrapper,
    useBlockWrapperAllowOwn,
  } = options;

  // Notice that this an original proxy, not a transparent one. Imagine this as
  // new proxy exotic, able to receive all property keys (including private
  // symbols). It does not allow overriding the get/set/has traps, so
  // encapsulation is not broken.
  const proxy = new Proxy(target, {
    getPrototypeOf: handler.getPrototypeOf,
    setPrototypeOf: handler.setPrototypeOf,

    // Implement [[Get]], [[Set], and [[Has]] so they trigger proxy's
    // getPrototypeOf trap if the target does not have an own property.
    get(target, key, receiver) {
      if (key === '__proto_target__') return target;

      const desc = Reflect.getOwnPropertyDescriptor(target, key);

      if (desc === undefined) {
        // This is a configuration option for testing, not actual API.
        if (useBlockWrapper || useBlockWrapperAllowOwn) {
          throw new Error('blocking get');
        }
        const proto = Reflect.getPrototypeOf(proxy);
        if (proto === null) return undefined;

        return Reflect.get(proto, key, receiver);
      }

      if (isDataDescriptor(desc)) return desc.value;

      const get = desc.get;
      if (get === undefined) return undefined;

      return get.call(receiver);
    },

    set(target, key, value, receiver) {
      let desc = Reflect.getOwnPropertyDescriptor(target, key);

      if (desc === undefined) {
        // This is a configuration option for testing, not actual API.
        if (!useBlockWrapperAllowOwn && useBlockWrapper) {
          throw new Error('blocking set');
        }

        const proto = Reflect.getPrototypeOf(proxy);
        if (!useBlockWrapperAllowOwn && proto !== null) {
          return Reflect.set(proto, key, value, receiver);
        }

        desc = {
          value,
          writable: true,
          enumerable: true,
          configurable: true,
        };
      }

      if (isDataDescriptor(desc)) {
        if (!desc.writable) return false;

        const existing = Reflect.getOwnPropertyDescriptor(receiver, key);
        if (existing !== undefined) {
          if (isAccessorDescriptor(existing)) return false;
          if (!existing.writable) return false;
          return Reflect.defineProperty(receiver, key, { value });
        }

        return Reflect.defineProperty(receiver, key, desc);
      }

      const set = desc.set;
      if (set === undefined) return false;

      set.call(receiver, value);
      return true;
    },

    has(target, key) {
      if (Reflect.getOwnPropertyDescriptor(target, key)) {
        return true;
      }

      // This is a configuration option for testing, not actual API.
      if (useBlockWrapperAllowOwn) {
        return false;
      }
      if (useBlockWrapper) {
        throw new Error('blocking has');
      }

      const proto = Reflect.getPrototypeOf(proxy);
      if (proto === null) {
        return false;
      }

      return Reflect.has(proto, key);
    },
  });

  return proxy;
}

exports.ProtoProxy = ProtoProxy;
exports.TransparentProxy = TransparentProxy;
