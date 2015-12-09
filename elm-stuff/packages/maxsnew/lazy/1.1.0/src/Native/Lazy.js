Elm.Native.Lazy = {};
Elm.Native.Lazy.make = function(localRuntime) {

    localRuntime.Native = localRuntime.Native || {};
    localRuntime.Native.Lazy = localRuntime.Native.Lazy || {};
    if (localRuntime.Native.Lazy.values) {
        return localRuntime.Native.Lazy.values;
    }

    function memoize(thunk) {
        var value;
        var isForced = false;
        return function(tuple0) {
            if (!isForced) {
                value = thunk(tuple0);
                isForced = true;
            }
            return value;
        };
    }

    return localRuntime.Native.Lazy.values = {
        memoize: memoize
    };
};
