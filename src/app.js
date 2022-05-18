define(
    [
        "src/me",
        "src/resources/resources",

        "src/screens/PlayScreen",

        "src/entities/VitorcEntity",
        "src/entities/ShipFireEntity",
    ],
    function (
        me,
        resources,

        PlayScreen,

    VitorcEntity,
        ShipFireEntity
    ) {

        var app = {

            onload: function () {
                me.video.init("app", 512, 384);
                me.loader.onload = this.loaded.bind(this);
                me.loader.preload(resources);

                me.state.change(me.state.LOADING);
            },

            loaded: function () {
                me.state.set(me.state.PLAY, new PlayScreen());

                me.entityPool.add("vitorc", VitorcEntity);
                me.entityPool.add("ship_fire", ShipFireEntity);

                me.input.bindKey(me.input.KEY.LEFT, "left");
                me.input.bindKey(me.input.KEY.RIGHT, "right");
                me.input.bindKey(me.input.KEY.UP, "jump");
                me.input.bindKey(me.input.KEY.DOWN, "duck");
                me.input.bindKey(me.input.KEY.SPACE, "fire");

                me.state.change(me.state.PLAY);
            },

        };
        return app;
    });