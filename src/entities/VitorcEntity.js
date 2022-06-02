define(
    [
        "src/me",
        "src/util",
        "src/entities/BlasterBulletEntity",
        "src/entities/GrenadeEntity",
        "src/entities/GrenadeTraceEntity",
        "src/entities/TeleportFlashEntity",
    ],
    function (
        me,
        util,
        BlasterBulletEntity,
        GrenadeEntity,
        GrenadeTraceEntity,
        TeleportFlashEntity
    ) {

        var VitorcEntity = me.ObjectEntity.extend({

            init: function (x, y, settings) {
                settings.image = "vitorc";
                settings.spritewidth = 48;

                this.parent(x, y, settings);

                this.collidable = true;

                this.addAnimation("stand", [0]);
                this.addAnimation("move", [0, 1, 2, 3, 4, 0, 5, 6, 7, 8]);
                this.addAnimation("jump", [3]);
                this.addAnimation("duck", [9]);
                this.addAnimation("die", [10]);
                this.addAnimation("fall", [8]);

                this.setCurrentAnimation("stand");

                this.animationspeed = 2;

                this.setVelocity(1.5, 2.75);
                this.gravity = 0.1;

                this.firePressed = false;
                this.jumpPressed = false;

                this.grenadeFireDuration = 35;
                this.grenadeFireTimer = 0;

                this.direction = "right";

                this.dieTimer = 0;
                this.dieDuration = 70;

                this.invincible = false;

                this.insideTeleport = false;
                this.thisTeleportGUID = null;
            },

            update: function () {
                this.updateJump();
                this.updateDieTimer();
                this.handleInput();
                var res = this.updateMovement();
                this.handleCollisionsWithCollisionMap(res);
                this.handleCollisionsWithEntities();
                this.handleCollisionsWithEntities();
                this.handleFallFromPlatform();
                this.handleNextScreen();
                this.parent();
                return true;
            },

            updateJump: function () {
                if (this.isCurrentAnimation("jump") && this.isOnTheGround()) {
                    this.setCurrentAnimation("stand");
                }
            },

            updateDieTimer: function () {
                if (!this.isCurrentAnimation("die")) {
                    return;
                }
                if (!this.isOnTheGround()) {
                    return;
                }
                this.dieTimer++;
                if (this.dieTimer > this.dieDuration) {
                    this.dieTimer = 0;

                    if (me.game.HUD.getItemValue("lives") == 0) {
                        // game over
                    }
                    else {
                        this.setCurrentAnimation("stand");
                        this.respawn();
                        this.makeTemporarilyInvincible();
                    }
                }
            },

            handleInput: function () {
                if (this.isCurrentAnimation("die")) {
                    return;
                }

                this.handleFireKey();

                if (this.isCurrentAnimation("jump") || this.falling) {
                    return;
                }
                else {
                    this.handleInputOnTheGround();
                }
            },

            handleCollisionsWithCollisionMap: function (res) {
                if (!this.isCurrentAnimation("jump") && res.x) {
                    this.setCurrentAnimation("stand");
                }
            },

            handleCollisionsWithEntities: function () {
                this.insideTeleport = false;

                var res = me.game.collide(this);
                if (!res) {
                    return;
                }

                this.handleCollisionWithSolidObject(res, res.obj);
                this.handleCollisionWithTeleport(res, res.obj);
            },

            handleCollisionWithSolidObject: function (res, obj) {
                if (!obj.isSolid) {
                    return;
                }

                this.pos.sub(res);

                if (res.y > 0) {
                    this.vel.y = 0;
                    this.falling = false;
                }

                if (res.x && this.isOnTheGround()) {
                    this.vel.x = 0;
                    this.setCurrentAnimation("stand");
                }
            },

            handleCollisionWithTeleport: function (res, obj) {
                if (obj.name == "teleport") {
                    this.insideTeleport = true;
                    this.thisTeleportGUID = obj.GUID;
                }
            },

            onCollision: function (res, obj) {
                if (this.isCurrentAnimation("die")) {
                    return;
                }

                if (obj.isLethal) {
                    this.die();
                }
            },

            handleFallFromPlatform: function () {
                if (!this.isCurrentAnimation("jump") && !this.isCurrentAnimation("die") && this.falling) {
                    this.vel.x = 0;
                    this.setCurrentAnimation("fall");
                }
            },

            handleNextScreen: function () {
                if (this.pos.x > 510) {
                    me.state.current().nextLevel();
                }
            },

            handleFireKey: function () {
                if (me.input.isKeyPressed("fire")) {
                    this.fireBlaster();
                    this.fireGrenade();
                    this.firePressed = true;
                    this.grenadeFireTimer++;
                }
                else {
                    this.firePressed = false;
                    this.grenadeFireTimer = 0;
                }
            },

            handleInputOnTheGround: function () {
                if (me.input.isKeyPressed("duck")) {
                    this.duck();
                    return;
                }

                this.stand();

                if (me.input.isKeyPressed("right")) {
                    this.direction = "right";
                    this.setCurrentAnimation("move");
                    this.doWalk(false);
                }
                else if (me.input.isKeyPressed("left")) {
                    this.direction = "left";
                    this.setCurrentAnimation("move");
                    this.doWalk(true);
                }

                this.handleJumpKey();
            },

            handleJumpKey: function () {
                if (!me.input.isKeyPressed("jump")) {
                    this.jumpPressed = false;
                    return;
                }

                if (this.insideTeleport) {
                    if (!this.jumpPressed) {
                        this.doTeleport();
                    }
                }
                else {
                    this.setCurrentAnimation("jump");
                    this.doJump();
                }

                this.jumpPressed = true;
            },

            fireBlaster: function () {
                if (!this.canFireBlaster()) {
                    return;
                }
                var pos = this.getBlasterBulletPosition();
                var bullet = new BlasterBulletEntity(pos.x, pos.y, this.direction);
                me.game.add(bullet, this.z);
                me.game.sort.defer();

                me.gamestat.updateValue("aliveBlasterBulletCount", 1);

                if (me.game.HUD.getItemValue("ammo") > 0) {
                    me.game.HUD.updateItemValue("ammo", -1);
                }
            },

            fireGrenade: function () {
                if (!this.canFireGrenade()) {
                    return;
                }
                var grenadePos = this.getGrenadePosition();
                var grenade = new GrenadeEntity(grenadePos.x, grenadePos.y, this.direction);
                me.game.add(grenade, this.z);

                var tracePos = this.getGrenadeTracePosition();
                var trace = new GrenadeTraceEntity(tracePos.x, tracePos.y, this.direction);
                me.game.add(trace, this.z);

                me.game.sort.defer();

                me.gamestat.updateValue("aliveGrenadesCount", 1);

                if (me.game.HUD.getItemValue("grenades") > 0) {
                    me.game.HUD.updateItemValue("grenades", -1);
                }
            },

            duck: function () {
                this.setCurrentAnimation("duck");
                this.vel.x = 0;
                this.updateColRect(-1, 0, 11, 53);
            },

            stand: function () {
                this.setCurrentAnimation("stand");
                this.vel.x = 0;
                this.updateColRect(-1, 0, 0, 64);
            },

            die: function () {
                if (this.invincible) {
                    return;
                }
                me.game.HUD.updateItemValue("lives", -1);
                this.setCurrentAnimation("die");
                this.vel.x = 0;
                this.forceJump();
            },

            respawn: function () {
                this.pos.x = this.respawn.x;
                this.pos.y = this.respawn.y;
            },

            makeTemporarilyInvincible: function () {
                var self = this;
                this.invincible = true;
                util.executeWithDelay(function () {
                    self.invincible = false;
                }, VitorcEntity.INVINCIBILITY_DURATION);
            },

            doTeleport: function () {
                var teleports = me.game.getEntityByName("teleport");
                this.createTeleportFlashes(teleports);
                var otherTeleport = this.getOtherTeleport(teleports);
                this.pos.x = otherTeleport.pos.x;
                this.pos.y = otherTeleport.pos.y + 32;
            },

            createTeleportFlashes: function (teleports) {
                for (var i in teleports) {
                    var x = teleports[i].pos.x + 16;
                    var y = teleports[i].pos.y + 32;
                    var flash = new TeleportFlashEntity(x, y);
                    me.game.add(flash, this.z + 1);
                }

                me.game.sort.defer();
            },

            getOtherTeleport: function (teleports) {
                for (var i in teleports) {
                    if (teleports[i].GUID != this.thisTeleportGUID) {
                        return teleports[i];
                    }
                }
                return null;
            },

            getBlasterBulletPosition: function () {
                var pos = {};

                if (this.direction == "right") {
                    pos.x = this.pos.x + this.width + VitorcEntity.BLASTER_BULLET_OFFSET_X;
                }
                else {
                    pos.x = this.pos.x - BlasterBulletEntity.WIDTH - VitorcEntity.BLASTER_BULLET_OFFSET_X;
                }

                if (this.isCurrentAnimation("duck")) {
                    pos.y = this.pos.y + VitorcEntity.BLASTER_BULLET_OFFSET_Y + VitorcEntity.DUCK_OFFSET;
                }
                else {
                    pos.y = this.pos.y + VitorcEntity.BLASTER_BULLET_OFFSET_Y;
                }

                return pos;
            },

            getGrenadePosition: function () {
                var pos = {};

                if (this.direction == "right") {
                    pos.x = this.pos.x + VitorcEntity.GRENADE_OFFSET_X;
                }
                else {
                    pos.x = this.pos.x + this.width - GrenadeEntity.WIDTH - VitorcEntity.GRENADE_OFFSET_X;
                }

                if (this.isCurrentAnimation("duck")) {
                    pos.y = this.pos.y + VitorcEntity.GRENADE_OFFSET_Y + VitorcEntity.DUCK_OFFSET;
                }
                else {
                    pos.y = this.pos.y + VitorcEntity.GRENADE_OFFSET_Y;
                }

                return pos;
            },

            getGrenadeTracePosition: function () {
                var pos = {};

                if (this.direction == "right") {
                    pos.x = this.pos.x + VitorcEntity.GRENADE_TRACE_OFFSET_X;
                }
                else {
                    pos.x = this.pos.x + this.width - GrenadeTraceEntity.WIDTH - VitorcEntity.GRENADE_TRACE_OFFSET_X;
                }

                if (this.isCurrentAnimation("duck")) {
                    pos.y = this.pos.y + VitorcEntity.GRENADE_TRACE_OFFSET_Y + VitorcEntity.DUCK_OFFSET;
                }
                else {
                    pos.y = this.pos.y + VitorcEntity.GRENADE_TRACE_OFFSET_Y;
                }

                return pos;
            },

            isOnTheGround: function () {
                return !this.jumping && !this.falling;
            },

            canFireBlaster: function () {
                if (this.firePressed || me.game.HUD.getItemValue("ammo") == 0) {
                    return false;
                }
                return true;
            },

            canFireGrenade: function () {
                if (me.gamestat.getItemValue("aliveBlasterBulletCount") > 0) {
                    return false;
                }
                if (me.gamestat.getItemValue("aliveGrenadesCount") > 0) {
                    return false;
                }
                if (this.grenadeFireTimer < this.grenadeFireDuration) {
                    return false;
                }
                if (me.game.HUD.getItemValue("grenades") == 0) {
                    return false;
                }
                return true;
            },

        });

        VitorcEntity.DUCK_OFFSET = 10;

        VitorcEntity.BLASTER_BULLET_OFFSET_X = 2;
        VitorcEntity.BLASTER_BULLET_OFFSET_Y = 30;

        VitorcEntity.GRENADE_OFFSET_X = 20;
        VitorcEntity.GRENADE_OFFSET_Y = 7;

        VitorcEntity.GRENADE_TRACE_OFFSET_X = 4;
        VitorcEntity.GRENADE_TRACE_OFFSET_Y = 5;

        VitorcEntity.INVINCIBILITY_DURATION = 3000;

        return VitorcEntity;

    });