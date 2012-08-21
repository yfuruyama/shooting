(function() {

  /*==============================================*/
  /* 本ゲームでは以下の素材を使わせて頂いています */
  /*==============================================*/

  // 自機の素材: http://game.yu-nagi.com/htm/senntouki1.htm
  // 背景の素材: http://divnil.com/iphone/img/app/i/p/iphone-4-wallpaper-186_20100808191654_76b4e9308a08677c8a37d07a72419f0d_raw.jpg
  // 敵機の素材: http://game.yu-nagi.com/game/sennkann/sennkann2_p4a.png
  // 弾の素材: http://dvdm.blog134.fc2.com/blog-entry-57.html
  // ライフの素材: http://masasoft.org/index.cgi?page=Material
  // 爆発の素材: http://rmake.jp/published_items/19116
  
  var system,
      imagePath = {
        plane: "img/plane.png",         // 自機
        bg: "img/bg.png",               // 背景
        enemy: "img/enemy.png",         // 敵機
        bullet: "img/bullet.png",       // 弾
        life: "img/life.png",           // ライフ
        explosion: "img/explosion.png"  // 爆発
      },
      resourceArr = [],
      ALL_FRAME = 50;

  function initialize() {
    system = new arc.System(320, 416, "canvas"),
    system.setGameClass(GameMain);

    for (var prop in imagePath) {
      resourceArr.push(imagePath[prop]);
    }
    // 画像のロード
    // ロードが完了するとゲームのランループが回り始める
    system.load(resourceArr);
  }

  // ゲームのメインクラス
  var GameMain = arc.Class.create(arc.Game, {

    initialize: function(params) {

      this._enemyArr = [];
      this._bulletArr = [];
      this._lifeArr = [];
      this._explosionArr = [];
      this._plane = null;
      this._score = null;
      this._isPlaying = false;
      this._moveScale = 1.5;
      this._prevTouchPosX = 0.0;
      this._prevTouchPosY = 0.0;
      this._frameCounter = 0;

      // 背景設定
      var _bg = new arc.display.Sprite(system.getImage(imagePath.bg));
      _bg.setX(0);
      _bg.setY(0);
      _bg.addEventListener(arc.Event.TOUCH_START, arc.util.bind(this._onTouchStartScreen, this)); 
      _bg.addEventListener(arc.Event.TOUCH_MOVE, arc.util.bind(this._onTouchMoveScreen, this)); 
      this.addChild(_bg);

      // 自機生成
      this._plane = new Plane(system.getImage(imagePath.plane));
      this.addChild(this._plane);

      this._plane.addEventListener(arc.Event.TOUCH_START, arc.util.bind(this._onTouchStartScreen, this)); 
      this._plane.addEventListener(arc.Event.TOUCH_MOVE, arc.util.bind(this._onTouchMoveScreen, this)); 

      // ライフを3つ生成
      for (var i = 0; i < 3; i++) {
        var life = new Life(system.getImage(imagePath.life));
        life.setX(260 + i * 20);
        life.setY(30);
        this.addChild(life);
        this._lifeArr.push(life);
      }

      // 得点表示
      this._score = new Score();
      this.addChild(this._score);

      // 実測FPS表示
      this._fpsField = new FPS();
      this.addChild(this._fpsField);

      // スタートカバー表示
      this._cover = new StartCover();
      this._cover.addEventListener(arc.Event.TOUCH_END, arc.util.bind(this._onTouchStartCover, this));
      this.addChild(this._cover);
    },


    update: function() {
      if (!this._isPlaying) {
        return;
      }

      this._frameCounter++;

      // 10, 20, 30フレームに1度弾を生成
      if (this._frameCounter == 10 || this._frameCounter == 20 || this._frameCounter == 30) {
        var bullet = new Bullet(system.getImage(imagePath.bullet));
        bullet.setX(this._plane.getX());
        bullet.setY(this._plane.getY() - 30);

        this.addChild(bullet);
        this._bulletArr.push(bullet);
      }

      // ALL_FRAMEフレームに1度敵を生成
      if (this._frameCounter >= ALL_FRAME) {

        var enemy = new Enemy(system.getImage(imagePath.enemy));
        this.addChild(enemy);
        this._enemyArr.push(enemy);

        this._frameCounter = 0;
      }

      // 敵機の位置を更新
      for (var i = 0; i < this._enemyArr.length; i++) {
        var enemy = this._enemyArr[i];
        enemy.updatePosition();
        if (!enemy.onScreen()) {
          this._enemyArr.splice(i, 1);
          this.removeChild(enemy);
        }
      }

      // 弾の位置を更新
      for (var i = 0; i < this._bulletArr.length; i++) {
        var bullet = this._bulletArr[i];
        bullet.updatePosition();
        if (!bullet.onScreen()) {
          this._bulletArr.splice(i, 1);
          this.removeChild(bullet);
        }
      }

      // 弾と敵機の衝突判定
      for (var i = 0; i < this._enemyArr.length; i++) {
        var enemy = this._enemyArr[i];
        for (var j = 0; j < this._bulletArr.length; j++) {
          var bullet = this._bulletArr[j];

          if (this._detectCollision(bullet, enemy)) {
            console.log("Collision between Bullet and Enemy");

            // 得点アップ
            this._score.incrementScore();

            // 爆発の画像を表示
            var explosion = new Explosion(system.getImage(imagePath.explosion));
            explosion.setX(enemy.getX());
            explosion.setY(enemy.getY());

            this.addChild(explosion);
            this._explosionArr.push(explosion);

            // 弾の削除
            this.removeChild(bullet);
            this._bulletArr.splice(j, 1);

            // 敵機の削除
            this.removeChild(enemy);
            this._enemyArr.splice(i, 1);

            break;
          }
        }
      }

      // 自機と敵機の衝突判定
      for (var i = 0; i < this._enemyArr.length; i++) {
        var enemy = this._enemyArr[i];
        if (this._detectCollision(enemy, this._plane)) {
          console.log("Collision between Plane and Enemy");

          // console.log("Plane x: " + this._plane.getX() + " y: " + this._plane.getY());
          // console.log("Enemy x: " + enemy.getX() + " y: " + enemy.getY());
          
          // ライフの削除
          this.removeChild(this._lifeArr.shift());

          // 敵機の削除
          this.removeChild(enemy);
          this._enemyArr.splice(i, 1);

          // 残りライフ0
          if (this._lifeArr.length == 0) {
            this._gameOverCover = new GameOverCover();
            this._gameOverCover.addEventListener(arc.Event.TOUCH_END, arc.util.bind(this._onTouchGameOverCover, this));
            this.addChild(this._gameOverCover);
            this._stopGame();
          }
          break;
        }
      }

      // 爆発の制御
      for (var i = 0; i < this._explosionArr.length; i++) {
        var explosion = this._explosionArr[i];
        explosion.setAlpha((explosion._lifespan--) / 10);
        if (explosion._lifespan <= 0) {
          // 爆発を削除
          this._explosionArr.splice(i, 1);
          this.removeChild(explosion);
        }
      }

      // fpsの更新
      this._fpsField.update();
    },

    // 衝突判定関数
    _detectCollision: function(obj1, obj2) {
      var obj1X = obj1.getX(),
          obj1Y = obj1.getY(),
          obj1W = obj1.getWidth(),
          obj1H = obj1.getHeight(),
          obj2X = obj2.getX(),
          obj2Y = obj2.getY(),
          obj2W = obj2.getWidth(),
          obj2H = obj2.getHeight();

      if ((obj1X <= obj2X + obj2W) &&
          (obj2X <= obj1X + obj1W) &&
          (obj1Y <= obj2Y + obj2H) &&
          (obj2Y <= obj1Y + obj1H)) {
        return true;
      } else {
        return false;
      }
    },


    _startGame: function(e) {
      this._isPlaying = true;
    },

    _stopGame: function(e) {
      this._isPlaying = false;
    },

    /*==================*/
    /* イベントハンドラ */
    /*==================*/

    // 画面にタッチ
    _onTouchStartScreen: function(e) {
        // console.log("TOUCH_START x: " + e.x + " y: " + e.y);
        this._prevTouchPosX = e.x;
        this._prevTouchPosY = e.y;
    },

    // 画面でスワイプ
    _onTouchMoveScreen: function(e) {
        // console.log("TOUCH_MOVE x: " + e.x + " y: " + e.y);

        // 指の移動よりthis._moveScale倍多く移動させる
        var deltaX = (e.x - this._prevTouchPosX) * this._moveScale;
        var deltaY = (e.y - this._prevTouchPosY) * this._moveScale;
        //console.log("deltaX: " + deltaX + " deltaY: " + deltaY);

        // planeの位置を更新
        var newX = this._plane.getX() + deltaX;
        if (newX > 320) { newX = 320; }
        else if (newX < 0) { newX = 0; }

        var newY = this._plane.getY() + deltaY;
        if (newY > 416) { newY = 416; }
        else if (newY < 0) { newY = 0; }

        this._plane.setX(newX);
        this._plane.setY(newY);

        this._prevTouchPosX = e.x;
        this._prevTouchPosY = e.y;
    },

    // StartCoverのタッチハンドラ
    _onTouchStartCover: function(e) {
      this.removeChild(this._cover);
      this._startGame();
    },

    // GameOverCoverのタッチハンドラ
    _onTouchGameOverCover: function(e) {
    },

  });

  // 自機
  var Plane = arc.Class.create(arc.display.Sprite, {
    initialize: function() {
      this.setX(system.getWidth() / 2);
      this.setY(300);
      this.setAlign(arc.display.Align.CENTER);
    }
  });

  // 敵機
  var Enemy = arc.Class.create(arc.display.Sprite, {
    initialize: function() {
      // var randScale = 1.0 + Math.random();
      var randScale = 1.0;
      this.setX(Math.random() * 320);
      this.setY(-30);
      this.setAlign(arc.display.Align.CENTER);

      // ランダムに敵機のスケールを設定
      this.setScaleX(randScale);
      this.setScaleY(randScale);
    },
    
    updatePosition: function() {
      this.setY(this.getY() + 2.0);
    },

    onScreen: function() {
      return this.getY() <=  416 ? true : false;
    }
  });

  // 弾
  var Bullet = arc.Class.create(arc.display.Sprite, {
    initialize: function() {
      this.setAlign(arc.display.Align.CENTER);
    },

    updatePosition: function() {
      this.setY(this.getY() - 2.0);
    },

    onScreen: function() {
      return this.getY() >=  0 ? true : false;
    }
  });

  // 爆発
  var Explosion = arc.Class.create(arc.display.Sprite, {
    initialize: function(params) {
      this._lifespan = 10;
      this.setAlign(arc.display.Align.CENTER);
    }
  });

  var Life = arc.Class.create(arc.display.Sprite, {
    initialize: function() {
      this.setX(0);
      this.setY(0);
    }
  });

  // スコア
  // 敵を倒すと1増える
  var Score = arc.Class.create(arc.display.TextField, {
    initialize: function() {
      this._score = 0;

      this.setX(180);
      this.setY(10);
      this.setAlign(arc.display.Align.LEFT);
      this.setColor(0xFFFFFF);
      this.setFont("Helvetica", 20, true);
      this.setText("SCORE: " + this._score + " pt");
    },

    getScore: function() {
      return this._score;
    },

    setScore: function(newScore) {
      this._score = newScore;
      this.setText("SCORE: " + newScore + " pt");
    },

    incrementScore: function() {
      var current = this.getScore();
      this.setScore(current + 1);
    }
  });

  // FPS
  var FPS = arc.Class.create(arc.display.TextField, {
    initialize: function() {
      this.setX(0);
      this.setY(10);
      this.setAlign(arc.display.Align.LEFT);
      this.setColor(0xFFFFFF);
      this.setFont("Helvetica", 20, true);
      this.setText(system.getFps().toFixed(2) + "fps");
    },

    update: function() {
      this.setText(system.getFps().toFixed(2) + "fps");
    }
  });

  // STARTカバー
  var StartCover = arc.Class.create(arc.display.DisplayObjectContainer, {
    initialize:function(){
      //黒背景
      this._bg = new arc.display.Shape();
      this._bg.beginFill(0x000000, 0.7);
      this._bg.drawRect(0, 0, system.getWidth(), system.getHeight());
      this._bg.endFill();

      //スタート表示のテキスト
      this._txt = new arc.display.TextField();
      this._txt.setAlign(arc.display.Align.CENTER);
      this._txt.setFont("Helvetica", 30, true);
      this._txt.setText("タッチでSTART");
      this._txt.setX(system.getWidth() / 2);
      this._txt.setY(system.getHeight() / 2);
      this._txt.setColor(0xffffff);

      this.addChild(this._bg);
      this.addChild(this._txt);
    }
  });

  // GAME OVERカバー
  var GameOverCover = arc.Class.create(arc.display.DisplayObjectContainer, {
    initialize:function(){
      //黒背景
      this._bg = new arc.display.Shape();
      this._bg.beginFill(0x000000, 0.7);
      this._bg.drawRect(0, 0, system.getWidth(), system.getHeight());
      this._bg.endFill();

      //ゲームオーバー時のテキスト
      this._txt = new arc.display.TextField();
      this._txt.setAlign(arc.display.Align.CENTER);
      this._txt.setFont("Helvetica", 30, true);
      this._txt.setText("GAME OVER");
      this._txt.setX(system.getWidth() / 2);
      this._txt.setY(system.getHeight() / 2);
      this._txt.setColor(0xffffff);

      this.addChild(this._bg);
      this.addChild(this._txt);
    }
  });

  window.addEventListener("DOMContentLoaded", function(e) {
    initialize();
  }, false);

})();
