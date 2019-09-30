const grpc = require('grpc')

function interceptor(options, nextCall) {
  return new grpc.InterceptingCall(nextCall(options), {
    start: function (metadata, listener, next) {
      next(metadata, {
        onReceiveMetadata: function (metadata, next) {
          console.log(`metada: `, metadata)
          next(metadata);
        },
        onReceiveMessage: function (message, next) {
          console.log(`message interceptor: `, message)
          next(message);
        },
        onReceiveStatus: function (status, next) {
          next(status);
        },
      });
    },
    sendMessage: function (message, next) {
      next(message);
    },
    halfClose: function (next) {
      next();
    },
    cancel: function (message, next) {
      next();
    }
  });
};
module.exports = interceptor