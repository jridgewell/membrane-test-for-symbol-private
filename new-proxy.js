/**
 * @param {any} obj
 * @param {ProxyHandler} handler
 */
function newProxy(obj, handler) {
    return new Proxy(obj, {
        ...handler,
        get(target, p, receiver) {
            if (typeof p !== 'symbol' && handler.get) return handler.get(target, p, receiver);

            return Reflect.get(target, p, receiver);
        },
        getOwnPropertyDescriptor(target, p) {
            if (typeof p !== 'symbol' && handler.getOwnPropertyDescriptor) return handler.getOwnPropertyDescriptor(target, p);

            return Reflect.getOwnPropertyDescriptor(target, p);
        },
        has(target, p) {
            if (typeof p !== 'symbol' && handler.has) return handler.has(target, p);

            return Reflect.has(target, p);

        },
        set(target, p, value, receiver) {
            if (typeof p !== 'symbol' && handler.set) return handler.set(target, p, value, receiver);

            return Reflect.set(target, p, value, receiver);

        },
        deleteProperty(target, p) {
            if (typeof p !== 'symbol' && handler.deleteProperty) return handler.deleteProperty(target, p);

            return Reflect.deleteProperty(target, p);
        },
        defineProperty(target, p, attributes) {
            if (typeof p !== 'symbol' && handler.defineProperty) return handler.defineProperty(target, p, attributes);

            return Reflect.defineProperty(target, p, attributes);
        },
    });
}

exports.newProxy = newProxy;