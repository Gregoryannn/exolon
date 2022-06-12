define(
    [
        "src/entities/KamikazeCreatorEntity",
        "src/entities/InterceptorEntity",
    ],
    function (
        KamikazeCreatorEntity,
        InterceptorEntity
    ) {

        var InterceptorCreatorEntity = KamikazeCreatorEntity.extend({

            // in sec
            delay: 1.5,

            createSpecificKamikaze: function (x, y) {
                return new InterceptorEntity(x, y);
            },

            shouldCreate: function () {
                if (this.vitorc.pos.x > 350) {
                    return false;
                }
                return true;
            },

        });

        return InterceptorCreatorEntity;

    });
