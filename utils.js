var bitcoinjs = require('bitcoinjs-lib')
var httpify = require('httpify')

function createNewAddress () {
  var privKey = bitcoinjs.ECKey.makeRandom()
  var testnet = bitcoinjs.networks.testnet

  return privKey.pub.getAddress(testnet).toString()
}

function requestUnconfirmedTransaction(callback) {
  var address = "mkU71dQZ5QAj2GspHfXW8ajgmx2hzYshUM"
  httpify({
    method: "POST",
    url: "https://testnet.helloblock.io/v1/faucet/withdrawal",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      toAddress: address,
      value: 1e4
    })
  }, function(err, res) {
    if (err) return callback(err)
    if (!res.body.data) return callback("Invalid JSend Response")

    callback(null, res.body.data.txHash, address)
  })
}

function requestNewUnspents(amount, callback) {
  httpify({
    method: 'GET',
    url: 'https://testnet.helloblock.io/v1/faucet?type=' + amount
  }, function(err, res) {
    if (err) return callback(err)

    var privKey = bitcoinjs.ECKey.fromWIF(res.body.data.privateKeyWIF)
    var txs = res.body.data.unspents.map(function(utxo) {
      var tx = new bitcoinjs.TransactionBuilder()
      tx.addInput(utxo.txHash, utxo.index)
      tx.addOutput(utxo.address, utxo.value)
      tx.sign(0, privKey)

      return tx.build()
    })

    if (txs.length !== amount) return callback(new Error('txs.length !== amount'))

    callback(undefined, txs)
  })
}

module.exports = {
  createNewAddress: createNewAddress,
  requestUnconfirmedTransaction: requestUnconfirmedTransaction,
  requestNewUnspents: requestNewUnspents
}
