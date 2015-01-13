var chai = require('chai');
var expect = chai.expect;
var u = require('./util');

describe('repeat', function() {
  var parser;

  beforeEach(function() {
    parser = new u.lacona.Parser();
  });

  describe('basic usage', function () {
    var test;

    beforeEach(function () {
      test = u.lacona.createPhrase({
        name: 'test/test',
        describe: function () {
          return u.lacona.repeat({
            child: u.lacona.literal({display: 'super'}),
            separator: u.lacona.literal({display: 'man'})
          });
        }
      });
    });

    it('does not accept input that does not match the child', function (done) {
      function callback(data) {
        expect(data).to.have.length(2);
        done();
      }

      parser.sentences = [test()];
      u.toStream(['wrong'])
        .pipe(parser)
        .pipe(u.toArray(callback));
    });

    it('accepts the child on its own', function (done) {
      function callback(data) {
        expect(data).to.have.length(3);
        expect(data[1].data.suggestion.words[0].string).to.equal('man');
        done();
      }

      parser.sentences = [test()];
      u.toStream(['superm'])
        .pipe(parser)
        .pipe(u.toArray(callback));
    });

    it('accepts the child twice, with the separator in the middle', function (done) {
      function callback(data) {
        expect(data).to.have.length(3);
        expect(data[1].data.suggestion.words[0].string).to.equal('super');
        done();
      }

      parser.sentences = [test()];
      u.toStream(['supermans'])
        .pipe(parser)
        .pipe(u.toArray(callback));
    });
  });

  describe('basic usage (no separator)', function () {
    var test;

    beforeEach(function () {
      test = u.lacona.createPhrase({
        name: 'test/test',
        describe: function () {
          return u.lacona.repeat({
            child: u.lacona.literal({display: 'super'})
          });
        }
      });
    });

    it('does not accept input that does not match the child', function (done) {
      function callback(data) {
        expect(data).to.have.length(2);
        done();
      }

      parser.sentences = [test()];
      u.toStream(['wrong'])
        .pipe(parser)
        .pipe(u.toArray(callback));
    });

    it('accepts the child on its own', function (done) {
      function callback(data) {
        expect(data).to.have.length(3);
        expect(data[1].data.suggestion.words[0].string).to.equal('super');
        done();
      }

      parser.sentences = [test()];
      u.toStream(['sup'])
        .pipe(parser)
        .pipe(u.toArray(callback));
    });

    it('accepts the child twice', function (done) {
      function callback(data) {
        expect(data).to.have.length(3);
        expect(data[1].data.suggestion.words[0].string).to.equal('super');
        expect(data[1].data.match[0].string).to.equal('super');
        done();
      }

      parser.sentences = [test()];
      u.toStream(['supers'])
        .pipe(parser)
        .pipe(u.toArray(callback));
    });
  });

  it('creates an array from the values of the children', function (done) {
    var test = u.lacona.createPhrase({
      name: 'test/test',
      describe: function () {
        return u.lacona.repeat({
          id: 'testId',
          separator: u.lacona.literal({display: 'man'}),
          child: u.lacona.literal({
            display: 'super',
            value: 'testValue',
            id: 'subElementId'
          })
        });
      }
    });

    function callback(data) {
      expect(data).to.have.length(3);
      expect(data[1].data.result.testId).to.deep.equal(['testValue', 'testValue']);
      expect(data[1].data.result.subElementId).to.be.undefined;
      done();
    }

    parser.sentences = [test()];
    u.toStream(['supermans'])
    .pipe(parser)
    .pipe(u.toArray(callback));
  });

  it('does not accept fewer than min iterations', function (done) {
    var test = u.lacona.createPhrase({
      name: 'test/test',
      describe: function () {
        return u.lacona.repeat({
          min: 2,
          child: u.lacona.literal({display: 'a'}),
          separator: u.lacona.literal({display: 'b'})
        });
      }
    });

    function callback(data) {
      expect(data).to.have.length(3);
      expect(data[1].data.match[0].string).to.equal('a');
      expect(data[1].data.suggestion.words[0].string).to.equal('b');
      expect(data[1].data.completion[0].string).to.equal('a');
      done();
    }

    parser.sentences = [test()];
    u.toStream(['a'])
      .pipe(parser)
      .pipe(u.toArray(callback));
  });


  it('does not accept more than max iterations', function (done) {
    var test = u.lacona.createPhrase({
      name: 'test/test',
      describe: function () {
        return u.lacona.repeat({
          max: 1,
          child: u.lacona.literal({display: 'a'}),
          separator: u.lacona.literal({display: 'b'})
        });
      }
    });

    function callback(data) {
      expect(data).to.have.length(3);
      expect(data[1].data.suggestion.words).to.be.empty;
      expect(data[1].data.match[0].string).to.equal('a');
      done();
    }

    parser.sentences = [test()];
    u.toStream(['a'])
      .pipe(parser)
      .pipe(u.toArray(callback));
  });

  describe('unique', function () {
    var test;

    beforeEach(function () {
      test = u.lacona.createPhrase({
        name: 'test/test',
        describe: function () {
          return u.lacona.repeat({
            unique: true,
            child: u.lacona.choice({
              children: [
                u.lacona.literal({display: 'a', value: 'a'}),
                u.lacona.literal({display: 'b', value: 'b'})
              ]
            })
          });
        }
      });
    });

    it('rejects non-unique repeated elements', function (done) {
      function callback(data) {
        expect(data).to.have.length(2);
        done();
      }

      parser.sentences = [test()];
      u.toStream(['aa'])
        .pipe(parser)
        .pipe(u.toArray(callback));
    });

    it('accepts unique repeated elements', function (done) {
      function callback(data) {
        expect(data).to.have.length(3);
        expect(data[1].data.match[0].string).to.equal('a');
        expect(data[1].data.match[1].string).to.equal('b');
        done();
      }

      parser.sentences = [test()];
      u.toStream(['ab'])
        .pipe(parser)
        .pipe(u.toArray(callback));
    });
  });
});
