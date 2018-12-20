const { newProxy } = require("./new-proxy");

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
 * @param {Set<symbol>} whitelist
 * @param {Set<any>} exposedToMySide
 * @param {Set<any>} exposedToOutside
 */
function createWrapFn(originalsToProxies, proxiesToOriginals, whitelist, exposedToMySide, exposedToOutside) {
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
        // we also don't need to wrap proxy second time
        if (proxiesToOriginals.has(original)) return original;
        exposedToOutside.add(original);

        const proxy = newProxy(original, {
            apply(target, thisArg, argArray) {
                thisArg = unwrap(thisArg);
                for (let i = 0; i < argArray.length; i++) {
                    argArray[i] = unwrap(argArray[i]);
                }

                const retval = Reflect.apply(target, thisArg, argArray);

                // in case when private symbols is exposed via some part of public API
                // we have to add such symbol to all possible targets where it could appear
                if (typeof retval === 'symbol' && !whitelist.has(retval) /* && retval.private */) {
                    exposedToMySide.forEach(ex => {
                        if (ex.hasOwnProperty(retval)) {
                            ex[retval] = wrap(ex[retval]);
                        }
                    });
                    whitelist.add(retval);
                }

                return unwrap(retval);
            },
            get(target, p, receiver) {
                receiver = unwrap(receiver);
                const retval = Reflect.get(target, p, receiver);

                // in case when private symbols is exposed via some part of public API
                // we have to add such symbol to all possible targets where it could appear
                if (typeof retval === 'symbol' && !whitelist.has(retval) /* && retval.private */) {
                    exposedToMySide.forEach(ex => {
                        if (ex.hasOwnProperty(retval)) {
                            ex[retval] = wrap(ex[retval]);
                        }
                    });
                    whitelist.add(retval);
                }

                return unwrap(retval);
            },
            set(target, p, value, receiver) {
                value = unwrap(value);
                receiver = unwrap(receiver);

                return Reflect.set(target, p, value, receiver);
            },

            // following methods also should be implemented,
            // but it they are skipped for simplicity
            // getPrototypeOf(target) { },
            // setPrototypeOf(target, v) { },
            // isExtensible(target) { },
            // preventExtensions(target) { },
            // getOwnPropertyDescriptor(target, p) { },
            // has(target, p) { },
            // deleteProperty(target, p) { },
            // defineProperty(target, p, attributes) { },
            // enumerate(target) { },
            // ownKeys(target) { },
            // construct(target, argArray, newTarget) { },
        }, whitelist);

        originalsToProxies.set(original, proxy);
        proxiesToOriginals.set(proxy, original);

        return proxy;
    }

    return wrap;
}

/**
 * @param {any} obj
 */
function membrane(left, right) {
    const leftToProxies = new WeakMap();
    const rightToProxies = new WeakMap();
    const exposedToRight = new Set();
    const exposedToLeft = new Set();
    const whitelist = new Set();

    const wrapLeft = createWrapFn(leftToProxies, rightToProxies, whitelist, exposedToRight, exposedToLeft);
    const wrapRight = createWrapFn(rightToProxies, leftToProxies, whitelist, exposedToLeft, exposedToRight);

    return [wrapLeft(left), wrapRight(right)];
}

exports.membrane = membrane;
