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

    const graph = {
        Left,
    };
    const wrappedGraph = membrane(graph);
    wrappedGraph.Right = Right;

    const wrappedLeftSide = wrappedGraph.Left;
    const wrappedRightSide = graph.Right;

    return {
        Left,
        Right,
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
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    Left.set(Left.leftValue, Left.leftValue);

    const got = wrappedLeftSide.get(wrappedLeftSide.leftValue);
    // Test that it's wrapped.
    console.assert(got !== Left.leftValue);
    // Test that it's the wrapped left value.
    console.assert(got.leftValue === true);

    // Sanity check
    console.assert(Left.get(Left.leftValue) === Left.leftValue);
}

{
    console.log('### bT[fT] = vP;')
    const {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    Left.set(Left.leftValue, wrappedRightSide.rightValue);

    const got = wrappedLeftSide.get(wrappedLeftSide.leftValue);
    // Test that it's unwrapped.
    console.assert(got === Right.rightValue);

    // Sanity check
    console.assert(Left.get(Left.leftValue) === wrappedRightSide.rightValue);
}

{
    console.log('## set using right side field name');
    console.log('### bT[fP] = vT;')
    const {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    wrappedRightSide.set(Left.leftValue, Left.leftValue);

    const got = Right.get(wrappedLeftSide.leftValue);
    // Test that it's wrapped.
    console.assert(got !== Left.leftValue);
    // Test that it's the wrapped left value.
    console.assert(got.leftValue === true);

    // Sanity check
    console.assert(wrappedRightSide.get(Left.leftValue) === Left.leftValue);
}

{
    console.log('### bT[fP] = vP;')
    const {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    wrappedRightSide.set(Left.leftValue, wrappedRightSide.rightValue);

    const got = Right.get(wrappedLeftSide.leftValue);
    // Test that it's unwrapped.
    console.assert(got === Right.rightValue);

    // Sanity check
    console.assert(wrappedRightSide.get(Left.leftValue) === wrappedRightSide.rightValue);
}

{
    console.log('# set on right side of membrane');
    console.log('## set using left side field name');
    console.log('### bP[fT] = vT;')
    const {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    Left.set(wrappedRightSide.rightValue, Left.leftValue);

    const got = wrappedLeftSide.get(Right.rightValue);
    // Test that it's wrapped.
    console.assert(got !== Left.leftValue);
    // Test that it's the wrapped left value.
    console.assert(got.leftValue === true);

    // Sanity check
    console.assert(Left.get(wrappedRightSide.rightValue) === Left.leftValue);
}

{
    console.log('### bP[fT] = vP;')
    const {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    Left.set(wrappedRightSide.rightValue, wrappedRightSide.rightValue);

    const got = wrappedLeftSide.get(Right.rightValue);
    // Test that it's unwrapped.
    console.assert(got === Right.rightValue);

    // Sanity check
    console.assert(Left.get(wrappedRightSide.rightValue) === wrappedRightSide.rightValue);
}

{
    console.log('## set using right side field name');
    console.log('### bP[fP] = vT;')
    const {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    wrappedRightSide.set(wrappedRightSide.rightValue, Left.leftValue);

    const got = Right.get(Right.rightValue);
    // Test that it's wrapped.
    console.assert(got !== Left.leftValue);
    // Test that it's the wrapped left value.
    console.assert(got.leftValue === true);

    // Sanity check
    console.assert(wrappedRightSide.get(wrappedRightSide.rightValue) === Left.leftValue);
}

{
    console.log('### bP[fP] = vP;')
    const {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    wrappedRightSide.set(wrappedRightSide.rightValue, wrappedRightSide.rightValue);

    const got = Right.get(Right.rightValue);
    // Test that it's unwrapped.
    console.assert(got === Right.rightValue);

    // Sanity check
    console.assert(wrappedRightSide.get(wrappedRightSide.rightValue) === wrappedRightSide.rightValue);
}

console.groupEnd('Closure access only (no exposed reified key)')
