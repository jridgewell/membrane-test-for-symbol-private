const { membrane } = require("..");

function setup() {
    const leftPriv = Symbol('left private'); // Symbol.private();
    class Left {
        // [leftPriv] = some value
    };
    const leftValue = Left.leftValue = {
        leftValue: true,
    };
    Left.leftPriv = leftPriv;

    const rightPriv = Symbol('right private');
    class Right {
        // [rightPriv] = some value
    }
    const rightValue = Right.rightValue = {
        rightValue: true,
    };
    Right.rightPriv = rightPriv;

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
function expose(wrappedLeftSide, wrappedRightSide) {
    // This exposes the private symbols to the membrane.
    wrappedLeftSide.leftPriv;
    wrappedRightSide.rightPriv;
}

console.group('Reified access (private symbols known after set)')

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
    leftValue[leftPriv] = leftValue;

    expose(wrappedLeftSide, wrappedRightSide);

    const got = wrappedLeftSide.leftValue[wrappedLeftSide.leftPriv];
    // Test that it's wrapped.
    console.assert(got !== leftValue);
    // Test that it's the wrapped left value.
    console.assert(got.leftValue === true);
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
    leftValue[leftPriv] = wrappedRightSide.rightValue;

    expose(wrappedLeftSide, wrappedRightSide);

    const got = wrappedLeftSide.leftValue[wrappedLeftSide.leftPriv];
    // Test that it's unwrapped.
    console.assert(got === rightValue);
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
    leftValue[wrappedRightSide.rightPriv] = leftValue;

    expose(wrappedLeftSide, wrappedRightSide);

    const got = wrappedLeftSide.leftValue[rightPriv];
    // Test that it's wrapped.
    console.assert(got !== leftValue);
    // Test that it's the wrapped left value.
    console.assert(got.leftValue === true);
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
    leftValue[wrappedRightSide.rightPriv] = wrappedRightSide.rightValue;

    expose(wrappedLeftSide, wrappedRightSide);

    const got = wrappedLeftSide.leftValue[rightPriv];
    // Test that it's unwrapped.
    console.assert(got === rightValue);
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
    wrappedRightSide.rightValue[leftPriv] = leftValue;

    expose(wrappedLeftSide, wrappedRightSide);

    const got = rightValue[leftPriv];
    // Test that it's wrapped.
    console.assert(got !== leftValue);
    // Test that it's the wrapped left value.
    console.assert(got.leftValue === true);
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
    wrappedRightSide.rightValue[leftPriv] = wrappedRightSide.rightValue;

    expose(wrappedLeftSide, wrappedRightSide);

    const got = rightValue[wrappedLeftSide.leftPriv];
    // Test that it's unwrapped.
    console.assert(got === rightValue);
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
    wrappedRightSide.rightValue[wrappedRightSide.rightPriv] = leftValue;

    expose(wrappedLeftSide, wrappedRightSide);

    const got = rightValue[rightPriv];
    // Test that it's wrapped.
    console.assert(got !== leftValue);
    // Test that it's the wrapped left value.
    console.assert(got.leftValue === true);
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
    wrappedRightSide.rightValue[wrappedRightSide.rightPriv] = wrappedRightSide.rightValue;

    expose(wrappedLeftSide, wrappedRightSide);

    const got = rightValue[rightPriv];
    // Test that it's unwrapped.
    console.assert(got === rightValue);
}

console.groupEnd('Closure access only (no exposed reified key)')
