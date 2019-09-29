const grpc = require('grpc')
const notesProto = grpc.load('notes.proto')
const server = new grpc.Server()

const notes = [{
    id: 1,
    title: 'Note 1',
    content: 'Content 1'
  },
  {
    id: 2,
    title: 'Note 2',
    content: 'Content 2'
  }
]

function listNotes(call, callback) {
  const n = call.request.id
  console.log(`received request id`, n)
  for (let note of notes) {
    call.write(note)
  }
  call.end()
}


function listNoteStream(call, callback) {
  console.log(call)
  call.on('data', function (n) {
    console.log('successfully received note')
    console.log(n)
  });
  call.on('end', function () {
    // The server has finished receiving
    console.log('end')
    const e = Math.random() > 0.2 ? null : new Error('oh no')
    callback(e, true)
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

server.addService(notesProto.notes.NoteService.service, {
  list: listNotes,
  listStream: listNoteStream
})
server.bind('127.0.0.1:50051', grpc.ServerCredentials.createInsecure())
console.log('Server running at http://127.0.0.1:50051')
server.start()