var TicTacToc = artifacts.require('./TicTacToc.sol')


module.exports = function (deployer) {
  //由于每次都要重新部署合约，所以migration这种方式不使用
  //deployer.deploy(TicTacToc)
}
