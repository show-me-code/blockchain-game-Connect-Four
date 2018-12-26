import { AssertionError } from "assert";

var TicTacToc = artifacts.require("TicTacToc");

//var moneyUsed = 1000000000000000000;
var moneyUsed = web3.utils.toWei('1', 'ether');
contract("TicTacToc", function(accounts){
    it("Join Game and test winner", function() {
        var Instance;
        var player1 = accounts[0];
        var player2 = accounts[1];
        return TicTacToc.new({from : accounts[0], value : moneyUsed}).then(instance => {
            Instance = instance;
            return instance.joinGame({from : player2, value : moneyUsed})
        }).then(board => {
            return Instance.setChess(0,0,{from : board.logs[1].args.player})
        }).then(board =>{
            return Instance.setChess(1,1,{from : board.logs[0].args.player})
        }).then(board =>{
            return Instance.setChess(0,1,{from : board.logs[0].args.player})
        }).then(board =>{
            return Instance.setChess(1,0,{from : board.logs[0].args.player})
        }).then(board =>{
            return Instance.setChess(0,2,{from : board.logs[0].args.player})
        }).then(board =>{
            return Instance.setChess(1,2,{from : board.logs[0].args.player})
        }).then(board =>{
            return Instance.setChess(0,3,{from : board.logs[0].args.player})
        }).then(board =>{
            console.log(board)
        }).catch(err => {
            console.log(err)
        })
    })
})