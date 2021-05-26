class Enemy extends Sprite{
	constructor(divName, assetDesc, player, sequence) {
        super(divName, new Point(0,0), assetDesc.fileName, new Size(assetDesc.width, assetDesc.height));
        this.state = GameSettings.enemyState.ready;
        this.waypointList = [];
        this.targetWayPointNumber = 0;
        this.targetWayPoint = new Waypoint(0,0,0,0);
        this.lastWayPointIndex = 0;
        this.player = player;
        this.score = sequence.score;
        this.lives = sequence.lives;
        this.speed = sequence.speed;
        this.readInWaypoints(sequence.waypoints);
	}
	
	readInWaypoints(wpList) {
        this.waypointList = [];
        for (let i = 0; i < wpList.length; ++i) {
            let t_wp = wpList[i];
            let n_wp = new Waypoint(
                t_wp.x + this.anchorShift.x , 
                t_wp.y + this.anchorShift.y, 
                t_wp.dir_x, 
                t_wp.dir_y
                );
            this.waypointList.push(n_wp);
        }
	}
	
	update(dt) {
        switch(this.state) {
            case GameSettings.enemyState.movingToWaypoint:
                this.moveTowardPoint(dt);
				this.checkPlayerCollision();
            break;
        }
    }
	
	checkPlayerCollision(){
		if(this.containingBox.IntersectedBy(this.player.containingBox) == true){
			if(this.player.hit == false){
				this.player.hit = true;
				console.log('collision with player');
			}
		}
	}
	
	moveTowardPoint(dt) {
        let inc = dt * this.speed;
        this.incrementPosition(inc * this.targetWayPoint.dir_x, inc * this.targetWayPoint.dir_y);

        if(Math.abs(this.position.x - this.targetWayPoint.point.x) < Math.abs(inc) &&
        Math.abs(this.position.y - this.targetWayPoint.point.y) < Math.abs(inc)) {
            this.updatePosition( this.targetWayPoint.point.x,  this.targetWayPoint.point.y);
        }

        if(this.position.equalToPoint(this.targetWayPoint.point.x, this.targetWayPoint.point.y) == true) {
            if (this.targetWayPointNumber == this.lastWayPointIndex) {
                this.killMe();
				console.log('reached end');
            } else {
                this.setNextWayPoint();
            }
        }
    }
	
	setNextWayPoint() {
        this.targetWayPointNumber++;
        this.targetWayPoint = this.waypointList[this.targetWayPointNumber];
    }
	
	killMe() {
        this.state = GameSettings.enemyState.dead;
        this.removeFromBoard();
    }
	
	setMoving() {
        this.targetWayPointNumber = 0;
        this.targetWayPoint = this.waypointList[this.targetWayPointNumber];
        this.lastWayPointIndex = this.waypointList.length - 1;
        this.setPosition(this.targetWayPoint.point.x, this.targetWayPoint.point.y, false);
        this.addToBoard(false);
        this.targetWayPointNumber = 1;
        this.targetWayPoint = this.waypointList[this.targetWayPointNumber];
        this.state = GameSettings.enemyState.movingToWaypoint;
    }
}

class EnemyCollection {
	constructor(player, bullets, explosions) {
		this.listEnemies = [];
		this.lastAdded = 0;
		this.gameOver = false;
		this.sequenceIndex = 0;
		this.sequencesDone = false;
		this.count = 0;
		this.player = player;
		this.bullets = bullets;
		this.explosions = explosions;
    }

	reset(){
		this.killAll();
		this.listEnemies = [];
		this.lastAdded = 0;
		this.gameOver = false;
		this.sequenceIndex = 0;
		this.sequencesDone = false;
		this.count = 0;
	}

    killAll() {
        for (let i = 0; i < this.listEnemies.length; ++i) {
            this.listEnemies[i].killMe();
        }
    }
    
    update(dt) {
		this.lastAdded += dt;
		if (this.sequencesDone == false && 
            EnemySequences[this.sequenceIndex].delayBefore < this.lastAdded) {
			this.addEnemy();
		}

        for (let i = this.listEnemies.length - 1; i >= 0; --i) {
            if (this.listEnemies[i].state == GameSettings.enemyState.dead) {
            	this.listEnemies.splice(i, 1);
            } else if (this.listEnemies[i].state == GameSettings.enemyState.movingToWaypoint){
				let en = this.listEnemies[i];
				
				for (let b = 0; b < this.bullets.listBullets.length; ++b){
					let bu = this.bullets.listBullets[b];
					if (bu.dead == false && 
						bu.position.y > GameSettings.bulletTop && 
						en.containingBox.IntersectedBy(bu.containingBox) == true){
							bu.killMe();
							en.lives--;
							if (en.lives <= 0) {
								playSound('explosion');
                                this.player.incrementScore(en.score);
                                en.killMe();
                                let cp = en.getCenterPoint();
                                this.explosions.createExplosion( new Point(cp.x, cp.y));
                            }
					}
				}
				
                en.update(dt);
            }
        }

		this.checkGameOver();
    }
    
