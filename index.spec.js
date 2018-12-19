const { membrane } = require(".");

console.log('STARTED');

const privateSymbol = Symbol('private'); // Symbol.private();
const value = {};
const Left = {
    base: {
        [privateSymbol]: value
    },
    value,
    field: privateSymbol,
    /**
     * @param {symbol} key
     * @param {object} val
     */
    assignment(key, val) {
        Left.base[key] = val;
    },
    /**
     * @param {symbol} key
     * @param {object} val
     */
    assertion(key, val) {
        console.assert(Left.base[key] === val);
    },
    /**
     * @param {(fT: symbol, vT: object) => void} cb
     */
    callFunctionFromRight(cb) {
        cb(Left.field, Left.value);
    }
};
const Right = membrane(Left);

const { base: bT, field: fT, value: vT } = Left;
const { base: bP, field: fP, value: vP } = Right;
console.log('------------------------------------------');
console.log('LEFT and RIGHT belongs to one scope')
console.log('------------------------------------------');

console.log('# set on left side of membrane');
console.log('## set using left side field name');
console.log('### bT[fT] = vT;')
Left.assignment(fT, vT);
Right.callFunctionFromRight((fT, vT) => {
    console.assert(bP[fP] === vP);
});

console.log('### bT[fT] = vP;')
Left.assignment(fT, vP);
Right.callFunctionFromRight((fT, vT) => {
    console.assert(bP[fP] === vT);
});

console.log('## set using right side field name');
console.log('### bT[fP] = vT;')
Left.assignment(fP, vT);
Right.callFunctionFromRight((fT, vT) => {
    console.assert(bP[fT] === vP);
});

console.log('### bT[fP] = vP;')
Left.assignment(fP, vP);
Right.callFunctionFromRight((fT, vT) => {
    console.assert(bP[fT] === vT);
});

console.log('# set on right side of membrane');
console.log('## set using left side field name');
console.log('### bP[fT] = vT;')
Left.callFunctionFromRight((fT, vT) => {
    bP[fT] = vT;
});
Right.assertion(fP, vP);

console.log('### bP[fT] = vP;')
Left.callFunctionFromRight((fT, vT) => {
    bP[fT] = vP;
});
Right.assertion(fP, vT);

console.log('## set using right side field name');
console.log('### bP[fP] = vT;')
Left.callFunctionFromRight((fT, vT) => {
    bP[fP] = vT;
});
Right.assertion(fT, vP);

console.log('### bP[fP] = vP;')
Left.callFunctionFromRight((fT, vT) => {
    bP[fP] = vP;
});
Right.assertion(fT, vT);

console.log('------------------------------------------');
console.log('LEFT and RIGHT belongs to different scopes');
console.log('------------------------------------------');

console.log('# set on left side of membrane');
console.log('## set using left side field name');
console.log('### bT[fT] = vT;')
Right.assignment(fT, vT);
Right.callFunctionFromRight((fT, vT) => {
    console.assert(bP[fP] === vP);
});

console.log('### bT[fT] = vP;')
Right.assignment(fT, vP);
Right.callFunctionFromRight((fT, vT) => {
    console.assert(bP[fP] === vT);
});

console.log('## set using right side field name');
console.log('### bT[fP] = vT;')
Right.assignment(fP, vT);
Right.callFunctionFromRight((fT, vT) => {
    console.assert(bP[fT] === vP);
});

console.log('### bT[fP] = vP;')
Right.assignment(fP, vP);
Right.callFunctionFromRight((fT, vT) => {
    console.assert(bP[fT] === vT);
});

console.log('# set on right side of membrane');
console.log('## set using left side field name');
console.log('### bP[fT] = vT;')
Right.callFunctionFromRight((fT, vT) => {
    bP[fT] = vT;
});
Right.assertion(fP, vP);

console.log('### bP[fT] = vP;')
Right.callFunctionFromRight((fT, vT) => {
    bP[fT] = vP;
});
Right.assertion(fP, vT);

console.log('## set using right side field name');
console.log('### bP[fP] = vT;')
Right.callFunctionFromRight((fT, vT) => {
    bP[fP] = vT;
});
Right.assertion(fT, vP);

console.log('### bP[fP] = vP;')
Right.callFunctionFromRight((fT, vT) => {
    bP[fP] = vP;
});
Right.assertion(fT, vT);

console.log('PASSED');