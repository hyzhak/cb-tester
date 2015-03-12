var assert = require('assert')
var bitcoinjs = require('bitcoinjs-lib')
var request = require('superagent')

function createNewAddress () {
  var privKey = bitcoinjs.ECKey.makeRandom()
  var testnet = bitcoinjs.networks.testnet

  return privKey.pub.getAddress(testnet).toString()
}

function requestNewUnspents(amount, callback) {
  assert(amount > 0, 'Minimum amount is 1')
  assert(amount <= 3, 'Maximum amount is 3')
  amount = Math.round(amount)

  request
  .get('https://testnet.helloblock.io/v1/faucet?type=' + amount)
  .end(function(err, res) {
    if (err) return callback(err)

    var privKey = bitcoinjs.ECKey.fromWIF(res.body.data.privateKeyWIF)
    var txs = res.body.data.unspents.map(function(utxo) {
      var tx = new bitcoinjs.TransactionBuilder()
      tx.addInput(utxo.txHash, utxo.index)
      tx.addOutput(utxo.address, utxo.value)
      tx.sign(0, privKey)

      return tx.build()
    })

    var addresses = res.body.data.unspents.map(function(utxo) {
      return utxo.address
    })

    if (txs.length !== amount) return callback(new Error('txs.length !== amount'))

    callback(undefined, txs, addresses)
  })
}

module.exports = {
  createNewAddress: createNewAddress,
  requestNewUnspents: requestNewUnspents
}
