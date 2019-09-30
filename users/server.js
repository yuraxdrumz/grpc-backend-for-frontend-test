const grpc = require('grpc')
const usersProto = grpc.load('users.proto')
const server = new grpc.Server()

const users = [{
    id: 1,
    image_data: Buffer.from("test")
  },
  {
    id: 2,
    image_data: Buffer.from("test")
  },
  {
    id: 3,
    image_data: Buffer.from("test")
  },
  {
    id: 4,
    image_data: Buffer.from("test")
  },
  {
    id: 3,
    image_data: Buffer.from("test")
  }
]


function listUsers(call, callback) {
  const n = call.request.id
  console.log(`received request id`, n)
  for (let user of users) {
    call.write(user)
  }
  call.end()
}

function listUsersSync(_, callback) {
  const e = Math.random() > 0.2 ? null : new Error('oh no')
  callback(e, users)
}

// used for streamin
function listUsersStream(call, callback) {
  call.on('data', function (n) {
    console.log('successfully received user')
    console.log(n)
    call.write(users[n.id])
  });
  call.on('end', function () {
    // The server has finished receiving
    console.log('end')
    call.end()
  });
  call.on('error', function (e) {
    // An error has occurred and the stream has been closed.
    console.error(e)
  });
  call.on('status', function (status) {
    // process status
    console.log(`status`, status)
  });
}

server.addService(usersProto.users.UserService.service, {
  list: listUsers,
  ListSync: listUsersSync,
  listStream: listUsersStream
})
server.bind('127.0.0.1:50052', grpc.ServerCredentials.createInsecure())
console.log('Server running at http://127.0.0.1:50052')
server.start()