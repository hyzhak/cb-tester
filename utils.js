var bitcoinjs = require('bitcoinjs-lib')
var httpify = require('httpify')

function createNewAddress () {
  var privKey = bitcoinjs.ECKey.makeRandom()
  var testnet = bitcoinjs.networks.testnet

  return privKey.pub.getAddress(testnet).toString()
}

var BLOCKTRAIL_ADDRESS = '2NGHjvjw83pcVFgMcA7QvSMh2c246rxLVz9'

function requestNewUnspent (callback) {
  var key = bitcoinjs.ECKey.makeRandom()
  var address = key.pub.getAddress(bitcoinjs.networks.testnet).toString()
  var value = 1e4

  httpify({
    method: 'POST',
    url: 'https://api.blocktrail.com/v1/tBTC/faucet/withdrawl?api_key=c0bd8155c66e3fb148bb1664adc1e4dacd872548',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: address, amount: value })
  }, function (err, res) {
    if (err) return callback(err)
    if (res.body.code >= 500) return callback(res.body)

    var txb = new bitcoinjs.TransactionBuilder()
    var unspent = res.body
    txb.addInput(unspent.txHash, unspent.index)
    txb.addOutput(BLOCKTRAIL_ADDRESS, value)
    txb.sign(0, key)

    callback(null, unspent.txHash, address, txb.build())
  })
}

module.exports = {
  createNewAddress: createNewAddress,
  requestNewUnspent: requestNewUnspent
}
