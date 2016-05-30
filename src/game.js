var sprites = {
  frog:     { sx: 0, sy: 0, w: 48, h: 48, frames: 1 },
  bg:       { sx: 433, sy: 0, w: 320, h: 480, frames: 1 },
  car1:     { sx: 143, sy: 0, w: 48, h: 48, frames: 1 },
  car2:     { sx: 191, sy: 0, w: 48, h: 48, frames: 1 },  
  car3:     { sx: 239, sy: 0, w: 96, h: 48, frames: 1 },
  car4:     { sx: 335, sy: 0, w: 48, h: 48, frames: 1 },
  car5:     { sx: 383, sy: 0, w: 48, h: 48, frames: 1 },
  trunk:    { sx: 288, sy: 383, w: 140, h: 48, frames: 1 },
  death:    { sx: 0, sy: 143, w: 48, h: 48, frames: 4 },
  water:    { sx: 0, sy: 0, w: 320, h: 144, frames: 1 },
  life:     { sx: 143, sy: 40, w: 40, h: 40, frames: 1 },
  home:     { sx: 0, sy: 0, w: 320, h: 48, frames: 1 },
  bigTitle: { sx: 0, sy: 433, w: 240, h: 48, frames: 1 }
};

var obstacles = { //ESTOS SON LOS BLUEPRINT
  carA:   { sprite: 'car1',   P: 2, V: 75 },
  carB:   { sprite: 'car2',   P: 5, V: 100 },
  carC:   { sprite: 'car4',   P: 4, V: 80 },
  carD:   { sprite: 'car5',   P: -3, V: 120 },
  track:  { sprite: 'car3',   P: 2, V: 70 },
  trunk:  { sprite: 'trunk',  P: 7, V: 85 }
};

var spawn = [
 // Start,   End,     Gap,  Type,   Override
  [ 0,      50000,   2700, 'carA',  { } ],
  [ 0,      50000,   2700, 'carB',  { } ],
  [ 2000,   50000,   2700, 'carC',  { } ],
  [ 0,      50000,   2700, 'carD',  { } ],
  [ 0,      50000,   2700, 'trunk', { } ],
  [ 0,      50000,   2700, 'trunk', { P: -8, V: 120 } ],
  [ 0,      50000,   2700, 'trunk', { P: 9, V: 90 } ]
];

var lifesRemaining = 3;
var gamePoints = 0;

var OBJECT_FROG = 1,
    OBJECT_CAR = 2,
    OBJECT_TRUNK = 4,
    OBJECT_WATER = 16;

var startGame = function() {
  var stageBoard = new GameBoard();
  stageBoard.add(new BackGround());
  Game.setBoard(0, stageBoard);
  Game.setBoard(1, new BigTitle());
  Game.setBoard(2, new TitleScreen("",
                                  "Go Up +10 / Win +100",
                                  "Press space to start playing",
                                  playGame));
};

var playGame = function() {
  var stateBoard = new GameBoard();
  stateBoard.add(new Lifes());
  stateBoard.add(new GamePoints());

  //Esto evita que si ganas la partida se recarguen las vidas.
  if (lifesRemaining <= 0) {
    lifesRemaining = 3;
    gamePoints = 0;
  }

  var principalBoard = new GameBoard();

  principalBoard.add(new TheFrog());
  principalBoard.add(new Water());
  principalBoard.add(new Home());
  principalBoard.add(new Spawner(spawn));

  Game.setBoard(1, stateBoard);
  Game.setBoard(2, principalBoard);

  //Dibuja el tiempo de juego
  Game.setBoard(3, new DrawTime());
};

var winGame = function() {
  Game.setBoard(2, new TitleScreen("You win!",
                                  "Actual Score: "  + gamePoints + " points",
                                  "Press space bar to play the next level",
                                  playGame));
};

var loseGame = function() {
  Game.setBoard(2, new TitleScreen("You lose!",
                                  "Best Score: "  + gamePoints + " points",
                                  "Press space bar to play again",
                                  playGame));
};

var BackGround = function() {
  this.setup('bg', { x: 0, y: 0 });

  this.step = function(dt) { };
};

BackGround.prototype = new Sprite();

