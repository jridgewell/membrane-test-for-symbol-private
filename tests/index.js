const helpers = require('./__helpers');

const defaultOptions = {
  syncWhenExposed: true,
  useShadowWrapper: true,
  useWhitelistApi: true,
  useBlockWrapper: false,
  useBlockWrapperAllowOwn: false,
};

describe('Membranes', () => {
  describe.forEach({
    'Shadow Target Membranes': true,
    'Regular Target Membranes': false,
  }, (useShadowTargets) => {

    describe.forEach({
      'Set function': helpers.closureSet,
      'Set Reified field': helpers.reifiedSet,
    }, (set) => {
      describe.forEach({
        'Get function': helpers.closureGet,
        'Get Reified field': helpers.reifiedGet,
      }, (get) => {

        describe('string fields', () => {
          helpers.suite(helpers.stringFields({
            useShadowTargets,
            ...defaultOptions,
          }), set, get);
        });

        describe('public symbol fields', () => {
          helpers.suite(helpers.symbolFields({
            useShadowTargets,
            ...defaultOptions,
          }), set, get);
        });

        describe('private symbol fields', () => {
          helpers.suite(helpers.privateSymbolFields({
            useShadowTargets,
            ...defaultOptions,
          }), set, get);
        });

        describe('private symbol fields (pre exposed)', () => {
          helpers.suite(helpers.preExposedPrivateSymbolFields({
            useShadowTargets,
            ...defaultOptions,
          }), set, get);
        });
      });
    });
  });
});
