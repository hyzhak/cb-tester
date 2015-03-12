var assert = require('assert')
var fixtures = require('./fixtures')
var typeForce = require('typeforce')
var utils = require('./utils')

module.exports = function(options) {
  describe('Addresses', function() {
    var blockchain

    beforeEach(function() {
      blockchain = options.blockchain
    })

    describe('Summary', function() {
      fixtures.addresses.forEach(function(f) {
        it('returns summary for ' + f, function(done) {
          blockchain.addresses.summary(f, function(err, result) {
            assert.ifError(err)

            typeForce({
              address: "String",
              balance: "Number",
              totalReceived: "Number",
              txCount: "Number"
            }, result)

            assert.strictEqual(result.address, f)
            assert(result.balance > 0, 'Invalid balance')
            assert(result.totalReceived > 0, 'Invalid totalReceived')
            assert(result.txCount > 0, 'Invalid txCount')

            return done()
          })
        })
      })

      fixtures.invalid.addresses.forEach(function(f) {
        it('throws on ' + f, function(done) {
          blockchain.addresses.summary(f, function(err) {
            assert.throws(function() {
              if (err) throw err
            }, new RegExp(f + ' is not a valid testnet address'))

            return done()
          })
        })
      })

      it('works for n of 0', function(done) {
        blockchain.addresses.summary([], function(err, results) {
          assert.ifError(err)
          assert.strictEqual(results.length, 0)

          return done()
        })
      })

      it('works for an unused address', function (done) {
        var address = utils.createNewAddress()

        blockchain.addresses.summary(address, function(err, result) {
          assert.ifError(err)

          assert.strictEqual(result.address, address)
          assert.strictEqual(result.balance, 0)
          assert.strictEqual(result.totalReceived, 0)
          assert.strictEqual(result.txCount, 0)

          return done()
        })
      })

      it('works for scriptHash addresses', function(done) {
        blockchain.addresses.summary(fixtures.scriptAddresses, function(err, results) {
          assert.ifError(err)
          assert.strictEqual(results.length, fixtures.scriptAddresses.length)

          return done()
        })
      })

      it('works for n of ' + fixtures.tooManyAddresses.length + ' addresses', function(done) {
        var addresses = fixtures.tooManyAddresses

        blockchain.addresses.summary(addresses, function(err, results) {
          assert.ifError(err)
          assert.strictEqual(results.length, addresses.length)

          return done()
        })
      })
    })

    describe('Transactions', function() {
      it('returns sane results', function(done) {
        blockchain.addresses.transactions(fixtures.addresses, 0, function(err, results) {
          assert.ifError(err)

          typeForce([{
            txId: "String",
            txHex: "String",
            blockId: "String",
            blockHeight: "Number"
          }], results)

          results.forEach(function(result) {
            assert(result.txId.match(/^[0-9a-f]+$/i))
            assert(result.txHex.match(/^[0-9a-f]+$/i))
            assert(result.blockId.match(/^[0-9a-f]+$/i))
            assert.strictEqual(result.txId.length, 64)
            assert.strictEqual(result.blockId.length, 64)
            assert(result.blockHeight > 0)
          })

          return done()
        })
      })

      fixtures.invalid.addresses.forEach(function(f) {
        it('throws on ' + f, function(done) {
          blockchain.addresses.transactions(f, function(err) {
            assert.throws(function() {
              if (err) throw err
            }, new RegExp(f + ' is not a valid testnet address'))

            return done()
          })
        })
      })

      it('works for n of 0', function(done) {
        blockchain.addresses.transactions([], function(err, results) {
          assert.ifError(err)
          assert.strictEqual(results.length, 0)

          return done()
        })
      })

      it('works for an unused address', function (done) {
        blockchain.addresses.transactions(utils.createNewAddress(), function(err, results) {
          assert.ifError(err)
          assert.strictEqual(results.length, 0)

          return done()
        })
      })

      it('returns expected transactions', function(done) {
        blockchain.addresses.transactions(fixtures.addresses, 0, function(err, results) {
          assert.ifError(err)

          fixtures.addressTransactions.forEach(function(f) {
            assert(results.some(function(result) {
              return (result.txId === f)
            }))
          })

          return done()
        })
      })

      it('works for n of ' + fixtures.tooManyAddresses.length + ' addresses', function(done) {
        blockchain.addresses.transactions(fixtures.tooManyAddresses, 0, function(err, results) {
          assert.ifError(err)

          // TODO: verify...
          assert(results.length > 70)

          return done()
        })
      })

      it('includes zero-confirmation transactions', function(done) {
        utils.requestNewUnspents(1, function(err, txs, addresses) {
          assert.ifError(err)

          var address = addresses[0]
          var txHex = txs[0].toHex()
          var txId = txs[0].getId()

          blockchain.transactions.propagate(txHex, function(err) {
            assert.ifError(err)

            setTimeout(function() {
              blockchain.addresses.transactions(address, function(err, results) {
                assert.ifError(err)

                assert(results.some(function(result) {
                  return result.txId === txId
                }))

                return done()
              })
            }, 5000) // possibly adequate 'propagation' time
          })
        })
      })
    })

    describe('Unspents', function() {
      it('returns sane results', function(done) {
        var address = fixtures.addresses[0]

        blockchain.addresses.unspents(address, function(err, results) {
          assert.ifError(err)

          typeForce([{
            txId: "String",
            address: "String",
            confirmations: "Number",
            value: "Number",
            vout: "Number"
          }], results)

          results.forEach(function(result) {
            assert(result.txId.match(/^[0-9a-f]+$/i))
            assert.strictEqual(result.txId.length, 64)

            assert.strictEqual(result.address, address)
            assert(isFinite(result.confirmations))
            assert(isFinite(result.value))
            assert(isFinite(result.vout))
          })

          return done()
        })
      })

      fixtures.invalid.addresses.forEach(function(f) {
        it('throws on ' + f, function(done) {
          blockchain.addresses.unspents(f, function(err) {
            assert.throws(function() {
              if (err) throw err
            }, new RegExp(f + ' is not a valid testnet address'))

            return done()
          })
        })
      })

      it('works for n of 0', function(done) {
        blockchain.addresses.unspents([], function(err, results) {
          assert.ifError(err)
          assert.strictEqual(results.length, 0)

          return done()
        })
      })

      it('works for an unused address', function (done) {
        blockchain.addresses.unspents(utils.createNewAddress(), function(err, results) {
          assert.ifError(err)
          assert.strictEqual(results.length, 0)

          return done()
        })
      })

      it('returns expected transactions', function(done) {
        blockchain.addresses.unspents(fixtures.addresses, function(err, results) {
          assert.ifError(err)

          fixtures.addressTransactions.forEach(function(f) {
            assert(results.some(function(result) {
              return (result.txId === f)
            }))
          })

          return done()
        })
      })

      it('works for n of ' + fixtures.tooManyAddresses.length + ' addresses', function(done) {
        var addresses = fixtures.tooManyAddresses

        blockchain.addresses.unspents(addresses, function(err) {
          assert.ifError(err)

          return done()
        })
      })
    })
  })
}
