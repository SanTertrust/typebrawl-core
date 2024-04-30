import { Socket } from "net"

export class Bytestream {
    public buffer: Buffer
    public version: number
    public id: number
    public length: number // used when decoding packet
    constructor(data: Buffer | undefined, version: number, id: number) {
        if (data != null) {
            this.buffer = data
        } else {
            this.buffer = Buffer.alloc(0)
        }

        this.version = version
        this.id = id
        this.length = 0
    }

    // reading string from bytes
    public readString(): string {
        let lengthString: number = this.buffer.readUint32BE()
        this.buffer = this.buffer.slice(4)
        let string: string = this.buffer.toString("utf-8", 0, lengthString)
        this.buffer = this.buffer.slice(lengthString)

        return string
    }

    // writing string length + string to bytes
    public writeString(text: string): void {
        let lengthBuffer = Buffer.alloc(4)
        lengthBuffer.writeUInt32BE(text.length)
        let textBuffer = Buffer.from(text, "utf-8")
        let LenandTextBuffer = Buffer.concat([lengthBuffer, textBuffer])
        this.buffer = Buffer.concat([this.buffer, LenandTextBuffer])
        return
    }

    // writing number to bytes as 32 bit number
    public writeInt(int: number): void {
        let intBuffer = Buffer.alloc(4)
        try {
            intBuffer.writeInt32BE(int)
        } catch (error) {
            intBuffer.writeInt32BE(0)
            console.log(`failed to writeInt. error: \n${error}`)
        }
        this.buffer = Buffer.concat([this.buffer, intBuffer])
    }

    // reading number from bytes as 32 bit number
    public readInt(): number {
        if (this.buffer.length < 4) {
            return 0
        }
        let number = this.buffer.readUInt32BE()
        this.buffer = this.buffer.slice(4)

        return number
    }

    // writing number to bytes as 16 bit number
    public writeShort(int: number): void {
        let shortBuffer = Buffer.alloc(2)
        shortBuffer.writeInt16BE(int)
        this.buffer = Buffer.concat([this.buffer, shortBuffer])
    }

    // reading 16 bit number from bytes
    public readShort(): number {
        let number = this.buffer.readInt16BE()
        this.buffer = this.buffer.slice(2)
        return number
    }

    public writeBoolean(value: boolean): void {
        let buffer = Buffer.alloc(1)
        if (value) { buffer.writeUInt8(1) } else { buffer.writeUint8(0) }
        this.buffer = Buffer.concat([this.buffer, buffer])
    }

    public readBoolean(): boolean {
        let number = this.buffer.readInt8()
        this.buffer = this.buffer.slice(1)
        return number === 1
    }

    public writeLong(v1: number, v2: number): void {
        let buffer = Buffer.alloc(8)
        buffer.writeUInt32BE(v1)
        buffer.writeUInt32BE(v2)
        this.buffer = Buffer.concat([this.buffer, buffer])
    }

    public readLong(): number[]{
        const v1 = this.buffer.readInt32BE()
        this.buffer = this.buffer.slice(4)
        const v2 = this.buffer.readInt32BE()
        this.buffer = this.buffer.slice(4)
        return [v1, v2]
    }

    public decode(): void {
        this.id = this.readShort()
        this.length = this.buffer.readUintBE(0, 3)
        this.buffer = this.buffer.slice(3)
        this.version = this.readShort()
        //this.buffer = this.buffer.slice(0, this.length) who cares

        console.log(this.buffer)
    }

    public send(socket: Socket): void {
        const headerBuffer = Buffer.alloc(7)
        headerBuffer.writeUInt16BE(this.id)
        headerBuffer.writeUIntBE(this.buffer.length, 2, 3)
        headerBuffer.writeUInt16BE(this.version, 5)
        this.buffer = Buffer.concat([headerBuffer, this.buffer, Buffer.from([0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00])])
        socket.write(this.buffer)
    }
}
