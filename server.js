const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
const clients = new Map();
const activeUsers = [];
const messages = [];

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        console.log(`Received: ${message}`);

        try {
            const receivedData = JSON.parse(message);
            console.log('Parsed JSON:', receivedData);
            const user = receivedData.user;

            if (receivedData.type === "autorization") {
                if (activeUsers.includes(receivedData.user)) {
                    ws.send(JSON.stringify({
                        type: 'autorization',
                        status: 'false',
                    }));
                    console.log('User is already exists!')
                    return
                } else {
                    activeUsers.push(user);
                }
            }

            if ('message' in receivedData) {
                if (messages.length >= 100) {
                    const numberOfMessagesToRemove = messages.length - 4;
                    messages.splice(0, numberOfMessagesToRemove);
                }
                const now = new Date();
                const formattedDate = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
                messages.push({
                    user: user,
                    message: receivedData.message,
                    date: formattedDate
                });
            }

            clients.set(user, ws);

            clients.forEach((client) => {
                client.send(JSON.stringify({
                    users: activeUsers,
                    messages: messages,
                }));
            });

        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');

        for (let [user, client] of clients) {
            if (client === ws) {
                clients.delete(user);
                const index = activeUsers.indexOf(user);
                if (index !== -1) {
                    activeUsers.splice(index, 1);
                }
            }
        }

        clients.forEach((client) => {
            client.send(JSON.stringify({
                users: activeUsers,
                messages: messages,
            }));
        });
    });
});
