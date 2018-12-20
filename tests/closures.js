const { membrane } = require("..");

function setup() {
    const leftPriv = Symbol('left private'); // Symbol.private();
    class Left {
        // [leftPriv] = some value

        static get(obj) {
            return obj[leftPriv];
        }

        static set(obj, value) {
            obj[leftPriv] = value;
        }
    };
    const leftValue = Left.leftValue = {
        leftValue: true,
    };

    const rightPriv = Symbol('right private');
    class Right {
        // [rightPriv] = some value

        static get(obj) {
            return obj[rightPriv];
        }

        static set(obj, value) {
            obj[rightPriv] = value;
        }
    }
    const rightValue = Right.rightValue = {
        rightValue: true,
    };

    const [
        wrappedLeftSide,
        wrappedRightSide,
    ] = membrane(Left, Right);

    return {
        Left,
        leftValue,
        leftPriv,
        Right,
        rightValue,
        rightPriv,
        wrappedLeftSide,
        wrappedRightSide,
    };
}

console.group('Closure access only (no exposed reified key)')

{
    console.log('# set on left side of membrane');
    console.log('## set using left side field name');
    console.log('### bT[fT] = vT;')
    const {
        Left,
        leftValue,
        leftPriv,
        Right,
        rightValue,
        rightPriv,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    Left.set(leftValue, leftValue);

    const got = wrappedLeftSide.get(wrappedLeftSide.leftValue);
    // Test that it's wrapped.
    console.assert(got !== leftValue);
    // Test that it's the wrapped left value.
    console.assert(got.leftValue === true);

    // Sanity check
    console.assert(Left.get(leftValue) === leftValue);
}

{
    console.log('### bT[fT] = vP;')
    const {
        Left,
        leftValue,
        leftPriv,
        Right,
        rightValue,
        rightPriv,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    Left.set(leftValue, wrappedRightSide.rightValue);

    const got = wrappedLeftSide.get(wrappedLeftSide.leftValue);
    // Test that it's unwrapped.
    console.assert(got === rightValue);

    // Sanity check
    console.assert(Left.get(leftValue) === wrappedRightSide.rightValue);
}

{
    console.log('## set using right side field name');
    console.log('### bT[fP] = vT;')
    const {
        Left,
        leftValue,
        leftPriv,
        Right,
        rightValue,
        rightPriv,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    wrappedRightSide.set(leftValue, leftValue);

    const got = Right.get(wrappedLeftSide.leftValue);
    // Test that it's wrapped.
    console.assert(got !== leftValue);
    // Test that it's the wrapped left value.
    console.assert(got.leftValue === true);

    // Sanity check
    console.assert(wrappedRightSide.get(leftValue) === leftValue);
}

{
    console.log('### bT[fP] = vP;')
    const {
        Left,
        leftValue,
        leftPriv,
        Right,
        rightValue,
        rightPriv,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    wrappedRightSide.set(leftValue, wrappedRightSide.rightValue);

    const got = Right.get(wrappedLeftSide.leftValue);
    // Test that it's unwrapped.
    console.assert(got === rightValue);

    // Sanity check
    console.assert(wrappedRightSide.get(leftValue) === wrappedRightSide.rightValue);
}

{
    console.log('# set on right side of membrane');
    console.log('## set using left side field name');
    console.log('### bP[fT] = vT;')
    const {
        Left,
        leftValue,
        leftPriv,
        Right,
        rightValue,
        rightPriv,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    Left.set(wrappedRightSide.rightValue, leftValue);

    const got = wrappedLeftSide.get(rightValue);
    // Test that it's wrapped.
    console.assert(got !== leftValue);
    // Test that it's the wrapped left value.
    console.assert(got.leftValue === true);

    // Sanity check
    console.assert(Left.get(wrappedRightSide.rightValue) === leftValue);
}

{
    console.log('### bP[fT] = vP;')
    const {
        Left,
        leftValue,
        leftPriv,
        Right,
        rightValue,
        rightPriv,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    debugger;
    Left.set(wrappedRightSide.rightValue, wrappedRightSide.rightValue);

    const got = wrappedLeftSide.get(rightValue);
    // Test that it's unwrapped.
    console.assert(got === rightValue);

    // Sanity check
    console.assert(Left.get(wrappedRightSide.rightValue) === wrappedRightSide.rightValue);
}

{
    console.log('## set using right side field name');
    console.log('### bP[fP] = vT;')
    const {
        Left,
        leftValue,
        leftPriv,
        Right,
        rightValue,
        rightPriv,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    wrappedRightSide.set(wrappedRightSide.rightValue, leftValue);

    const got = Right.get(rightValue);
    // Test that it's wrapped.
    console.assert(got !== leftValue);
    // Test that it's the wrapped left value.
    console.assert(got.leftValue === true);

    // Sanity check
    console.assert(wrappedRightSide.get(wrappedRightSide.rightValue) === leftValue);
}

{
    console.log('### bP[fP] = vP;')
    const {
        Left,
        leftValue,
        leftPriv,
        Right,
        rightValue,
        rightPriv,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    wrappedRightSide.set(wrappedRightSide.rightValue, wrappedRightSide.rightValue);

    const got = Right.get(rightValue);
    // Test that it's unwrapped.
    console.assert(got === rightValue);

    // Sanity check
    console.assert(wrappedRightSide.get(wrappedRightSide.rightValue) === wrappedRightSide.rightValue);
}

console.groupEnd('Closure access only (no exposed reified key)')
