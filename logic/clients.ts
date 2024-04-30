// client manager

import { Socket } from "net";
import { Client } from "./client";

let clientsTable: Map<Socket, Client> = new Map();

// adds client to clientsTable
export function addClient(client: Client): void {
    clientsTable.set(client.socket, client)
}

// removes client from clientsTable
export function removeClient(client: Client): boolean {
    if (clientsTable.has(client.socket)){
        clientsTable.delete(client.socket)
        return true
    } else {
        return false
    }
}

// returns clientsTable
export function getClients(): Map<Socket, Client>{
    return clientsTable
}