var TheFrog = function() {
  this.setup('frog', { vx: 0, reloadTime: 0.19 });
  this.x = Game.width/2 - this.w/2;
  this.y = Game.height -  this.h;
  this.reload = this.reloadTime;

  this.step = function(dt) {
    this.reload -= dt;
    if (this.reload <= 0) {
      if(Game.keys['left']) {
        this.x -= this.w;
        this.frame++;
      }

      else if(Game.keys['right']) {
        this.x += this.w;
        this.frame++;
      }

      else if(Game.keys['up']) {
        this.y -= this.h;
        this.frame++;
        gamePoints += 10;
      }

      else if(Game.keys['down']) {
        this.y += this.h;
        this.frame++;
        //gamePoints -= 10;
      }

      /*Controlamos que no se salga de la pantalla en ninguna dirección.
      También controlamos que si está en los límites, la rana cambie de frame.*/
      if (this.x < 0) {
        this.x = 0;
        this.frame--;
      }

      else if(this.x > Game.width - this.w) {
        this.x = Game.width - this.w;
        this.frame--;
      }

      if (this.y < 0) {
        this.y = 0;
        this.frame--;
      }

      else if(this.y > Game.height - this.h) {
        this.y = Game.height - this.h;
        this.frame--;
      }
  
      this.reload = this.reloadTime;
    }

    if(this.frame >= 3) {
      this.frame = 0;
    }
    
    this.collisionControl();
    this.gameTimeOut();

    //La rana se mueve constantemente. Pero recorre 0 mientras no esté encima de un tronco.
    if (this.x < 0)
      this.x -= 2*this.vx*dt;

    else if (this.x > Game.width - this.w)
        this.x = Game.width - this.w;

    
    this.x += this.vx*dt;
    this.vx = 0;
  };

  this.gameTimeOut = function() {
    if (Game.gameTime >= 60*15) {
      this.board.remove(this);
      this.board.add(new Death(this.x, this.y));
    }
  };

  //Es el controlador de colisiones de la rana. Comprueba todas las colisiones posibles.
  this.collisionControl = function() {
    this.trunkCollision();
    this.carCollision();
    this.waterCollision();
  };

  this.trunkCollision = function() {
    var collision = this.board.collide(this, OBJECT_TRUNK);
    if (collision) {
      if (collision.P > 0)
        this.onTrunk(-collision.V);

      else
        this.onTrunk(collision.V);
    }
  };

  this.waterCollision = function() {
    if (!this.board.collide(this, OBJECT_TRUNK)) {
      var collision = this.board.collide(this, OBJECT_WATER);

      if (collision) {
        this.board.remove(this);
        this.board.add(new Death(this.x, this.y));
      }
    }
  };

  this.carCollision = function() {
    var collision = this.board.collide(this, OBJECT_CAR);

    if (collision) {
      this.board.remove(this);
      this.board.add(new Death(this.x, this.y));
    }
  };

  //Modifica la velocidad de la rana a la del tronco.
  this.onTrunk = function(vTrunk) {
    this.vx = vTrunk;
  };
};

TheFrog.prototype = new Sprite();
TheFrog.prototype.type = OBJECT_FROG;

var Car = function(blueprint, override) {
  this.merge(this.baseParameters);
  this.setup(blueprint.sprite,blueprint);
  this.merge(override);

  if (this.P >= 0) {
    this.x = Game.width;
    this.y = Game.height - this.P*this.h;
  }

  else {
    this.x = -this.w;
    this.y = Game.height - (-this.P)*this.h;
  }
}

Car.prototype = new Sprite();
Car.prototype.type = OBJECT_CAR;

Car.prototype.baseParameters = {
   P: 0, V: 0,
   reloadTime: 0.75, reload: 0
};

Car.prototype.step = function(dt) {
  if (this.P >= 0) {
    this.x -= this.V*dt;
    if (this.x < -this.w) {
      this.board.remove(this);
    }
  }

  else {
    this.x += this.V*dt;
    if (this.x > Game.width) {
      this.board.remove(this);
    }
  }
};

var Trunk = function(blueprint, override) {
  this.merge(this.baseParameters);
  this.setup(blueprint.sprite,blueprint);
  this.merge(override);

  if (this.P >= 0) {
    this.x = Game.width;
    this.y = Game.height - this.P*this.h;
  }

  else {
    this.x = -this.w;
    this.y = Game.height - (-this.P)*this.h;
  }
};

Trunk.prototype = new Sprite();
Trunk.prototype.type = OBJECT_TRUNK;

Trunk.prototype.baseParameters = {
   P: 0, V: 0,
   reloadTime: 0.75, reload: 0
};

