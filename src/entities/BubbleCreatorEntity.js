define(
    [
        "src/entities/KamikazeCreatorEntity",
        "src/entities/BubbleEntity",
    ],
    function (
        KamikazeCreatorEntity,
        BubbleEntity
    ) {

        var BubbleCreatorEntity = KamikazeCreatorEntity.extend({

                delay: 1000,

            createSpecificKamikaze: function (x, y) {
                return new BubbleEntity(x, y);
            },

        });

        return BubbleCreatorEntity;

    });