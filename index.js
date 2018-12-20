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
 * @param {(proxy: any) => any} unwrapFn
 * @param {Set<symbol>} whitelist
 * @param {Set<any>} exposedToMySide
 * @param {Set<any>} exposedToOutside
 */
function createWrapFn(originalsToProxies, proxiesToOriginals, unwrapFn, whitelist, exposedToMySide, exposedToOutside) {

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
                thisArg = unwrapFn(thisArg);
                for (let i = 0; i < argArray.length; i++) {
                    argArray[i] = unwrapFn(argArray[i]);
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

                return wrap(retval);
            },
            get(target, p, receiver) {
                receiver = unwrapFn(receiver);
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

                return wrap(retval);
            },
            set(target, p, value, receiver) {
                value = unwrapFn(value);
                receiver = unwrapFn(receiver);

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
    const originalProxies = new WeakMap();
    const originalTargets = new WeakMap();
    const outerProxies = new WeakMap();
    const exposedToRight = new Set();
    const exposedToLeft = new Set();
    const whitelist = new Set();

    const wrap = createWrapFn(originalProxies, originalTargets, unwrap, whitelist, exposedToRight, exposedToLeft);
    const wrapOuter = createWrapFn(outerProxies, originalProxies, wrap, whitelist, exposedToLeft, exposedToRight);

    function unwrap(proxy) {
        return originalTargets.has(proxy)
            ? originalTargets.get(proxy)
            : wrapOuter(proxy);
    }

    return [wrap(left), wrapOuter(right)];
}

exports.membrane = membrane;