Trunk.prototype.step = function(dt) {
  if (this.P >= 0) {
    this.x -= this.V*dt;
    if (this.x < -this.w) {
      this.board.remove(this);
    }
  }

  else {
    this.x += this.V*dt;
    if (this.x > Game.width) {
      this.board.remove(this);
    }
  }
};

var Spawner = function(spawnData) {
  this.spawnData = [];
  for(var i=0; i<spawnData.length; i++) {
    this.spawnData.push(Object.create(spawnData[i]));
  }

  this.t=0;
};

Spawner.prototype.step = function(dt) {
  var remove = [];
  var curObstacle = null;
  var i=0;

  // Se actualiza el desplazamiento del tiempo actual
  this.t += dt * 1000;

  //   Start, End,  Gap, Type,   Override
  // [ 0,     4000, 500, 'carA', { x: 100 } ]
  while ((curObstacle = this.spawnData[i]) && (curObstacle[0] < this.t + 2000)) {
    // Comprobamos si hemos sobrepasado el tiempo final, de ser así eliminamos el objeto
    if (this.t > curObstacle[1]) {
      remove.push(curObstacle);
    }

    else if (curObstacle[0] < this.t) {
      // Obtenemos el blueprint del objeto actual.
      var obstacle = obstacles[curObstacle[3]];
      var override = curObstacle[4];

      // Añadimos al array el nuevo obstáculo, comprobamos si es un tronco o un coche.
      if (obstacle.sprite == "trunk")
        this.board.add(new Trunk(obstacle,override));

      else
        this.board.add(new Car(obstacle,override));

      // Incrementamos el tiempo de inicio más el de espacio(gap).
      curObstacle[0] += curObstacle[2];
    }

    i++;
  }

  // Eliminamos cualquier objeto del array que haya expirado.
  for(var idx=0,len=remove.length;idx<len;idx++) {
    var remIdx = this.spawnData.indexOf(remove[idx]);
    if(remIdx != -1) this.spawnData.splice(remIdx,1);
  }
};

Spawner.prototype.draw = function(ctx) { };

var Water =  function() {
  this.setup('water', { });
  this.x = 0;
  this.y = 48;

  this.draw = function() { };

  this.step = function(dt) { };
};

Water.prototype = new Sprite();
Water.prototype.type = OBJECT_WATER;

var Home =  function() {
  this.setup('home', { });
  this.x = 0;
  this.y = 0;

  this.draw = function() { };

  this.step = function(dt) {
    var collide = this.board.collide(this, OBJECT_FROG);
    if (collide) {
      gamePoints += 100;
      winGame();
    }
  };
};

Home.prototype = new Sprite();

var Death = function(x,y) {
  this.setup('death', { frame: 0, reloadTime: 0.25 });
  lifesRemaining--;
  this.reload = this.reloadTime;
  this.x = x;
  this.y = y;

  this.step = function(dt) {
    this.reload -= dt;
    if (this.reload <= 0) {
      this.frame++;
      this.reload = this.reloadTime;
    }

    if (this.frame > 4) {
      this.board.remove(this);
      if (lifesRemaining <= 0) {
        loseGame();
      }

      else {
        this.board.add(new TheFrog());
        Game.gameTime = 0;
      }
    }
  };
};

Death.prototype = new Sprite();

var Lifes = function() {
  this.setup('life', { });
  this.x = Game.width-60;
  this.y = -10;

  this.step = function(dt) { };

  this.draw = function(dt) {
    var nextLifePos = this.x;
    for (var i=0; i<lifesRemaining; i++) {
      SpriteSheet.draw(Game.ctx,'life',nextLifePos,this.y,0);
      nextLifePos+=20;
    }
  };
};

Lifes.prototype = new Sprite();

var BigTitle = function() {
  this.setup('bigTitle', { });
  this.x = Game.width/2 - this.w/2;
  this.y = Game.height/2 - 125;

  this.step = function(dt) { };
};

BigTitle.prototype = new Sprite();

var GamePoints = function() {
  var pointsLength = 8;

  this.draw = function(ctx) {
    ctx.save();
    ctx.font = "bold 18px arial";
    ctx.fillStyle= "#FFFFFF";

    var txt = "" + gamePoints;
    var i = pointsLength - txt.length, zeros = "";
    while(i-- > 0) { zeros += "0"; }

    ctx.fillText(zeros + txt,10,20);
    ctx.restore();
  };

  this.step = function(dt) { };
};

window.addEventListener("load", function() {
  Game.initialize("game",sprites,startGame);
});