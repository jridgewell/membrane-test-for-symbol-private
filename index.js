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
 */
function createWrapFn(originalsToProxies, proxiesToOriginals, unwrapFn) {
    /**
     * `privateHandlers` are special objects dedicated to keep invariants built
     * on top of exposing private symbols via public API
     * we also need one-to-one relation between `privateHandler` and `original`
     */
    const privateHandlersOriginals = new WeakMap();
    /**
     * we're keep track of created handlers, so we'll be able to adjust them with
     * newly exposed private symbols
     */
    const allHandlers = new Set();

    /**
     * just simple helper that creates getter/setter pair for specific
     * private symbol and object that gets through membrane
     * @param {object | Function} handler
     * @param {symbol} privateSymbol
     */
    function handlePrivate(handler, privateSymbol) {
        const original = privateHandlersOriginals.get(handler);
        Object.defineProperty(handler, privateSymbol, {
            get() {
                return wrap(original[privateSymbol]);
            },
            set(v) {
                original[privateSymbol] = unwrapFn(v);
            }
        });
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
        const privateHandler = typeof original === 'function'
            ? () => { }
            : {};
        privateHandlersOriginals.set(privateHandler, original);
        allHandlers.add(privateHandler);

        // we use `newProxy` instead of `new Proxy` to emulate behavior of `Symbol.private`
        //       note that we don't use `original` here as proxy target
        //                     ↓↓↓↓↓↓↓↓↓↓↓↓↓↓
        const proxy = newProxy(privateHandler, {
            apply(target, thisArg, argArray) {
                thisArg = unwrapFn(thisArg);
                for (let i = 0; i < argArray.length; i++) {
                    if (!isPrimitive(argArray[i])) {
                        argArray[i] = unwrapFn(argArray[i]);
                    }
                }

                //          but we use `original` here instead of `target`
                //                           ↓↓↓↓↓↓↓↓
                const retval = Reflect.apply(original, thisArg, argArray);

                // in case when private symbols is exposed via some part of public API
                // we have to add such symbol to all possible targets where it could appear
                if (typeof retval === 'symbol' /* && retval.private */) {
                    allHandlers.forEach(handler => handlePrivate(handler, retval));
                }

                return wrap(retval);
            },
            get(target, p, receiver) {
                receiver = unwrapFn(receiver);
                //       but we use `original` here instead of `target`
                //                         ↓↓↓↓↓↓↓↓
                const retval = Reflect.get(original, p, receiver);

                // in case when private symbols is exposed via some part of public API
                // we have to add such symbol to all possible targets where it could appear
                if (typeof retval === 'symbol' /* && retval.private */) {
                    allHandlers.forEach(handler => handlePrivate(handler, retval));
                }

                return wrap(retval);
            },
            // following methods also should be implemented,
            // but it they are skipped for simplicity
            // getPrototypeOf(target) { },
            // setPrototypeOf(target, v) { },
            // isExtensible(target) { },
            // preventExtensions(target) { },
            // getOwnPropertyDescriptor(target, p) { },
            // has(target, p) { },
            // set(target, p, value, receiver) { },
            // deleteProperty(target, p) { },
            // defineProperty(target, p, attributes) { },
            // enumerate(target) { },
            // ownKeys(target) { },
            // construct(target, argArray, newTarget) { },
        });

        originalsToProxies.set(original, proxy);
        proxiesToOriginals.set(proxy, original);

        return proxy;
    }

    return wrap;
}

/**
 * @param {any} obj
 */
function membrane(obj) {
    const originalProxies = new WeakMap();
    const originalTargets = new WeakMap();
    const outerProxies = new WeakMap();

    const wrap = createWrapFn(originalProxies, originalTargets, unwrap);
    const wrapOuter = createWrapFn(outerProxies, originalProxies, wrap)

    function unwrap(proxy) {
        return originalTargets.has(proxy)
            ? originalTargets.get(proxy)
            : wrapOuter(proxy);
    }

    return wrap(obj);
}

exports.membrane = membrane;