define(function () {

    var util = {};

    /**
     * Return random integer in the range [min, max] (min and max are included).
     */
    util.getRandomInt = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    util.arrayRandomElement = function (arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    };

    util.randomSign = function () {
        return util.arrayRandomElement([-1, 1]);
    };

    util.strlpad = function (s, padString, length) {
        var str = "" + s;
        while (str.length < length) {
            str = padString + str;
        }
        return str;
    };

    return util;

});