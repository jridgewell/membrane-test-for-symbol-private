const helpers = require('./__helpers');

describe('Membranes', () => {
  describe('Shadow Target Membranes', () => {
    describe('Closure based access', () => {
      const set = (Side, base, value) => {
        Side.set(base, value);
      };
      const get = (Side, base) => {
        return Side.get(base);
      };

      describe('string fields', () => {
        helpers.suite(helpers.stringFields(true), set, get);
      });

      describe('public symbol fields', () => {
        helpers.suite(helpers.symbolFields(true), set, get);
      });

      describe('private symbol fields', () => {
        helpers.suite(helpers.privateSymbolFields(true), set, get);
      });
    });

    describe('Reified key based access', () => {
      const set = (Side, base, value) => {
        base[Side.field] = value;
      };
      const get = (Side, base) => {
        return base[Side.field];
      };

      describe('string fields', () => {
        helpers.suite(helpers.stringFields(true), set, get);
      });

      describe('public symbol fields', () => {
        helpers.suite(helpers.symbolFields(true), set, get);
      });

      describe('private symbol fields', () => {
        helpers.suite(helpers.privateSymbolFields(true), set, get);
      });

      describe('private symbol fields (pre exposed)', () => {
        helpers.suite(helpers.preExposedPrivateSymbolFields(true), set, get);
      });
    });
  });


  describe('Regular Target Membranes', () => {
    describe('Closure based access', () => {
      const set = (Side, base, value) => {
        Side.set(base, value);
      };
      const get = (Side, base) => {
        return Side.get(base);
      };

      describe('string fields', () => {
        helpers.suite(helpers.stringFields(false), set, get);
      });

      describe('public symbol fields', () => {
        helpers.suite(helpers.symbolFields(false), set, get);
      });

      describe('private symbol fields', () => {
        helpers.suite(helpers.privateSymbolFields(false), set, get);
      });
    });

    describe('Reified key based access', () => {
      const set = (Side, base, value) => {
        base[Side.field] = value;
      };
      const get = (Side, base) => {
        return base[Side.field];
      };

      describe('string fields', () => {
        helpers.suite(helpers.stringFields(false), set, get);
      });

      describe('public symbol fields', () => {
        helpers.suite(helpers.symbolFields(false), set, get);
      });

      describe('private symbol fields', () => {
        helpers.suite(helpers.privateSymbolFields(false), set, get);
      });

      describe('private symbol fields (pre exposed)', () => {
        helpers.suite(helpers.preExposedPrivateSymbolFields(false), set, get);
      });
    });
  });
});
