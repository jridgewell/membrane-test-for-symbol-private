/**
 * @param {any} obj
 * @param {ProxyHandler} handler
 * @param {Set<symbol>} whitelist
 */
function newProxy(obj, handler, whitelist) {
    whitelist = whitelist || new Set;
    return new Proxy(obj, {
        ...handler,
        get(target, p, receiver) {
            if ((typeof p !== 'symbol' || whitelist.has(p)) && handler.get) {
                return handler.get(...arguments);
            }

            return Reflect.get(...arguments);
        },
        getOwnPropertyDescriptor(target, p) {
            if ((typeof p !== 'symbol' || whitelist.has(p)) && handler.getOwnPropertyDescriptor) {
                return handler.getOwnPropertyDescriptor(...arguments);
            }

            return Reflect.getOwnPropertyDescriptor(...arguments);
        },
        has(target, p) {
            if ((typeof p !== 'symbol' || whitelist.has(p)) && handler.has) {
                return handler.has(...arguments);
            }

            return Reflect.has(...arguments);

        },
        set(target, p, value, receiver) {
            if ((typeof p !== 'symbol' || whitelist.has(p)) && handler.set) {
                return handler.set(...arguments);
            }

            return Reflect.set(...arguments);

        },
        deleteProperty(target, p) {
            if ((typeof p !== 'symbol' || whitelist.has(p)) && handler.deleteProperty) {
                return handler.deleteProperty(...arguments);
            }

            return Reflect.deleteProperty(...arguments);
        },
        defineProperty(target, p, attributes) {
            if ((typeof p !== 'symbol' || whitelist.has(p)) && handler.defineProperty) {
                return handler.defineProperty(...arguments);
            }

            return Reflect.defineProperty(...arguments);
        },
    });
}

exports.newProxy = newProxy;
