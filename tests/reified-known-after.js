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

console.group('Reified access (private symbols known after set)')

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
    Left.leftValue[Left.leftPriv] = Left.leftValue;

    const got = wrappedLeftSide.leftValue[wrappedLeftSide.leftPriv];
    // Test that it's wrapped.
    console.assert(got !== Left.leftValue);
    // Test that it's the wrapped left value.
    console.assert(got.leftValue === true);

    // Sanity check
    console.assert(Left.leftValue[Left.leftPriv] === Left.leftValue);
}

{
    console.log('### bT[fT] = vP;')
    const {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    Left.leftValue[Left.leftPriv] = wrappedRightSide.rightValue;

    const got = wrappedLeftSide.leftValue[wrappedLeftSide.leftPriv];
    // Test that it's unwrapped.
    console.assert(got === Right.rightValue);

    // Sanity check
    console.assert(Left.leftValue[Left.leftPriv] === wrappedRightSide.rightValue);
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
    Left.leftValue[wrappedRightSide.rightPriv] = Left.leftValue;

    const got = wrappedLeftSide.leftValue[Right.rightPriv];
    // Test that it's wrapped.
    console.assert(got !== Left.leftValue);
    // Test that it's the wrapped left value.
    console.assert(got.leftValue === true);

    // Sanity check
    console.assert(Left.leftValue[wrappedRightSide.rightPriv] === Left.leftValue);
}

{
    console.log('### bT[fP] = vP;')
    const {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    Left.leftValue[wrappedRightSide.rightPriv] = wrappedRightSide.rightValue;

    const got = wrappedLeftSide.leftValue[Right.rightPriv];
    // Test that it's unwrapped.
    console.assert(got === Right.rightValue);

    // Sanity check
    console.assert(Left.leftValue[wrappedRightSide.rightPriv] === wrappedRightSide.rightValue);
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
    wrappedRightSide.rightValue[Left.leftPriv] = Left.leftValue;

    const got = Right.rightValue[wrappedLeftSide.leftPriv];
    // Test that it's wrapped.
    console.assert(got !== Left.leftValue);
    // Test that it's the wrapped left value.
    console.assert(got.leftValue === true);

    // Sanity check
    console.assert(wrappedRightSide.rightValue[Left.leftPriv] === Left.leftValue);
}

{
    console.log('### bP[fT] = vP;')
    const {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    wrappedRightSide.rightValue[Left.leftPriv] = wrappedRightSide.rightValue;

    const got = Right.rightValue[wrappedLeftSide.leftPriv];
    // Test that it's unwrapped.
    console.assert(got === Right.rightValue);

    // Sanity check
    console.assert(wrappedRightSide.rightValue[Left.leftPriv] === wrappedRightSide.rightValue);
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
    wrappedRightSide.rightValue[wrappedRightSide.rightPriv] = Left.leftValue;

    const got = Right.rightValue[Right.rightPriv];
    // Test that it's wrapped.
    console.assert(got !== Left.leftValue);
    // Test that it's the wrapped left value.
    console.assert(got.leftValue === true);

    // Sanity check
    console.assert(wrappedRightSide.rightValue[wrappedRightSide.rightPriv] === Left.leftValue);
}

{
    console.log('### bP[fP] = vP;')
    const {
        Left,
        Right,
        wrappedLeftSide,
        wrappedRightSide,
    } = setup();
    wrappedRightSide.rightValue[wrappedRightSide.rightPriv] = wrappedRightSide.rightValue;

    const got = Right.rightValue[Right.rightPriv];
    // Test that it's unwrapped.
    console.assert(got === Right.rightValue);

    // Sanity check
    console.assert(wrappedRightSide.rightValue[wrappedRightSide.rightPriv] === wrappedRightSide.rightValue);
}

console.groupEnd('Closure access only (no exposed reified key)')
