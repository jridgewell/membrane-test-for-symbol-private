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
 * @param {Set<any>} originals
 * @param {Set<any>} proxies
 */
function createWrapFn(originalsToProxies, proxiesToOriginals, originals, proxies) {
    /**
     * @param {proxy} proxy
     * @param {WeakMap<object, any>} originalsToProxies
     * @param {WeakMap<object, any>} proxiesToOriginals
     * @param {Set<any>} originals
     * @param {Set<any>} proxies
     */
    function unwrap(proxy, originalsToProxies, proxiesToOriginals, originals, proxies) {
        if (proxiesToOriginals.has(proxy)) {
            return proxiesToOriginals.get(proxy);
        }
        return wrap(proxy, proxiesToOriginals, originalsToProxies, proxies, originals);
    }

    /**
     * @param {object | Function} original
     * @param {WeakMap<object, any>} originalsToProxies
     * @param {WeakMap<object, any>} proxiesToOriginals
     * @param {Set<any>} originals
     * @param {Set<any>} proxies
     */
    function wrap(original, originalsToProxies, proxiesToOriginals, originals, proxies) {
        // we don't need to wrap any primitive values
        if (isPrimitive(original)) return original;
        // we also don't need to wrap already wrapped values
        if (originalsToProxies.has(original)) return originalsToProxies.get(original);
        // we also don't need to wrap proxy second time
        if (proxiesToOriginals.has(original)) return proxiesToOriginals.get(original);
        const shadowTarget = typeof original === 'function'
            ? () => { }
            : {};

        // we use `newProxy` instead of `new Proxy` to emulate behavior of `Symbol.private`
        //       note that we don't use `original` here as proxy target
        //                     ↓↓↓↓↓↓↓↓↓↓↓↓↓↓
        const proxy = new Proxy(shadowTarget, {
            apply(target, thisArg, argArray) {
                thisArg = unwrap(thisArg, originalsToProxies, proxiesToOriginals, originals, proxies);
                for (let i = 0; i < argArray.length; i++) {
                    if (!isPrimitive(argArray[i])) {
                        argArray[i] = unwrap(argArray[i], originalsToProxies, proxiesToOriginals, originals, proxies);
                    }
                }

                //          but we use `original` here instead of `target`
                //                           ↓↓↓↓↓↓↓↓
                const retval = Reflect.apply(original, thisArg, argArray);

                return unwrap(retval, originalsToProxies, proxiesToOriginals, originals, proxies);
            },
            get(target, p, receiver) {
                receiver = unwrap(receiver, originalsToProxies, proxiesToOriginals, originals, proxies);
                //       but we use `original` here instead of `target`
                //                         ↓↓↓↓↓↓↓↓
                const retval = Reflect.get(original, p, receiver);

                return unwrap(retval, originalsToProxies, proxiesToOriginals, originals, proxies);
            },
            set(target, p, value, receiver) {
                value = unwrap(value, originalsToProxies, proxiesToOriginals, originals, proxies);
                receiver = unwrap(receiver, originalsToProxies, proxiesToOriginals, originals, proxies);

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
 * @param {any} graph
 */
function membrane(graph) {
    const originalsToProxies = new WeakMap();
    const proxiesToOriginals = new WeakMap();
    const originals = new Set();
    const proxies = new Set();

    const wrap = createWrapFn(originalsToProxies, proxiesToOriginals, originals, proxies);

    return wrap(graph, originalsToProxies, proxiesToOriginals, originals, proxies);
}

exports.membrane = membrane;
