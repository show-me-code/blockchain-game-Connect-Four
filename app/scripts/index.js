// Import the page's CSS. Webpack will know what to do with it.
import '../styles/app.css'

// Import libraries we need.
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'
import $ from 'jquery'

// Import our contract artifacts and turn them into usable abstractions.
import TicTacTocArtifact from '../../build/contracts/TicTacToc.json'


/**
 * 启用两个终端，一个运行develop 另外一个npm run dev开始监听使得能够浏览器能够访问
 */
const TicTacToc = contract(TicTacTocArtifact)
var Instance

let accounts
let account

const App = {
  start: function () {
    const self = this

    // Bootstrap the MetaCoin abstraction for Use.
    TicTacToc.setProvider(web3.currentProvider)

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function (err, accs) {
      if (err != null) {
        alert('There was an error fetching your accounts.')
        return
      }

      if (accs.length === 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.")
        return
      }

      accounts = accs
      account = accounts[0]

    })
  },

  newGame : function() {
    TicTacToc.new({from: account, value: web3.toWei("1", "ether"), gas:3000000}).then(instance =>{
      Instance = instance;
      console.log(instance);
      for(var i = 0; i < 4; i++) {
        for(var j = 0; j < 4; j++) {
          $($("#board")[0].children[0].children[i].children[j]).off('onclick').click({x:i, y:j}, App.setChess);
        }
      }
      console.log('game start!')
    }).catch(err =>{
      console.log(err);
    })
  
  },
  joinGame : function() {
    account = accounts[1];
    var Address = prompt('enter the address of the game');
    if(Address != null) {
      console.log("address added");
      TicTacToc.at(Address).then(instance => {
        Instance = instance;
        console.log(Instance)
        return Instance.joinGame({from: account, value: web3.toWei("1", "ether"), gas:3000000});
      }).then(tx =>{
        console.log('tx');
        console.log(tx);
        for(var i = 0; i < 4; i++) {
          for(var j = 0; j < 4; j++) {
            //通过jquery调用setchess
            $($("#board")[0].children[0].children[i].children[j]).off('onclick').click({x:i, y:j}, App.setChess);
          }
        }
      })
    }
  },
  setChess:function(event) {
    console.log('clicked');
    console.log(event);
    //必须要确定一个地址
    Instance.setChess(event.data.x, event.data.y,{from: account}).then(tx => {
      
      console.log(tx);
    })
  }
}

window.App = App

window.addEventListener('load', function () {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn(
      'Using web3 detected from external source.' +
      ' If you find that your accounts don\'t appear or you have 0 MetaCoin,' +
      ' ensure you\'ve configured that source properly.' +
      ' If using MetaMask, see the following link.' +
      ' Feel free to delete this warning. :)' +
      ' http://truffleframework.com/tutorials/truffle-and-metamask'
    )
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider)
  } else {
    console.warn(
      'No web3 detected. Falling back to http://127.0.0.1:9545.' +
      ' You should remove this fallback when you deploy live, as it\'s inherently insecure.' +
      ' Consider switching to Metamask for development.' +
      ' More info here: http://truffleframework.com/tutorials/truffle-and-metamask'
    )
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9545'))
  }

  App.start()
})
