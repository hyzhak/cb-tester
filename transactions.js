var assert = require('assert')
var fixtures = require('./fixtures')
var types = require('common-blockchain').types
var typeForce = require('typeforce')
var utils = require('./utils')

module.exports = function(options) {
  describe('Transactions', function() {
    var blockchain

    beforeEach(function() {
      blockchain = options.blockchain
    })

    describe('Summary', function() {
      function verify(f, result) {
        assert.strictEqual(f.txId, result.txId)
        assert.strictEqual(f.blockId, result.blockId)
        assert.strictEqual(f.blockHeight, result.blockHeight)
        assert.strictEqual(f.nInputs, result.nInputs)
        assert.strictEqual(f.nOutputs, result.nOutputs)
        assert.strictEqual(f.totalInputValue, result.totalInputValue)
        assert.strictEqual(f.totalOutputValue, result.totalOutputValue)
      }

      fixtures.transactions.slice(0, 10).forEach(function(f) {
        it('returns a summary for ' + f.txId + ' correctly', function(done) {
          blockchain.transactions.summary(f.txId, function(err, result) {
            assert.ifError(err)
            typeForce(types.transactions.summary, result)

            verify(f, result)

            done()
          })
        })
      })

      fixtures.invalid.transactions.forEach(function(f) {
        it('throws on ' + f, function(done) {
          blockchain.transactions.summary(f, function(err) {
            assert.throws(function() {
              if (err) throw err
            }, new RegExp(f + ' is not a valid txId'))

            done()
          })
        })
      })

      it('works for n of 0', function(done) {
        blockchain.transactions.summary([], function(err, results) {
          assert.ifError(err)
          assert.strictEqual(results.length, 0)

          return done()
        })
      })

      it('works for n of ' + fixtures.transactions.length + ' transactions', function(done) {
        var txIds = fixtures.transactions.map(function(f) { return f.txId })

        blockchain.transactions.summary(txIds, function(err, results) {
          assert.ifError(err)
          typeForce([types.transactions.summary], results)

          var resultsMap = {}
          results.map(function(result) { resultsMap[result.txId] = result })

          fixtures.transactions.forEach(function(f) {
            verify(f, resultsMap[f.txId])
          })

          done()
        })
      })
    })

    describe('Get', function() {
      fixtures.transactions.slice(0, 10).forEach(function(f) {
        it('returns the transaction for ' + f.txId + ' correctly', function(done) {
          blockchain.transactions.get(f.txId, function(err, result) {
            assert.ifError(err)
            typeForce(types.transactions.get, result)

            assert.strictEqual(result.txId, f.txId)
            assert.strictEqual(result.blockId, f.blockId)
            assert.strictEqual(result.blockHeight, f.blockHeight)
            assert.strictEqual(result.txHex, f.txHex, result.txHex + ' != ' + f.txHex)

            done()
          })
        })
      })

      fixtures.invalid.transactions.forEach(function(f) {
        it('throws on ' + f, function(done) {
          blockchain.transactions.get(f, function(err) {
            assert.throws(function() {
              if (err) throw err
            }, new RegExp(f + ' is not a valid txId'))

            done()
          })
        })
      })

      it('works for n of 0', function(done) {
        blockchain.transactions.get([], function(err, results) {
          assert.ifError(err)
          assert.strictEqual(results.length, 0)

          return done()
        })
      })

      it('works for n of ' + fixtures.transactions.length + ' transactions', function(done) {
        var txIds = fixtures.transactions.map(function(f) { return f.txId })

        blockchain.transactions.get(txIds, function(err, results) {
          assert.ifError(err)

          typeForce([types.transactions.get], results)
          assert.strictEqual(results.length, fixtures.transactions.length)

          fixtures.transactions.forEach(function(f) {
            assert(results.some(function(result) {
              return (result.txId === f.txId) && (result.txHex === f.txHex)
            }))
          })

          done()
        })
      })
    })

    describe('Latest', function() {
      it('returns sane results', function(done) {
        blockchain.transactions.latest(function(err, results) {
          assert.ifError(err)

          typeForce(types.transactions.latest, results)
          results.forEach(function(result) {
            assert(result.txId.match(/^[0-9a-f]+$/i))
            assert.strictEqual(result.txId.length, 64)
            assert(result.txHex.match(/^[0-9a-f]+$/i))
          })

          done()
        })
      })
    })

    describe('Propagate', function() {
      it('propagates a single Transaction', function(done) {
        utils.requestNewUnspents(1, function(err, txs) {
          assert.ifError(err)

          var txId = txs[0].getId()
          var txHex = txs[0].toHex()

          blockchain.transactions.propagate(txHex, function(err, result) {
            assert.ifError(err)

            typeForce(types.transactions.propagate, result)
            assert.strictEqual(result, txId)

            done()
          })
        })
      })

      it('works for n of 0', function(done) {
        blockchain.transactions.propagate([], function(err, results) {
          assert.ifError(err)
          assert.strictEqual(results.length, 0)

          return done()
        })
      })

      it('works for n of 3 transactions', function(done) {
        utils.requestNewUnspents(3, function(err, txs) {
          assert.ifError(err)

          var txIds = txs.map(function(tx) { return tx.getId() })
          var txHexs = txs.map(function(tx) { return tx.toHex() })

          blockchain.transactions.propagate(txHexs, function(err, results) {
            assert.ifError(err)
            typeForce([types.transactions.propagate], results)

            results.forEach(function(actualTxId, i) {
              assert.strictEqual(actualTxId, txIds[i])
            })

            done()
          })
        })
      })

      it.skip('throws on malformed transaction', function() {

      })
    })
  })
}
