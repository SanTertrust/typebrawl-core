import * as net from 'net'
import { Client } from './logic/client'
import { addClient, removeClient, getClients } from './logic/clients'
import { resolvePacket } from './packet/packetManager'

const server = net.createServer((socket: net.Socket) => {
    let client = new Client(socket)
    client.output("connected.")
    addClient(client)

    socket.on("error", (error: Error) => {
        client.output(`an error occured: ${error.message}`)
    })

    socket.on("data", (data: Buffer) => {
        resolvePacket(data, client)
    })

    socket.on("close", (hadError: boolean) => {
        client.output(`connection closed.`)
        removeClient(client)
    })
})

server.on("error", (error: Error) => {
    console.log(`[SERVER] an error occured: ${error.message}`)
})
server.listen(9339, () => {
    console.log("[SERVER] started")
})