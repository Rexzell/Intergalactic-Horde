const ImageFiles = [
    'playerShip',
	'Lasers/laser',
	'Enemies/enemy1',
    'Enemies/enemy2',
    'Enemies/enemy3',
    'Enemies/enemy4',
    'Enemies/enemy5',
    'Enemies/enemy6',
    'Enemies/enemy7',
    'Enemies/enemy8',
    'Enemies/enemy9',
    'Enemies/enemy10',
    'Enemies/enemy11',
    'Enemies/enemy12',
    'Enemies/enemy13',
    'Enemies/enemy14',
    'Enemies/enemy15',
    'Enemies/enemy16',
    'Enemies/enemy17',
    'Enemies/enemy18',
    'Enemies/enemy19',
    'Enemies/enemy20',
	'Explosion/explosion1',
    'Explosion/explosion2',
    'Explosion/explosion3',
    'Explosion/explosion4',
    'Explosion/explosion5',
    'Explosion/explosion6',
    'Explosion/explosion7',
    'Explosion/explosion8',
    'Explosion/explosion9'
];

const soundFiles = [
	'shoot',
	'explosion',
	'loselife',
	'gameover',
	'completed'
];

const soundPath = 'assets/Sounds/';

const WayPoints = {
	straightDown1: [{
        rotation: 0,
        x: 60,
        y: -10,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: 60,
        y: 620,
        dir_x: 0,
        dir_y: 1
    }
    ],
	
	straightDown2: [{
        rotation: 0,
        x: 170,
        y: -10,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: 170,
        y: 620,
        dir_x: 0,
        dir_y: 1
    }
    ],
	
	straightDown3: [{
        rotation: 0,
        x: 270,
        y: -10,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: 270,
        y: 620,
        dir_x: 0,
        dir_y: 1
    }
    ],
	
	straightDown4: [{
        rotation: 0,
        x: 380,
        y: -10,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: 380,
        y: 620,
        dir_x: 0,
        dir_y: 1
    }
    ],
	
	straightDown5: [{
        rotation: 0,
        x: 490,
        y: -10,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: 490,
        y: 620,
        dir_x: 0,
        dir_y: 1
    }
    ],
	
	straightDown6: [{
        rotation: 0,
        x: 600,
        y: -10,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: 600,
        y: 620,
        dir_x: 0,
        dir_y: 1
    }
    ],
	
	straightDown7: [{
        rotation: 0,
        x: 680,
        y: -10,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: 680,
        y: 620,
        dir_x: 0,
        dir_y: 1
    }
    ],
	
	straightUp1: [{
        rotation: 0,
        x: 60,
        y: 620,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: 60,
        y: -10,
        dir_x: 0,
        dir_y: -1
    }
    ],
	
	straightUp2: [{
        rotation: 0,
        x: 170,
        y: 620,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: 170,
        y: -10,
        dir_x: 0,
        dir_y: -1
    }
    ],
	
	straightUp3: [{
        rotation: 0,
        x: 270,
        y: 620,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: 270,
        y: -10,
        dir_x: 0,
        dir_y: -1
    }
    ],
	
	straightUp4: [{
        rotation: 0,
        x: 380,
        y: 620,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: 380,
        y: -10,
        dir_x: 0,
        dir_y: -1
    }
    ],
	
	straightUp5: [{
        rotation: 0,
        x: 490,
        y: 620,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: 490,
        y: -10,
        dir_x: 0,
        dir_y: -1
    }
    ],
	
	straightUp6: [{
        rotation: 0,
        x: 600,
        y: 620,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: 600,
        y: -10,
        dir_x: 0,
        dir_y: -1
    }
    ],
	
	straightUp7: [{
        rotation: 0,
        x: 680,
        y: 620,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: 680,
        y: -10,
        dir_x: 0,
        dir_y: -1
    }
    ],
	
	toLeft1: [{
        rotation: 0,
        x: 730,
        y: 80,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: -10,
        y: 80,
        dir_x: -1,
        dir_y: 0
    }
    ],
	
	toLeft2: [{
        rotation: 0,
        x: 730,
        y: 160,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: -10,
        y: 160,
        dir_x: -1,
        dir_y: 0
    }
    ],
	
	toLeft3: [{
        rotation: 0,
        x: 730,
        y: 250,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: -10,
        y: 250,
        dir_x: -1,
        dir_y: 0
    }
    ],
	
	toLeft4: [{
        rotation: 0,
        x: 730,
        y: 340,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: -10,
        y: 340,
        dir_x: -1,
        dir_y: 0
    }
    ],
	
	toLeft5: [{
        rotation: 0,
        x: 730,
        y: 430,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: -10,
        y: 430,
        dir_x: -1,
        dir_y: 0
    }
    ],
	
	toLeft6: [{
        rotation: 0,
        x: 730,
        y: 520,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: -10,
        y: 520,
        dir_x: -1,
        dir_y: 0
    }
    ],
	
	delay: [{
        rotation: 0,
        x: 680,
        y: -200,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: 900,
        y: -200,
        dir_x: 1,
        dir_y: 0
    }
    ],
	
    LEFTTORIGHTSHALLOW: [{
        rotation: 0,
        x: 60,
        y: -90,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: 60,
        y: 128,
        dir_x: 0,
        dir_y: 1
    },
    {
        rotation: 0,
        x: 810,
        y: 128,
        dir_x: 1,
        dir_y: 0
    }
    ],
	
    STREAMFROMB180: [{
        rotation: 0,
        x: 180,
        y: 620,
        dir_x: 0,
        dir_y: 0
    },
    {
        rotation: 0,
        x: 180,
        y: -90,
        dir_x: 0,
        dir_y: -1
    }
    ]
};

let EnemySequences = [];

const GameSettings = {
    keyPress: {
        left: 39,
        right: 37,
        up: 38,
        down: 40,
        space: 32,
		left2: 	68,
		right2: 65,
		up2: 87,
		down2: 83
    },
	targetFPS: 1000 / 60,
	
	bulletSpeed: 700 / 1000,
	bulletLife: 4000,
	bulletFireRate: 200,
	bulletTop: 10,
	
    playAreaWidth: 720,
    playAreaHeight: 576,
    playAreaDiv: '#playArea',
	
	playerFlashOpacity: '0.5',
	playerFlashTime: 300,
	playerFlashes: 8,

    playerDivName: 'playerSprite',
    playerStart: {
        x: 360,
        y: 440
    },
    playerStartLives: 5,
    playerState: {
        ok: 0,
        dead: 1,
        hitFlashing: 2
    },
    playerMoveStep: 8,
	enemyState: {
		ready: 1,
		dead: 0,
		movingToWaypoint: 2
	},
	pressSpaceDelay: 3000,
	gamePhase: {
		readyToplay: 1,
		countdownToStart: 2,
		playing: 3,
		gameOver: 4
	},
	countdownGap: 2500,
	countDownValues: ['Survive the Intergalactic Horde'],
	explosionTimeout: 1000
};

let GameManager = {
    assets : {},
    player: undefined,
	bullets: undefined,
	explosions: undefined,
	sounds: {},
	phase: GameSettings.gamePhase.gameOver,
	lastUpdated: Date.now(),
	elapsedTime: 0,
	fps: 0
};