    checkGameOver() {
		if (this.listEnemies.length == 0 && this.sequencesDone == true) {
			this.gameOver = true;
            console.log('game over');   
		}
    }
    
    addEnemy() {
		// add a new enemy with the sequence data
		let seq = EnemySequences[this.sequenceIndex];
		let en_new = new Enemy('en_' + this.count, GameManager.assets[seq.image],
		this.player, seq );
		this.listEnemies.push(en_new);
		en_new.setMoving();
		this.count++;
		this.sequenceIndex++;
        this.lastAdded = 0;
        if (this.sequenceIndex == EnemySequences.length) {
			writeMessage('You Win the Game')
			this.sequencesDone = true;
            console.log('sequences done');
        }
	}
}

function addEnemySequence(delayBefore, image, score,
	lives, speed, number, delayBetween, waypoints){
		for(let i = 0; i < number; ++i){
			let delay = delayBetween;
			if(i == 0){
				delay = delayBefore;
			}
			EnemySequences.push({
				delayBefore: delay,
				image: image,
				waypoints: waypoints,
				score: score,
				lives: lives,
				speed: speed
			});
		}
}

//seconds, enemy type, points, health, speed, number of enemies, enemy gap, type of sequence
function setUpSequences() {
	//Chapter 1 set 1
  addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown1']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown2']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown7']);
	
	//Chapter 1 set 2
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown2']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown1']);
		
	//Chapter 1 set 3
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown1']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown2']);
		
	//Chapter 1 set 4
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown1']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown2']);
	
	//Chapter 1 set 5
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown2']);
	addEnemySequence(200, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightDown1']);
		
	//Chapter 2 set 1
	addEnemySequence(2000, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown1']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown3']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown5']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown7']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown6']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown4']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown2']);
		
	//Chapter 2 set 2
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown3']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown2']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown1']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown4']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown5']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown6']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown7']);
		
	//Chapter 2 set 3
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown1']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown3']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown5']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown7']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown6']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown4']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown2']);
	
	//Chapter 2 set 4
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown7']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown6']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown5']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown4']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown3']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown2']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown1']);
		
	//Chapter 2 set 5
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown1']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown3']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown5']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown7']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown6']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown4']);
	addEnemySequence(10, 'Enemies/enemy2', 100, 1, 400 / 1000, 
        2, 400, WayPoints['straightDown2']);
		
	//Chapter 3 set 1
	addEnemySequence(2000, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        10, 100, WayPoints['straightDown7']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        10, 100, WayPoints['straightDown6']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        10, 100, WayPoints['straightDown5']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        10, 100, WayPoints['straightDown4']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        10, 100, WayPoints['straightDown3']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        10, 100, WayPoints['straightDown2']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        10, 100, WayPoints['straightDown1']);
		
	//Chapter 3 set 2
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        20, 100, WayPoints['straightDown1']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        20, 100, WayPoints['straightDown2']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        20, 100, WayPoints['straightDown3']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        20, 100, WayPoints['straightDown4']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        20, 100, WayPoints['straightDown5']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        20, 100, WayPoints['straightDown6']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        20, 100, WayPoints['straightDown7']);
		
	//Chapter 3 set 3
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        30, 100, WayPoints['straightDown1']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        30, 100, WayPoints['straightDown3']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        30, 100, WayPoints['straightDown5']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        30, 100, WayPoints['straightDown7']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        30, 100, WayPoints['straightDown6']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        30, 100, WayPoints['straightDown4']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 600 / 1000, 
        30, 100, WayPoints['straightDown2']);
		
	//Chapter 3 set 4
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown1']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown3']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown5']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown7']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown6']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown4']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown2']);
	
	//Chapter 3 set 5
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown1']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown2']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown3']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown4']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown5']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown6']);
	addEnemySequence(5, 'Enemies/enemy3', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown7']);
	
	//Chapter 4 set 1
	addEnemySequence(2000, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown7']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown6']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown5']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown4']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown3']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown2']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown1']);
		
	//Chapter 4 set 2
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown1']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown2']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown3']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown4']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown5']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown6']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown7']);
		
	//Chapter 4 set 3
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown3']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown2']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown4']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown5']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown1']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown7']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown6']);
	
	//Chapter 4 set 4
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown3']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown2']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown4']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown5']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown1']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown7']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        5, 100, WayPoints['straightDown6']);
	
	//Chapter 4 set 5
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        10, 100, WayPoints['straightDown3']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        10, 100, WayPoints['straightDown2']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        10, 100, WayPoints['straightDown4']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        10, 100, WayPoints['straightDown5']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        10, 100, WayPoints['straightDown1']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        10, 100, WayPoints['straightDown7']);
	addEnemySequence(5, 'Enemies/enemy4', 100, 1, 800 / 1000, 
        10, 100, WayPoints['straightDown6']);
	
	//Chapter 5 set 1
	addEnemySequence(2000, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown7']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown6']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown5']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown4']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown3']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown2']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown1']);
		
	//Chapter 5 set 2
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown1']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown2']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown3']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown4']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown5']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown6']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown7']);
		
	//Chapter 5 set 3
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown3']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown2']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown4']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown5']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown1']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown7']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown6']);
	
	//Chapter 5 set 4
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown3']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown2']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown4']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown5']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown1']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown7']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        5, 100, WayPoints['straightDown6']);
	
	//Chapter 5 set 5
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        10, 100, WayPoints['straightDown3']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        10, 100, WayPoints['straightDown2']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        10, 100, WayPoints['straightDown4']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        10, 100, WayPoints['straightDown5']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        10, 100, WayPoints['straightDown1']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        10, 100, WayPoints['straightDown7']);
	addEnemySequence(5, 'Enemies/enemy5', 100, 1, 600 / 1000, 
        10, 100, WayPoints['straightDown6']);
	
	//Chapter 6 set 1
	addEnemySequence(2000, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft4']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft6']);
		
	//Chapter 6 set 2
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft4']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft6']);
		
	//Chapter 6 set 3
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft6']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft4']);
		
	//Chapter 6 set 4
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft6']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft4']);
		
	//Chapter 6 set 5
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft4']);
	addEnemySequence(400, 'Enemies/enemy6', 100, 1, 200 / 1000, 
        1, 100, WayPoints['toLeft6']);
		
	//Chapter 7 set 1
	addEnemySequence(2000, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft4']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft6']);
		
	//Chapter 7 set 2
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft4']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft6']);
		
	//Chapter 7 set 3
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft6']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft4']);
		
	//Chapter 7 set 4
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft6']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft4']);
		
	//Chapter 7 set 5
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft4']);
	addEnemySequence(400, 'Enemies/enemy7', 100, 1, 200 / 1000, 
        2, 400, WayPoints['toLeft6']);
		
	//Chapter 8 set 1
	addEnemySequence(2000, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft4']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft6']);
		
	//Chapter 8 set 2
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft4']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft6']);
		
	//Chapter 8 set 3
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft6']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft4']);
		
	//Chapter 8 set 4
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft6']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft4']);
		
	//Chapter 8 set 5
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft4']);
	addEnemySequence(400, 'Enemies/enemy8', 100, 1, 400 / 1000, 
        3, 400, WayPoints['toLeft6']);
	
	//Chapter 9 set 1
	addEnemySequence(2000, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft4']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft6']);
		
	//Chapter 9 set 2
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft4']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft6']);
		
	//Chapter 9 set 3
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft6']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft4']);
		
	//Chapter 9 set 4
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 100, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 100, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 100, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 100, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 100, WayPoints['toLeft6']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 100, WayPoints['toLeft4']);
		
	//Chapter 9 set 5
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft4']);
	addEnemySequence(400, 'Enemies/enemy9', 100, 1, 450 / 1000, 
        1, 400, WayPoints['toLeft6']);
		
	//Chapter 10 set 1
	addEnemySequence(2000, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft4']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft6']);
		
	//Chapter 10 set 2
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft4']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft6']);
		
	//Chapter 10 set 3
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft4']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft4']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft2']);
		
	//Chapter 10 set 4
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft6']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft4']);
	
	//Chapter 10 set 5
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft1']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft2']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft3']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft5']);
	addEnemySequence(400, 'Enemies/enemy10', 100, 1, 500 / 1000, 
        1, 400, WayPoints['toLeft6']);
	
	//Chapter 11 set 1
	addEnemySequence(2000, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp2']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp6']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp4']);
		
	//Chapter 11 set 2
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp6']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp4']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp2']);
		
	//Chapter 11 set 3
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp2']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp4']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp6']);
		
	//Chapter 11 set 4
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp6']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp4']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp2']);
		
	//Chapter 11 set 5
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp2']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp6']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy11', 100, 1, 200 / 1000, 
        1, 400, WayPoints['straightUp4']);
		
	//Chapter 12 set 1
	addEnemySequence(2000, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp6']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp4']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp2']);
		
	//Chapter 12 set 2
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp2']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp4']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp6']);
		
	//Chapter 12 set 3
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp6']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp4']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp2']);
		
	//Chapter 12 set 4
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp2']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp6']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp4']);
		
	//Chapter 12 set 5
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp2']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp4']);
	addEnemySequence(300, 'Enemies/enemy12', 100, 1, 200 / 1000, 
        2, 400, WayPoints['straightUp6']);
	
	//Chapter 13 set 1
	addEnemySequence(2000, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp6']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp4']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp2']);
		
	//Chapter 13 set 2
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp2']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp4']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp6']);
		
	//Chapter 13 set 3
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp6']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp4']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp2']);
		
	//Chapter 13 set 4
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp2']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp6']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp4']);
		
	//Chapter 13 set 5
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp2']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp4']);
	addEnemySequence(300, 'Enemies/enemy13', 100, 1, 400 / 1000, 
        3, 400, WayPoints['straightUp6']);
		
	//Chapter 14 set 1
	addEnemySequence(2000, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp6']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp4']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp2']);
		
	//Chapter 14 set 2
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp2']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp4']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp6']);
		
	//Chapter 14 set 3
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp6']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp4']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp2']);
		
	//Chapter 14 set 4
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp2']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp6']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp4']);
		
	//Chapter 14 set 5
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp2']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp4']);
	addEnemySequence(300, 'Enemies/enemy14', 100, 1, 400 / 1000, 
        1, 600, WayPoints['straightUp6']);
		
	//Chapter 15 set 1
	addEnemySequence(2000, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp6']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp4']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp2']);
		
	//Chapter 15 set 2
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp2']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp4']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp6']);
		
	//Chapter 15 set 3
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp6']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp4']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp2']);
		
	//Chapter 15 set 4
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp2']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp6']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp4']);
		
	//Chapter 15 set 5
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp7']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp5']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp3']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp1']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp2']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp4']);
	addEnemySequence(300, 'Enemies/enemy15', 100, 1, 450 / 1000, 
        1, 600, WayPoints['straightUp6']);
		
	//Chapter 16 set 1
	addEnemySequence(2000, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown1']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown2']);
	
	//Chapter 16 set 2
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown2']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown1']);
		
	//Chapter 16 set 3
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown1']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown2']);
		
	//Chapter 16 set 4
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown1']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown2']);
	
	//Chapter 16 set 5
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown2']);
	addEnemySequence(200, 'Enemies/enemy16', 100, 1, 500 / 1000, 
        1, 200, WayPoints['straightDown1']);
		
	//Chapter 17 set 1
	addEnemySequence(2000, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown1']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown4'])
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown2']);
	
	//Chapter 17 set 2
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown2']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown1']);
		
	//Chapter 17 set 3
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown1']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown2']);
		
	//Chapter 17 set 4
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown1']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown2']);
	
	//Chapter 17 set 5
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown2']);
	addEnemySequence(200, 'Enemies/enemy17', 100, 1, 600 / 1000, 
        2, 200, WayPoints['straightDown1']);
		
	//Chapter 18 set 1
	addEnemySequence(2000, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown1']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown4'])
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown2']);
	
	//Chapter 18 set 2
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown2']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown1']);
		
	//Chapter 18 set 3
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown1']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown2']);
		
	//Chapter 18 set 4
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown1']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown2']);
	
	//Chapter 18 set 5
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown2']);
	addEnemySequence(200, 'Enemies/enemy18', 100, 1, 800 / 1000, 
        1, 200, WayPoints['straightDown1']);
		
	//Chapter 19 set 1
	addEnemySequence(2000, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown1']);
	addEnemySequence(200, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown4'])
	addEnemySequence(200, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown2']);
	
	//Chapter 19 set 2
	addEnemySequence(200, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown2']);
	addEnemySequence(200, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown1']);
		
	//Chapter 19 set 3
	addEnemySequence(200, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown1']);
	addEnemySequence(200, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy19', 100, 1, 2000 / 1000, 
        10, 100, WayPoints['straightDown2']);
		
	//Chapter 20 set 1
  addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown1']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown2']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown7']);
	
	//Chapter 20 set 2
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown2']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown1']);
		
	//Chapter 20 set 3
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown1']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown2']);
		
	//Chapter 20 set 4
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown1']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown2']);
	
	//Chapter 20 set 5
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown7']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown6']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown5']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown4']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown3']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown2']);
	addEnemySequence(200, 'Enemies/enemy20', 100, 1, 1500 / 1000, 
        1, 400, WayPoints['straightDown1']);
		
	//Delay the Win Screen
	addEnemySequence(2000, 'Enemies/enemy1', 100, 1, 200 / 1000, 
        1, 400, WayPoints['delay']);
	console.log(EnemySequences);
}