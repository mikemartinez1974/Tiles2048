/**
 * Created by Mike on 12/12/2015.
 */
//2048 tiles

/* global TweenLite */
/* global TimelineLite */
/* global console */
/* global SplitText */
/* global Hammer */
/* global Elastic */
/* global Back */
/* global $c */

/* global $ */
$(function () {

    "use strict";

    var multiplier = 1;

    function setScale() {
        var brdsize = gameBoard.totalWidth();
        var tsize = gameBoard.tileSize;
        var sbsize = tsize * 1.27;
        var hmargin = 16;
        var vmargin = 20;
        var vsize = brdsize + sbsize + tsize + vmargin;
        var hsize = brdsize + hmargin;
        var winWidth = window.innerWidth;
        var winHeight = window.innerHeight;
        var m = 3;
        while (((vsize * m) > winHeight) || ((hsize * m) > winWidth)) {
            m -= 0.01;
        }

        multiplier = m;
    }

    function scale(value) {
        return Math.floor(value * multiplier);
    }

    function getRandomInt (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    //object
    function GameObject() {
    }
    GameObject.prototype.remove = function () {
        this.element().remove();
    };
    GameObject.prototype.selector = function () {
        return "#" + this.id;
    };
    GameObject.prototype.element = function () {
        return $(this.selector());
    };
    GameObject.prototype.position = function () {
        var e = this.element();
        var p = e.position();
        var rt = (p === undefined ? 0 : p.top ) + "px";
        var rl = (p === undefined ? 0 : p.left) + "px";
        return {top: rt, left: rl};
    };

    //object
    function ScoreBoard(id) {
        this.id = id || "scoreBoard";

        var _points = 0;
        Object.defineProperty(this, "points", {
            get: function () {
                return _points;
            },
            set: function (val) {
                _points = val;
            }
        });

        var _personalBest = 0;
        Object.defineProperty(this, "personalBest", {
            get: function () {
                return _personalBest;
            },
            set: function (val) {
                if (val) {
                    _personalBest = val;
                }
            }
        });

        var _html = "<div id='mcfScoreBoardOuter' class='mcfScoreBoardOuter' " +
            " style='width:" + gameBoard.totalWidth() + "px; " +
            " font-size: " + scale(150) + "%;' > " +
            "    <div id='" + this.id + "' class='mcfScoreBoard'> " +
            "       <div >Score:<span id='score'>0</span></div> " +
            "       <div >Best:<span id='best'>0</span></div> " +
            "</div> ";

        Object.defineProperty(this, "html", {
            get: function () {
                return _html;
            }
        });

        this._displayBest = 0;
        this._displayScore = 0;

        if (localStorage.mcf2048PersonalBest === undefined) {
            localStorage.mcf2048PersonalBest = 0;
            this.personalBest = 0;
        }
        else {
            this.personalBest = parseInt(localStorage.mcf2048PersonalBest, 10);
        }
    }
    ScoreBoard.prototype = new GameObject();
    ScoreBoard.prototype.constructor = ScoreBoard;
    ScoreBoard.prototype.render = function () {
        $("#container").append(this.html);
        TweenLite.to(this, 0.25, {
            _displayScore: this.points,
            _displayBest: this.personalBest,
            onUpdate: this.updateScoreBoard,
            callbackScope: this
        });
    };
    ScoreBoard.prototype.setScore = function (newPoints) {
        this.points = 0;
        this.score(newPoints);
        return this.points;
    };
    ScoreBoard.prototype.updateScoreBoard = function () {
        $("#score").text(parseInt(this._displayScore, 10));
        $("#best").text(parseInt(this._displayBest, 10));
    };
    ScoreBoard.prototype.score = function (newPoints) {
        this.points += newPoints;
        if (this.points > this.personalBest) {
            this.personalBest = this.points;
            localStorage.mcf2048PersonalBest = this.personalBest;
        }

        TweenLite.to(this, 0.25, {
            _displayScore: this.points,
            _displayBest: this.personalBest,
            onUpdate: this.updateScoreBoard,
            callbackScope: this
        });
    };


    //object
    function GameOverBox(id) {
        this.id = id || "gameOverBox";
        this.timeline = new TimelineLite();
        this.restart = function() {
            $(".mcfGameOver").remove();
            gameBoard.startGame();
        };
    }
    GameOverBox.prototype = new GameObject();
    GameOverBox.prototype.constructor = GameOverBox;
    GameOverBox.prototype.html = function () {
        //noinspection UnnecessaryLocalVariableJS
        var style = "style='font-size: " + scale(175) + "%;'";
        var retval = " <div id='" + this.id + "' class='mcfGameOver' " + style + " >" +
                        "<div class=value>" +
                            "<p class='goText'>Game Over!<br>" +
                            "Try Again?</p>" +
                        "</div>"+
                     "</div>";
        return retval;
    };
    GameOverBox.prototype.render = function () {
        controls.disableUndo();
        gameBoard.element().append(this.html());
        var div = this.element();
        $("#" + this.id).on("click",this.restart);
        TweenLite.set(div, {css:{perspective:500, perspectiveOrigin:"50% 50%", transformStyle:"preserve-3d"}});
        TweenLite.from(div, 0.5, {x: (gameBoard.tileSize * 4)});

        var mySplitText = new SplitText($(".goText"), {type:"chars,lines"});

        var numChars = mySplitText.chars.length;
        gameOverSound.play();
        for(var i = 0; i < numChars; i++){
            this.timeline.from(mySplitText.chars[i], 0.8, {css:{y:getRandomInt(-75, 75), x:getRandomInt(-150, 150), rotation:getRandomInt(0, 720), autoAlpha:0}, ease:Back.easeOut}, i * 0.02, "dropIn");
        }

        //this.timeline.staggerTo(mySplitText.chars, 4, {css:{transformOrigin:"50% 50% -30px", rotationY:-360, rotationX:360, rotation:360}, ease:Elastic.easeInOut}, 0.02, "+=1");
    };



    //object
    var nextSpaceId = 0;
    function GameSpace(id, gameBoard) {
        this.type = "GameSpace";
        this.id = nextSpaceId;
        this.showIdInCell = false;
        this.top = 0;
        this.left = 0;
        nextSpaceId += 1;
        var _gameBoard = gameBoard;
        Object.defineProperty(this, "gameBoard", {
            configurable: true,
            enumerable: true,
            get: function () {
                return _gameBoard;
            },
            set: function (val) {
                _gameBoard = val;
            }
        });

        var _tile = null;
        Object.defineProperty(this, "tile", {
            get: function () {
                return _tile;
            },
            set: function (newTile) {
                if (newTile === null) {
                    _tile = null;
                }
                else if (newTile instanceof Tile2048) {
                    _tile = newTile;
                }
                else {
                    throw "GameSpace.Tile can only be set to a tile.";
                }
            }
        });

        Object.defineProperty(this, "hasTile", {
            get: function () {
                return this.tile != null;
            }
        });

        Object.defineProperty(this, "hasNoTile", {
            get: function () {
                return this.tile == null;
            }
        });

        this.html = function () {
            var htmlBegin = "<div id='" + this.id + "' class='" + this.type + "' " +
                "  style='top:" + this.top + "px; left:" + this.left + "px;" +
                "  height:" + this.height + "px; width:" + this.width + "px; border-size:" + (this.width / 10) + "px;'>";
            var htmlLabel = "<p>" + this.id + "</p>";
            var htmlEnd = "</div>";
            var retval;
            if (!this.showIdInCell) {
                retval = htmlBegin;
            }
            else {
                retval = htmlBegin + htmlLabel;
            }
            retval += htmlEnd;
            return retval;
        };
    }
    GameSpace.prototype = new GameObject();
    GameSpace.prototype.constructor = GameSpace;
    GameSpace.prototype.value = function () {
        if (this.tile) {
            return this.tile.value;
        }
        else {
            return 0;
        }
    };
    GameSpace.prototype.clear = function () {
        this.tile = null;
        return this;
    };


    //object
    function GameBoard(id) {

        this.hammer = null;

        //GameObject.call(this);
        this.type = "GameBoard";
        this.id = id || "Board1";
        this.timeline = new TimelineLite();

        this.mulligans = 5;
        this.pastStates = [];
        this.turnIndex = 0;

        this.thisSpace = null;
        this.thisTile = null;
        this.adjacentSpace = null;
        this.adjacentTile = null;
        this.okToAddTile = false;
        this.movesThisTurn = null;
        this.movesLastTurn = null;
        this.undoFailSafe = false;
        this.listeningForUndo = false;
        this.won = false;

        var _tileSize = 0;
        Object.defineProperty(this, "tileSize", {
            configurable: true,
            enumerable: true,
            get: function () {
                return scale(_tileSize);
            },
            set: function (val) {
                _tileSize = val;
            }
        });

        var _boardSize = 0;
        Object.defineProperty(this, "boardSize", {
            configurable: true,
            enumerable: true,
            get: function () {
                return _boardSize;
            },
            set: function (val) {
                _boardSize = val;
            }
        });

        Object.defineProperty(this, "borderSize", {
            get: function() {
                return Math.floor((this.tileSize * this.boardSize) /10);
            }
        })

        this.html = function () {
            return "<div id='" + this.id + "' class='" + this.type + "' " +
                " style='border-width:" + this.borderSize + "px; width:" + (this.tileSize * this.boardSize) + "px;" +
                " height:" + (this.tileSize * this.boardSize) + "px; border-radius:" + this.boardSize + "px;'" +
                "></div>";
        };

        this.totalWidth = function () {
            return this.tileSize * this.boardSize / 10 * 2 + this.tileSize * this.boardSize;
        };

        var _matrix = [];
        Object.defineProperty(this, "matrix", {
            get: function () {
                return _matrix;
            },
            set: function (val) {
                _matrix = val;
            }
        });

        var _spaces = [];
        Object.defineProperty(this, "spaces", {
            get: function () {
                return _spaces;
            },
            set: function (val) {
                _spaces = val;
            }
        });

        Object.defineProperty(this, "maxTiles", {
            get: function () {
                return _boardSize * _boardSize;
            }
        });

        var _gameover = false;
        Object.defineProperty(this, "gameOver", {
            get: function () {
                var options = 0;
                var thisSpace;
                var thisTile;
                var adjacentSpace;
                var adjacentTile;
                var matrixRows = this.matrix.length;
                var matrixCols = this.matrix[0].length;
                if (tileFactory.getActiveTileCount() < 16) {
                    return false;
                }

                var r, c;
                //north
                for (r = 0; r < matrixRows - 1; r += 1) {
                    for (c = 0; c < matrixCols; c += 1) {
                        thisSpace = this.matrix[r][c];
                        thisTile = thisSpace.tile == null ? false : thisSpace.tile;
                        adjacentSpace = this.matrix[r + 1][c] == null ? false : this.matrix[r + 1][c];
                        adjacentTile = adjacentSpace.tile == null ? false : adjacentSpace.tile;
                        if (adjacentSpace) {
                            if (thisSpace.hasNoTile && adjacentSpace.hasTile) {
                                options += 1;
                            }
                            if (thisSpace.hasTile && adjacentSpace.hasTile) {
                                if (thisTile.value == adjacentTile.value) { // jshint ignore:line
                                    options += 1;
                                }
                            }
                        }
                    }
                }
                //east
                for (c = matrixCols - 1; c > 0; c -= 1) {
                    for (r = matrixRows - 1; r >= 0; r -= 1) {
                        thisSpace = this.matrix[r][c];
                        thisTile = thisSpace.tile == null ? false : thisSpace.tile;
                        adjacentSpace = this.matrix[r][c - 1] == null ? false : this.matrix[r][c - 1];
                        adjacentTile = adjacentSpace.tile == null ? false : adjacentSpace.tile;
                        if (adjacentSpace) {
                            if (thisSpace.hasNoTile && adjacentSpace.hasTile) {
                                options += 1;
                            }
                            if (thisSpace.hasTile && adjacentSpace.hasTile) {
                                if (thisTile.value == adjacentTile.value) { // jshint ignore:line
                                    options += 1;
                                }
                            }
                        }
                    }
                }
                //south
                for (r = matrixRows - 1; r > 0; r -= 1) {
                    for (c = 0; c < matrixCols; c += 1) {
                        thisSpace = this.matrix[r][c];
                        thisTile = thisSpace.tile == null ? false : thisSpace.tile;
                        adjacentSpace = this.matrix[r - 1][c] == null ? false : this.matrix[r - 1][c];
                        adjacentTile = adjacentSpace.tile == null ? false : adjacentSpace.tile;
                        if (adjacentSpace) {
                            if (thisSpace.hasNoTile && adjacentSpace.hasTile) {
                                options += 1;
                            }
                            if (thisSpace.hasTile && adjacentSpace.hasTile) {
                                if (thisTile.value == adjacentTile.value) { // jshint ignore:line
                                    options += 1;
                                }
                            }
                        }
                    }
                }
                //west
                for (c = 0; c < matrixCols - 1; c += 1) {
                    for (r = matrixRows - 1; r >= 0; r -= 1) {
                        thisSpace = this.matrix[r][c];
                        thisTile = thisSpace.tile == null ? false : thisSpace.tile;
                        adjacentSpace = this.matrix[r][c + 1] == null ? false : this.matrix[r][c + 1];
                        adjacentTile = adjacentSpace.tile == null ? false : adjacentSpace.tile;
                        if (adjacentSpace) {
                            if (thisSpace.hasNoTile && adjacentSpace.hasTile) {
                                options += 1;
                            }
                            if (thisSpace.hasTile && adjacentSpace.hasTile) {
                                if (thisTile.value == adjacentTile.value) { // jshint ignore:line
                                    options += 1;
                                }
                            }
                        }
                    }
                }
                return options ? false : true
            }
        });

        var _listening = false;
        Object.defineProperty(this, "listeningForMoves", {
            get: function () {
                return _listening;
            },
            set: function (value) {
                if (_listening != value) {
                    _listening = value;
                }
            }
        })
    }
    GameBoard.prototype = new GameObject();
    GameBoard.prototype.constructor = GameBoard;
    GameBoard.prototype.render = function () {
        $("#container").append(this.html());
        this.spaces.forEach(function (e) {
                gameBoard.element().append(e.html());
            }
        );
        this.attachInputEvents();
    };
    GameBoard.prototype.setup = function () {
        if (this.matrix.length > 0) {
            tileFactory.reset();
            this.matrix = [];
            this.spaces = [];
        }
        var t = 0, l = 0;
        var r = 0, c = 0;
        var boardSize = this.boardSize;
        for (var i = 1; i <= boardSize; i += 1) {
            //var col = 0;
            var row = [];
            for (var j = 1; j <= boardSize; j += 1) {
                var newSpace = new GameSpace(this.spaces.length, this);
                newSpace.top = t;
                newSpace.left = l;
                newSpace.height = this.tileSize;
                newSpace.width = this.tileSize;
                this.spaces.push(newSpace);
                row.push(newSpace);
                l += this.tileSize;
            }
            this.matrix.push(row);
            c = 0;
            l = 0;
            r += 1;
            t += this.tileSize;
        }
    };
    GameBoard.prototype.startGame = function () {

        try {
            this.won == false;
            this.spaces.forEach(function (space) {
                space.clear();
            });
            tileFactory.reset();
            this.turnIndex = 0;
            scoreBoard.setScore(0);
            this.mulligans = 5;
            this.pastStates = [];
            controls.updateMulligans();
            $(".mcfGameOver").remove();
        }
        catch (error) {
            throw error;
        }
        finally {
            this.addTile();
            this.addTile();
            TweenLite.set(".tile",{opacity:1});
            //this.saveBoardState();
            //this.attachInputEvents();
            gameBoard.listeningForMoves = true;
            controls.enableUndo();
        }
    };
    GameBoard.prototype.attachInputEvents = function () {

        $("body").on("keydown", function() {
            gameBoard.onKeyDown(event);
        });

        //noinspection JSCheckFunctionSignatures
        gameBoard.hammer = new Hammer(document.getElementById("gameBoard"));
        gameBoard.hammer.get("swipe").set({enable:true,direction:Hammer.DIRECTION_ALL,velocity:.5});
        gameBoard.hammer.on("swipeup",gameBoard.onSwipeUp);
        gameBoard.hammer.on("swiperight",gameBoard.onSwipeRight);
        gameBoard.hammer.on("swipedown",gameBoard.onSwipeDown);
        gameBoard.hammer.on("swipeleft",gameBoard.onSwipeLeft);
    };
    GameBoard.prototype.onSwipeUp = function (event) {
        gameBoard.onKeyDown({keyCode:38});
    };
    GameBoard.prototype.onSwipeDown = function (event) {
        gameBoard.onKeyDown({keyCode:40});
    };
    GameBoard.prototype.onSwipeLeft = function (event) {
        gameBoard.onKeyDown({keyCode:37});
    };
    GameBoard.prototype.onSwipeRight = function (event) {
        gameBoard.onKeyDown({keyCode:39});
    };
    GameBoard.prototype.onKeyDown = function (event) {
        try {
            event.preventDefault();
        }
        catch(er){}

        if (gameBoard.listeningForMoves) {

            noSlideIsPlaying = true;
            noMatchIsPlaying = true;

            gameBoard.listeningForMoves = false;

            var undoWasPlayed = false;
            var direction = "";
            var goodKey =
                event.keyCode === 37 ? true :
                    event.keyCode === 38 ? true :
                        event.keyCode === 39 ? true :
                            event.keyCode === 40 ? true :
                                event.keyCode === "undo" ? true : false;

            if (goodKey) {
                switch (event.keyCode) {
                    case 38:  //north
                        direction = "north";
                        break;
                    case 37:  //west
                        direction = "west";
                        break;
                    case 40:  //south
                        direction = "south";
                        break;
                    case 39:  //east
                        direction = "east";
                        break;
                    default:
                        gameBoard.listeningForMoves = true;
                        return;
                }


                if (gameBoard.turnIndex === 0) {
                    this.saveBoardState();
                }
                else {
                    if (this.movesLastTurn > 0) {
                        this.saveBoardState();
                    }
                }

                this.movesLastTurn = 0;
                this.timeline = new TimelineLite();
                this.timeline.addLabel("start", 0);

                // Here is where the logic starts...
                if (gameBoard.gameOver === false) {

                    gameBoard.moveTiles(direction);

                    tileFactory.commit();

                    gameBoard.timeline.add(tileFactory.timeline, "start");
                    gameBoard.timeline.eventCallback("onComplete", gameBoard.onAnimationComplete, null, gameBoard);
                    gameBoard.timeline.play();

                    if (tileFactory.movingTiles === 0) {
                        gameBoard.listeningForMoves = true;
                    }
                }
                else {
                    this.pastStates = [];
                    gameBoard.youLose();
                }
            }
            else {
                // gameBoard.attachInputEvents();
                gameBoard.listeningForMoves = true;
            }
        }
    };
    GameBoard.prototype.removeInputEvents = function () {
        $("body").off();
        this.hammer.destroy();
    };
    GameBoard.prototype.moveTiles = function (direction) {
        var r, c;
        var matrixLength = this.matrix.length;
        do {
            this.movesThisTurn = 0;

            switch (direction) {
                case "north":
                    for (r = 0; r < matrixLength - 1; r += 1) {
                        for (c = 0; c < matrixLength; c += 1) {
                            this.thisSpace = this.matrix[r][c];
                            this.thisTile = this.thisSpace.tile == null ? false : this.thisSpace.tile;
                            this.adjacentSpace = this.matrix[r + 1][c] == null ? false : this.matrix[r + 1][c];
                            this.adjacentTile = this.adjacentSpace.tile == null ? false : this.adjacentSpace.tile;
                            this.testSpace();
                        }
                    }
                    break;
                case "east":
                    for (c = matrixLength - 1; c > 0; c -= 1) {
                        for (r = matrixLength - 1; r >= 0; r -= 1) {
                            this.thisSpace = this.matrix[r][c];
                            this.thisTile = this.thisSpace.tile == null ? false : this.thisSpace.tile;
                            this.adjacentSpace = this.matrix[r][c - 1] == null ? false : this.matrix[r][c - 1];
                            this.adjacentTile = this.adjacentSpace.tile == null ? false : this.adjacentSpace.tile;
                            this.testSpace();
                        }
                    }
                    break;
                case "south":
                    for (r = matrixLength - 1; r > 0; r -= 1) {
                        for (c = 0; c < matrixLength; c += 1) {
                            this.thisSpace = this.matrix[r][c];
                            this.thisTile = this.thisSpace.tile == null ? false : this.thisSpace.tile;
                            this.adjacentSpace = this.matrix[r - 1][c] == null ? false : this.matrix[r - 1][c];
                            this.adjacentTile = this.adjacentSpace.tile == null ? false : this.adjacentSpace.tile;
                            this.testSpace();
                        }
                    }
                    break;
                case "west":
                    for (c = 0; c < matrixLength - 1; c += 1) {
                        for (r = matrixLength - 1; r >= 0; r -= 1) {
                            this.thisSpace = this.matrix[r][c];
                            this.thisTile = this.thisSpace.tile == null ? false : this.thisSpace.tile;
                            this.adjacentSpace = this.matrix[r][c + 1] == null ? false : this.matrix[r][c + 1];
                            this.adjacentTile = this.adjacentSpace.tile == null ? false : this.adjacentSpace.tile;
                            this.testSpace();
                        }
                    }
                    break;
            }
            if (this.movesThisTurn > 0) {
                this.movesLastTurn += 1;
            }
        }
        while (this.movesThisTurn > 0);
    };
    GameBoard.prototype.testSpace = function () {
        var adjacentSpace = this.adjacentSpace;
        var adjacentTile = this.adjacentTile;
        var thisTile = this.thisTile;
        var thisSpace = this.thisSpace;
        var ordinal = getRandomInt(1,4);
        if (adjacentSpace) {
            if (adjacentTile) {
                if (thisTile) {
                    if (thisTile.value == adjacentTile.value) { // jshint ignore:line
                        //merge tiles
                        if (thisTile.hasMerged === false && adjacentTile.hasMerged === false) {
                            adjacentTile.space = thisSpace;
                            this.okToAddTile = true;
                            this.movesThisTurn += 1;
                            if(noSlideIsPlaying) {
                                switch(ordinal) {
                                    case 1:
                                        slide1Sound.play();
                                        break;
                                    case 2:
                                        slide2Sound.play();
                                        break;
                                    case 3:
                                        slide3Sound.play();
                                        break;
                                    case 4:
                                        slide4Sound.play();
                                        break;
                                }
                            }
                            noSlideIsPlaying = false;
                        }
                    }
                }
                else {
                    //move tile in.
                    adjacentTile.space = thisSpace;
                    this.okToAddTile = true;
                    this.movesThisTurn += 1;
                    if(noSlideIsPlaying) {

                        switch(ordinal) {
                            case 1:
                                slide1Sound.play();
                                break;
                            case 2:
                                slide2Sound.play();
                                break;
                            case 3:
                                slide3Sound.play();
                                break;
                            case 4:
                                slide4Sound.play();
                                break;
                        }
                    }
                    noSlideIsPlaying = false;
                }
            }
        }
    };
    GameBoard.prototype.undo = function () {

        if (this.turnIndex < 1) { return; }
        if (this.mulligans === 0) { return; }
        if (this.listeningForUndo === false ) { return; }

        try {
            this.allTiles = [];
            this.spaces.forEach(function (space) {
                if (space.tile) {
                    var tile = space.tile;
                    tile.remove();
                    space.tile = null;
                }
            });

            var newBoard = gameBoard.pastStates.shift();
            var rowLength = newBoard.board.length;
            var colLength = newBoard.board[0].length;
            for (var r = 0; r < rowLength; r += 1) {
                for (var c = 0; c < colLength; c += 1) {
                    var tileValue = newBoard.board[r][c];
                    var space = gameBoard.matrix[r][c];
                    if (tileValue) {
                        tileFactory.createNewTile(space, tileValue);
                    }
                    else {
                        space.clear();
                    }
                }
            }

            scoreBoard.setScore(newBoard.score);
            scoreBoard.personalBest = newBoard.hiScore;
        }
        catch (error) {
            throw error;
        }
        finally {

            this.mulligans -= 1;
            controls.updateMulligans();
            this.turnIndex -= 1;
        }
    };
    GameBoard.prototype.addTile = function () {
        var rndA, rndB;
        if (arguments[0] == null) {
            var activeTiles = tileFactory.getActiveTileCount();
            var max = this.maxTiles;
            if (activeTiles <= max) {
                var randomSpace;
                do
                {
                    rndA = Math.round(Math.random() * (this.matrix.length - 1));
                    rndB = Math.round(Math.random() * (this.matrix[0].length - 1));
                    randomSpace = this.matrix[rndA][rndB];
                }
                while (randomSpace.tile != null);
                tileFactory.createNewTile(randomSpace);
                return true;
            }
            return false;
        }
    };
    GameBoard.prototype.saveBoardState = function () {
        var rLength = this.matrix.length;
        var cLength = this.matrix[0].length;

        if (this.mulligans > 0) {
            var newLayer = [];
            for (var r = 0; r < rLength; r += 1) {
                newLayer.push([]);
                for (var c = 0; c < cLength; c += 1) {
                    newLayer[r].push(this.matrix[r][c].value());
                }
            }

            var pastTurn = {};
            pastTurn.board = newLayer;
            pastTurn.score = scoreBoard.points;
            pastTurn.hiScore = scoreBoard.personalBest;
            this.pastStates.unshift(pastTurn);
            while (this.pastStates.length > this.mulligans) {
                this.pastStates.pop()
            }

            //gameBoard.logPastStates();
        }
    };
    GameBoard.prototype.youLose = function () {
        new GameOverBox().render();
    };
    GameBoard.prototype.addTilesIfNecessary = function () {

        if (this.okToAddTile) {
            gameBoard.turnIndex += 1;
            this.addTile();
            this.okToAddTile = false;
        }

        gameBoard.listeningForMoves = true;

    }
    GameBoard.prototype.finishedMovingTiles = function () {
        //this.lookForRemainingMoves();
        gameBoard.addTilesIfNecessary();
        //gameBoard.endOfTurn();
    }
    GameBoard.prototype.logPastStates = function () {

        for (var i = 0; i < this.pastStates.length; i++) {
            console.table(this.pastStates[i].board);
            console.info(i, this.pastStates.length);
            var turn = this.pastStates[i];
            if (turn !== undefined) {
                var rowOutput = "";
                rowOutput += turn.board[0][0] + "  " + turn.board[0][1] + "  " + turn.board[0][2] + "  " + turn.board[0][3] + "\n";
                rowOutput += turn.board[1][0] + "  " + turn.board[1][1] + "  " + turn.board[1][2] + "  " + turn.board[1][3] + "\n";
                rowOutput += turn.board[2][0] + "  " + turn.board[2][1] + "  " + turn.board[2][2] + "  " + turn.board[2][3] + "\n";
                rowOutput += turn.board[3][0] + "  " + turn.board[3][1] + "  " + turn.board[3][2] + "  " + turn.board[3][3] + "\n";

            }
        }
    };



    //object
    var tileFactory = {
        animateDuration: 0.15,
        nextTileId: 0,
        allTiles: [],
        movesThisTurn: 0,
        timeline: new TimelineLite().addLabel("start", 0),
        movingTiles: 0,
        somethingHasMoved: function () {
            var retval = false;
            var tileCount = this.allTiles.length;
            for (var i = 0; i < tileCount; i += 1) {
                if (this.allTiles[i].needsToMove) {
                    retval = true;
                }
            }
            return retval;
        },
        reset: function () {
            $(".Tile").remove();
            this.allTiles = [];
        },
        createNewTile: function (space, value) {
            var aNewTile = new Tile2048();
            aNewTile.id = "t" + (this.nextTileId += 1);
            aNewTile.factory = this;

            if (value === undefined) {
                if (Math.round(2 * Math.random() + 1) == 2) { // jshint ignore:line
                    aNewTile.value = 4;
                }
                else {
                    aNewTile.value = 2;
                }
            }
            else {
                aNewTile.value = value;
            }

            if (space instanceof GameSpace) {
                aNewTile.space = space;
                space.tile = aNewTile;
            }
            else {

                throw "TileFactory : createNewTile : Invalid argument : space must be of type GameSpace : space = " + space;
            }

            if (isNaN(value) && (value != null)) {
                var values = aNewTile._values;
                var index = values.indexOf(value);
                if (index != -1) { // jshint ignore:line
                    aNewTile.size = values.indexOf(value);
                }
                else {
                    throw("Tile Factory : createNewTile : Invalid Argument: value =" + value);
                }
            }

            aNewTile.render();
            this.allTiles.push(aNewTile);

            return aNewTile;
        },
        getActiveTileCount: function () {
            return this.allTiles.length;
        },
        commit: function () {
            var factory = this;
            this.timeline = new TimelineLite();
            this.allTiles.forEach(function (thisTile) {
                if (thisTile.needsToDie) {
                    thisTile.die();
                }
                if (thisTile.needsToGrow) {
                    thisTile.grow();
                    thisTile.needsToGrow = false;
                }
                if (thisTile.needsToMove) {
                    thisTile.move();
                }

                factory.timeline.add(thisTile.timeline, "start");
            });
            this.timeline.eventCallback("onComplete", this.fixAllTiles, null, this);
        },
        fixAllTiles: function () {
            this.allTiles.forEach(function (thisTile) {
                thisTile.fixTile();
            });
        },
        tickOneOff: function () {
            if ((tileFactory.movingTiles -= 1) < 1) {
                //gameBoard.onAnimationComplete();
                gameBoard.finishedMovingTiles();
            }
        }
    };


    //object
    function Tile2048() {
        var _colors = ["white", "white", "black", "white", "black", "white", "white", "black", "black", "white", "black", "white", "white"];
        var _bgColors = ["DarkViolet", "DeepSkyBlue", "Orange", "Indigo", "LimeGreen", "OrangeRed", "DarkBlue", "Lime", "Gold", "RoyalBlue", "Yellow", "Red", "Black"];
        var _space = null;
        var _hasMerged = false;
        var _size = 0;
        this.type = "Tile";
        this.factory = tileFactory;
        this._values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384];
        this.needsToGrow = false;
        this.needsToDie = false;
        this.needsToMove = false;
        this.displayValue = 0;
        this.timeline = new TimelineLite();
        this.timeline.addLabel("start", 0);
        this.height = gameBoard.tileSize;
        this.width = gameBoard.tileSize;
        this.showValue = true;
        this.showId = false;
        Object.defineProperty(this, "size", {
            get: function () {

                return _size;
            },
            set: function (val) {

                if (val) {
                    _size = val;
                }
            }
        });
        Object.defineProperty(this, "space", {
            get: function () {
                return _space;
            },
            set: function (newSpace) {
                if (newSpace instanceof GameSpace) {
                    if (this.space && this.space.id == newSpace.id) { // jshint ignore:line
                        return;
                    }
                    if (this.space) {
                        this.space.clear();
                    }
                    if (newSpace.tile != null) {
                        newSpace.tile.needsToDie = true;
                        this.hasMerged = true;
                        this.needsToGrow = true;
                    }
                    _space = newSpace;
                    _space.tile = this;
                    //this.factory.somethingHasMoved = true;
                    this.needsToMove = true;
                }
                else if (newSpace == null) {
                    console.trace();
                    throw("Tile2048.space:invalid argument. Argument is undefined");
                }
                else {
                    console.trace();
                    throw("Tile2048.space:invalid argument.");
                }
                return this;
            }
        });
        Object.defineProperty(this, "bgColor", {
            get: function () {
                return _bgColors[this.size];
            }
        });
        Object.defineProperty(this, "color", {
            get: function () {
                return _colors[this.size];
            }
        });
        Object.defineProperty(this, "value", {
            get: function () {
                return this._values[this.size];
            },
            set: function (val) {
                this.size = this._values.indexOf(val);
            }
        });
        Object.defineProperty(this, "hasMerged", {
            get: function () {
                return _hasMerged;
            },
            set: function (val) {
                _hasMerged = val;
            }
        });
    }
    Tile2048.prototype = new GameObject();
    Tile2048.prototype.constructor = Tile2048;
    Tile2048.prototype.grow = function () {
        this.size = this.size + 1;
        scoreBoard.score(this.value);
        //change the color on the element.
        this.timeline.to(this.element(),
            this.factory.animateDuration,
            {
                color: $c.name2hex(this.color),
                backgroundColor: $c.name2hex(this.bgColor)
            },
            "start");
        //tween the logical value of the tile.
        this.timeline.to(this,
            this.factory.animateDuration,
            {
                displayValue: this.value,
                onComplete: function() {
                    if(gameBoard.won == false) {
                        gameBoard.won == true;
                        applauseSound.play();
                    }
                    if ((noMatchIsPlaying))
                        if (this.size > 10) {
                            bigMatchSound.play();
                        }
                        else {
                            smallMatchSound.play();
                        }
                    noMatchIsPlaying = false;
                    },
                onUpdate: this.updateTile,
                callbackScope: this
            },
            "start");
    };
    Tile2048.prototype.updateTile = function () {
        var selector = $("#" + this.id + " > .value");
        selector.text(Math.round(this.displayValue));
    };
    Tile2048.prototype.html = function () {
        var boilerplate = "<div id='" + this.id + "' class='tile' " +
            " style='top:" + this.space.position().top + "; left:" + this.space.position().left + ";" +
            " font-size:" + scale(150) + "%; " +
            " color:" + this.color + "; " +
            " background-color:" + this.bgColor + ";" +
            " height:" + this.space.width + "px;" +
            " width:" + this.space.width + "px;" +
            " border-width:" + ( this.space.width / 15 ) + "px;" +
            " border-radius:" + ( this.space.width / 15 ) + "px; " +
            " '>";
        var value = "<p class='value'>" + this.value + "</p>";
        var id = "<p class='id'>" + this.id + "</p>";
        var close = "</div>";
        var retval = boilerplate;
        if (this.showValue) {
            retval += value;
        }
        if (this.showId) {
            retval += id;
        }
        retval += close;
        return retval;
    };
    Tile2048.prototype.render = function () {
        $(gameBoard.element()).append(this.html());
        this.fadeIn();
    };
    Tile2048.prototype.fixTile = function () {
        this.timeline = new TimelineLite();
        this.needsToGrow = false;
        this.hasMerged = false;
    };
    Tile2048.prototype.move = function () {
        var element = this.element();
        var duration = this.factory.animateDuration;
        var sp = this.space.position();
        sp.onComplete = tileFactory.tickOneOff;
        tileFactory.movingTiles += 1;
        new TweenLite.to(element, duration, sp);
        // this.timeline.to(element, duration, sp);
        this.needsToMove = false;
    };
    Tile2048.prototype.fadeIn = function () {
        // this.timeline.from(this.element(), this.factory.animateDuration, {
        //     autoAlpha: 0,
        //     onComplete: function() { this.timeline = new TimelineLite(); },
        //     callbackScope: this
        // });
        gameBoard.timeline.add(this.timeline,"+0.25");
    };
    Tile2048.prototype.die = function () {
        this.timeline.to(this.element(),
            this.factory.animateDuration,
            {
                autoAlpha: 0,
                onComplete: this.remove,
                callbackScope: this
            },
            "start");
    };
    Tile2048.prototype.remove = function () {
        this.element().remove();
        var tiles = this.factory.allTiles;
        tiles.splice(tiles.indexOf(this), 1);
    };

    var noSlideIsPlaying = true;
    var noMatchIsPlaying = true;
    var slide1Sound = document.getElementById("slide1");
    var slide2Sound = document.getElementById("slide2");
    var slide3Sound = document.getElementById("slide3");
    var slide4Sound = document.getElementById("slide4");
    var smallMatchSound = document.getElementById("smallMatch");
    var bigMatchSound = document.getElementById("bigMatch");
    var gameOverSound = document.getElementById("gameOver");
    var applauseSound = document.getElementById("applause");

    var controls = {
        id: "controls",
        html: function () {
            var style = "style='width:" + ( gameBoard.element().outerWidth() / 2 ) + "px; " +
                " height:" + gameBoard.tileSize + "px; " +
                " font-size: " + scale(100) + "%;'";
            var html = "   <div id='controls' style:'width:" + Math.floor(gameBoard.totalWidth()) + "px;' > " +
                "           <button id='btnUndo' class='btn' " + style + ">Undo (" + gameBoard.mulligans + ")</button> " +
                "           <button id='btnRestart' class='btn' " + style + ">New Game</button> " +
                "   </div>";
            return html;
        },
        render: function () {
            $("#container").append(this.html());
            $("#btnUndo").click(controls.undo);
            this.enableUndo();
            $("#btnRestart").click(controls.restart);
        },
        undo: function (eventArgs) {
            gameBoard.undo();
        },
        updateMulligans: function () {

            $("#btnUndo").text("Undo (" + parseInt(gameBoard.mulligans, 10) + ")");
        },
        restart: function () {
            gameBoard.startGame();
        },
        disableUndo: function () {
            gameBoard.listeningForUndo = false;
        },
        enableUndo: function() {
            gameBoard.listeningForUndo = true;
        }
    };


    var gameBoard = new GameBoard("gameBoard");
    gameBoard.boardSize = 4;
    gameBoard.tileSize = 75;
    setScale();
    gameBoard.setup();
    var scoreBoard = new ScoreBoard("scoreBoard");
    $("<div id='container' class='container' style='width:" + (gameBoard.totalWidth() + 2)  + "px;'></div>").appendTo("body");
    scoreBoard.render();
    gameBoard.render();
    controls.render();
    gameBoard.startGame();
});