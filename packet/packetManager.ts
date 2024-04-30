import { Bytestream } from "../bytestream";
import { Client } from "../logic/client";

export function resolvePacket(bytes: Buffer, client: Client){
    let clientPacket = new Bytestream(bytes, 0, 0)
    clientPacket.decode()
    client.output(`packet with id ${clientPacket.id} was sended.`)
    // do whatever you want
    if (clientPacket.id == 10100){
        const number = clientPacket.readInt()
        console.log(number)
    } else {
        client.output("unknown packet, ignoring.")
    }
}