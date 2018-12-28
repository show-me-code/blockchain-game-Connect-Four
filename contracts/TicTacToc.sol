//solium-disable linebreak-style
pragma solidity ^0.5.0;
//有两个玩家，一个创建合约一个加入合约

/***
12.21更新
在用到truffle的时候发现必须使用0.5.0版本，更改如下：
在所有事件前加入emit关键字，防止DAO
在所有需要支付的地址上加入了payable来让玩家的地址可以被支付
将this.balance改为了address(this).balance
用以太币钱包部署的应该就是旧版本了，这个版本控制真的是闹心
12.27更新
删除了energencyCashOut和withDrawMoney，发现没有使用的必要
 */
contract TicTacToc{
    uint constant GameValue = 1 ether;
    uint public boardSize = 4;
    uint movesCounter;
    bool gameActive;
    uint timeToMove = 10 minutes;
    uint avaliableGameTime;
    uint getMoneyPlayer1;
    uint getMoneyPlayer2;

    address[4][4] board; //实现在特定的位置下棋
    address payable public player1;
    address payable public player2;
    address payable activedPlayer;// 正在下棋的玩者
    


    event playerJoined(address player);
    event playerRemind(address player); // 提醒谁应该下棋
    event GameOverWinner(address player);
    event GameOverDraw();
    event GetMoney(address player, uint value);


    constructor() payable public {
        //第一个玩者构建合约
        require(msg.value == GameValue);
        player1 = msg.sender;
        activedPlayer = player1;
        avaliableGameTime = now + timeToMove;
    }

    function joinGame() public payable {
        //第二个玩者加入游戏
        assert(player2 == address(0));// 防止重复加入
        assert(player1 != msg.sender);
        require(msg.value == GameValue);
        player2 = msg.sender;
        avaliableGameTime = now + timeToMove;
        emit playerJoined(player2);
        gameActive = true;
        //为了尽可能地随机，使用区块的数
        if(block.number%2 == 0) {
            activedPlayer = player1;
        } else {
            activedPlayer = player2;
        }
        emit playerRemind(activedPlayer);
    }

    //后期优化为setChess
    function setChess(uint x, uint y) public {
        //在棋盘的位置标注是谁下的
        require(board[x][y] == address(0));
        require(avaliableGameTime > now);
        assert(x < boardSize);
        assert(y < boardSize);
        assert(gameActive);
        //playerRemind(activedPlayer);
        require(msg.sender == activedPlayer);
        board[x][y] = msg.sender;
        movesCounter++;
        avaliableGameTime = now + timeToMove;
        //决定行是否胜利 col
        for (uint index = 0; index < boardSize; index++) {
            if(board[index][y] != activedPlayer) {
                break;
            }
            //win
            if(index == boardSize - 1){
                //winner
                setWinner(activedPlayer);
                return;
            }
        }
        //决定列是否胜利 row
        for (uint index = 0; index < boardSize; index++){
            if(board[x][index] != activedPlayer){
                break;
            }
            //win
            if(index == boardSize - 1){
                //winner
                setWinner(activedPlayer);
                return;
            }
        }
        //对角线 diagonale
        if(x == y) {
            for(uint index = 0; index < boardSize; index++) {
                if(board[index][index] != activedPlayer) {
                    break;
                }
                //win
                if(index == boardSize - 1){
                    //winner
                    return;
                }
            }
        }
        //反对角线 antidiagonale
        if((x + y) == boardSize - 1){
            for(uint index = 0; index < boardSize; index++){
                if(board[index][(boardSize-1) - index] != activedPlayer){
                    break;
                }
                //win
                if(index == boardSize - 1) {
                    //winner
                    setWinner(activedPlayer);
                    return;
                }
            }
        }
        //平局情况
        if(movesCounter == boardSize**2){
            //draw
            setDraw();
            return;
        }
        //切换下棋的玩家
        if(activedPlayer == player1) {
            activedPlayer = player2;
        } else {
            activedPlayer = player1;
        }
        emit playerRemind(activedPlayer);
    }

    function getBoard() public view returns(address[4][4] memory) {
        //返回当前的棋盘
        return board;
    }

    //在0.5.0更新之后必须要给地址加上payable才能调用send啥的，我佛了，事件前加入emit
    function setWinner(address payable player) private {
        gameActive = false;
        //emit event
        emit GameOverWinner(player);
        //pay
        //use send because if we use transfer the game will roll back to the time last set cheek
        uint balanceNow = address(this).balance;
        if(!player.send(address(this).balance)) {
            if(player == player1) {
                getMoneyPlayer1 = address(this).balance;
            } else {
                getMoneyPlayer2 == address(this).balance;
            }
        } else {
            emit GetMoney(player, balanceNow);
            balanceNow = 0;
        }
    }
    //the situation that draw（平局）
    function setDraw() private {
        gameActive = false;
        emit GameOverDraw();
        uint moneyWithDraw = address(this).balance/2;
        if(!player1.send(moneyWithDraw)) {
            getMoneyPlayer1 += moneyWithDraw;
        } else {
            emit GetMoney(player1, moneyWithDraw);
        }
        if(!player2.send(moneyWithDraw)) {
            getMoneyPlayer2 += moneyWithDraw;
        } else {
            emit GetMoney(player2, moneyWithDraw);
        }
    }

}