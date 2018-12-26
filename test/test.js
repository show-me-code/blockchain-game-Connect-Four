
var TicTacToc = artifacts.require("TicTacToc");
/**
 * 安装了babel-preset-env，否则会报告缺少，主要在babellrc设置了
 * web3.toWei失效
 * 1.0版本已经变成了web3.utils.toWei
 */
//var moneyUsed = 1000000000000000000;
var moneyUsed = web3.utils.toWei('1',"ether");
contract("TicTacToc", function(accounts) {
    it("the board need to be initalized empty", function() {
        return TicTacToc.new({from : accounts[0], value : moneyUsed}).then(instance => {
            return instance.getBoard.call();
        }).then(board => {
            console.log(board);
        }).catch(err => {
            console.log(err)
        })
    })
})