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
var Instance;
var getAddress;
var remindEvent;
var GameOverWinnerEvent;
var GameOverDrawEvent;


let accounts
let account

const App = {
  start: function () {
    console.log(getAddress);
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
      //显示两个按钮，显示游戏地址
      $('.during-game').show("slow");
      $('.after-start').hide();
      $('#game-address').text(instance.address);
      $('#your-turn').hide()
      //监听加入时间，不用像其他三个单独写函数了
      var joinedEvent = Instance.playerJoined();
        joinedEvent.watch(function(error, eventobj) {
          //加入只有一次，那么直接可以停止监听
          $('#another-address').text(eventobj.args.player);
          joinedEvent.stopWatching();
          if(error == null) {
            console.log('joinedEvent:' + eventobj);
          } else {
            console.log(error)
          }
        });
      //监听三个事件：提醒下一名玩家；游戏胜利；游戏平局
      remindEvent = Instance.playerRemind();
      remindEvent.watch(App.playerRemind);
      
      GameOverWinnerEvent = Instance.GameOverWinner();
      GameOverWinnerEvent.watch(App.GameOverWinner);
      
      GameOverDrawEvent = Instance.GameOverDraw();
      GameOverDrawEvent.watch(App.GameOverWinner);

      console.log('game start!')
    }).catch(err =>{
      console.log(err);
    })
  
  },
  joinGame : function() {
    //本来想着直接显示游戏地址，但是忽然意识到多个游戏存在的时候会显示混乱
    var Address = prompt('enter the address of the game');
    if(Address != null) {
      console.log("address added");
      TicTacToc.at(Address).then(instance => {
        Instance = instance;
        console.log(Instance);

        remindEvent = Instance.playerRemind();
        remindEvent.watch(App.playerRemind);
        
        GameOverWinnerEvent = Instance.GameOverWinner();
        GameOverWinnerEvent.watch(App.GameOverWinner);
        
        GameOverDrawEvent = Instance.GameOverDraw();
        GameOverDrawEvent.watch(App.GameOverWinner);

        return Instance.joinGame({from: account, value: web3.toWei("1", "ether"), gas:3000000});
      }).then(tx =>{
        console.log('joinGame:'+tx);
        $('.during-game').show("slow");
        $('.after-start').hide();
        $('#game-address').text(Instance.address);
        $('#your-turn').hide()
        //对手是player1，直接调用sol的公共变量
        Instance.player1.call().then(address => {
          $('#another-address').text(address);
        })
      })
    }
  },

  setChess:function(event) {
    console.log('clicked');
    console.log(event);
    //必须要确定一个地址，不确定地址会报错
    Instance.setChess(event.data.x, event.data.y,{from: account}).then(tx => {
      console.log('setChess:'+ tx);
      App.print();
    })
  },

  print:function() {
    Instance.getBoard.call().then( board => {
      //扫描board，如果当前玩家账号是则换为图片
      for(var i = 0; i < board.length; i++) {
        for(var j = 0; j < board.length; j++) {
          if(board[i][j] == account) {
            //$('img').attr('src','../../app/rick.jpg') 注意路径问题
            $("#board")[0].children[0].children[i].children[j].innerHTML = "<img src = '../../app/morty.jpg'/>";
          } else if(board[i][j] != 0) {
            $("#board")[0].children[0].children[i].children[j].innerHTML = "<img src = '../../app/rick.jpg'/>";
          }
        }
      }
    })
  },

  GameOverWinner: function(error, eventobj) {
    if(eventobj.event == "GameOverWinner") {
      if(eventobj.args.player == account) {
        alert("YOU WIN");
      } else {
        alert("YOU LOSE");
      }
    } else {
      //不是输或赢那就是平局，不用多监听一个事件了
      alert("THAT'S DRAW")
    }
    //停止监听
    remindEvent.stopWatching();
    GameOverDrawEvent.stopWatching();
    GameOverWinnerEvent.stopWatching();
    
    for(var i = 0; i < 4; i++) {
      for(var j = 0; j < 4; j++) {
        $("#board")[0].children[0].children[i].children[j] = '';
      }
    }

  },

  playerRemind: function(error, eventobj){
        App.print();
        console.log(eventobj);
        if(eventobj.args.player == account) {
          //在账号确认的情况下，如果那个地方是空，则调用setChess,同时提醒
        for(var i = 0; i < 4; i++) {
          for(var j = 0; j < 4; j++) {
            if($("#board")[0].children[0].children[i].children[j].innerHTML == '')
            $($("#board")[0].children[0].children[i].children[j]).off('click').click({x:i, y:j}, App.setChess);
          }
        }
        $('#your-turn').show();
        $('#waiting').hide();
    } else {
      $('#your-turn').hide();
      $('#waiting').show();
    }
  
  }
};

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
