var _ = require('lodash');
var async = require('async');
var moment = require('moment');
var chai = require('chai');
var expect = chai.expect;
var lacona;
var sinon = require('sinon');

chai.use(require('sinon-chai'));

if (typeof window !== 'undefined' && window.lacona) {
	lacona = window.lacona;
} else {
	lacona = require('../src/lacona');
}

chai.config.includeStack = true;

describe('sequence', function() {
	var parser;

	beforeEach(function() {
		parser = new lacona.Parser();
	});

	it('', function (done) {
		var schema = {
			root: {
				type: 'sequence',
				children: [
					'super',
					'man'
				]
			},
			run: ''
		}

		var onData = sinon.spy(function(data) {
			expect(data.suggestion.words[0].string).to.equal('man');
			expect(data.result).to.be.empty;
		});

		var onEnd = function() {
			expect(onData).to.have.been.called.once;
			done();
		};

		parser
		.understand(schema)
		.on('data', onData)
		.on('end', onEnd)
		.parse('super m');
	});

	it('empty separator', function (done) {
		var schema = {
			root: {
				type: 'sequence',
				children: [
					'super',
					'man'
				],
				separator: ''
			},
			run: ''
		}

		var onData = sinon.spy(function(data) {
			expect(data.suggestion.words[0].string).to.equal('man');
			expect(data.result).to.be.empty;
		});

		var onEnd = function() {
			expect(onData).to.have.been.called.once;
			done();
		};

		parser
		.understand(schema)
		.on('data', onData)
		.on('end', onEnd)
		.parse('superm');
	});

	it('custom separator', function (done) {
		var schema = {
			root: {
				type: 'sequence',
				children: [
					'super',
					'man'
				],
				separator: ' test '
			},
			run: ''
		}

		var onData = sinon.spy(function(data) {
			expect(data.suggestion.words[0].string).to.equal('man');
		});

		var onEnd = function() {
			expect(onData).to.have.been.called.once;
			done();
		};

		parser
		.understand(schema)
		.on('data', onData)
		.on('end', onEnd)
		.parse('super test m');
	});

	it('optional child', function (done) {
		var schema = {
			root: {
				type: 'sequence',
				children: [
					'super', {
						type: 'literal',
						optional: 'true',
						display: 'maximum',
						value: 'optionalValue',
						id: 'optionalId',
					},
					'man'
				]
			},
			run: ''
		}

		var onData = sinon.spy(function(data) {
			expect(['maximum', 'man']).to.contain(data.suggestion.words[0].string);
			if (data.suggestion.words[0].string === 'maximum') {
				expect(data.result.optionalId).to.equal('optionalValue');
			} else {
				expect(data.result).to.be.empty;
			}
		});

		var onEnd = function() {
			expect(onData).to.have.been.called.twice;
			done();
		};

		parser
		.understand(schema)
		.on('data', onData)
		.on('end', onEnd)
		.parse('super m');
	});

	it('can set a value to the result', function (done) {
		var schema = {
			root: {
				type: 'sequence',
				id: 'testId',
				value: 'testValue',
				children: [
					'super',
					'man'
				]
			},
			run: ''
		}

		var onData = sinon.spy(function(data) {
			expect(data.result.testId).to.equal('testValue');
		});

		var onEnd = function() {
			expect(onData).to.have.been.called.once;
			done();
		};

		parser
		.understand(schema)
		.on('data', onData)
		.on('end', onEnd)
		.parse('super m');
	});
});
