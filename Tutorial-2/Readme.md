## Sharing counter between 2 separate processes using Redis

### For basic setup of server:

    npm i express

### For redis:

    npm i redis

### Running redis server:

    redis-server

### Run server on 2 ports

    node index.js 8080

    node index.js 8081

If both servers share the same redis-server, they can share information between them.

    http://localhost:8080/

    http://localhost:8081/

so when we try to re-load either of above, COUNT shared is same